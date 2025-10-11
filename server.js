require('dotenv').config();
const express = require('express');
const cors = require("cors"); // ✅ imported cors
const app = express();

app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000" 
}));

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboardRoutes');
const staffRoutes = require('./routes/staff');
const userRoutes = require('./routes/user');
const employerRoutes = require('./routes/employer');

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/staffs', staffRoutes);
app.use('/users', userRoutes);
app.use('/employers', employerRoutes);


// Global error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});