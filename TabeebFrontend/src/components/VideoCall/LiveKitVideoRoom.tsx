'use client';

import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { FaExpand, FaCompress, FaUserMd, FaUser } from 'react-icons/fa';

interface LiveKitVideoRoomProps {
  token: string;
  serverUrl: string;
  onDisconnected: () => void;
  userRole: 'doctor' | 'patient';
  onTogglePrescription?: () => void;
  isPrescriptionOpen?: boolean;
  onCompleteConsultation?: () => void;
}

export default function LiveKitVideoRoom({
  token,
  serverUrl,
  onDisconnected,
  userRole,
  onTogglePrescription,
  isPrescriptionOpen,
  onCompleteConsultation,
}: LiveKitVideoRoomProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const normalizedUrl = serverUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://cloud.sehat.dpdns.org';

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Browser blocked full screen or non-user interaction
    }
  };

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden flex flex-col min-w-0 min-h-0">
      {/* Consultation Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-20 shrink-0 select-none">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="flex items-center space-x-2 truncate">
            {userRole === 'doctor' ? (
              <FaUserMd className="w-4 h-4 text-teal-400 shrink-0" />
            ) : (
              <FaUser className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span className="text-white text-sm font-semibold truncate">
              {userRole === 'doctor' ? 'Doctor Consultation Room' : 'Patient Video Consultation'}
            </span>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Doctor Rx Side Panel Toggle */}
          {userRole === 'doctor' && onTogglePrescription && (
            <button
              onClick={onTogglePrescription}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                isPrescriptionOpen
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
              title="Toggle Live Prescription Panel"
            >
              <span>📝 Rx Panel</span>
            </button>
          )}

          {/* Doctor Complete Consultation Button */}
          {userRole === 'doctor' && onCompleteConsultation && (
            <button
              onClick={onCompleteConsultation}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1"
              title="End consultation and mark appointment as completed"
            >
              <span>✓ Complete Consultation</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <FaCompress className="w-3.5 h-3.5" /> : <FaExpand className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main LiveKit Video Grid Container */}
      <div className="flex-1 relative overflow-hidden min-w-0 min-h-0 w-full h-full bg-slate-950">
        <LiveKitRoom
          connect={true}
          video={true}
          audio={true}
          token={token}
          serverUrl={normalizedUrl}
          onDisconnected={onDisconnected}
          onError={(err) => console.error('LiveKit Room error:', err)}
          data-lk-theme="default"
          className="w-full h-full"
          style={{ height: '100%', width: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
