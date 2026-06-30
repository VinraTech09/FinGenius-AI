// FinGenius AI - Main Application JavaScript
const API_BASE_URL = 'http://localhost:5000/api';

// Axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
    }
    return Promise.reject(error);
  }
);

// Utility Functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const showAlert = (message, type = 'error') => {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'error' 
        ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
        : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
      }
    </svg>
    ${message}
  `;
  
  const container = document.querySelector('.auth-card') || document.querySelector('.main-content');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
  }
};

const showLoading = () => {
  return `<div class="loading-container"><div class="spinner"></div></div>`;
};

// Authentication Functions
const register = async (name, email, password) => {
  try {
    const response = await api.post('/users/register', { name, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      window.location.href = 'dashboard.html';
    }
  } catch (error) {
    showAlert(error.response?.data?.message || 'Registration failed');
  }
};

const login = async (email, password) => {
  try {
    const response = await api.post('/users/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      window.location.href = 'dashboard.html';
    }
  } catch (error) {
    showAlert(error.response?.data?.message || 'Login failed');
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
};

const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Check authentication on protected pages
const requireAuth = () => {
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
};

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      await login(email, password);
    });
  }

  // Register Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      await register(name, email, password);
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Update user info in sidebar
  const userInfo = document.getElementById('userInfo');
  if (userInfo && isAuthenticated()) {
    const user = getUser();
    userInfo.textContent = user?.name || 'User';
  }
});

// Export functions for use in other files
window.fingeniusAPI = api;
window.fingenius = {
  formatCurrency,
  formatDate,
  showAlert,
  showLoading,
  register,
  login,
  logout,
  isAuthenticated,
  getUser,
  requireAuth,    
    apiCall: async (url, options = {}) => {
        const method = options.method || 'GET';
        const data = options.body ? JSON.parse(options.body) : null;
        
        if (method === 'GET') {
            const res = await api.get(url);
            return res.data;
        }
        if (method === 'POST') {
            const res = await api.post(url, data);
            return res.data;
        }
        if (method === 'DELETE') {
            const res = await api.delete(url);
            return res.data;
        }
    }
};
