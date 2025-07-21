import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import recordRoutes from './routes/medicalRecords';
import doctorRoutes from './routes/doctorRoutes';
import patientRoutes from './routes/patientRoutes';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/doctor', doctorRoutes); 
app.use('/api/patient', patientRoutes);
app.use('/api/records', recordRoutes);


const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
