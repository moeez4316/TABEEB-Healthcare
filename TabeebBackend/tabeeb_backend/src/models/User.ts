import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: String,
  name: String,
  role: { type: String, enum: ['doctor', 'patient'], default: 'patient' },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  licenseNo: String,
  cnic: String
});

export default mongoose.model('User', userSchema);