'use client';

import React from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';

interface LiveKitVideoRoomProps {
  token: string;
  serverUrl: string;
  onDisconnected: () => void;
  userRole: 'doctor' | 'patient';
}

export default function LiveKitVideoRoom({
  token,
  serverUrl,
  onDisconnected,
  userRole,
}: LiveKitVideoRoomProps) {
  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white text-sm font-semibold">
            {userRole === 'doctor' ? '🩺 Doctor Consultation Room' : '🩺 Patient Video Consultation'}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">LiveKit Secure RTC</span>
      </div>

      {/* Main LiveKit Room */}
      <div className="flex-1 relative overflow-hidden">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          onDisconnected={onDisconnected}
          data-lk-theme="default"
          style={{ height: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
