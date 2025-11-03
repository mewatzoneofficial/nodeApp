import express from 'express';
import {
  getAll,
  getById,
  createRecord,
  updateRecord,
  deleteRecord
} from '../controllers/jobController.js';

const router = express.Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', createRecord);
router.put('/:id', updateRecord);
router.delete('/:id', deleteRecord);

export default router;
