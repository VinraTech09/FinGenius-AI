const express = require('express');
const router = express.Router();
const { 
  getInsights, 
  getHealthScore, 
  getFraudDetection, 
  getPredictions,
  chatWithAI
} = require('../controllers/aiController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// AI insights routes
router.get('/insights', getInsights);
router.get('/health-score', getHealthScore);
router.get('/fraud-detection', getFraudDetection);
router.get('/predictions', getPredictions);

// Chat with AI
router.post('/chat', chatWithAI);

module.exports = router;
