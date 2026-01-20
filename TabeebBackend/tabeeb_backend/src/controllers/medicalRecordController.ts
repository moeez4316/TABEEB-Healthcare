import { Request, Response } from 'express';
import MedicalRecord from '../models/MedicalRecord';
import { verifyPublicIdOwnership, buildCloudinaryUrl } from '../services/uploadService';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../lib/prisma';

/**
 * Create medical record after client-side Cloudinary upload
 * POST /api/records
 * Body: { publicId, resourceType, fileName, fileType, tags?, notes? }
 */
export const uploadRecord = async (req: Request, res: Response) => {
  try {
    // Defensive check for body parsing
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        error: 'Request body is required. Ensure Content-Type is application/json' 
      });
    }
    
    const { publicId, resourceType, fileName, fileType, tags, notes } = req.body;
    const userId = req.user!.uid;

    // Validate required fields
    if (!publicId || !resourceType) {
      return res.status(400).json({ error: 'publicId and resourceType are required' });
    }

    // Verify ownership - ensure this publicId belongs to this user
    if (!verifyPublicIdOwnership(publicId, userId, 'medical-record')) {
      return res.status(403).json({ 
        error: 'Invalid publicId for this user',
        debug: { publicId, userId, expected: `tabeeb/medical-records/${userId}/` }
      });
    }

    // Check if patient account is active
    const patient = await prisma.patient.findUnique({
      where: { uid: userId },
      select: { isActive: true }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.isActive) {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

    // Build the full URL from publicId
    const fileUrl = buildCloudinaryUrl(publicId, resourceType);

    // Parse tags if sent as a comma-separated string
    let tagsArray: string[] = [];
    if (typeof tags === 'string') {
      tagsArray = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      tagsArray = tags;
    }

    // Create record in MongoDB
    const record = await MedicalRecord.create({
      userId,
      fileUrl,
      fileType: fileType || 'application/octet-stream',
      publicId,
      resourceType,
      fileName: fileName || publicId.split('/').pop(),
      tags: tagsArray,
      notes
    });

    res.status(201).json(record);
  } catch (err) {
    console.error('Create record error:', err);
    res.status(500).json({ error: 'Failed to create record', details: err });
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
