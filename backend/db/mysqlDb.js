const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

class MySQLDB {
  constructor() {
    this.pool = null;
  }

  async connect() {
    if (this.pool) return this.pool;

    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'fingeniusweb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection and create tables if not exist
    try {
      const connection = await this.pool.getConnection();
      
      // Create users table if not exists (adapted to schema)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          User_ID INT AUTO_INCREMENT PRIMARY KEY,
          Name VARCHAR(255) NOT NULL,
          Email VARCHAR(255) UNIQUE NOT NULL,
          Password VARCHAR(255) NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Income table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS income (
          Income_ID INT AUTO_INCREMENT PRIMARY KEY,
          User_ID INT NOT NULL,
          Amount DECIMAL(15,2) NOT NULL,
          Category VARCHAR(100) NOT NULL,
          Date DATE NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          description TEXT,
          FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE
        )
      `);

      // Expense table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS expense (
          Expense_ID INT AUTO_INCREMENT PRIMARY KEY,
          User_ID INT NOT NULL,
          Amount DECIMAL(15,2) NOT NULL,
          Category VARCHAR(100) NOT NULL,
          Date DATE NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          description TEXT,
          FOREIGN KEY (User_ID) REFERENCES users(User_ID) ON DELETE CASCADE
        )
      `);

      connection.release();
      console.log('✅ MySQL connected and tables ready');
    } catch (error) {
      console.error('❌ MySQL connection failed:', error);
      throw error;
    }
    return this.pool;
  }

  async createUser(userData) {
    const { name, email, password } = userData;
    const [result] = await (await this.connect()).execute(
      'INSERT INTO users (Name, Email, Password) VALUES (?, ?, ?)',
      [name, email, password]
    );
    const userId = result.insertId;
    return { _id: userId, name, email, password, subscriptionType: 'free' };
  }

  async findUserByEmail(email) {
    const [rows] = await (await this.connect()).execute(
      'SELECT * FROM users WHERE Email = ?',
      [email]
    );
    return rows[0] ? { _id: rows[0].User_ID, name: rows[0].Name, email: rows[0].Email, password: rows[0].Password, subscriptionType: 'free' } : null;
  }

  async findUserById(id) {
    const [rows] = await (await this.connect()).execute(
      'SELECT * FROM users WHERE User_ID = ?',
      [id]
    );
    return rows[0] ? { _id: rows[0].User_ID, name: rows[0].Name, email: rows[0].Email, password: rows[0].Password, subscriptionType: 'free' } : null;
  }

  async updateUser(id, updates) {
    const fields = Object.keys(updates).map(key => {
      if (key === 'name') return 'Name = ?';
      if (key === 'email') return 'Email = ?';
      if (key === 'password') return 'Password = ?';
      return `${key} = ?`;
    }).join(', ');
    const values = Object.values(updates);
    values.push(id);
    await (await this.connect()).execute(
      `UPDATE users SET ${fields} WHERE User_ID = ?`,
      values
    );
    return this.findUserById(id);
  }

  async createTransaction(transactionData) {
    const table = transactionData.type === 'income' ? 'income' : 'expense';
  const userId = transactionData.userId;

  const amount = transactionData.amount;

  const category = transactionData.category;

  const description = transactionData.description || '';

  const dateStr = transactionData.date || new Date().toISOString().split('T')[0];

  const [result] = await (await this.connect()).execute(

    `INSERT INTO ${table} (User_ID, Amount, Category, description, Date) VALUES (?, ?, ?, ?, ?)`,

    [userId, amount, category, description, dateStr]

  );
    const idField = table === 'income' ? 'Income_ID' : 'Expense_ID';
    const [rows] = await (await this.connect()).execute(
      `SELECT *, '${transactionData.type}' as type, ${idField} as _id FROM ${table} WHERE ${idField} = ?`,
      [result.insertId]
    );
    return rows[0];
  }

  async findTransactionsByUserId(userId, options = {}) {
    let query = `
      SELECT 'income' as type, Income_ID as _id, User_ID, Amount, Category, Date, createdAt 
      FROM income 
      WHERE User_ID = ?
      UNION ALL
      SELECT 'expense' as type, Expense_ID as _id, User_ID, Amount, Category, Date, createdAt 
      FROM expense 
      WHERE User_ID = ?
      ORDER BY Date DESC, createdAt DESC
    `;
    let params = [userId, userId];

    if (options.type) {
      const tableFilter = options.type === 'income' ? 'income' : 'expense';
      query = `SELECT '${options.type}' as type, ${tableFilter === 'income' ? 'Income_ID' : 'Expense_ID'} as _id, * FROM ${tableFilter} WHERE User_ID = ? ORDER BY Date DESC, createdAt DESC`;
      params = [userId];
    }

    if (options.category) {
      // Simplified: add HAVING or separate queries for UNION; for now filter post-query
    }

    const [allRows] = await (await this.connect()).execute(query, params);

    // Client-side filter/paginate for simplicity (matches inMemory)
    let results = allRows.filter(row => {
      if (options.category && row.Category !== options.category) return false;
      if (options.startDate && new Date(row.Date) < new Date(options.startDate)) return false;
      if (options.endDate && new Date(row.Date) > new Date(options.endDate)) return false;
      if (options.type && row.type !== options.type) return false;
      return true;
    });

    const limit = options.limit || 50;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    return {
      transactions: results.slice(skip, skip + limit),
      total: results.length,
      page,
      pages: Math.ceil(results.length / limit)
    };
  }

  async deleteTransaction(id, userId) {
    // Try income first
    const [incomeRes] = await (await this.connect()).execute(
      'DELETE FROM income WHERE Income_ID = ? AND User_ID = ?',
      [id, userId]
    );
    if (incomeRes.affectedRows > 0) return true;

    // Then expense
    const [expenseRes] = await (await this.connect()).execute(
      'DELETE FROM expense WHERE Expense_ID = ? AND User_ID = ?',
      [id, userId]
    );
    return expenseRes.affectedRows > 0;
  }
}

const db = new MySQLDB();
module.exports = db;

