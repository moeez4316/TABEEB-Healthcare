import express from 'express';
import {
  createPrescription,
  getDoctorPrescriptions,
  getPatientPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  getPrescriptionStats,
  getAppointmentPrescriptions
} from '../controllers/prescriptionController';
import { verifyToken } from '../middleware/verifyToken';
import {
  validateCreatePrescription,
  validateUpdatePrescription,
  validatePrescriptionId,
  validateAppointmentId,
  validatePagination,
  validateMedicineInteractions
} from '../middleware/prescriptionValidation';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Doctor routes - with validation middleware
router.post('/', validateCreatePrescription, validateMedicineInteractions, createPrescription);
router.get('/doctor', validatePagination, getDoctorPrescriptions);
router.get('/doctor/stats', getPrescriptionStats);
router.put('/:prescriptionId', validatePrescriptionId, validateUpdatePrescription, validateMedicineInteractions, updatePrescription);
router.delete('/:prescriptionId', validatePrescriptionId, deletePrescription);

// Patient routes - with validation middleware
router.get('/patient', validatePagination, getPatientPrescriptions);

// Appointment integration routes
router.get('/appointment/:appointmentId', validateAppointmentId, getAppointmentPrescriptions);

// Shared route - uses database-level authorization to check access
router.get('/:prescriptionId', validatePrescriptionId, getPrescriptionById);

export default router;