const db = require('../db/mysqlDb');
const { calculateHealthScore } = require('../ai/healthScoreEngine');
const { detectFraud } = require('../ai/fraudEngine');
const predictionModel = require('../ai/predictionModel');

// @desc    Add income
// @route   POST /api/finance/add-income
// @access  Private
const addIncome = async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ message: 'Category and amount are required' });
    }

    const transaction = await db.createTransaction({
      userId: req.userId,
      type: 'income',
      category,
      amount: parseFloat(amount),
      description: description || '',
      date: date || new Date().toISOString()
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Add Income Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove income
// @route   DELETE /api/finance/remove-income/:id
// @access  Private
const removeIncome = async (req, res) => {
  try {
    const deleted = await db.deleteTransaction(parseInt(req.params.id), req.userId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Income not found' });
    }

    res.json({ message: 'Income removed successfully' });
  } catch (error) {
    console.error('Remove Income Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add expense
// @route   POST /api/finance/add-expense
// @access  Private
const addExpense = async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ message: 'Category and amount are required' });
    }

    const transaction = await db.createTransaction({
      userId: req.userId,
      type: 'expense',
      category,
      amount: parseFloat(amount),
      description: description || '',
      date: date || new Date().toISOString()
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Add Expense Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove expense
// @route   DELETE /api/finance/remove-expense/:id
// @access  Private
const removeExpense = async (req, res) => {
  try {
    const deleted = await db.deleteTransaction(parseInt(req.params.id), req.userId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense removed successfully' });
  } catch (error) {
    console.error('Remove Expense Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all transactions
// @route   GET /api/finance/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, limit = 50, page = 1 } = req.query;

    const result = await db.findTransactionsByUserId(req.userId, {
      type,
      category,
      startDate,
      endDate,
      limit: parseInt(limit),
      page: parseInt(page)
    });

    res.json(result);
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get dashboard data
// @route   GET /api/finance/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const result = await db.findTransactionsByUserId(req.userId, { limit: 1000 });
    const transactions = result.transactions;

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.Amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.Amount), 0);

    const balance = totalIncome - totalExpenses;

    // Get recent transactions
    const recentTransactions = transactions.slice(0, 10);

    // Get category breakdown
    const incomeByCategory = {};
    const expenseByCategory = {};

    transactions.forEach(t => {
      if (t.type === 'income') {
        incomeByCategory[t.Category] = (incomeByCategory[t.Category] || 0) + parseFloat(t.Amount);
      } else {
        expenseByCategory[t.Category] = (expenseByCategory[t.Category] || 0) + parseFloat(t.Amount);
      }
    });

    // Get monthly data for charts
    const monthlyData = {};
    transactions.forEach(t => {
      const date = new Date(t.Date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expenses: 0 };
      }
      
      if (t.type === 'income') {
        monthlyData[key].income += parseFloat(t.Amount);
      } else {
        monthlyData[key].expenses += parseFloat(t.Amount);
      }
    });

    // Calculate AI metrics
    const healthScore = await calculateHealthScore(transactions);
    const fraudDetection = await detectFraud(transactions);
    const predictions = await predictionModel.predict(transactions);

    res.json({
      totalIncome,
      totalExpenses,
      balance,
      recentTransactions,
      incomeByCategory,
      expenseByCategory,
      monthlyData: Object.entries(monthlyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([month, data]) => ({ month, ...data })),
      healthScore,
      fraudDetection,
      predictions,
      isAlertMode: healthScore.isAlertMode || fraudDetection.hasFraud || predictions.riskProbability > 70
    });
  } catch (error) {
    console.error('Get Dashboard Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Export transactions as CSV
// @route   GET /api/finance/export
// @access  Private
const exportTransactions = async (req, res) => {
  try {
    const result = await db.findTransactionsByUserId(req.userId, { limit: 10000 });
    const transactions = result.transactions;

    // Create CSV header
    let csv = 'Date,Type,Category,Amount,Description\n';

    // Add data rows
    transactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString();
      csv += `"${date}","${t.type}","${t.category}","${t.amount}","${t.description}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check if user can afford a purchase
// @route   POST /api/finance/can-afford
// @access  Private
const checkAffordability = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    const amountNum = parseFloat(amount);
    const result = await db.findTransactionsByUserId(req.userId, { limit: 1000 });
    const transactions = result.transactions;

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.Amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.Amount), 0);

    const balance = totalIncome - totalExpenses;

    // Calculate health score
    const healthScore = await calculateHealthScore(transactions);

    // Calculate emergency fund (3 months of expenses)
    const monthlyExpenses = totalExpenses / 3; // Approximate
    const emergencyFund = monthlyExpenses * 3;

    // Determine if affordable
    let canAfford = true;
    let reasons = [];

    if (balance < amountNum) {
      canAfford = false;
      reasons.push('Insufficient balance');
    }

    if (healthScore.score < 40) {
      canAfford = false;
      reasons.push('Financial health is critical');
    }

    if (balance < emergencyFund) {
      reasons.push('Warning: Below emergency fund threshold');
    }

    res.json({
      canAfford,
      amount: amountNum,
      currentBalance: balance,
      healthScore: healthScore.score,
      emergencyFund,
      reasons
    });
  } catch (error) {
    console.error('Check Affordability Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addIncome,
  removeIncome,
  addExpense,
  removeExpense,
  getTransactions,
  getDashboardData,
  exportTransactions,
  checkAffordability
};
