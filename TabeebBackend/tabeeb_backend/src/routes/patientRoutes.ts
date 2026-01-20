import express from 'express';
import {
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  restorePatient,
  updatePatientProfileImage,
  deletePatientProfileImage,
} from '../controllers/patientController';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

// Patient profile routes - All use JSON body (no multer needed)
router.post('/', verifyToken, createPatient);
router.get('/', verifyToken, getPatient);
router.put('/', verifyToken, updatePatient);
router.delete('/', verifyToken, deletePatient);
router.post('/restore', verifyToken, restorePatient);

// Profile image routes - Accept JSON { publicId, url } after client-side Cloudinary upload
router.post('/profile-image', verifyToken, updatePatientProfileImage);
router.put('/profile-image', verifyToken, updatePatientProfileImage);
router.delete('/profile-image', verifyToken, deletePatientProfileImage);

export default router;
