import express from 'express';
import { verifyToken } from '../middleware/verifyToken';
import {
  validateBookAppointment,
  validateStatusUpdate,
  validatePagination,
  validateCUID
} from '../middleware/appointmentValidation';
import {
  bookAppointment,
  getDoctorAppointments,
  getPatientAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentDetails,
  getAppointmentStats,
  shareDocumentsWithAppointment,
  unshareDocumentFromAppointment,
  getAppointmentSharedDocuments,
  confirmAppointmentPayment,
  checkFollowUpEligibility,
  bookFollowUpAppointment
} from '../controllers/appointmentController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Patient routes
router.post('/book', validateBookAppointment, bookAppointment);
router.get('/patient', validatePagination, getPatientAppointments);

// Follow-up routes (must be before :id routes)
router.get('/follow-up/eligibility/:doctorUid', checkFollowUpEligibility);
router.post('/follow-up/book', bookFollowUpAppointment);

// Doctor routes
router.get('/doctor', validatePagination, getDoctorAppointments);
router.patch('/:id/status', validateCUID('id'), validateStatusUpdate, updateAppointmentStatus);

// Shared routes (both patient and doctor)
router.get('/stats/overview', getAppointmentStats);
router.get('/:id', validateCUID('id'), getAppointmentDetails);
router.patch('/:id/cancel', validateCUID('id'), cancelAppointment);

// Document sharing routes
router.post('/:id/share-documents', validateCUID('id'), shareDocumentsWithAppointment);
router.delete('/:id/shared-documents/:documentId', validateCUID('id'), unshareDocumentFromAppointment);
router.get('/:id/shared-documents', validateCUID('id'), getAppointmentSharedDocuments);

// Payment confirmation route (dummy for now)
router.post('/:appointmentId/confirm-payment', confirmAppointmentPayment);

export default router;
