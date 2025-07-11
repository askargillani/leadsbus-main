const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Configure CORS
app.use(cors({
  origin: '*', // If you need credentials, replace '*' with your frontend URL
  credentials: false, // Set to false when using origin: '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Routes
app.use('/api/users', userRoutes);

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message); // Log the error message
  console.error('Stack:', err.stack);   // Log the stack trace
  res.status(500).json({ error: 'Internal Server Error' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error', err));
