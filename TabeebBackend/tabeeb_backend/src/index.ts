import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import userRoutes from './routes/userRoutes'
import recordRoutes from './routes/medicalRecords';
import doctorRoutes from './routes/doctorRoutes';
import patientRoutes from './routes/patientRoutes';
import adminRoutes from './routes/adminRoutes';
import verificationRoutes from './routes/verificationRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import prescriptionRoutes from './routes/prescriptionRoutes';
import videoCallRoutes from './routes/videoCallRoutes';
import reviewRoutes from './routes/reviewRoutes';
import blogRoutes from './routes/blogRoutes';
import uploadRoutes from './routes/uploadRoutes';
import healthRoutes from './routes/healthRoutes';
import { scheduleAutoGeneration } from './utils/autoGenerateSlots';
import { generalLimiter } from './middleware/rateLimiter';

dotenv.config();
connectDB();

const app = express();
app.use(cors());

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Global body parsing
app.use(express.json({ limit: '1mb' })); // JSON metadata only (files upload directly to Cloudinary)
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// All routes - multer on specific routes handles file uploads automatically
app.use('/api', healthRoutes);
app.use('/api/user', userRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/video-calls', videoCallRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/upload', uploadRoutes);


const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start auto-generation scheduler
  scheduleAutoGeneration();
});
