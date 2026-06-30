/**
 * AI Fraud Detection Engine
 * Detects unusual patterns in financial transactions
 * 
 * Detects:
 * - 200% sudden expense spike
 * - Unusual category spending
 * - Multiple transactions in short time
 * - Midnight abnormal activity
 */

const detectFraud = async (transactions) => {
  try {
    const alerts = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter recent transactions
    const recentTransactions = transactions.filter(t => new Date(t.date) >= oneWeekAgo);
    const monthlyTransactions = transactions.filter(t => new Date(t.date) >= oneMonthAgo);

    if (monthlyTransactions.length === 0) {
      return { hasFraud: false, alerts: [] };
    }

    // Calculate monthly averages
    const monthlyExpenseByCategory = {};
    let totalMonthlyExpenses = 0;
    let transactionCount = 0;

    monthlyTransactions.forEach(t => {
      if (t.type === 'expense') {
        totalMonthlyExpenses += t.amount;
        transactionCount++;
        monthlyExpenseByCategory[t.category] = (monthlyExpenseByCategory[t.category] || 0) + t.amount;
      }
    });

    const avgMonthlyExpenses = totalMonthlyExpenses / 3; // Approximate 3 months
    const avgTransactionAmount = transactionCount > 0 ? totalMonthlyExpenses / transactionCount : 0;

    // 1. Check for 200% sudden expense spike
    recentTransactions.forEach(t => {
      if (t.type === 'expense') {
        // Check against average
        if (avgMonthlyExpenses > 0 && t.amount > avgMonthlyExpenses * 2) {
          alerts.push({
            type: 'spike',
            severity: 'high',
            message: `Unusual expense spike: ₹${t.amount.toLocaleString()} on ${new Date(t.date).toLocaleDateString()}`,
            date: t.date,
            amount: t.amount
          });
        }
      }
    });

    // 2. Check for unusual category spending
    const categoryThreshold = avgMonthlyExpenses * 0.5; // 50% of monthly expenses
    Object.entries(monthlyExpenseByCategory).forEach(([category, amount]) => {
      if (amount > categoryThreshold && category !== 'EMI' && category !== 'Bills') {
        // Find recent transaction in this category
        const unusualTx = recentTransactions.find(t => t.category === category && t.type === 'expense');
        if (unusualTx) {
          alerts.push({
            type: 'category',
            severity: 'medium',
            message: `Unusual spending in ${category}: ₹${amount.toLocaleString()}`,
            date: unusualTx.date,
            amount: amount
          });
        }
      }
    });

    // 3. Check for multiple transactions in short time
    const transactionsByHour = {};
    recentTransactions.forEach(t => {
      const hour = new Date(t.date).getHours();
      const key = `${new Date(t.date).toDateString()}-${hour}`;
      transactionsByHour[key] = (transactionsByHour[key] || 0) + 1;
    });

    Object.entries(transactionsByHour).forEach(([key, count]) => {
      if (count >= 5) {
        alerts.push({
          type: 'frequency',
          severity: 'medium',
          message: `High transaction frequency: ${count} transactions in one hour`,
          date: key,
          amount: 0
        });
      }
    });

    // 4. Check for midnight abnormal activity
    recentTransactions.forEach(t => {
      const hour = new Date(t.date).getHours();
      if (hour >= 0 && hour < 5) {
        alerts.push({
          type: 'midnight',
          severity: 'high',
          message: `Unusual transaction at midnight: ₹${t.amount.toLocaleString()}`,
          date: t.date,
          amount: t.amount
        });
      }
    });

    // 5. Check for very large single transactions
    recentTransactions.forEach(t => {
      if (t.type === 'expense' && avgTransactionAmount > 0 && t.amount > avgTransactionAmount * 10) {
        alerts.push({
          type: 'large',
          severity: 'high',
          message: `Very large transaction: ₹${t.amount.toLocaleString()}`,
          date: t.date,
          amount: t.amount
        });
      }
    });

    // Remove duplicates
    const uniqueAlerts = alerts.filter((alert, index, self) =>
      index === self.findIndex(a => a.message === alert.message)
    );

    return {
      hasFraud: uniqueAlerts.length > 0,
      alerts: uniqueAlerts.slice(0, 5) // Limit to 5 alerts
    };

  } catch (error) {
    console.error('Fraud Detection Error:', error);
    return { hasFraud: false, alerts: [] };
  }
};

module.exports = { detectFraud };
