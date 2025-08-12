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
  getAppointmentSharedDocuments
} from '../controllers/appointmentController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Patient routes
router.post('/book', validateBookAppointment, bookAppointment);
router.get('/patient', validatePagination, getPatientAppointments);

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

export default router;
