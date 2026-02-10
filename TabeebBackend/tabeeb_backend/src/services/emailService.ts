import { resend, EMAIL_CONFIG } from '../config/resend';

// ========================================
// EMAIL TEMPLATES
// ========================================

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f4f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 28px; letter-spacing: 1px; }
    .header p { color: #e0f2fe; margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; color: #334155; line-height: 1.6; }
    .body h2 { color: #0284c7; margin-top: 0; }
    .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .info-label { font-weight: 600; color: #475569; }
    .info-value { color: #0f172a; }
    .btn { display: inline-block; background: #0ea5e9; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .btn:hover { background: #0284c7; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-error { background: #fee2e2; color: #991b1b; }
    .badge-info { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 TABEEB</h1>
      <p>Healthcare Platform</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Tabeeb Healthcare. All rights reserved.</p>
      <p>This is an automated message from <a href="https://tabeeb.dpdns.org" style="color: #0ea5e9;">tabeeb.dpdns.org</a></p>
    </div>
  </div>
</body>
</html>
`;

// ========================================
// SEND EMAIL FUNCTION
// ========================================

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail(options: SendEmailOptions, retries = 3) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('📧 Email skipped (RESEND_API_KEY not configured):', options.subject);
    return { success: false, error: 'API key not configured' };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_CONFIG.fromAddress,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
        tags: options.tags,
      });

      if (error) {
        // Retry on transient/network errors
        const msg = (error as { message?: string }).message || '';
        if (attempt < retries && (msg.includes('could not be resolved') || msg.includes('Unable to fetch'))) {
          console.warn(`📧 Email attempt ${attempt}/${retries} failed (transient), retrying in ${attempt}s...`);
          await new Promise(r => setTimeout(r, attempt * 1000));
          continue;
        }
        console.error('📧 Email send error:', error);
        return { success: false, error };
      }

      console.log('📧 Email sent successfully:', data?.id, '→', options.to);
      return { success: true, data };
    } catch (err) {
      if (attempt < retries) {
        console.warn(`📧 Email attempt ${attempt}/${retries} threw, retrying in ${attempt}s...`);
        await new Promise(r => setTimeout(r, attempt * 1000));
        continue;
      }
      console.error('📧 Email exception:', err);
      return { success: false, error: err };
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

// ========================================
// APPOINTMENT EMAILS
// ========================================

export async function sendAppointmentConfirmation(params: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  duration: number;
  appointmentId: string;
  consultationFees?: string;
}) {
  const html = baseTemplate(`
    <h2>Appointment Confirmed! ✅</h2>
    <p>Dear <strong>${params.patientName}</strong>,</p>
    <p>Your appointment has been successfully booked.</p>
    
    <div class="info-box">
      <div class="info-row"><span class="info-label">Doctor</span><span class="info-value">Dr. ${params.doctorName}</span></div>
      <div class="info-row"><span class="info-label">Specialization</span><span class="info-value">${params.specialization}</span></div>
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">${params.date}</span></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${params.time}</span></div>
      <div class="info-row"><span class="info-label">Duration</span><span class="info-value">${params.duration} minutes</span></div>
      ${params.consultationFees ? `<div class="info-row"><span class="info-label">Fee</span><span class="info-value">Rs. ${params.consultationFees}</span></div>` : ''}
      <div class="info-row" style="border-bottom: none;"><span class="info-label">Appointment ID</span><span class="info-value" style="font-size: 11px;">${params.appointmentId}</span></div>
    </div>
    
    <p>Please be available 5 minutes before your scheduled time.</p>
    <a href="https://tabeeb.dpdns.org/Patient/appointments" class="btn">View Appointment</a>
  `);

  return sendEmail({
    to: params.patientEmail,
    subject: `Appointment Confirmed - Dr. ${params.doctorName} on ${params.date}`,
    html,
    tags: [{ name: 'type', value: 'appointment-confirmation' }],
  });
}

export async function sendAppointmentNotificationToDoctor(params: {
  doctorEmail: string;
  doctorName: string;
  patientName: string;
  date: string;
  time: string;
  duration: number;
  patientNotes?: string;
}) {
  const html = baseTemplate(`
    <h2>New Appointment Booked 📋</h2>
    <p>Dear <strong>Dr. ${params.doctorName}</strong>,</p>
    <p>A new appointment has been booked with you.</p>
    
    <div class="info-box">
      <div class="info-row"><span class="info-label">Patient</span><span class="info-value">${params.patientName}</span></div>
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">${params.date}</span></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${params.time}</span></div>
      <div class="info-row" style="border-bottom: none;"><span class="info-label">Duration</span><span class="info-value">${params.duration} minutes</span></div>
      ${params.patientNotes ? `<div class="info-row" style="border-bottom: none;"><span class="info-label">Patient Notes</span><span class="info-value">${params.patientNotes}</span></div>` : ''}
    </div>
    
    <a href="https://tabeeb.dpdns.org/Doctor/Appointments" class="btn">View Appointments</a>
  `);

  return sendEmail({
    to: params.doctorEmail,
    subject: `New Appointment - ${params.patientName} on ${params.date}`,
    html,
    tags: [{ name: 'type', value: 'appointment-doctor-notification' }],
  });
}

export async function sendAppointmentCancellation(params: {
  email: string;
  recipientName: string;
  doctorName: string;
  patientName: string;
  date: string;
  time: string;
  cancelReason?: string;
  cancelledBy: 'patient' | 'doctor';
}) {
  const html = baseTemplate(`
    <h2>Appointment Cancelled ❌</h2>
    <p>Dear <strong>${params.recipientName}</strong>,</p>
    <p>The following appointment has been cancelled by the <strong>${params.cancelledBy}</strong>.</p>
    
    <div class="info-box">
      <div class="info-row"><span class="info-label">Doctor</span><span class="info-value">Dr. ${params.doctorName}</span></div>
      <div class="info-row"><span class="info-label">Patient</span><span class="info-value">${params.patientName}</span></div>
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">${params.date}</span></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${params.time}</span></div>
      ${params.cancelReason ? `<div class="info-row" style="border-bottom: none;"><span class="info-label">Reason</span><span class="info-value">${params.cancelReason}</span></div>` : ''}
    </div>
    
    <p>If you'd like to reschedule, please book a new appointment.</p>
    <a href="https://tabeeb.dpdns.org" class="btn">Book New Appointment</a>
  `);

  return sendEmail({
    to: params.email,
    subject: `Appointment Cancelled - ${params.date} at ${params.time}`,
    html,
    tags: [{ name: 'type', value: 'appointment-cancellation' }],
  });
}

export async function sendAppointmentReminder(params: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
}) {
  const html = baseTemplate(`
    <h2>Appointment Reminder ⏰</h2>
    <p>Dear <strong>${params.patientName}</strong>,</p>
    <p>This is a reminder for your upcoming appointment.</p>
    
    <div class="info-box">
      <div class="info-row"><span class="info-label">Doctor</span><span class="info-value">Dr. ${params.doctorName}</span></div>
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">${params.date}</span></div>
      <div class="info-row" style="border-bottom: none;"><span class="info-label">Time</span><span class="info-value">${params.time}</span></div>
    </div>
    
    <p>Please be online 5 minutes before your scheduled time.</p>
    <a href="https://tabeeb.dpdns.org/Patient/appointments" class="btn">View Appointment</a>
  `);

  return sendEmail({
    to: params.patientEmail,
    subject: `Reminder: Appointment with Dr. ${params.doctorName} - ${params.date}`,
    html,
    tags: [{ name: 'type', value: 'appointment-reminder' }],
  });
}

// ========================================
// VERIFICATION EMAILS
// ========================================

export async function sendVerificationApproved(params: {
  doctorEmail: string;
  doctorName: string;
}) {
  const html = baseTemplate(`
    <h2>Verification Approved! 🎉</h2>
    <p>Dear <strong>Dr. ${params.doctorName}</strong>,</p>
    <p>Congratulations! Your profile has been verified successfully.</p>
    
    <div class="info-box">
      <p><span class="badge badge-success">✅ VERIFIED</span></p>
      <p style="margin: 8px 0 0;">You can now receive appointments and start consulting patients on Tabeeb.</p>
    </div>
    
    <a href="https://tabeeb.dpdns.org/Doctor/Dashboard" class="btn">Go to Dashboard</a>
  `);

  return sendEmail({
    to: params.doctorEmail,
    subject: 'Your Tabeeb Profile is Verified! ✅',
    html,
    tags: [{ name: 'type', value: 'verification-approved' }],
  });
}

export async function sendVerificationRejected(params: {
  doctorEmail: string;
  doctorName: string;
  reason?: string;
}) {
  const html = baseTemplate(`
    <h2>Verification Update</h2>
    <p>Dear <strong>Dr. ${params.doctorName}</strong>,</p>
    <p>Unfortunately, your verification request was not approved at this time.</p>
    
    <div class="info-box">
      <p><span class="badge badge-error">❌ NOT APPROVED</span></p>
      ${params.reason ? `<p style="margin: 8px 0 0;"><strong>Reason:</strong> ${params.reason}</p>` : ''}
    </div>
    
    <p>Please review the feedback and resubmit your documents.</p>
    <a href="https://tabeeb.dpdns.org/Doctor/verification" class="btn">Resubmit Documents</a>
  `);

  return sendEmail({
    to: params.doctorEmail,
    subject: 'Verification Update - Action Required',
    html,
    tags: [{ name: 'type', value: 'verification-rejected' }],
  });
}

// ========================================
// PRESCRIPTION EMAIL
// ========================================

export async function sendPrescriptionReady(params: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  prescriptionId: string;
  diagnosis?: string;
}) {
  const html = baseTemplate(`
    <h2>New Prescription Available 💊</h2>
    <p>Dear <strong>${params.patientName}</strong>,</p>
    <p>Dr. ${params.doctorName} has issued a new prescription for you.</p>
    
    <div class="info-box">
      <div class="info-row"><span class="info-label">Doctor</span><span class="info-value">Dr. ${params.doctorName}</span></div>
      ${params.diagnosis ? `<div class="info-row"><span class="info-label">Diagnosis</span><span class="info-value">${params.diagnosis}</span></div>` : ''}
      <div class="info-row" style="border-bottom: none;"><span class="info-label">Prescription ID</span><span class="info-value" style="font-size: 11px;">${params.prescriptionId}</span></div>
    </div>
    
    <a href="https://tabeeb.dpdns.org/Patient/prescriptions" class="btn">View Prescription</a>
  `);

  return sendEmail({
    to: params.patientEmail,
    subject: `New Prescription from Dr. ${params.doctorName}`,
    html,
    tags: [{ name: 'type', value: 'prescription-ready' }],
  });
}

// ========================================
// WELCOME EMAIL
// ========================================

export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  role: 'patient' | 'doctor';
}) {
  const dashboardUrl = params.role === 'doctor'
    ? 'https://tabeeb.dpdns.org/Doctor/Dashboard'
    : 'https://tabeeb.dpdns.org/Patient/dashboard';

  const html = baseTemplate(`
    <h2>Welcome to Tabeeb! 👋</h2>
    <p>Dear <strong>${params.name}</strong>,</p>
    <p>Thank you for joining Tabeeb Healthcare Platform. We're excited to have you on board!</p>
    
    <div class="info-box">
      <p><span class="badge badge-info">${params.role === 'doctor' ? '🩺 DOCTOR' : '👤 PATIENT'}</span></p>
      <p style="margin: 8px 0 0;">Your account has been created successfully.</p>
      ${params.role === 'doctor' ? '<p style="margin: 8px 0 0;">Please complete your verification to start receiving appointments.</p>' : ''}
    </div>
    
    <a href="${dashboardUrl}" class="btn">Go to Dashboard</a>
  `);

  return sendEmail({
    to: params.email,
    subject: 'Welcome to Tabeeb Healthcare! 🏥',
    html,
    tags: [{ name: 'type', value: 'welcome' }],
  });
}

// ========================================
// CONTACT / GENERAL EMAIL
// ========================================

export async function sendOtpEmail(params: {
  email: string;
  code: string;
  type: 'EMAIL_VERIFY' | 'PASSWORD_RESET';
  name?: string;
  frontendUrl?: string;
}) {
  const isReset = params.type === 'PASSWORD_RESET';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
  const magicLink = `${apiUrl}/api/auth/verify-link?email=${encodeURIComponent(params.email)}&code=${params.code}&type=${params.type}`;

  const title = isReset ? 'Reset Your Password' : 'Verify Your Email';
  const subtitle = isReset
    ? 'You requested to reset your password. Click the button below or enter the code manually.'
    : 'Welcome to Tabeeb! Click the button below or enter the code to verify your email.';
  const buttonText = isReset ? '🔑 Reset My Password' : '✉️ Verify My Email';

  const digitBoxes = params.code.split('').map(digit =>
    `<td style="padding: 0 4px;">
      <div style="width: 44px; height: 52px; background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 10px; text-align: center; line-height: 52px; font-size: 26px; font-weight: 700; color: #0284c7; font-family: 'Courier New', Courier, monospace;">
        ${digit}
      </div>
    </td>`
  ).join('');

  const html = baseTemplate(`
    <h2>${title}</h2>
    <p>Dear <strong>${params.name || 'User'}</strong>,</p>
    <p>${subtitle}</p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #ffffff; padding: 16px 48px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);">
        ${buttonText}
      </a>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="border-top: 1px solid #e2e8f0; height: 1px; line-height: 1px;">&nbsp;</td>
          <td style="padding: 0 16px; white-space: nowrap; color: #94a3b8; font-size: 13px;">or enter code manually</td>
          <td style="border-top: 1px solid #e2e8f0; height: 1px; line-height: 1px;">&nbsp;</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
        <tr>
          ${digitBoxes}
        </tr>
      </table>
    </div>

    <div class="info-box">
      <p style="margin: 0;"><strong>⏱ This code expires in 10 minutes.</strong></p>
      <p style="margin: 8px 0 0;">If you did not request this, please ignore this email.</p>
    </div>

    <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">For security, never share this code with anyone. Tabeeb staff will never ask for your code.</p>
  `);

  return sendEmail({
    to: params.email,
    subject: isReset
      ? `${params.code} is your Tabeeb password reset code`
      : `${params.code} is your Tabeeb verification code`,
    html,
    tags: [{ name: 'type', value: isReset ? 'password-reset-otp' : 'email-verify-otp' }],
  });
}

export async function sendPasswordChangedEmail(params: {
  email: string;
  name?: string;
}) {
  const html = baseTemplate(`
    <h2>Password Changed Successfully 🔒</h2>
    <p>Dear <strong>${params.name || 'User'}</strong>,</p>
    <p>Your password has been changed successfully.</p>
    
    <div class="info-box">
      <p style="margin: 0;">If you did not make this change, please contact support immediately at <a href="mailto:support@tabeebemail.me" style="color: #0ea5e9;">support@tabeebemail.me</a></p>
    </div>
    
    <a href="https://tabeeb.dpdns.org/auth" class="btn">Sign In</a>
  `);

  return sendEmail({
    to: params.email,
    subject: 'Your Tabeeb Password Has Been Changed',
    html,
    tags: [{ name: 'type', value: 'password-changed' }],
  });
}

export async function sendContactEmail(params: {
  from: string;
  name: string;
  subject: string;
  message: string;
}) {
  const html = baseTemplate(`
    <h2>New Contact Message 📩</h2>
    
    <div class="info-box">
      <div class="info-row"><span class="info-label">From</span><span class="info-value">${params.name}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${params.from}</span></div>
      <div class="info-row" style="border-bottom: none;"><span class="info-label">Subject</span><span class="info-value">${params.subject}</span></div>
    </div>
    
    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-top: 16px;">
      <p style="white-space: pre-wrap;">${params.message}</p>
    </div>
  `);

  return sendEmail({
    to: EMAIL_CONFIG.replyTo,
    subject: `[Contact] ${params.subject}`,
    html,
    replyTo: params.from,
    tags: [{ name: 'type', value: 'contact' }],
  });
}
