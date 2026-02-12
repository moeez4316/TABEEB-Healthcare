import { Request, Response } from 'express';
import { verifyPublicIdOwnership, buildCloudinaryUrl } from '../services/uploadService';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../lib/prisma';

/** Helper: convert comma-separated tags string ↔ array */
const parseTags = (tags: unknown): string[] => {
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean);
  if (Array.isArray(tags)) return tags.map(String);
  return [];
};
const serializeTags = (arr: string[]): string | null => (arr.length ? arr.join(',') : null);

/** Format a Prisma record to the shape the frontend expects */
const formatRecord = (r: any) => ({
  id: r.id,
  userId: r.userId,
  fileUrl: r.fileUrl,
  fileType: r.fileType,
  publicId: r.publicId,
  resourceType: r.resourceType,
  fileName: r.fileName,
  tags: r.tags ? r.tags.split(',').map((t: string) => t.trim()) : [],
  notes: r.notes,
  uploadedAt: r.uploadedAt,
});

/**
 * Create medical record after client-side Cloudinary upload
 * POST /api/records
 * Body: { publicId, resourceType, fileName, fileType, tags?, notes? }
 */
export const uploadRecord = async (req: Request, res: Response) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Request body is required. Ensure Content-Type is application/json'
      });
    }

    const { publicId, resourceType, fileName, fileType, tags, notes } = req.body;
    const userId = req.user!.uid;

    if (!publicId || !resourceType) {
      return res.status(400).json({ error: 'publicId and resourceType are required' });
    }

    if (!verifyPublicIdOwnership(publicId, userId, 'medical-record')) {
      return res.status(403).json({
        error: 'Invalid publicId for this user',
        debug: { publicId, userId, expected: `tabeeb/medical-records/${userId}/` }
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { uid: userId },
      select: { isActive: true }
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (!patient.isActive) return res.status(403).json({ error: 'Your account is deactivated' });

    const fileUrl = buildCloudinaryUrl(publicId, resourceType);
    const tagsArray = parseTags(tags);

    const record = await prisma.medicalRecord.create({
      data: {
        userId,
        fileUrl,
        fileType: fileType || 'application/octet-stream',
        publicId,
        resourceType,
        fileName: fileName || publicId.split('/').pop() || 'file',
        tags: serializeTags(tagsArray),
        notes: notes || null,
      }
    });

    res.status(201).json(formatRecord(record));
  } catch (err) {
    console.error('Create record error:', err);
    res.status(500).json({ error: 'Failed to create record', details: err });
  }
};

export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { uid: req.user!.uid },
      select: { isActive: true }
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (!patient.isActive) return res.status(403).json({ error: 'Your account is deactivated' });

    const record = await prisma.medicalRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.uid }
    });
    if (!record) return res.status(404).json({ error: 'Record not found' });

    // Delete from Cloudinary
    const cloudinaryResult = await cloudinary.uploader.destroy(
      record.publicId,
      { resource_type: record.resourceType || 'raw' }
    );
    if (cloudinaryResult.result !== 'ok' && cloudinaryResult.result !== 'not found') {
      return res.status(500).json({ error: 'Cloudinary deletion failed', details: cloudinaryResult });
    }

    await prisma.medicalRecord.delete({ where: { id: record.id } });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete record error:', err);
    res.status(500).json({ error: 'Delete failed', details: err });
  }
};

export const getRecords = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { uid: req.user!.uid },
      select: { isActive: true }
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (!patient.isActive) return res.status(403).json({ error: 'Your account is deactivated' });

    const records = await prisma.medicalRecord.findMany({
      where: { userId: req.user!.uid },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json(records.map(formatRecord));
  } catch (err) {
    console.error('Get records error:', err);
    res.status(500).json({ error: 'Failed to fetch records', details: err });
  }
};
