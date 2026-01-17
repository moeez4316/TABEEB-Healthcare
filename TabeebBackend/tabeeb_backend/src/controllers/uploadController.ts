import { Request, Response } from 'express';
import { uploadBlogImage } from '../services/uploadService';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = req.body.folder || 'general';
    const userId = req.user?.uid || 'anonymous';
    
    console.log(`Uploading image for user ${userId} to folder ${folder}`);
    
    const result = await uploadBlogImage(req.file.buffer, userId, folder) as any;

    console.log(`Image uploaded successfully: ${result.secure_url}`);

    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload image';
    if (error.code === 'EAI_AGAIN' || error.code === 'ENOTFOUND') {
      errorMessage = 'Network error: Unable to connect to image storage service. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = `Upload failed: ${error.message}`;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.code || error.message 
    });
  }
};
