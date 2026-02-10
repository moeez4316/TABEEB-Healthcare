import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { EMAIL_CONFIG } from '../config/resend';
import prisma from '../lib/prisma';
import { sendEmail } from '../services/emailService';

// ========================================
// RESEND WEBHOOK EVENT TYPES
// ========================================

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    // Common fields
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;

    // For email.sent / email.delivered / email.bounced / email.complained
    created_at?: string;
    
    // For inbound emails (email.received)
    headers?: Array<{ name: string; value: string }>;
    html?: string;
    text?: string;
    cc?: string[];
    bcc?: string[];
    reply_to?: string[];
    attachments?: Array<{
      filename: string;
      content_type: string;
      content: string; // Base64 encoded
    }>;

    // For bounces
    bounce_type?: string;
    
    // For clicks
    click?: { link: string; timestamp: string };
  };
}

// ========================================
// WEBHOOK HANDLER (Receives ALL Resend events)
// ========================================

export const handleResendWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSecret = EMAIL_CONFIG.webhookSecret;
    
    // If webhook secret is set, verify the signature
    if (webhookSecret) {
      const svixId = req.headers['svix-id'] as string;
      const svixTimestamp = req.headers['svix-timestamp'] as string;
      const svixSignature = req.headers['svix-signature'] as string;

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('📨 Webhook: Missing svix headers');
        res.status(400).json({ error: 'Missing webhook signature headers' });
        return;
      }

      const wh = new Webhook(webhookSecret);
      try {
        wh.verify(JSON.stringify(req.body), {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        });
      } catch (err) {
        console.error('📨 Webhook: Signature verification failed:', err);
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }
    }

    const event = req.body as ResendWebhookEvent;
    console.log(`📨 Webhook received: ${event.type}`, JSON.stringify(event.data, null, 2));

    switch (event.type) {
      // ---- OUTBOUND EMAIL EVENTS ----
      case 'email.sent':
        console.log(`📤 Email sent: ${event.data.email_id} → ${event.data.to?.join(', ')}`);
        break;

      case 'email.delivered':
        console.log(`✅ Email delivered: ${event.data.email_id} → ${event.data.to?.join(', ')}`);
        break;

      case 'email.delivery_delayed':
        console.log(`⏳ Email delayed: ${event.data.email_id} → ${event.data.to?.join(', ')}`);
        break;

      case 'email.bounced':
        console.error(`🔴 Email bounced: ${event.data.email_id} → ${event.data.to?.join(', ')} (${event.data.bounce_type})`);
        // TODO: Mark email as invalid in your DB, disable email notifications for this user
        break;

      case 'email.complained':
        console.error(`🚨 Email complaint (spam): ${event.data.email_id} → ${event.data.to?.join(', ')}`);
        // TODO: Unsubscribe the user from emails immediately
        break;

      case 'email.opened':
        console.log(`👁️ Email opened: ${event.data.email_id}`);
        break;

      case 'email.clicked':
        console.log(`🔗 Email link clicked: ${event.data.email_id} → ${event.data.click?.link}`);
        break;

      // ---- INBOUND EMAIL EVENT (Receiving mail) ----
      case 'email.received':
        console.log(`📥 INBOUND EMAIL RECEIVED!`);
        console.log(`   From: ${event.data.from}`);
        console.log(`   To: ${event.data.to?.join(', ')}`);
        console.log(`   Subject: ${event.data.subject}`);
        
        await handleInboundEmail(event.data);
        break;

      default:
        console.log(`📨 Unhandled webhook event: ${event.type}`);
    }

    // Always respond 200 to acknowledge receipt
    res.status(200).json({ received: true, type: event.type });
  } catch (error) {
    console.error('📨 Webhook processing error:', error);
    // Still return 200 to avoid Resend retrying
    res.status(200).json({ received: true, error: 'Processing error' });
  }
};

// ========================================
// INBOUND EMAIL HANDLER
// ========================================

async function handleInboundEmail(data: ResendWebhookEvent['data']) {
  const from = data.from || '';
  const to = data.to || [];
  const subject = data.subject || '(No Subject)';
  const textBody = data.text || '';
  const htmlBody = data.html || '';
  const attachments = data.attachments || [];

  console.log('📥 Processing inbound email:');
  console.log(`   From: ${from}`);
  console.log(`   To: ${to.join(', ')}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Text length: ${textBody.length}`);
  console.log(`   HTML length: ${htmlBody.length}`);
  console.log(`   Attachments: ${attachments.length}`);

  // Route based on the recipient address
  for (const recipient of to) {
    const localPart = recipient.split('@')[0].toLowerCase();

    switch (localPart) {
      case 'support':
        console.log('📥 Routing to support handler...');
        await handleSupportEmail(from, subject, textBody, htmlBody, attachments);
        break;

      case 'noreply':
        console.log('📥 Auto-reply received on noreply, ignoring.');
        break;

      case 'contact':
        console.log('📥 Routing to contact handler...');
        await handleContactEmail(from, subject, textBody, htmlBody);
        break;

      case 'feedback':
        console.log('📥 Routing to feedback handler...');
        await handleFeedbackEmail(from, subject, textBody, htmlBody);
        break;

      default:
        console.log(`📥 Email to ${recipient} - no specific handler, logging.`);
        break;
    }
  }
}

// ========================================
// INBOUND EMAIL SUB-HANDLERS
// ========================================

async function handleSupportEmail(
  from: string,
  subject: string,
  text: string,
  html: string,
  attachments: Array<{ filename: string; content_type: string; content: string }>
) {
  console.log('🎫 Support request received:');
  console.log(`   From: ${from}`);
  console.log(`   Subject: ${subject}`);

  try {
    // Store in database
    await prisma.contactMessage.create({
      data: {
        type: 'SUPPORT',
        fromEmail: from,
        subject,
        message: text || 'No text content',
        htmlContent: html || undefined,
        attachments: attachments.length > 0
          ? attachments.map(a => ({ filename: a.filename, contentType: a.content_type }))
          : undefined,
      },
    });

    // Send auto-acknowledgment
    await sendEmail({
      to: from,
      subject: `Re: ${subject} — We received your message`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0;">Tabeeb Healthcare Support</h2>
          </div>
          <div style="padding: 24px; background: #f8fffe; border: 1px solid #e0f2f1; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Thank you for contacting Tabeeb Healthcare support.</p>
            <p>We have received your message and our team will get back to you within <strong>24-48 hours</strong>.</p>
            <p style="color: #888; font-size: 13px; margin-top: 20px;">This is an automated response. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    });

    console.log('✅ Support message saved to DB and acknowledgment sent');
  } catch (error) {
    console.error('❌ Error saving support email:', error);
  }
}

async function handleContactEmail(
  from: string,
  subject: string,
  text: string,
  html: string
) {
  console.log('📬 Contact email received:');
  console.log(`   From: ${from}`);
  console.log(`   Subject: ${subject}`);

  try {
    await prisma.contactMessage.create({
      data: {
        type: 'CONTACT',
        fromEmail: from,
        subject,
        message: text || 'No text content',
        htmlContent: html || undefined,
      },
    });
    console.log('✅ Contact email saved to DB');
  } catch (error) {
    console.error('❌ Error saving contact email:', error);
  }
}

async function handleFeedbackEmail(
  from: string,
  subject: string,
  text: string,
  html: string
) {
  console.log('💬 Feedback email received:');
  console.log(`   From: ${from}`);
  console.log(`   Subject: ${subject}`);

  try {
    await prisma.contactMessage.create({
      data: {
        type: 'FEEDBACK',
        fromEmail: from,
        subject,
        message: text || 'No text content',
        htmlContent: html || undefined,
      },
    });
    console.log('✅ Feedback email saved to DB');
  } catch (error) {
    console.error('❌ Error saving feedback email:', error);
  }
}
