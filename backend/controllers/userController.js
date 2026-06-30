const db = require('../db/mysqlDb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fingenius-secret-key-2024';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await db.findUserByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await db.createUser({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      subscriptionType: user.subscriptionType,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate user
// @route   POST /api/users/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      subscriptionType: user.subscriptionType,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await db.findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, subscriptionType } = req.body;
    
    const user = await db.findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {};
    if (name) updates.Name = name;
    if (email) updates.Email = email;
    if (subscriptionType) updates.subscriptionType = subscriptionType;

    const updatedUser = await db.updateUser(req.userId, updates);

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      subscriptionType: updatedUser.subscriptionType
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update subscription
// @route   PUT /api/users/subscription
// @access  Private
const updateSubscription = async (req, res) => {
  try {
    const { subscriptionType } = req.body;
    
    const validSubscriptions = ['free', 'pro', 'premium'];
    if (!validSubscriptions.includes(subscriptionType)) {
      return res.status(400).json({ message: 'Invalid subscription type' });
    }

    const user = await db.findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await db.updateUser(req.userId, { subscriptionType });

    res.json({ 
      message: 'Subscription updated successfully',
      subscriptionType 
    });
  } catch (error) {
    console.error('Update Subscription Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  updateSubscription
};
