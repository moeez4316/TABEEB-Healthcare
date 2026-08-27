'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaSpinner, FaUserMd, FaTimes, FaPhoneSlash } from 'react-icons/fa';
import { io, Socket } from 'socket.io-client';
import LiveKitVideoRoom from './LiveKitVideoRoom';
import { useLeaveConfirmation } from './useLeaveConfirmation';

interface PatientVideoCallModalProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  firebaseToken: string;
}

type PatientCallState = 'connecting_socket' | 'waiting_room' | 'fetching_token' | 'in_call' | 'error';

export default function PatientVideoCallModal({
  appointmentId,
  isOpen,
  onClose,
  firebaseToken,
}: PatientVideoCallModalProps) {
  const [callState, setCallState] = useState<PatientCallState>('connecting_socket');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('wss://cloud.sehat.dpdns.org');
  
  const socketRef = useRef<Socket | null>(null);

  const handleClose = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setCallState('connecting_socket');
    setErrorMsg(null);
    setLivekitToken(null);
    onClose();
  }, [onClose]);

  const { requestLeave, finalizeLeave } = useLeaveConfirmation({
    isOpen,
    onConfirmLeave: handleClose,
    message: 'Do you want to leave the consultation waiting room?',
  });

  const fetchTokenAndJoinRoom = useCallback(async () => {
    try {
      setCallState('fetching_token');
      setErrorMsg(null);

      const response = await fetch(`/api/livekit/token?appointmentId=${encodeURIComponent(appointmentId)}&role=patient`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to obtain video consultation token');
      }

      const { token, serverUrl: url } = await response.json();
      if (!token) {
        throw new Error('Invalid token response from server');
      }

      setLivekitToken(token);
      if (url) setServerUrl(url);
      setCallState('in_call');
    } catch (err) {
      console.error('Error fetching LiveKit token for patient:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to connect to consultation server');
      setCallState('error');
    }
  }, [appointmentId, firebaseToken]);

  // Socket.io waiting room connection effect
  useEffect(() => {
    if (!isOpen) return;

    setCallState('connecting_socket');
    setErrorMsg(null);

    const socketEndpoint = process.env.NEXT_PUBLIC_LIVEKIT_SOCKET_URL || 'wss://cloud.sehat.dpdns.org/socket.io/';
    
    let baseUrl = socketEndpoint;
    if (socketEndpoint.includes('/socket.io')) {
      baseUrl = socketEndpoint.split('/socket.io')[0];
    }

    const socket = io(baseUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to LiveKit Socket.io server:', socket.id);
      socket.emit('join-waiting-room', appointmentId);
      socket.emit('join-waiting-room', { appointmentId });
      setCallState('waiting_room');
    });

    const handleDoctorJoined = () => {
      console.log('Doctor joined event received via Socket.io');
      fetchTokenAndJoinRoom();
    };

    socket.on('doctor-joined', handleDoctorJoined);
    socket.on('doctor_joined', handleDoctorJoined);

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error, continuing in waiting state:', err.message);
    });

    return () => {
      socket.off('doctor-joined', handleDoctorJoined);
      socket.off('doctor_joined', handleDoctorJoined);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, appointmentId, fetchTokenAndJoinRoom]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 w-full h-full overflow-hidden">
      <div className="relative w-full h-full bg-slate-950 shadow-2xl overflow-hidden flex flex-col min-w-0 min-h-0">
        {/* Top bar during waiting/error states */}
        {callState !== 'in_call' && (
          <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                <FaUserMd className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">TABEEB Video Consultation</h3>
                <p className="text-xs text-slate-400">Appointment ID: {appointmentId}</p>
              </div>
            </div>
            <button
              onClick={requestLeave}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center min-w-0 min-h-0">
          {/* Waiting Room Screen */}
          {(callState === 'connecting_socket' || callState === 'waiting_room' || callState === 'fetching_token') && (
            <div className="p-6 text-center max-w-md mx-auto flex flex-col items-center">
              {/* Pulse rings animation */}
              <div className="relative mb-8 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-teal-500/10 animate-ping absolute" />
                <div className="w-20 h-20 rounded-full bg-teal-500/20 animate-pulse absolute" />
                <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center relative z-10 shadow-lg shadow-teal-500/30">
                  {callState === 'fetching_token' ? (
                    <FaSpinner className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <FaUserMd className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {callState === 'fetching_token'
                  ? 'Connecting to Doctor...'
                  : 'Waiting for Doctor to Join'}
              </h2>
              
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                {callState === 'fetching_token'
                  ? 'Doctor has entered the consultation. Setting up video stream...'
                  : 'You are currently in the secure waiting room. Your video call will start automatically as soon as your doctor joins.'}
              </p>

              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 mb-8 w-full">
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <p className="text-xs text-slate-300">
                    Status: <span className="font-semibold text-amber-300">Waiting Room Active</span>
                  </p>
                </div>
              </div>

              <button
                onClick={requestLeave}
                className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl transition-all font-medium text-sm"
              >
                <FaPhoneSlash className="w-4 h-4" />
                <span>Leave Waiting Room</span>
              </button>
            </div>
          )}

          {/* Error Screen */}
          {callState === 'error' && (
            <div className="p-6 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
                <FaTimes className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
              <p className="text-slate-400 text-sm mb-6">{errorMsg || 'Could not connect to video consultation.'}</p>
              
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={requestLeave}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors font-medium text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => fetchTokenAndJoinRoom()}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors font-medium text-sm"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* LiveKit Consultation Room */}
          {callState === 'in_call' && livekitToken && (
            <LiveKitVideoRoom
              token={livekitToken}
              serverUrl={serverUrl}
              userRole="patient"
              onDisconnected={finalizeLeave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
