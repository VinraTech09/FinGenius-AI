// REMOVED: MySQL DB now used. Delete this file or rename after migration.
// This replaces MongoDB for local development without requiring MongoDB installation

class InMemoryDB {
  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.userIdCounter = 1;
    this.transactionIdCounter = 1;
  }

  // User methods
async createUser(userData) {
    const normalizedData = Object.fromEntries(Object.entries(userData).map(([k,v]) => [k.toLowerCase(), v]));
    const user = { _id: this.userIdCounter++, ...normalizedData, subscriptionType: 'free', createdAt: new Date() };
    this.users.set(user._id, user);
    return user;
  }

  async findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findUserById(id) {
    return this.users.get(id) || null;
  }

async updateUser(id, updates) {
    const user = this.users.get(id);
    if (user) {
      const normalizedUpdates = Object.fromEntries(Object.entries(updates).map(([k,v]) => [k.toLowerCase(), v]));
      Object.assign(user, normalizedUpdates);
      this.users.set(id, user);
    }
    return user;
  }

  // Transaction methods
  async createTransaction(transactionData) {
    const transaction = { _id: this.transactionIdCounter++, ...transactionData, createdAt: new Date() };
    this.transactions.set(transaction._id, transaction);
    return transaction;
  }

  async findTransactionsByUserId(userId, options = {}) {
    let results = [];
    for (const t of this.transactions.values()) {
      if (t.userId === userId) {
        // Apply filters
        if (options.type && t.type !== options.type) continue;
        if (options.category && t.category !== options.category) continue;
        if (options.startDate && new Date(t.date) < new Date(options.startDate)) continue;
        if (options.endDate && new Date(t.date) > new Date(options.endDate)) continue;
        results.push(t);
      }
    }
    
    // Sort by date descending
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Apply pagination
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
    const transaction = this.transactions.get(id);
    if (transaction && transaction.userId === userId) {
      this.transactions.delete(id);
      return true;
    }
    return false;
  }

  // Clear all data
  clear() {
    this.users.clear();
    this.transactions.clear();
  }
}

// Export singleton instance
const db = new InMemoryDB();
module.exports = db;
