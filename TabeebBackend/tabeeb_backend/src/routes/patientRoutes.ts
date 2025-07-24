import express from 'express';
import {
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

router.post('/', verifyToken, createPatient);
router.get('/', verifyToken, getPatient);
router.put('/', verifyToken, updatePatient);
router.delete('/', verifyToken, deletePatient);

export default router;
