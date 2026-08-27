'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FaSpinner, FaTimes } from 'react-icons/fa';
import { io, Socket } from 'socket.io-client';
import VideoCallPrescriptionPanel from './VideoCallPrescriptionPanel';
import LiveKitVideoRoom from './LiveKitVideoRoom';
import { useLeaveConfirmation } from './useLeaveConfirmation';

interface DoctorVideoCallModalProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  firebaseToken: string;
}

export default function DoctorVideoCallModal({
  appointmentId,
  isOpen,
  onClose,
  firebaseToken,
}: DoctorVideoCallModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('wss://cloud.sehat.dpdns.org');
  const [prescriptionPanelOpen, setPrescriptionPanelOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(500);

  const socketRef = useRef<Socket | null>(null);

  const handlePanelWidthChange = useCallback((width: number) => {
    setPanelWidth(width);
  }, []);

  const handleClose = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setLoading(true);
    setError(null);
    setLivekitToken(null);
    onClose();
  }, [onClose]);

  const { requestLeave, finalizeLeave } = useLeaveConfirmation({
    isOpen,
    onConfirmLeave: handleClose,
    message: 'Do you want to end the consultation?',
  });

  // Fetch LiveKit token for doctor directly and emit doctor-joined socket signal
  useEffect(() => {
    if (!isOpen) return;

    // Connect socket to relay doctor-joined signal to patient waiting room
    const socketEndpoint = process.env.NEXT_PUBLIC_LIVEKIT_SOCKET_URL || 'wss://cloud.sehat.dpdns.org/socket.io/';
    let baseUrl = socketEndpoint;
    if (socketEndpoint.includes('/socket.io')) {
      baseUrl = socketEndpoint.split('/socket.io')[0];
    }

    const socket = io(baseUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Doctor connected to Socket.io server:', socket.id);
      socket.emit('join-waiting-room', appointmentId);
      socket.emit('join-waiting-room', { appointmentId });
      socket.emit('doctor-joined', appointmentId);
      socket.emit('doctor-joined', { appointmentId });
    });

    const fetchDoctorToken = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/livekit/token?appointmentId=${encodeURIComponent(appointmentId)}&role=doctor`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to initiate doctor consultation session');
        }

        const data = await response.json();
        if (!data.token) {
          throw new Error('Invalid LiveKit token returned from server');
        }

        setLivekitToken(data.token);
        if (data.serverUrl) setServerUrl(data.serverUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching LiveKit token for doctor:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to consultation server');
        setLoading(false);
      }
    };

    fetchDoctorToken();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, appointmentId, firebaseToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-full bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
        {/* Loading State */}
        {loading && !error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950">
            <FaSpinner className="w-14 h-14 text-teal-500 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-white mb-1">Connecting as Doctor...</h3>
            <p className="text-sm text-slate-400">Initializing LiveKit video consultation room</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950 text-center">
            <div className="bg-rose-950/40 border border-rose-800/50 rounded-2xl p-6 max-w-md">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <FaTimes className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-rose-200 mb-2">Consultation Error</h3>
              <p className="text-sm text-rose-300/80 mb-6">{error}</p>
              
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={requestLeave}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors text-sm font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors text-sm font-medium"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Call & Prescription Layout */}
        {!loading && !error && livekitToken && (
          <div className="w-full h-full relative flex flex-row overflow-hidden">
            {/* LiveKit Video Consultation Room */}
            <div
              className={`h-full transition-all duration-300 ${prescriptionPanelOpen ? 'hidden sm:block flex-1' : 'w-full'}`}
              style={prescriptionPanelOpen ? { marginRight: `${panelWidth}px` } : undefined}
            >
              <LiveKitVideoRoom
                token={livekitToken}
                serverUrl={serverUrl}
                userRole="doctor"
                onDisconnected={finalizeLeave}
              />
            </div>

            {/* Live Prescription Drafting Side Panel */}
            <VideoCallPrescriptionPanel
              appointmentId={appointmentId}
              isOpen={prescriptionPanelOpen}
              onToggle={() => setPrescriptionPanelOpen((prev) => !prev)}
              onWidthChange={handlePanelWidthChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
