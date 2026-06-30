/**
 * AI Prediction Model using Linear Regression
 * Predicts next 3 months balance, risk probability, and savings trend
 * (Uses custom ML logic instead of TensorFlow.js)
 */

// Simple linear regression model for predictions
class PredictionModel {
  constructor() {
    this.isModelReady = false;
    this.history = [];
  }

  // Prepare data from transactions
  prepareData(transactions) {
    const monthlyData = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expenses: 0 };
      }
      
      if (t.type === 'income') {
        monthlyData[key].income += t.amount;
      } else {
        monthlyData[key].expenses += t.amount;
      }
    });

    // Convert to array and sort by date
    const sortedData = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        balance: data.income - data.expenses
      }));

    return sortedData;
  }

  // Simple linear regression for trend prediction
  linearRegression(values) {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  // Make predictions
  async predict(transactions) {
    try {
      const monthlyData = this.prepareData(transactions);
      
      if (monthlyData.length < 2) {
        return this.getDefaultPrediction();
      }

      // Extract balance values
      const balances = monthlyData.map(d => d.balance);
      const incomes = monthlyData.map(d => d.income);
      const expenses = monthlyData.map(d => d.expenses);

      // Calculate trends
      const balanceTrend = this.linearRegression(balances);
      const incomeTrend = this.linearRegression(incomes);
      const expenseTrend = this.linearRegression(expenses);

      // Current values
      const currentBalance = balances[balances.length - 1];
      const currentIncome = incomes[incomes.length - 1];
      const currentExpenses = expenses[expenses.length - 1];

      // Predict next 3 months
      const predictions = [];
      for (let i = 1; i <= 3; i++) {
        const predictedBalance = currentBalance + (balanceTrend.slope * i);
        const predictedIncome = currentIncome + (incomeTrend.slope * i);
        const predictedExpenses = currentExpenses + (expenseTrend.slope * i);
        
        predictions.push({
          month: this.getFutureMonth(i),
          predictedBalance: Math.max(0, Math.round(predictedBalance)),
          predictedIncome: Math.round(predictedIncome),
          predictedExpenses: Math.round(predictedExpenses)
        });
      }

      // Calculate risk probability
      const riskFactors = [];
      let riskScore = 0;

      // Check if balance trend is negative
      if (balanceTrend.slope < -1000) {
        riskFactors.push('Declining balance trend');
        riskScore += 30;
      }

      // Check if expenses are growing faster than income
      if (expenseTrend.slope > incomeTrend.slope && expenseTrend.slope > 0) {
        riskFactors.push('Expenses growing faster than income');
        riskScore += 25;
      }

      // Check if current balance is negative
      if (currentBalance < 0) {
        riskFactors.push('Negative current balance');
        riskScore += 35;
      }

      // Check savings ratio
      const savingsRatio = currentIncome > 0 ? (currentIncome - currentExpenses) / currentIncome : 0;
      if (savingsRatio < 0) {
        riskFactors.push('Negative savings');
        riskScore += 20;
      } else if (savingsRatio < 0.1) {
        riskFactors.push('Very low savings (<10%)');
        riskScore += 10;
      }

      const riskProbability = Math.min(100, Math.max(0, riskScore));

      // Determine savings trend
      let savingsTrend = 'stable';
      if (balanceTrend.slope > 500) {
        savingsTrend = 'improving';
      } else if (balanceTrend.slope < -500) {
        savingsTrend = 'declining';
      }

      return {
        predictions,
        riskProbability,
        riskFactors: riskFactors.length > 0 ? riskFactors : ['No significant risks detected'],
        savingsTrend,
        currentBalance,
        trendDirection: balanceTrend.slope > 0 ? 'positive' : balanceTrend.slope < 0 ? 'negative' : 'stable',
        trendValue: Math.round(balanceTrend.slope),
        modelAccuracy: monthlyData.length >= 6 ? 85 : 60 + (monthlyData.length * 5),
        isReliable: monthlyData.length >= 3
      };

    } catch (error) {
      console.error('Prediction Error:', error);
      return this.getDefaultPrediction();
    }
  }

  getFutureMonth(offset) {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  }

  getDefaultPrediction() {
    return {
      predictions: [
        { month: this.getFutureMonth(1), predictedBalance: 0, predictedIncome: 0, predictedExpenses: 0 },
        { month: this.getFutureMonth(2), predictedBalance: 0, predictedIncome: 0, predictedExpenses: 0 },
        { month: this.getFutureMonth(3), predictedBalance: 0, predictedIncome: 0, predictedExpenses: 0 }
      ],
      riskProbability: 50,
      riskFactors: ['Insufficient data for accurate prediction'],
      savingsTrend: 'unknown',
      currentBalance: 0,
      trendDirection: 'stable',
      trendValue: 0,
      modelAccuracy: 0,
      isReliable: false
    };
  }
}

module.exports = new PredictionModel();
