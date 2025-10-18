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

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/user', userRoutes);
app.use('/api/doctor', doctorRoutes); 
app.use('/api/patient', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/video-calls', videoCallRoutes);


const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
