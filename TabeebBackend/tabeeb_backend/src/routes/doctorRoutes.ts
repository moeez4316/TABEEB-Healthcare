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
  getOnboardingStatus,
  completeOnboarding,
} from '../controllers/doctorController';
import {
  getOwnDoctorPayoutMethods,
  createDoctorPayoutMethod,
  updateDoctorPayoutMethod,
  deleteDoctorPayoutMethod,
} from '../controllers/doctorPayoutController';
import {
  getPublicDoctorProfile,
  getDoctorAvailabilitySummary
} from '../controllers/publicDoctorController';
import { verifyToken } from '../middleware/verifyToken';
import { validateDoctorProfile, verifyEmailVerified } from '../middleware/userValidation';

const router = express.Router();

// Doctor profile routes - All use JSON body (no multer needed)
router.post('/', verifyToken, verifyEmailVerified, validateDoctorProfile, createDoctor);
router.get('/', verifyToken, getDoctor);
router.put('/', verifyToken, validateDoctorProfile, updateDoctor);
router.delete('/', verifyToken, deleteDoctor);
router.post('/restore', verifyToken, restoreDoctor);

// Profile image routes - Accept JSON { publicId, url } after client-side Cloudinary upload
router.post('/profile-image', verifyToken, updateDoctorProfileImage);
router.put('/profile-image', verifyToken, updateDoctorProfileImage);
router.delete('/profile-image', verifyToken, deleteDoctorProfileImage);

// Onboarding routes
router.get('/onboarding-status', verifyToken, getOnboardingStatus);
router.post('/complete-onboarding', verifyToken, completeOnboarding);

// Payout methods routes
router.get('/payout-methods', verifyToken, getOwnDoctorPayoutMethods);
router.post('/payout-methods', verifyToken, createDoctorPayoutMethod);
router.put('/payout-methods/:methodId', verifyToken, updateDoctorPayoutMethod);
router.delete('/payout-methods/:methodId', verifyToken, deleteDoctorPayoutMethod);

// Public routes (no authentication required)
router.get('/verified', getVerifiedDoctors); // Get all verified doctors
router.get('/profile/:doctorUid', getPublicDoctorProfile); // Get single doctor public profile
router.get('/profile/:doctorUid/availability-summary', getDoctorAvailabilitySummary); // Get availability summary

export default router;