import express from 'express';
import {
  createDoctor,
  getDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

router.post('/', verifyToken, createDoctor);
router.get('/', verifyToken, getDoctor);
router.put('/', verifyToken, updateDoctor);
router.delete('/', verifyToken, deleteDoctor);

export default router;