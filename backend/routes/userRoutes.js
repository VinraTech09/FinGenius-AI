const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, updateSubscription } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/subscription', auth, updateSubscription);

module.exports = router;
