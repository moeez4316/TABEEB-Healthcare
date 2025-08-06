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

// Apply authentication middleware to all routes
router.use(verifyToken);

// Doctor availability management routes
router.post('/set', validateSetAvailability, setDoctorAvailability);
router.get('/doctor/:doctorUid', getDoctorAvailability);
router.get('/doctor', getDoctorAvailability);
router.put('/:id', validateCUID('id'), validateSetAvailability, updateAvailability);
router.delete('/:id', validateCUID('id'), deleteAvailability);

// Get available slots for booking (public for patients)
router.get('/slots/:doctorUid', getAvailableSlots);

// Get weekly schedule view
router.get('/schedule/:doctorUid', getWeeklySchedule);
router.get('/schedule', getWeeklySchedule);

export default router;
