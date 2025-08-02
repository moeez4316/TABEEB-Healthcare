import express from 'express';
import {
  createDoctor,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  getVerifiedDoctors,
} from '../controllers/doctorController';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

router.post('/', verifyToken, createDoctor);
router.get('/', verifyToken, getDoctor);
router.put('/', verifyToken, updateDoctor);
router.delete('/', verifyToken, deleteDoctor);

// Public route to get verified doctors for patients
router.get('/verified', getVerifiedDoctors);

export default router;