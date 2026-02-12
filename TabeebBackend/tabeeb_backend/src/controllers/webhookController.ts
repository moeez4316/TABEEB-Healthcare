import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { EMAIL_CONFIG, resend } from '../config/resend';
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
    
    // For inbound emails (email.received) — NOTE: html/text are NOT in webhook payload
    // You must call resend.emails.receiving.get(email_id) to get the body
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

// Helper: extract email from "Name <email@domain.com>" format
function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1] : raw.trim();
}

// Helper: extract display name from "Name <email@domain.com>" format
function extractName(raw: string): string | null {
  const match = raw.match(/^(.+?)\s*<[^>]+>$/);
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : null;
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
  const rawFrom = data.from || '';
  const to = data.to || [];
  const subject = data.subject || '(No Subject)';
  const emailId = data.email_id || '';

  // Parse sender info
  const fromEmail = extractEmail(rawFrom);
  const fromName = extractName(rawFrom);

  console.log('📥 Processing inbound email:');
  console.log(`   Email ID: ${emailId}`);
  console.log(`   From (raw): ${rawFrom}`);
  console.log(`   From (email): ${fromEmail}`);
  console.log(`   From (name): ${fromName}`);
  console.log(`   To: ${to.join(', ')}`);
  console.log(`   Subject: ${subject}`);

  // Fetch FULL email content from Resend API
  // (Webhook payloads do NOT include html/text body — you must call the API)
  let textBody = '';
  let htmlBody = '';
  let emailAttachments: Array<{ filename: string; content_type: string }> = [];

  if (emailId) {
    try {
      console.log(`📥 Fetching email content from Resend API for ID: ${emailId}`);
      const { data: fullEmail, error } = await resend.emails.receiving.get(emailId);

      if (error) {
        console.error('❌ Resend API error fetching email content:', error);
      } else if (fullEmail) {
        textBody = (fullEmail as any).text || '';
        htmlBody = (fullEmail as any).html || '';
        emailAttachments = ((fullEmail as any).attachments || []).map((a: any) => ({
          filename: a.filename,
          content_type: a.content_type,
        }));
        console.log(`   ✅ Fetched body — text: ${textBody.length} chars, html: ${htmlBody.length} chars, attachments: ${emailAttachments.length}`);
      }
    } catch (err) {
      console.error('❌ Error fetching email content from Resend API:', err);
    }
  } else {
    console.warn('⚠️  No email_id in webhook payload, cannot fetch body');
  }

  // Determine message type based on recipient routing
  let handled = false;

  for (const recipient of to) {
    // Handle both "email@domain" and "Name <email@domain>" formats
    const cleanEmail = extractEmail(recipient);
    const localPart = cleanEmail.split('@')[0].toLowerCase();

    console.log(`📥 Routing recipient: ${recipient} → local part: ${localPart}`);

    switch (localPart) {
      case 'support':
        console.log('📥 Routing to support handler...');
        await saveInboundEmail('SUPPORT', fromEmail, fromName, subject, textBody, htmlBody, emailAttachments, true);
        handled = true;
        break;

      case 'noreply':
        console.log('📥 Auto-reply received on noreply, ignoring.');
        handled = true;
        break;

      case 'contact':
        console.log('📥 Routing to contact handler...');
        await saveInboundEmail('CONTACT', fromEmail, fromName, subject, textBody, htmlBody, emailAttachments, false);
        handled = true;
        break;

      case 'feedback':
        console.log('📥 Routing to feedback handler...');
        await saveInboundEmail('FEEDBACK', fromEmail, fromName, subject, textBody, htmlBody, emailAttachments, false);
        handled = true;
        break;

      default:
        console.log(`📥 Email to ${recipient} (${localPart}) - no specific handler.`);
        break;
    }
  }

  // Fallback: if no recipient matched a handler, still save the email as INBOUND
  if (!handled) {
    console.log('📥 No handler matched — saving as generic INBOUND message');
    await saveInboundEmail('INBOUND', fromEmail, fromName, subject, textBody, htmlBody, emailAttachments, false);
  }
}

// ========================================
// SAVE INBOUND EMAIL TO DATABASE
// ========================================

async function saveInboundEmail(
  type: 'SUPPORT' | 'CONTACT' | 'FEEDBACK' | 'INBOUND',
  fromEmail: string,
  fromName: string | null,
  subject: string,
  text: string,
  html: string,
  attachments: Array<{ filename: string; content_type: string }>,
  sendAck: boolean
) {
  try {
    const message = await prisma.contactMessage.create({
      data: {
        type,
        fromEmail,
        fromName: fromName || undefined,
        subject,
        message: text || html?.replace(/<[^>]*>/g, '').substring(0, 5000) || 'No text content',
        htmlContent: html || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
    });

    console.log(`✅ ${type} message saved to DB with ID: ${message.id}`);

    // Send auto-acknowledgment for support emails
    if (sendAck && fromEmail) {
      try {
        await sendEmail({
          to: fromEmail,
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
        console.log('✅ Auto-acknowledgment sent to', fromEmail);
      } catch (ackError) {
        console.error('⚠️  Failed to send auto-acknowledgment (message still saved):', ackError);
      }
    }
  } catch (error) {
    console.error(`❌ Error saving ${type} email to DB:`, error);
  }
}
