'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';

interface PatientVideoCallModalProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  firebaseToken: string;
}

interface JitsiAPI {
  dispose: () => void;
  addEventListener: (event: string, handler: () => void) => void;
  removeEventListener?: (event: string, handler: () => void) => void;
  executeCommand?: (command: string, ...args: unknown[]) => void;
}

interface JitsiConfig {
  roomName: string;
  jwt?: string;
  width: string;
  height: string;
  parentNode: HTMLElement;
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
  userInfo?: {
    displayName?: string;
  };
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: {
      new (domain: string, options: JitsiConfig): JitsiAPI;
    };
  }
}

export default function PatientVideoCallModal({
  appointmentId,
  isOpen,
  onClose,
  firebaseToken,
}: PatientVideoCallModalProps) {
  const jitsiContainer = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<JitsiAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);

  // Load Jitsi External API script
  useEffect(() => {
    if (!isOpen) return;

    const scriptSrc = 'https://cloud.sehat.dpdns.org/external_api.js';
    
    const checkJitsiLoaded = () => {
      return typeof window.JitsiMeetExternalAPI === 'function';
    };

    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
    
    if (existingScript) {
      if (checkJitsiLoaded()) {
        setJitsiLoaded(true);
      } else {
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkInterval = setInterval(() => {
          attempts++;
          if (checkJitsiLoaded()) {
            clearInterval(checkInterval);
            setJitsiLoaded(true);
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            setError('Video call interface is taking too long to load. Please refresh and try again.');
            setLoading(false);
          }
        }, 500);
        
        return () => clearInterval(checkInterval);
      }
    } else {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      
      let loadTimeout: NodeJS.Timeout;
      
      script.onload = () => {
        loadTimeout = setTimeout(() => {
          if (checkJitsiLoaded()) {
            setJitsiLoaded(true);
          } else {
            setError('Video call interface loaded but not available. Please refresh and try again.');
            setLoading(false);
          }
        }, 1000);
      };
      
      script.onerror = () => {
        setError('Failed to load video call interface. Please check your connection and try again.');
        setLoading(false);
      };
      
      document.body.appendChild(script);
      
      return () => {
        if (loadTimeout) clearTimeout(loadTimeout);
      };
    }
  }, [isOpen]);

  // Initialize Jitsi for PATIENT (without JWT token - will be placed in lobby)
  useEffect(() => {
    if (!isOpen || !jitsiLoaded || !jitsiContainer.current) return;

    if (typeof window.JitsiMeetExternalAPI !== 'function') {
      setError('Video call interface is not ready. Please try again.');
      setLoading(false);
      return;
    }

    const initializeCall = async () => {
      try {
        setLoading(true);
        setError(null);

        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        // Get room info for PATIENT (backend verifies and returns NO JWT for guest mode)
        const response = await fetch(`${API_URL}/api/video-calls/initiate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            appointmentId,
            role: 'patient' // Explicitly tell backend this is a patient request
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to initiate video call');
        }

        const data = await response.json();
        const { videoCall } = data;

        if (!jitsiContainer.current) {
          throw new Error('Video container not ready');
        }

        const domain = 'cloud.sehat.dpdns.org';
        
        // ✅ PATIENT configuration WITHOUT JWT token
        // No JWT = Automatic lobby placement by Jitsi
        const options: JitsiConfig = {
          roomName: videoCall.roomName,
          // ❌ NO JWT TOKEN - This causes automatic lobby placement!
          // jwt: undefined, // Explicitly no JWT
          width: '100%',
          height: '100%',
          parentNode: jitsiContainer.current,
          configOverwrite: {
            startWithAudioMuted: true,          // ✅ Start muted for privacy
            startWithVideoMuted: true,          // ✅ Start with camera off
            enableWelcomePage: false,
            prejoinPageEnabled: true,           // ✅ Show prejoin for device testing
            disableDeepLinking: true,
            // ❌ NO lobby_bypass setting - patient goes to lobby automatically
            disableInviteFunctions: true,
            doNotStoreRoom: true,
            enableClosePage: false,
            disableProfile: true,
            disableReactions: false,            // Allow reactions
            disablePolls: true,
            disableRecordAudioNotification: true,
            disableSelfView: false,
            disableLocalVideoFlip: false,
            hideConferenceSubject: false,       // Show room name
            hideConferenceTimer: false,         // Show timer
            hideParticipantsStats: true,        // Hide participant stats for patient
            disableRemoteMute: true,            // ✅ PATIENT CANNOT mute others
            enableLobbyChat: false,             // No lobby chat
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'chat',
              'raisehand',                      // Can raise hand
              'hangup',
              'settings',
              'tileview',                       // Grid view
              // ❌ No 'participants-pane' - patient doesn't need to see participants list
              // ❌ No 'desktop' - patient typically doesn't screen share
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DISPLAY_WELCOME_PAGE_CONTENT: false,
            DISABLE_VIDEO_BACKGROUND: false,    // Allow virtual backgrounds
            DISABLE_FOCUS_INDICATOR: false,
            DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
            DISABLE_TRANSCRIPTION_SUBTITLES: true,
            HIDE_INVITE_MORE_HEADER: true,
            MOBILE_APP_PROMO: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
          },
        };

        const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);

        // Auto-hide loading after 2 seconds (patient might still be in lobby)
        const loadingTimeout = setTimeout(() => {
          setLoading(false);
        }, 2000);

        // Event listeners
        jitsiApi.addEventListener('videoConferenceJoined', async () => {
          clearTimeout(loadingTimeout);
          setLoading(false);
          
          try {
            await fetch(`${API_URL}/api/video-calls/${videoCall.id}/status`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${firebaseToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ action: 'join' }),
            });
          } catch {
            // Failed to update join status
          }
        });

        jitsiApi.addEventListener('videoConferenceLeft', async () => {
          try {
            await fetch(`${API_URL}/api/video-calls/${videoCall.id}/status`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${firebaseToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ action: 'end' }),
            });
          } catch {
            // Failed to update end status
          }

          handleClose();
        });

        jitsiApi.addEventListener('readyToClose', () => {
          handleClose();
        });

        setApi(jitsiApi);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to initialize video call');
        setLoading(false);
      }
    };

    initializeCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, jitsiLoaded, appointmentId, firebaseToken]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, [api]);

  const handleClose = () => {
    if (api) {
      api.dispose();
      setApi(null);
    }
    setLoading(true);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full h-full max-w-7xl max-h-screen m-4 bg-white dark:bg-slate-900 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              🤒 Patient Video Consultation
            </h2>
            <p className="text-sm text-teal-100">
              You&apos;ll wait in the lobby until the doctor admits you
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            aria-label="Close video call"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Video Call Container */}
        <div className="w-full h-full pt-20 relative">
          {loading && !error && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900">
              <FaSpinner className="w-16 h-16 text-teal-600 animate-spin mb-4" />
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                🤒 Joining consultation...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You&apos;ll be placed in the waiting room
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                The doctor will admit you shortly
              </p>
              <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                <p>⏳ No JWT token = Automatic lobby placement</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-lg">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
                  Connection Error
                </h3>
                <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                
                <div className="bg-white dark:bg-slate-800 rounded-md p-4 mb-4 text-sm">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">💡 Troubleshooting Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Check your internet connection</li>
                    <li>Make sure the video server is accessible</li>
                    <li>Try refreshing the page</li>
                    <li>Clear browser cache and try again</li>
                    <li>Ask the doctor if they&apos;ve started the call</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Refresh & Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            ref={jitsiContainer}
            className="w-full h-full"
          />
        </div>

        {/* Instructions Footer */}
        {loading && !error && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-start space-x-3 text-sm">
              <span className="text-teal-600 dark:text-teal-400 font-semibold">💡 Patient Tips:</span>
              <div className="flex-1 text-gray-600 dark:text-gray-400">
                <p>• Allow camera and microphone access when prompted</p>
                <p className="mt-1">• You&apos;ll be placed in a waiting room (lobby)</p>
                <p className="mt-1">• Please wait patiently - the doctor will admit you when ready</p>
                <p className="mt-1">• You start muted - unmute when the doctor admits you</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
