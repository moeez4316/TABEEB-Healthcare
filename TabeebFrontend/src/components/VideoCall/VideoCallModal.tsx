'use client';

import React from 'react';
import DoctorVideoCallModal from './DoctorVideoCallModal';
import PatientVideoCallModal from './PatientVideoCallModal';

interface VideoCallModalProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  firebaseToken: string;
  userRole: 'doctor' | 'patient';
}

export default function VideoCallModal({
  appointmentId,
  isOpen,
  onClose,
  firebaseToken,
  userRole,
}: VideoCallModalProps) {
  if (userRole === 'doctor') {
    return (
      <DoctorVideoCallModal
        appointmentId={appointmentId}
        isOpen={isOpen}
        onClose={onClose}
        firebaseToken={firebaseToken}
      />
    );
  }

  return (
    <PatientVideoCallModal
      appointmentId={appointmentId}
      isOpen={isOpen}
      onClose={onClose}
      firebaseToken={firebaseToken}
    />
  );
}
