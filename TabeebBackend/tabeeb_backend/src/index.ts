import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
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
import emailRoutes from './routes/emailRoutes';
import authRoutes from './routes/authRoutes';
import { scheduleAutoGeneration } from './utils/autoGenerateSlots';
import { generalLimiter } from './middleware/rateLimiter';
import { initRealtime } from './realtime/realtime';

dotenv.config();

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
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);


const PORT = process.env.PORT || 5002;
const server = http.createServer(app);

initRealtime(server).catch((err) => {
  console.error('Realtime init failed:', err);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start auto-generation scheduler
  scheduleAutoGeneration();
});
