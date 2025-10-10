const express = require('express');
const router = express.Router();
const {
  getAll,
  getById,
  createRecord,
  updateRecord,
  deleteRecord
} = require('../controllers/userController');

router.get('/', getAll);  
router.get('/:id', getById);
router.post('/', createRecord); 
router.put('/:id', updateRecord);
router.delete('/:id', deleteRecord); 

module.exports = router;  