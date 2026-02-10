import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendEmail } from '../services/emailService';
import { EMAIL_CONFIG } from '../config/resend';

// ========================================
// GET ALL CONTACT MESSAGES (Admin)
// ========================================

export const getAllContactMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (type && type !== 'all') where.type = type;

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.contactMessage.count({ where }),
    ]);

    res.json({
      messages,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalMessages: total,
        hasMore: skip + Number(limit) < total,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch contact messages' });
  }
};

// ========================================
// GET SINGLE CONTACT MESSAGE (Admin)
// ========================================

export const getContactMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const message = await prisma.contactMessage.findUnique({ where: { id } });

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Auto-mark as READ if it was NEW
    if (message.status === 'NEW') {
      await prisma.contactMessage.update({
        where: { id },
        data: { status: 'READ' },
      });
    }

    res.json({ message: { ...message, status: message.status === 'NEW' ? 'READ' : message.status } });
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ error: 'Failed to fetch contact message' });
  }
};

// ========================================
// UPDATE MESSAGE STATUS (Admin)
// ========================================

export const updateMessageStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;

    const updated = await prisma.contactMessage.update({
      where: { id },
      data,
    });

    res.json({ message: updated });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
};

// ========================================
// REPLY TO MESSAGE (Admin)
// ========================================

export const replyToMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reply, adminUsername } = req.body;

    if (!reply) {
      res.status(400).json({ error: 'Reply message is required' });
      return;
    }

    const message = await prisma.contactMessage.findUnique({ where: { id } });
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Send the reply email
    const emailResult = await sendEmail({
      to: message.fromEmail,
      subject: `Re: ${message.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0;">Tabeeb Healthcare</h2>
            <p style="color: #e0f2f1; margin: 8px 0 0 0; font-size: 14px;">Response to your message</p>
          </div>
          <div style="padding: 24px; background: #f8fffe; border: 1px solid #e0f2f1; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #1a1a1a; line-height: 1.6;">${reply.replace(/\n/g, '<br>')}</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
            <p style="color: #888; font-size: 12px;">
              <strong>Your original message:</strong><br>
              <em>${message.message.substring(0, 300)}${message.message.length > 300 ? '...' : ''}</em>
            </p>
          </div>
        </div>
      `,
    });

    if (!emailResult.success) {
      res.status(500).json({ error: 'Failed to send reply email' });
      return;
    }

    // Update the message in DB
    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        status: 'REPLIED',
        adminReply: reply,
        repliedAt: new Date(),
        repliedBy: adminUsername || 'admin',
      },
    });

    res.json({ message: updated, emailSent: true });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
};

// ========================================
// DELETE MESSAGE (Admin)
// ========================================

export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.contactMessage.delete({ where: { id } });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// ========================================
// GET UNREAD COUNT (Admin)
// ========================================

export const getUnreadCount = async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await prisma.contactMessage.count({
      where: { status: 'NEW' },
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};
