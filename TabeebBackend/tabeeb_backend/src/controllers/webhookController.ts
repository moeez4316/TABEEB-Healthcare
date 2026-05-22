import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { Prisma } from '@prisma/client';
import { EMAIL_CONFIG, resend } from '../config/resend';
import prisma from '../lib/prisma';
import { sendEmail } from '../services/emailService';
import {
  buildInboundMailboxMetadata,
  extractEmailFromMailboxHeader,
  resolveInboundMailboxRouting,
} from '../services/adminMailboxService';
import { SafepayService } from '../services/safepayService';

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
  const fromEmail = extractEmailFromMailboxHeader(rawFrom);
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

  const routing = await resolveInboundMailboxRouting(to);
  console.log('📥 Mailbox routing result:', routing);

  await saveInboundEmail(
    routing.messageType,
    fromEmail,
    fromName,
    subject,
    textBody,
    htmlBody,
    emailAttachments,
    routing.messageType === 'SUPPORT',
    buildInboundMailboxMetadata(routing)
  );
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
  sendAck: boolean,
  metadata: Prisma.InputJsonValue
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
        metadata: metadata || undefined,
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

// ========================================
// SAFEPAY WEBHOOK HANDLER
// ========================================

export const handleSafepayWebhook = async (req: Request, res: Response) => {
  try {
    const signatureV1 = req.headers['x-sfpy-merchant-secret'] as string;
    const signatureV2 = req.headers['x-sfpy-signature'] as string;
    
    // Validate signature (either V1 or V2 format)
    if (!SafepayService.validateWebhookSignature(signatureV1 || signatureV2)) {
      console.error('❌ Invalid SafePay webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // SafePay Sandbox formats vary wildly. We must handle the actual payload received.
    const payload = req.body.root || req.body;
    let state, order_id, reference;

    if (payload.data && payload.data.notification) {
      // New format seen in raw logs: { data: { type: "payment:created", notification: { state: "PAID", tracker: "...", metadata: { order_id: "..." } } } }
      state = payload.data.notification.state;
      reference = payload.data.notification.tracker || payload.data.notification.reference;
      order_id = payload.data.notification.metadata?.order_id;
    } else if (payload.type === 'payment.succeeded' && payload.data) {
      // Payment 2.0 format nested data
      state = 'PAID';
      order_id = payload.data.reference; 
      reference = payload.data.tracker;
    } else {
      // Legacy format
      state = payload.state;
      order_id = payload.order_id;
      reference = payload.reference || payload.tracker;
      
      // If order_id isn't at the root, check payment_metadata array
      if (!order_id && Array.isArray(payload.payment_metadata)) {
        const orderMeta = payload.payment_metadata.find((meta: any) => meta.meta_key === 'order_id');
        if (orderMeta) {
          order_id = orderMeta.meta_value;
        }
      }
    }

    if (!order_id) {
      return res.status(400).json({ error: 'Missing order_id' });
    }

    console.log(`💸 SafePay webhook received for order ${order_id} with state: ${state}`);

    // Idempotency guard: if already PAID, skip processing
    const payment = await prisma.appointmentPayment.findFirst({
      where: { appointmentId: order_id }
    });

    if (payment?.paymentStatus === 'PAID') {
      console.log(`✅ Order ${order_id} is already marked as PAID. Ignoring duplicate webhook.`);
      return res.status(200).json({ received: true });
    }

    if (state === 'PAID') {
      // 1. Update Payment Record
      await prisma.appointmentPayment.update({
        where: { appointmentId: order_id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'safepay',
          ...(reference ? { safepayTracker: reference } : {})
        }
      });
      // Note: Appointment.status stays PENDING (awaiting doctor confirmation)

      // 2. Send Patient Confirmation Email
      const appointment = await prisma.appointment.findUnique({
        where: { id: order_id },
        include: { patient: true }
      });

      if (appointment?.patient?.email) {
        try {
          await sendEmail({
            to: appointment.patient.email,
            subject: 'Payment Received — Tabeeb Healthcare',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 24px; border-radius: 12px 12px 0 0;">
                  <h2 style="color: white; margin: 0;">Payment Successful</h2>
                </div>
                <div style="padding: 24px; background: #f8fffe; border: 1px solid #e0f2f1; border-top: none; border-radius: 0 0 12px 12px;">
                  <p>Your payment for appointment <strong>${order_id}</strong> has been successfully received.</p>
                  <p>Your appointment is currently <strong>awaiting doctor confirmation</strong>. You will be notified once confirmed.</p>
                </div>
              </div>
            `
          });
          console.log(`✉️ Payment confirmation email sent to ${appointment.patient.email}`);
        } catch (e) {
          console.error('⚠️ Failed to send SafePay payment confirmation email:', e);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('❌ Error handling SafePay webhook:', error);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
};

// ========================================
// SAFEPAY REDIRECT HANDLER (Handles POST/GET from SafePay)
// ========================================

export const handleSafepayRedirect = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.query.appointmentId as string;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    console.log(`🔀 SafePay Redirect triggered for appointment: ${appointmentId}`);
    
    // Safely redirect the browser to the frontend success page via 302
    return res.redirect(`${frontendUrl}/Patient/payment/success?appointmentId=${appointmentId}`);
  } catch (error) {
    console.error('❌ Error handling SafePay redirect:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/Patient/payment/error`);
  }
};
