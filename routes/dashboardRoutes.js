const express = require('express');
const router = express.Router();
const {
  authProfile
} = require('../controllers/dashboardController');

router.get('/profile/:id', authProfile);

module.exports = router;  
