require('dotenv').config();
const express = require('express');
const cors = require("cors"); // ✅ imported cors
const app = express();

app.use(express.json());

// ✅ Enable CORS for all routes
app.use(cors({
  origin: "http://localhost:3000" // allow your React app
}));

const userRoutes = require('./routes/user');

app.use('/users', userRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
