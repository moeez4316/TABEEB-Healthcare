import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('⚠️  RESEND_API_KEY is not set. Email functionality will be disabled.');
}

export const resend = new Resend(resendApiKey || '');

// Email configuration
export const EMAIL_CONFIG = {
  fromAddress: process.env.RESEND_FROM_EMAIL || 'Tabeeb Healthcare <noreply@mailsytems.live>',
  replyTo: process.env.RESEND_REPLY_TO || 'support@mailsytems.live',
  domain: process.env.RESEND_DOMAIN || 'mailsytems.live',
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET || '',
};
