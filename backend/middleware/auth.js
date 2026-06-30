const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fingenius-secret-key-2024';

// @desc    Auth middleware - Protect routes
// @access  Private
const auth = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { auth };
