/**
 * AI Financial Health Score Engine
 * Calculates health score based on multiple financial factors
 * 
 * Formula:
 * healthScore = (savings_ratio * 40) + (expense_stability * 20) + (income_growth * 20) + (debt_inverse * 20)
 */

const calculateHealthScore = async (transactions) => {
  try {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Filter transactions for calculations
    const recentTransactions = transactions.filter(t => new Date(t.date) >= threeMonthsAgo);
    const currentMonthTransactions = transactions.filter(t => new Date(t.date) >= oneMonthAgo);
    const previousMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= new Date(now.getFullYear(), now.getMonth() - 2, 1) && date < oneMonthAgo;
    });

    // Calculate total income and expenses
    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousMonthIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // 1. Savings Ratio (40% weight)
    const savingsRatio = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
    const savingsScore = Math.max(0, Math.min(100, savingsRatio * 100));

    // 2. Expense Stability (20% weight)
    // Calculate expense variance
    const monthlyExpenses = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0);
      const monthExp = transactions
        .filter(t => {
          const date = new Date(t.date);
          return t.type === 'expense' && date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      monthlyExpenses.push(monthExp);
    }

    let expenseStabilityScore = 100;
    if (monthlyExpenses.length >= 2) {
      const avgExpenses = monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length;
      const variance = monthlyExpenses.reduce((sum, exp) => sum + Math.pow(exp - avgExpenses, 2), 0) / monthlyExpenses.length;
      const stdDev = Math.sqrt(variance);
      const cv = avgExpenses > 0 ? stdDev / avgExpenses : 0; // Coefficient of variation
      expenseStabilityScore = Math.max(0, 100 - (cv * 100));
    }

    // 3. Income Growth (20% weight)
    let incomeGrowthScore = 50; // Default neutral
    if (previousMonthIncome > 0 && currentMonthIncome > 0) {
      const growthRate = (currentMonthIncome - previousMonthIncome) / previousMonthIncome;
      incomeGrowthScore = Math.max(0, Math.min(100, 50 + (growthRate * 100)));
    } else if (currentMonthIncome > 0 && previousMonthIncome === 0) {
      incomeGrowthScore = 75; // New income started
    }

    // 4. Debt Inverse (20% weight) - Lower expenses = higher score
    const debtInverseScore = totalIncome > 0 
      ? Math.max(0, 100 - ((totalExpenses / totalIncome) * 100))
      : 50;

    // Calculate final health score
    const healthScore = Math.round(
      (savingsScore * 0.4) +
      (expenseStabilityScore * 0.2) +
      (incomeGrowthScore * 0.2) +
      (debtInverseScore * 0.2)
    );

    // Determine status
    let status, recommendation;
    if (healthScore >= 80) {
      status = 'Excellent';
      recommendation = 'Your financial health is excellent! Keep up the good work.';
    } else if (healthScore >= 60) {
      status = 'Stable';
      recommendation = 'Your finances are stable. Consider increasing savings.';
    } else if (healthScore >= 40) {
      status = 'Risk';
      recommendation = 'Your financial health needs attention. Review your expenses.';
    } else {
      status = 'Critical';
      recommendation = 'URGENT: Your financial health is critical. Take immediate action.';
    }

    return {
      score: Math.max(0, Math.min(100, healthScore)),
      status,
      recommendation,
      factors: {
        savingsRatio: Math.round(savingsScore),
        expenseStability: Math.round(expenseStabilityScore),
        incomeGrowth: Math.round(incomeGrowthScore),
        debtInverse: Math.round(debtInverseScore)
      },
      isAlertMode: healthScore < 40
    };

  } catch (error) {
    console.error('Health Score Calculation Error:', error);
    return {
      score: 50,
      status: 'Unknown',
      recommendation: 'Unable to calculate health score. Please add more transactions.',
      factors: { savingsRatio: 0, expenseStability: 0, incomeGrowth: 0, debtInverse: 0 },
      isAlertMode: false
    };
  }
};

module.exports = { calculateHealthScore };
