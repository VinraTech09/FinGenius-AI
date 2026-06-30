// FinGenius AI - Dashboard JavaScript
let dashboardCharts = {};

// Initialize Dashboard
async function initDashboard() {
  if (!fingenius.requireAuth()) return;
  
  await loadDashboardData();
  setupEventListeners();
}

// Load Dashboard Data
async function loadDashboardData() {
  try {
    const response = await fingeniusAPI.get('/finance/dashboard');
    const data = response.data;
    
    // Update stats
    updateStats(data);
    
    // Update AI Cards
    updateAICards(data);
    
    // Update Charts
    updateCharts(data);
    
    // Update Transactions
    updateTransactions(data.recentTransactions);
    
    // Handle Alert Mode
    if (data.isAlertMode) {
      showAlertMode(data);
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    fingenius.showAlert('Failed to load dashboard data');
  }
}

// Update Stats Cards
function updateStats(data) {
  document.getElementById('totalIncome').textContent = fingenius.formatCurrency(data.totalIncome);
  document.getElementById('totalExpenses').textContent = fingenius.formatCurrency(data.totalExpenses);
  document.getElementById('currentBalance').textContent = fingenius.formatCurrency(data.balance);
  
  // Color balance based on value
  const balanceEl = document.getElementById('currentBalance');
  if (data.balance < 0) {
    balanceEl.style.color = 'var(--danger-color)';
  } else {
    balanceEl.style.color = 'var(--success-color)';
  }
}

// Update AI Cards
function updateAICards(data) {
  // Health Score
  const healthScore = data.healthScore;
  const scoreCircle = document.getElementById('healthScoreCircle');
  const scoreValue = document.getElementById('healthScoreValue');
  const scoreStatus = document.getElementById('healthScoreStatus');
  const scoreRecommendation = document.getElementById('healthScoreRecommendation');
  
  scoreValue.textContent = healthScore.score;
  scoreStatus.textContent = healthScore.status;
  scoreRecommendation.textContent = healthScore.recommendation;
  
  // Update circle class
  scoreCircle.className = 'score-circle';
  if (healthScore.score >= 80) scoreCircle.classList.add('excellent');
  else if (healthScore.score >= 60) scoreCircle.classList.add('stable');
  else if (healthScore.score >= 40) scoreCircle.classList.add('risk');
  else scoreCircle.classList.add('critical');
  
  // Predictions
  const predictions = data.predictions;
  const predictionContent = document.getElementById('predictionContent');
  
  if (predictions.predictions && predictions.predictions.length > 0) {
    let html = '<div class="predictions-list">';
    predictions.predictions.forEach(pred => {
      html += `
        <div class="prediction-item">
          <span class="prediction-month">${pred.month}</span>
          <span class="prediction-balance">${fingenius.formatCurrency(pred.predictedBalance)}</span>
        </div>
      `;
    });
    html += '</div>';
    predictionContent.innerHTML = html;
  } else {
    predictionContent.innerHTML = '<p class="text-muted">Add more transactions to get predictions</p>';
  }
  
  // Risk Probability
  const riskElement = document.getElementById('riskProbability');
  if (riskElement) {
    riskElement.textContent = predictions.riskProbability + '%';
  }
  
  // Fraud Alerts
  const fraudDetection = data.fraudDetection;
  const fraudAlertsContainer = document.getElementById('fraudAlerts');
  
  if (fraudDetection.hasFraud && fraudDetection.alerts.length > 0) {
    let html = '';
    fraudDetection.alerts.forEach(alert => {
      html += `
        <div class="fraud-alert">
          <div class="fraud-alert-title">${alert.message}</div>
          <small>${alert.type} - ${alert.severity}</small>
        </div>
      `;
    });
    fraudAlertsContainer.innerHTML = html;
  } else {
    fraudAlertsContainer.innerHTML = '<p class="text-muted">No fraud detected</p>';
  }
}

// Update Charts
function updateCharts(data) {
  // Destroy existing charts
  Object.values(dashboardCharts).forEach(chart => chart.destroy());
  
  // Monthly Data for Line Chart
  const monthlyData = data.monthlyData;
  const labels = monthlyData.map(m => m.month);
  const incomeData = monthlyData.map(m => m.income);
  const expenseData = monthlyData.map(m => m.expenses);
  
  // Expense Trend Line Chart
  const trendCtx = document.getElementById('trendChart');
  if (trendCtx) {
    dashboardCharts.trend = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Income',
          data: incomeData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }, {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: '#94a3b8' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });
  }
  
  // Income vs Expense Bar Chart
  const barCtx = document.getElementById('barChart');
  if (barCtx) {
    dashboardCharts.bar = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Income',
          data: incomeData,
          backgroundColor: '#10b981'
        }, {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: '#ef4444'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: '#94a3b8' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });
  }
  
  // Category Pie Chart
  const pieCtx = document.getElementById('pieChart');
  if (pieCtx && Object.keys(data.expenseByCategory).length > 0) {
    const categories = Object.keys(data.expenseByCategory);
    const amounts = Object.values(data.expenseByCategory);
    
    dashboardCharts.pie = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: amounts,
          backgroundColor: [
            '#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
            '#06b6d4', '#ec4899', '#84cc16', '#14b8a6', '#f97316'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94a3b8' }
          }
        }
      }
    });
  }
}

// Update Transactions List
function updateTransactions(transactions) {
  const container = document.getElementById('transactionsList');
  if (!container) return;
  
  if (transactions.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">No transactions yet</p>';
    return;
  }
  
  let html = '';
  transactions.forEach(t => {
    const isIncome = t.type === 'income';
    html += `
      <div class="transaction-item">
        <div class="transaction-info">
          <div class="transaction-icon ${t.type}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${isIncome 
                ? '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>'
                : '<line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>'
              }
            </svg>
          </div>
          <div class="transaction-details">
            <h4>${t.Category}</h4>
            <p>${t.description || 'No description'}</p>
          </div>
        </div>
        <div class="transaction-amount ${t.type}">
          <div class="amount">${isIncome ? '+' : '-'}${fingenius.formatCurrency(t.Amount)}</div>
          <div class="date">${fingenius.formatDate(t.Date)}</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Show Alert Mode
function showAlertMode(data) {
  const alertContainer = document.getElementById('alertMode');
  if (!alertContainer) return;
  
  let message = 'Financial Alert: ';
  if (data.healthScore.isAlertMode) {
    message += 'Critical health score! ';
  }
  if (data.fraudDetection.hasFraud) {
    message += 'Fraud detected! ';
  }
  if (data.predictions.riskProbability > 70) {
    message += 'High risk detected!';
  }
  
  alertContainer.innerHTML = `
    <div class="alert-mode">
      <div class="alert-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        ${message}
      </div>
      <p>Please review your financial situation and take necessary actions.</p>
    </div>
  `;
}

// Setup Event Listeners
function setupEventListeners() {
  // Add Income Button
  const addIncomeBtn = document.getElementById('addIncomeBtn');
  if (addIncomeBtn) {
    addIncomeBtn.addEventListener('click', () => openModal('incomeModal'));
  }
  
  // Add Expense Button
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => openModal('expenseModal'));
  }
  
  // Close Modal
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });
  
  // Income Form
  const incomeForm = document.getElementById('incomeForm');
  if (incomeForm) {
    incomeForm.addEventListener('submit', handleAddIncome);
  }
  
  // Expense Form
  const expenseForm = document.getElementById('expenseForm');
  if (expenseForm) {
    expenseForm.addEventListener('submit', handleAddExpense);
  }
  
  // Export Button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportTransactions);
  }
}

// Modal Functions
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
  });
}

// Handle Add Income
async function handleAddIncome(e) {
  e.preventDefault();
  
  const category = document.getElementById('incomeCategory').value;
  const amount = document.getElementById('incomeAmount').value;
  const description = document.getElementById('incomeDescription').value;
  const date = document.getElementById('incomeDate').value;
  
  try {
    await fingeniusAPI.post('/finance/add-income', {
      category,
      amount: parseFloat(amount),
      description,
      date: date || new Date().toISOString()
    });
    
    fingenius.showAlert('Income added successfully!', 'success');
    closeModals();
    document.getElementById('incomeForm').reset();
    await loadDashboardData();
  } catch (error) {
    fingenius.showAlert(error.response?.data?.message || 'Failed to add income');
  }
}

// Handle Add Expense
async function handleAddExpense(e) {
  e.preventDefault();
  
  const category = document.getElementById('expenseCategory').value;
  const amount = document.getElementById('expenseAmount').value;
  const description = document.getElementById('expenseDescription').value;
  const date = document.getElementById('expenseDate').value;
  
  try {
    await fingeniusAPI.post('/finance/add-expense', {
      category,
      amount: parseFloat(amount),
      description,
      date: date || new Date().toISOString()
    });
    
    fingenius.showAlert('Expense added successfully!', 'success');
    closeModals();
    document.getElementById('expenseForm').reset();
    await loadDashboardData();
  } catch (error) {
    fingenius.showAlert(error.response?.data?.message || 'Failed to add expense');
  }
}

// Export Transactions
async function exportTransactions() {
  try {
    const response = await fingeniusAPI.get('/finance/export', {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    fingenius.showAlert('Transactions exported successfully!', 'success');
  } catch (error) {
    fingenius.showAlert('Failed to export transactions');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);
