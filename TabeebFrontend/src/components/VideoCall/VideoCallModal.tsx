'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';

interface VideoCallModalProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  firebaseToken: string;
  userRole: 'doctor' | 'patient';
}

interface JitsiAPI {
  dispose: () => void;
  addEventListener: (event: string, handler: () => void) => void;
  removeEventListener?: (event: string, handler: () => void) => void;
  executeCommand?: (command: string, ...args: unknown[]) => void;
}

interface JitsiConfig {
  roomName: string;
  jwt?: string; // Optional - only for doctors
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

export default function VideoCallModal({
  appointmentId,
  isOpen,
  onClose,
  firebaseToken,
  userRole,
}: VideoCallModalProps) {
  const jitsiContainer = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<JitsiAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);

  // Load Jitsi External API script
  useEffect(() => {
    if (!isOpen) return;

    const scriptSrc = 'https://cloud.sehat.dpdns.org/external_api.js';
    
    // Function to check if Jitsi is loaded
    const checkJitsiLoaded = () => {
      return typeof window.JitsiMeetExternalAPI === 'function';
    };

    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
    
    if (existingScript) {
      // Script exists, check if JitsiMeetExternalAPI is available
      if (checkJitsiLoaded()) {
        setJitsiLoaded(true);
      } else {
        // Script tag exists but not loaded yet, wait for it with timeout
        let attempts = 0;
        const maxAttempts = 20; // 10 seconds max wait
        
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
      // Script doesn't exist, create and load it
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      
      let loadTimeout: NodeJS.Timeout;
      
      script.onload = () => {
        // Wait a bit for the script to initialize
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

  // Initialize Jitsi when modal opens
  useEffect(() => {
    if (!isOpen || !jitsiLoaded || !jitsiContainer.current) return;

    // Additional safety check
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

        // Initiate video call and get JWT token
        const response = await fetch(`${API_URL}/api/video-calls/initiate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ appointmentId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to initiate video call');
        }

        const data = await response.json();
        const { jitsiToken, videoCall, note, patientName } = data;

        // Ensure container is available
        if (!jitsiContainer.current) {
          throw new Error('Video container not ready');
        }

        // Configure Jitsi - Different approach for doctor vs patient
        const domain = 'cloud.sehat.dpdns.org';
        
        // Build Jitsi config
        const options: JitsiConfig = {
          roomName: videoCall.roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainer.current,
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            requireDisplayName: false,
            disableInviteFunctions: true,
            doNotStoreRoom: true,
            enableClosePage: false,
            disableProfile: true,
            disableReactions: true,
            disablePolls: true,
            disableRecordAudioNotification: true,
            disableSelfView: false,
            disableLocalVideoFlip: false,
            hideConferenceSubject: true,
            hideConferenceTimer: false,
            hideParticipantsStats: true,
            disableRemoteMute: userRole === 'patient', // Only doctor can mute others
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'chat',
              'hangup',
              'settings',
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DISPLAY_WELCOME_PAGE_CONTENT: false,
            DISABLE_VIDEO_BACKGROUND: true,
            DISABLE_FOCUS_INDICATOR: false,
            DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
            DISABLE_TRANSCRIPTION_SUBTITLES: true,
            HIDE_INVITE_MORE_HEADER: true,
            MOBILE_APP_PROMO: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
          },
        };

        // DOCTOR: Add JWT token (will bypass lobby automatically)
        if (userRole === 'doctor' && jitsiToken) {
          options.jwt = jitsiToken;
          console.log('Doctor joining with JWT token - will bypass lobby');
        } 
        // PATIENT: No JWT (will be placed in lobby automatically)
        else if (userRole === 'patient') {
          options.userInfo = {
            displayName: patientName || 'Patient',
          };
          console.log('Patient joining without JWT - will be placed in lobby');
          if (note) {
            console.log('Note:', note);
          }
        }

        const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);

        // Hide loading after a short delay to show Jitsi interface
        // This ensures lobby screen is visible for patients
        const loadingTimeout = setTimeout(() => {
          console.log('Loading timeout - showing Jitsi interface');
          setLoading(false);
        }, 2000); // 2 seconds timeout

        // Event listeners
        jitsiApi.addEventListener('videoConferenceJoined', async () => {
          console.log('User joined the video call');
          clearTimeout(loadingTimeout); // Clear timeout if user joins before it fires
          setLoading(false);
          
          // Update call status to joined
          try {
            await fetch(`${API_URL}/api/video-calls/${appointmentId}/status`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${firebaseToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ action: 'join' }),
            });
          } catch (err) {
            console.error('Failed to update join status:', err);
          }
        });

        jitsiApi.addEventListener('videoConferenceLeft', async () => {
          console.log('User left the video call');
          
          // Update call status to ended
          try {
            await fetch(`${API_URL}/api/video-calls/${appointmentId}/status`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${firebaseToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ action: 'end' }),
            });
          } catch (err) {
            console.error('Failed to update end status:', err);
          }

          handleClose();
        });

        jitsiApi.addEventListener('readyToClose', () => {
          handleClose();
        });

        setApi(jitsiApi);
      } catch (error) {
        console.error('Error initializing video call:', error);
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
              Video Consultation
            </h2>
            <p className="text-sm text-teal-100">
              {userRole === 'doctor' ? 'As Doctor (Moderator)' : 'As Patient'}
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
                {userRole === 'doctor' 
                  ? 'Connecting to video call...'
                  : 'Joining consultation...'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userRole === 'doctor'
                  ? 'Setting up your consultation room'
                  : 'You will be placed in the waiting room. The doctor will admit you shortly.'}
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-lg">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
                  Connection Error
                </h3>
                <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                
                {/* Troubleshooting Tips */}
                <div className="bg-white dark:bg-slate-800 rounded-md p-4 mb-4 text-sm">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">💡 Troubleshooting Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Check your internet connection</li>
                    <li>Make sure the video server is accessible</li>
                    <li>Try refreshing the page</li>
                    <li>Clear browser cache and try again</li>
                    <li>Try a different browser (Chrome/Firefox recommended)</li>
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
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      setJitsiLoaded(false);
                      window.location.reload();
                    }}
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

        {/* Instructions Footer (only shown while loading) */}
        {loading && !error && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-start space-x-3 text-sm">
              <span className="text-teal-600 dark:text-teal-400 font-semibold">💡 {userRole === 'doctor' ? 'Doctor' : 'Patient'} Tips:</span>
              <div className="flex-1 text-gray-600 dark:text-gray-400">
                {userRole === 'doctor' ? (
                  <>
                    <p>Make sure to allow camera and microphone access when prompted.</p>
                    <p className="mt-1">As a moderator, you can admit patients from the waiting room and control meeting settings.</p>
                  </>
                ) : (
                  <>
                    <p>Make sure to allow camera and microphone access when prompted.</p>
                    <p className="mt-1">You will be placed in a waiting room. Please wait for the doctor to admit you to the consultation.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
