import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, default: 'pdf' },
  publicId: { type: String, required: true },
  resourceType: { type: String, required: true },
  tags: [String],
  uploadedAt: { type: Date, default: Date.now },
  notes: String
});

export default mongoose.model('MedicalRecord', medicalRecordSchema);