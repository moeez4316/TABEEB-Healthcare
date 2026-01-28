import express from 'express';
import {
  createDoctor,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  restoreDoctor,
  getVerifiedDoctors,
  updateDoctorProfileImage,
  deleteDoctorProfileImage,
} from '../controllers/doctorController';
import {
  getPublicDoctorProfile,
  getDoctorAvailabilitySummary
} from '../controllers/publicDoctorController';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

// Doctor profile routes - All use JSON body (no multer needed)
router.post('/', verifyToken, createDoctor);
router.get('/', verifyToken, getDoctor);
router.put('/', verifyToken, updateDoctor);
router.delete('/', verifyToken, deleteDoctor);
router.post('/restore', verifyToken, restoreDoctor);

// Profile image routes - Accept JSON { publicId, url } after client-side Cloudinary upload
router.post('/profile-image', verifyToken, updateDoctorProfileImage);
router.put('/profile-image', verifyToken, updateDoctorProfileImage);
router.delete('/profile-image', verifyToken, deleteDoctorProfileImage);

// Public routes (no authentication required)
router.get('/verified', getVerifiedDoctors); // Get all verified doctors
router.get('/profile/:doctorUid', getPublicDoctorProfile); // Get single doctor public profile
router.get('/profile/:doctorUid/availability-summary', getDoctorAvailabilitySummary); // Get availability summary

export default router;