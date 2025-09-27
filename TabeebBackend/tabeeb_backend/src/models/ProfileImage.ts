import mongoose from 'mongoose';

const profileImageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  imageUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  width: { type: Number },
  height: { type: Number },
  format: { type: String },
  bytes: { type: Number }
});

export default mongoose.model('ProfileImage', profileImageSchema);