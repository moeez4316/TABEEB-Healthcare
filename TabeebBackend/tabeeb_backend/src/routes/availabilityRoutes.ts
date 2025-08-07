import express from 'express';
import { verifyToken } from '../middleware/verifyToken';
import {
  validateSetAvailability,
  validatePagination,
  validateCUID
} from '../middleware/appointmentValidation';
import {
  setDoctorAvailability,
  getDoctorAvailability,
  getAvailableSlots,
  updateAvailability,
  deleteAvailability,
  getWeeklySchedule
} from '../controllers/availabilityController';

const router = express.Router();

// Public routes for patients (no authentication required)
// Get available slots for booking
router.get('/slots/:doctorUid', getAvailableSlots);

// Get doctor availability for calendar display (public for patients)
router.get('/doctor/:doctorUid', getDoctorAvailability);

// Apply authentication middleware to protected routes
router.use(verifyToken);

// Authenticated routes for doctor availability management
router.post('/set', setDoctorAvailability);
router.get('/doctor', getDoctorAvailability); // Get own availability (authenticated)
router.put('/:id', validateCUID('id'), validateSetAvailability, updateAvailability);
router.delete('/:id', validateCUID('id'), deleteAvailability);

// Get weekly schedule view
router.get('/schedule/:doctorUid', getWeeklySchedule);
router.get('/schedule', getWeeklySchedule);

export default router;
