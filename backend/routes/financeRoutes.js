const express = require('express');
const router = express.Router();
const db = require('../db');s

const { 
  addIncome, 
  removeIncome, 
  addExpense, 
  removeExpense, 
  getTransactions, 
  getDashboardData,
  exportTransactions,
  checkAffordability
} = require('../controllers/financeController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Income routes
router.post('/add-income', addIncome);
router.delete('/remove-income/:id', removeIncome);

// Expense routes
router.post('/add-expense', addExpense);
router.delete('/remove-expense/:id', removeExpense);

// Transaction routes
router.get('/transactions', getTransactions);
router.get('/dashboard', getDashboardData);
router.get('/export', exportTransactions);

// Affordability check
router.post('/can-afford', checkAffordability);

// Download CSV Route - Naya
router.get('/download-csv', auth, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM transactions WHERE user_id =?', 
            [req.user.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).send('No transactions');
        }
        
        let csv = 'Date,Type,Category,Amount,Description\n';
        
        rows.forEach(t => {
            const date = t.Date? new Date(t.Date).toLocaleDateString('en-IN') : 'N/A';
            const type = t.type || 'N/A';
            const category = t.Category || 'N/A'; 
            const amount = t.Amount || 0;
            const description = t.description? t.description.replace(/,/g, ' ') : 'N/A';
            
            csv += `${date},${type},${category},${amount},${description}\n`;
        });
        
        res.header('Content-Type', 'text/csv');
        res.attachment('FinGenius_Transactions.csv');
        res.send(csv);
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
module.exports = router;
