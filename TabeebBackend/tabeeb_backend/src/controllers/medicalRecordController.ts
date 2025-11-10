import { Request, Response } from 'express';
import MedicalRecord from '../models/MedicalRecord';
import { uploadToCloudinary } from '../services/uploadService';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../lib/prisma';

export const uploadRecord = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    let { tags, notes } = req.body;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Check if patient account is active
    const patient = await prisma.patient.findUnique({
      where: { uid: req.user!.uid },
      select: { isActive: true }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.isActive) {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

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
    // Check if patient account is active
    const patient = await prisma.patient.findUnique({
      where: { uid: req.user!.uid },
      select: { isActive: true }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.isActive) {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

    const record = await MedicalRecord.findOne({ _id: req.params.id, userId: req.user!.uid });
    if (!record) return res.status(404).json({ error: 'Record not found' });

    // Delete from Cloudinary using stored publicId
    const cloudinaryResult = await cloudinary.uploader.destroy(record.publicId, { resource_type: record.resourceType || 'raw' });

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
  try {
    // Check if patient account is active
    const patient = await prisma.patient.findUnique({
      where: { uid: req.user!.uid },
      select: { isActive: true }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.isActive) {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

    const records = await MedicalRecord.find({ userId: req.user!.uid });
    res.json(records);
  } catch (err) {
    console.error('Get records error:', err);
    res.status(500).json({ error: 'Failed to fetch records', details: err });
  }
};
