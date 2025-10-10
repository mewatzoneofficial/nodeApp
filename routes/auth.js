const express = require('express');
const router = express.Router();
const {
  authUser,
  deleteAnonymousUser,
  deleteAnonymousUsers,
} = require('../controllers/authController');

router.post('/login', authUser);
router.get('/deleteAnonymousUser', deleteAnonymousUser);
router.get('/deleteAnonymousUsers', deleteAnonymousUsers);

module.exports = router;
