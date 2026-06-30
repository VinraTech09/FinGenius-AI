const db = require('../db/mysqlDb');
const { calculateHealthScore } = require('../ai/healthScoreEngine');
const { detectFraud } = require('../ai/fraudEngine');
const predictionModel = require('../ai/predictionModel');

// @desc    Get AI insights
// @route   GET /api/ai/insights
// @access  Private
const getInsights = async (req, res) => {
  try {
    const result = await db.findTransactionsByUserId(req.userId, { limit: 1000 });
    const transactions = result.transactions;

    const healthScore = await calculateHealthScore(transactions);
    const fraudDetection = await detectFraud(transactions);
    const predictions = await predictionModel.predict(transactions);

    res.json({
      healthScore,
      fraudDetection,
      predictions
    });
  } catch (error) {
    console.error('Get AI Insights Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get health score
// @route   GET /api/ai/health-score
// @access  Private
const getHealthScore = async (req, res) => {
  try {
    const result = await db.findTransactionsByUserId(req.userId, { limit: 1000 });
    const healthScore = await calculateHealthScore(result.transactions);
    res.json(healthScore);
  } catch (error) {
    console.error('Get Health Score Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get fraud detection
// @route   GET /api/ai/fraud-detection
// @access  Private
const getFraudDetection = async (req, res) => {
  try {
    const result = await db.findTransactionsByUserId(req.userId, { limit: 1000 });
    const fraudDetection = await detectFraud(result.transactions);
    res.json(fraudDetection);
  } catch (error) {
    console.error('Get Fraud Detection Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get predictions
// @route   GET /api/ai/predictions
// @access  Private
const getPredictions = async (req, res) => {
  try {
    const result = await db.findTransactionsByUserId(req.userId, { limit: 1000 });
    const predictions = await predictionModel.predict(result.transactions);
    res.json(predictions);
  } catch (error) {
    console.error('Get Predictions Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Chat with AI
// @route   POST /api/ai/chat
// @access  Private
const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const result = await db.findTransactionsByUserId(req.userId, { limit: 1000 });
    const transactions = result.transactions;
    
    const healthScore = await calculateHealthScore(transactions);

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    // Calculate emergency fund
    const monthlyExpenses = totalExpenses / 3; // Approximate
    const emergencyFund = monthlyExpenses * 3;

    // Parse user message
    const lowerMessage = message.toLowerCase();
    let response = '';

    // Check for purchase suggestion
    const purchaseMatch = message.match(/(\d+(?:,\d+)*)/);
    if (lowerMessage.includes('buy') || lowerMessage.includes('purchase') || lowerMessage.includes(' afford')) {
      if (purchaseMatch) {
        const amount = parseInt(purchaseMatch[1].replace(/,/g, ''));
        
        let canAfford = true;
        let reasons = [];

        if (balance < amount) {
          canAfford = false;
          reasons.push('Insufficient balance');
        }

        if (healthScore.score < 40) {
          canAfford = false;
          reasons.push('Your financial health is critical');
        }

        if (balance < emergencyFund) {
          reasons.push('This would dip below your emergency fund');
        }

        if (canAfford) {
          response = `✅ Yes, you can afford this purchase of ₹${amount.toLocaleString()}!\n\n` +
            `Current Balance: ₹${balance.toLocaleString()}\n` +
            `Health Score: ${healthScore.score}/100 (${healthScore.status})\n` +
            `Emergency Fund: ₹${emergencyFund.toLocaleString()}\n\n` +
            `${healthScore.recommendation}`;
        } else {
          response = `❌ No, your financial condition is not good right now.\n\n` +
            `Reasons:\n${reasons.join('\n')}\n\n` +
            `Current Balance: ₹${balance.toLocaleString()}\n` +
            `Health Score: ${healthScore.score}/100 (${healthScore.status})\n\n` +
            `${healthScore.recommendation}`;
        }
      } else {
        response = `To check if you can afford something, please include the amount. For example: "Can I buy 50000 phone?"`;
      }
    }
    // Check for savings advice
    else if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      if (healthScore.score < 40) {
        response = `Your financial health needs immediate attention. Here's my advice:\n\n` +
          `1. Create a budget and track all expenses\n` +
          `2. Cut unnecessary spending\n` +
          `3. Focus on building an emergency fund\n` +
          `4. Consider additional income sources\n\n` +
          `${healthScore.recommendation}`;
      } else if (healthScore.score < 60) {
        response = `Your financial health is stable but could be better. Here's my advice:\n\n` +
          `1. Aim to save at least 20% of your income\n` +
          `2. Review your expenses and identify areas to cut\n` +
          `3. Build your emergency fund to cover 3-6 months expenses\n\n` +
          `${healthScore.recommendation}`;
      } else {
        response = `Great job! Your financial health is good. To maximize savings:\n\n` +
          `1. Continue your current saving habits\n` +
          `2. Consider investing in diversified assets\n` +
          `3. Review and optimize your monthly budget\n\n` +
          `${healthScore.recommendation}`;
      }
    }
    // Check for expense advice
    else if (lowerMessage.includes('expense') || lowerMessage.includes('spend') || lowerMessage.includes('budget')) {
      const expenseByCategory = {};
      transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });

      const topCategories = Object.entries(expenseByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      response = `Here's your expense breakdown:\n\n`;
      topCategories.forEach(([cat, amt]) => {
        response += `• ${cat}: ₹${amt.toLocaleString()}\n`;
      });

      response += `\nTotal Expenses: ₹${totalExpenses.toLocaleString()}\n`;
      response += `Balance: ₹${balance.toLocaleString()}\n\n`;
      response += healthScore.recommendation;
    }
    // Check for income advice
    else if (lowerMessage.includes('income') || lowerMessage.includes('earn')) {
      response = `Your income analysis:\n\n` +
        `Total Income: ₹${totalIncome.toLocaleString()}\n` +
        `Total Expenses: ₹${totalExpenses.toLocaleString()}\n` +
        `Current Balance: ₹${balance.toLocaleString()}\n\n`;
      
      if (balance < 0) {
        response += `Your expenses exceed your income. Consider:\n` +
          `1. Finding ways to increase income\n` +
          `2. Reducing expenses\n` +
          `3. Creating a strict budget`;
      } else {
        response += `Good job! You're earning more than you spend. Keep it up!`;
      }
    }
    // General financial advice
    else if (lowerMessage.includes('advice') || lowerMessage.includes('help') || lowerMessage.includes('tip')) {
      response = `Here are some general financial tips based on your profile:\n\n`;
      
      if (healthScore.score < 40) {
        response += `🚨 Your financial health needs attention!\n\n`;
      } else if (healthScore.score < 60) {
        response += `📊 Your finances are stable but room for improvement.\n\n`;
      } else {
        response += `🎉 Your finances are in great shape!\n\n`;
      }

      response += `1. Track all your expenses daily\n` +
        `2. Create a monthly budget\n` +
        `3. Build an emergency fund (3-6 months expenses)\n` +
        `4. Save before you spend\n` +
        `5. Review your health score regularly`;
    }
    // Default response
    else {
      response = `Hello! I'm your AI financial advisor. I can help you with:\n\n` +
        `• Purchase suggestions: "Can I buy 50000 phone?"\n` +
        `• Savings advice: "How can I save more?"\n` +
        `• Expense analysis: "How am I spending?"\n` +
        `• General tips: "Give me financial advice"\n\n` +
        `Your current health score: ${healthScore.score}/100 (${healthScore.status})`;
    }

    res.json({ response });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getInsights,
  getHealthScore,
  getFraudDetection,
  getPredictions,
  chatWithAI
};
