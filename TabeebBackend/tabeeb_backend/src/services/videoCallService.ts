import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

interface JitsiTokenPayload {
  aud: string;
  iss: string;
  sub: string;
  room: string;
  exp: number;
  moderator: boolean;
  context: {
    user: {
      name: string;
      email: string;
      avatar?: string;
      lobby_bypass: boolean;
    };
  };
}

interface GenerateTokenParams {
  appointmentId: string;
  userName: string;
  userEmail: string;
  isModerator?: boolean;
  avatarUrl?: string;
  expiryHours?: number;
}

/**
 * Generate Jitsi JWT token for DOCTOR ONLY (with moderator privileges)
 * @param params - Token generation parameters
 * @returns JWT token string
 */
export const generateDoctorJitsiToken = (params: GenerateTokenParams): string => {
  const {
    appointmentId,
    userName,
    userEmail,
    avatarUrl,
    expiryHours = 2, // Default 2 hours validity
  } = params;

  const APP_ID = process.env.JITSI_APP_ID;
  const APP_SECRET = process.env.JITSI_APP_SECRET;
  const DOMAIN = process.env.JITSI_DOMAIN;

  if (!APP_ID || !APP_SECRET || !DOMAIN) {
    throw new Error('Jitsi configuration missing in environment variables');
  }

  // Use appointment ID as room name for uniqueness
  const roomName = `appointment_${appointmentId}`;

  const payload: JitsiTokenPayload = {
    aud: APP_ID,
    iss: APP_ID,
    sub: DOMAIN,
    room: roomName,
    exp: Math.floor(Date.now() / 1000) + expiryHours * 3600,
    moderator: true, // Doctor is always moderator
    context: {
      user: {
        name: userName,
        email: userEmail,
        ...(avatarUrl && { avatar: avatarUrl }),
        lobby_bypass: true, // Doctor bypasses lobby
      },
    },
  };

  const token = jwt.sign(payload, APP_SECRET, { algorithm: 'HS256' });
  return token;
};

/**
 * Generate simple meeting link for PATIENT (no JWT - automatic lobby placement)
 * @param appointmentId - Appointment ID
 * @param userName - Patient name (optional, for display)
 * @returns Simple Jitsi meeting URL without JWT
 */
export const generatePatientMeetingLink = (
  appointmentId: string,
  userName?: string
): string => {
  const DOMAIN = process.env.JITSI_DOMAIN;
  
  if (!DOMAIN) {
    throw new Error('Jitsi domain missing in environment variables');
  }

  const roomName = `appointment_${appointmentId}`;
  
  // Simple URL without JWT - Jitsi will automatically place user in lobby
  // and require moderator admission
  let url = `https://${DOMAIN}/${roomName}`;
  
  // Add display name as URL parameter if provided
  if (userName) {
    url += `?userInfo.displayName=${encodeURIComponent(userName)}`;
  }
  
  // Add config to start with camera and mic muted
  url += `${userName ? '&' : '?'}config.startWithAudioMuted=true&config.startWithVideoMuted=true`;
  
  return url;
};

/**
 * Generate complete Jitsi meeting link with JWT token for DOCTOR
 * @param params - Token generation parameters
 * @returns Complete Jitsi meeting URL with JWT
 */
export const generateDoctorMeetingLink = (params: GenerateTokenParams): string => {
  const token = generateDoctorJitsiToken(params);
  const DOMAIN = process.env.JITSI_DOMAIN;
  const roomName = `appointment_${params.appointmentId}`;

  // Doctor link with JWT and muted settings
  return `https://${DOMAIN}/${roomName}?jwt=${token}&config.startWithAudioMuted=true&config.startWithVideoMuted=true`;
};

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use generateDoctorJitsiToken or generatePatientMeetingLink instead
 */
export const generateJitsiToken = (params: GenerateTokenParams): string => {
  return generateDoctorJitsiToken(params);
};

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use generateDoctorMeetingLink or generatePatientMeetingLink instead
 */
export const generateJitsiMeetingLink = (params: GenerateTokenParams): string => {
  return generateDoctorMeetingLink(params);
};

/**
 * Calculate call duration in seconds
 * @param startTime - Call start time
 * @param endTime - Call end time
 * @returns Duration in seconds
 */
export const calculateCallDuration = (startTime: Date, endTime: Date): number => {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
};
