import { Request, Response } from 'express';
import { uploadBlogImage } from '../services/uploadService';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = req.body.folder || 'general';
    const userId = req.user?.uid || 'anonymous';
    
    const result = await uploadBlogImage(req.file.buffer, userId, folder) as any;

    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};
