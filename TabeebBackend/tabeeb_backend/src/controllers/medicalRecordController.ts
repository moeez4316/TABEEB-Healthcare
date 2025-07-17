
import { Request, Response } from 'express';
import MedicalRecord from '../models/MedicalRecord';
import { uploadToCloudinary } from '../services/uploadService';
import { v2 as cloudinary } from 'cloudinary';

export const uploadRecord = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    let { tags, notes } = req.body;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Determine resource_type for Cloudinary
    let resourceType: 'image' | 'raw' = 'raw';
    if (file.mimetype.startsWith('image/')) resourceType = 'image';

    // Upload directly from buffer
    const uploadResult = await uploadToCloudinary(file.buffer, file.originalname, resourceType) as { secure_url: string, public_id: string };

    // Parse tags if sent as a comma-separated string
    let tagsArray: string[] = [];
    if (typeof tags === 'string') {
      tagsArray = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      tagsArray = tags;
    }

    const record = await MedicalRecord.create({
      userId: req.user!.uid,
      fileUrl: uploadResult.secure_url,
      fileType: file.mimetype,
      publicId: uploadResult.public_id,
      resourceType,
      tags: tagsArray,
      notes
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err });
  }
};

export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, userId: req.user!.uid });
    if (!record) return res.status(404).json({ error: 'Record not found' });

    // Use stored publicId for deletion

    console.log('Attempting to delete Cloudinary asset with publicId:', record.publicId, 'and resourceType:', record.resourceType);
    const cloudinaryResult = await cloudinary.uploader.destroy(record.publicId, { resource_type: record.resourceType || 'raw' });
    console.log('Cloudinary destroy result:', cloudinaryResult);

    if (cloudinaryResult.result !== 'ok' && cloudinaryResult.result !== 'not found') {
      return res.status(500).json({ error: 'Cloudinary deletion failed', details: cloudinaryResult });
    }

    // Delete from MongoDB
    await MedicalRecord.deleteOne({ _id: record._id });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete record error:', err);
    res.status(500).json({ error: 'Delete failed', details: err });
  }
};

export const getRecords = async (req: Request, res: Response) => {
  const records = await MedicalRecord.find({ userId: req.user!.uid });
  res.json(records);
};
