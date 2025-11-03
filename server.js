import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import staffRoutes from './routes/staff.js';
import userRoutes from './routes/user.js';
import employerRoutes from './routes/employer.js';
import jobRoutes from './routes/jobRoutes.js';

const app = express();

app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000"
}));

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/staffs', staffRoutes);
app.use('/users', userRoutes);
app.use('/employers', employerRoutes);
app.use('/job', jobRoutes);

// Error handling middleware
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
