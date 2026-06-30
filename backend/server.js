const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const financeRoutes = require('./routes/financeRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/ai', aiRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FinGenius AI API is running', database: 'MySQL' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Function to find free port
const findFreePort = (initialPort) => {
  return new Promise((resolve) => {
    const server = app.listen(0, 'localhost', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
};

// Start server with port handling
const startServer = async (preferredPort = 5000) => {
  try {
    const port = process.env.PORT || preferredPort;
    
    const listener = app.listen(port, () => {
      console.log(`🚀 FinGenius AI server running on port ${port}`);
      console.log(`📊 API available at http://localhost:${port}/api`);
      console.log(`💾 Using MySQL database`);
    });

    listener.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${port} is already in use. Trying next port...`);
        listener.close();
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
