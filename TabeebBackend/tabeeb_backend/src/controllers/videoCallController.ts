import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { 
  generateDoctorJitsiToken, 
  generateDoctorMeetingLink, 
  generatePatientMeetingLink,
  calculateCallDuration 
} from '../services/videoCallService';
import { VideoCallStatus } from '@prisma/client';

/**
 * Initiate a video call for an appointment
 * Creates VideoCall record and returns JWT token
 */
export const initiateVideoCall = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.body;
    const userUid = req.user?.uid;
    const userRole = req.user?.role;

    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required' });
    }

    // Verify appointment exists and user is part of it
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify user is either the doctor or patient
    if (appointment.doctorUid !== userUid && appointment.patientUid !== userUid) {
      return res.status(403).json({ message: 'Unauthorized to access this appointment' });
    }

    // Check if both doctor and patient accounts are active
    if (!appointment.doctor.isActive) {
      return res.status(403).json({ message: 'Doctor account is deactivated' });
    }

    if (!appointment.patient.isActive) {
      return res.status(403).json({ message: 'Patient account is deactivated' });
    }

    // Check if appointment is confirmed or in progress
    if (appointment.status !== 'CONFIRMED' && appointment.status !== 'IN_PROGRESS') {
      return res.status(400).json({ 
        message: 'Video call can only be initiated for confirmed or in-progress appointments',
        currentStatus: appointment.status 
      });
    }

    // Check if video call already exists
    let videoCall = await prisma.videoCall.findUnique({
      where: { appointmentId },
    });

    // Create or update video call record
    if (!videoCall) {
      videoCall = await prisma.videoCall.create({
        data: {
          appointmentId,
          roomName: `appointment_${appointmentId}`,
          status: VideoCallStatus.SCHEDULED,
        },
      });
    }

    // Determine role by checking appointment data (MORE RELIABLE than token claims)
    const isDoctor = appointment.doctorUid === userUid;
    const isPatient = appointment.patientUid === userUid;

    // Separate logic for doctor and patient
    if (isDoctor) {
      // DOCTOR: Generate JWT token with moderator privileges and lobby bypass
      const userName = `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;
      const userEmail = appointment.doctor.email || `doctor_${appointment.doctor.uid}@tabeeb.internal`;
      const avatarUrl = appointment.doctor.profileImageUrl;

      const token = generateDoctorJitsiToken({
        appointmentId,
        userName,
        userEmail,
        avatarUrl: avatarUrl || undefined,
        expiryHours: 3,
      });

      const meetingLink = generateDoctorMeetingLink({
        appointmentId,
        userName,
        userEmail,
        avatarUrl: avatarUrl || undefined,
      });

      res.status(200).json({
        message: 'Video call initiated successfully (Doctor)',
        videoCall: {
          id: videoCall.id,
          appointmentId: videoCall.appointmentId,
          roomName: videoCall.roomName,
          status: videoCall.status,
        },
        jitsiToken: token,
        meetingLink,
        userRole: 'doctor',
        isModerator: true,
        lobbyBypass: true,
        expiresIn: '3 hours',
      });
    } else {
      // PATIENT: Generate simple meeting link (no JWT - automatic lobby placement)
      const userName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
      
      const meetingLink = generatePatientMeetingLink(appointmentId, userName);

      res.status(200).json({
        message: 'Video call initiated successfully (Patient)',
        videoCall: {
          id: videoCall.id,
          appointmentId: videoCall.appointmentId,
          roomName: videoCall.roomName,
          status: videoCall.status,
        },
        meetingLink, // Simple link without JWT
        jitsiToken: null, // No token for patients
        patientName: userName, // Send patient name so frontend can auto-fill display name
        userRole: 'patient',
        isModerator: false,
        lobbyBypass: false,
        note: 'You will be placed in the lobby. Please wait for the doctor to admit you.',
      });
    }
  } catch (error: any) {
    console.error('Error initiating video call:', error);
    res.status(500).json({ message: 'Failed to initiate video call', error: error.message });
  }
};

/**
 * Get video call token for an appointment
 * Allows regenerating token without creating new call
 */
export const getVideoCallToken = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const userUid = req.user?.uid;
    const userRole = req.user?.role;

    // Verify appointment and access
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        patient: true,
        videoCall: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctorUid !== userUid && appointment.patientUid !== userUid) {
      return res.status(403).json({ message: 'Unauthorized to access this appointment' });
    }

    // Check if both doctor and patient accounts are active
    if (!appointment.doctor.isActive) {
      return res.status(403).json({ message: 'Doctor account is deactivated' });
    }

    if (!appointment.patient.isActive) {
      return res.status(403).json({ message: 'Patient account is deactivated' });
    }

    if (!appointment.videoCall) {
      return res.status(404).json({ message: 'Video call not initiated for this appointment' });
    }

    // Determine role by checking appointment data (MORE RELIABLE than token claims)
    const isDoctor = appointment.doctorUid === userUid;
    const isPatient = appointment.patientUid === userUid;

    // Separate logic for doctor and patient
    if (isDoctor) {
      // DOCTOR: Generate JWT token with moderator privileges
      const userName = `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;
      const userEmail = appointment.doctor.email || `doctor_${appointment.doctor.uid}@tabeeb.internal`;
      const avatarUrl = appointment.doctor.profileImageUrl;

      const token = generateDoctorJitsiToken({
        appointmentId,
        userName,
        userEmail,
        avatarUrl: avatarUrl || undefined,
        expiryHours: 3,
      });

      const meetingLink = generateDoctorMeetingLink({
        appointmentId,
        userName,
        userEmail,
        avatarUrl: avatarUrl || undefined,
      });

      res.status(200).json({
        message: 'Token retrieved successfully (Doctor)',
        videoCall: {
          id: appointment.videoCall.id,
          appointmentId: appointment.videoCall.appointmentId,
          roomName: appointment.videoCall.roomName,
          status: appointment.videoCall.status,
        },
        jitsiToken: token,
        meetingLink,
        userRole: 'doctor',
        isModerator: true,
        lobbyBypass: true,
        expiresIn: '3 hours',
      });
    } else {
      // PATIENT: Generate simple meeting link (no JWT)
      const userName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
      
      const meetingLink = generatePatientMeetingLink(appointmentId, userName);

      res.status(200).json({
        message: 'Meeting link retrieved successfully (Patient)',
        videoCall: {
          id: appointment.videoCall.id,
          appointmentId: appointment.videoCall.appointmentId,
          roomName: appointment.videoCall.roomName,
          status: appointment.videoCall.status,
        },
        meetingLink,
        jitsiToken: null,
        userRole: 'patient',
        isModerator: false,
        lobbyBypass: false,
        note: 'You will be placed in the lobby. Please wait for the doctor to admit you.',
      });
    }
  } catch (error: any) {
    console.error('Error getting video call token:', error);
    res.status(500).json({ message: 'Failed to get video call token', error: error.message });
  }
};

/**
 * Update video call status (start, end, etc.)
 */
export const updateVideoCallStatus = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { status, action } = req.body; // action: 'join', 'start', 'end', 'cancel'
    const userUid = req.user?.uid;
    const userRole = req.user?.role;

    // Verify appointment and access
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { videoCall: true },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctorUid !== userUid && appointment.patientUid !== userUid) {
      return res.status(403).json({ message: 'Unauthorized to access this appointment' });
    }

    if (!appointment.videoCall) {
      return res.status(404).json({ message: 'Video call not found for this appointment' });
    }

    // Determine role by checking appointment data (MORE RELIABLE than token claims)
    const isDoctor = appointment.doctorUid === userUid;
    const isPatient = appointment.patientUid === userUid;

    const updateData: any = {};
    const now = new Date();

    // Handle different actions
    switch (action) {
      case 'join':
        if (isDoctor) {
          updateData.doctorJoinedAt = now;
        } else {
          updateData.patientJoinedAt = now;
        }
        // If both have joined, mark as IN_PROGRESS
        if (
          (isDoctor && appointment.videoCall.patientJoinedAt) ||
          (isPatient && appointment.videoCall.doctorJoinedAt)
        ) {
          updateData.status = VideoCallStatus.IN_PROGRESS;
          updateData.startedAt = appointment.videoCall.startedAt || now;
        }
        break;

      case 'start':
        updateData.status = VideoCallStatus.IN_PROGRESS;
        updateData.startedAt = appointment.videoCall.startedAt || now;
        if (isDoctor) {
          updateData.doctorJoinedAt = appointment.videoCall.doctorJoinedAt || now;
        } else {
          updateData.patientJoinedAt = appointment.videoCall.patientJoinedAt || now;
        }
        break;

      case 'end':
        updateData.status = VideoCallStatus.COMPLETED;
        updateData.endedAt = now;
        if (appointment.videoCall.startedAt) {
          updateData.duration = calculateCallDuration(appointment.videoCall.startedAt, now);
        }
        // Update appointment status to completed if not already
        if (appointment.status !== 'COMPLETED') {
          await prisma.appointment.update({
            where: { id: appointmentId },
            data: { 
              status: 'COMPLETED',
              completedAt: now,
            },
          });
        }
        break;

      case 'cancel':
        updateData.status = VideoCallStatus.CANCELLED;
        break;

      case 'failed':
        updateData.status = VideoCallStatus.FAILED;
        break;

      default:
        if (status) {
          updateData.status = status;
        }
    }

    // Update video call
    const updatedVideoCall = await prisma.videoCall.update({
      where: { appointmentId },
      data: updateData,
    });

    res.status(200).json({
      message: 'Video call status updated successfully',
      videoCall: updatedVideoCall,
    });
  } catch (error: any) {
    console.error('Error updating video call status:', error);
    res.status(500).json({ message: 'Failed to update video call status', error: error.message });
  }
};

/**
 * Get video call details for an appointment
 */
export const getVideoCallDetails = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const userUid = req.user?.uid;

    // Verify appointment and access
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        videoCall: true,
        doctor: {
          select: {
            uid: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        patient: {
          select: {
            uid: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctorUid !== userUid && appointment.patientUid !== userUid) {
      return res.status(403).json({ message: 'Unauthorized to access this appointment' });
    }

    res.status(200).json({
      message: 'Video call details retrieved successfully',
      appointment: {
        id: appointment.id,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
      },
      videoCall: appointment.videoCall,
      doctor: appointment.doctor,
      patient: appointment.patient,
    });
  } catch (error: any) {
    console.error('Error getting video call details:', error);
    res.status(500).json({ message: 'Failed to get video call details', error: error.message });
  }
};

/**
 * Get all video calls for a user (doctor or patient)
 */
export const getUserVideoCalls = async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    const userRole = req.user?.role;
    const { status } = req.query; // Optional filter by status

    const whereCondition: any = {};
    
    if (userRole === 'doctor') {
      whereCondition.appointment = { doctorUid: userUid };
    } else {
      whereCondition.appointment = { patientUid: userUid };
    }

    if (status) {
      whereCondition.status = status;
    }

    const videoCalls = await prisma.videoCall.findMany({
      where: whereCondition,
      include: {
        appointment: {
          include: {
            doctor: {
              select: {
                uid: true,
                firstName: true,
                lastName: true,
                email: true,
                specialization: true,
              },
            },
            patient: {
              select: {
                uid: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      message: 'Video calls retrieved successfully',
      count: videoCalls.length,
      videoCalls,
    });
  } catch (error: any) {
    console.error('Error getting user video calls:', error);
    res.status(500).json({ message: 'Failed to get video calls', error: error.message });
  }
};
