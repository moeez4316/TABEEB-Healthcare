'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  ChatMessage,
  subscribeToMessages,
  sendTextMessage,
  sendMediaMessage,
  markMessagesAsRead,
  initializeChatRoom
} from '@/lib/chat-service';
import { FaPaperPlane, FaMicrophone, FaPaperclip, FaTimes, FaPlay, FaPause, FaFileAlt, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import { uploadFile } from '@/lib/cloudinary-upload';
import { LinearProgress, useUploadProgress } from '@/components/shared/UploadProgress';

interface AppointmentChatProps {
  appointmentId: string;
  doctorUid: string;
  patientUid: string;
  doctorName: string;
  patientName: string;
  currentUserRole: 'patient' | 'doctor';
  onClose?: () => void;
  readOnly?: boolean;
}

export default function AppointmentChat({
  appointmentId,
  doctorUid,
  patientUid,
  doctorName,
  patientName,
  currentUserRole,
  onClose,
  readOnly = false
}: AppointmentChatProps) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'document'; fileName?: string } | null>(null);
  const sendOnStopRef = useRef<boolean>(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const uploadProgress = useUploadProgress();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimeRef = useRef<number>(0);

  const currentUserId = user?.uid || '';
  const currentUserName = currentUserRole === 'doctor' ? doctorName : patientName;

  // Initialize chat room and subscribe to messages
  useEffect(() => {
    if (!appointmentId) return;

    // Initialize the chat room
    initializeChatRoom(appointmentId, doctorUid, patientUid, doctorName, patientName);

    // Subscribe to messages
    const unsubscribe = subscribeToMessages(appointmentId, (msgs) => {
      setMessages(msgs);
      // Mark messages as read
      if (currentUserId) {
        markMessagesAsRead(appointmentId, currentUserId);
      }
    });

    return () => unsubscribe();
  }, [appointmentId, doctorUid, patientUid, doctorName, patientName, currentUserId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Prevent background scroll when modal is open (comprehensive scroll lock)
  useEffect(() => {
    if (showMediaPreview) {
      // Save current scroll position
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      
      // Prevent scroll on multiple elements
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      
      // Prevent overscroll bounce on iOS
      document.documentElement.style.overscrollBehavior = 'none';
      document.body.style.overscrollBehavior = 'none';
      
      return () => {
        // Restore scroll
        document.documentElement.style.overflow = 'unset';
        document.body.style.overflow = 'unset';
        document.documentElement.style.overscrollBehavior = 'unset';
        document.body.style.overscrollBehavior = 'unset';
        
        // Restore scroll position
        window.scrollTo(scrollX, scrollY);
      };
    }
  }, [showMediaPreview]);

  // Handle send text message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendTextMessage(
        appointmentId,
        currentUserId,
        currentUserRole,
        currentUserName,
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = recordingTimeRef.current;
        stream.getTracks().forEach(track => track.stop());

        // Check file size (2MB limit for voice - allows ~2-3 min)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (audioBlob.size > maxSize) {
          alert('Voice message too long. Maximum 2-3 minutes allowed.');
          setRecordingTime(0);
          recordingTimeRef.current = 0;
          return;
        }

          // If user requested send on stop, upload immediately; otherwise discard silently
          if (sendOnStopRef.current) {
            sendOnStopRef.current = false;
            await uploadVoiceMessage(audioBlob, duration);
          }
          setRecordingTime(0);
          recordingTimeRef.current = 0;
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Upload voice message to Cloudinary
  const uploadVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!token) return;
    setUploading(true);
    uploadProgress.startUpload();
    try {
      const result = await uploadFile(audioBlob, 'chat-media', token, {
        onProgress: (p) => {
          uploadProgress.updateProgress(p.percentage);
        }
      });

      uploadProgress.startProcessing();

      // Send media message
      await sendMediaMessage(
        appointmentId,
        currentUserId,
        currentUserRole,
        currentUserName,
        'voice',
        result.secureUrl,
        undefined,
        duration
      );

      uploadProgress.complete();
    } catch (error) {
      console.error('Failed to upload voice message:', error);
      uploadProgress.fail(String(error));
    } finally {
      setUploading(false);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
    }
  };

  // Handle file upload (documents/images)
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    // File size limits
    const maxImageSize = 2 * 1024 * 1024; // 2MB for images
    const maxDocSize = 5 * 1024 * 1024;   // 5MB for documents

    const isImage = file.type.startsWith('image/');
    const isDocument = file.type === 'application/pdf' || 
                       file.type.includes('document') ||
                       file.type.includes('text');

    if (!isImage && !isDocument) {
      alert('Please select an image or document file');
      return;
    }

    // Check file size
    const maxSize = isImage ? maxImageSize : maxDocSize;
    if (file.size > maxSize) {
      alert(`File too large. Maximum size: ${isImage ? '2MB' : '5MB'}`);
      return;
    }

    setUploading(true);
    uploadProgress.startUpload();
    try {
      const result = await uploadFile(file, 'chat-media', token, {
        onProgress: (p) => uploadProgress.updateProgress(p.percentage)
      });

      uploadProgress.startProcessing();

      await sendMediaMessage(
        appointmentId,
        currentUserId,
        currentUserRole,
        currentUserName,
        isImage ? 'image' : 'document',
        result.secureUrl,
        file.name
      );

      uploadProgress.complete();
    } catch (error) {
      console.error('Failed to upload file:', error);
      uploadProgress.fail(String(error));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Play/pause audio
  const toggleAudioPlay = (messageId: string, audioUrl: string) => {
    if (playingAudio === messageId) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingAudio(null);
      setPlayingAudio(messageId);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimestampWithToDate = (t: unknown): t is { toDate: () => Date } =>
    typeof t === 'object' && t !== null && 'toDate' in (t as object) && typeof (t as { toDate?: unknown }).toDate === 'function';

  // Handle input focus to scroll into view above keyboard
  const handleInputFocus = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const formatMessageTime = (timestamp?: Date | string | number | { toDate?: () => Date } | null) => {
    if (timestamp == null) return '';
    let date: Date;
    if (isTimestampWithToDate(timestamp)) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp as string | number | Date);
    }
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 bg-teal-600 dark:bg-teal-700 text-white flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base sm:text-xl truncate">
            Chat with {currentUserRole === 'doctor' ? patientName : `Dr. ${doctorName}`}
          </h3>
          <p className="text-xs sm:text-sm text-teal-100">Appointment Chat</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 sm:p-2.5 hover:bg-teal-700 dark:hover:bg-teal-600 rounded-full transition-colors flex-shrink-0 ml-2">
            <FaTimes className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-slate-900" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <p className="text-sm sm:text-base">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-lg rounded-lg px-3 sm:px-4 py-2 sm:py-3 ${
                    isOwn
                      ? 'bg-teal-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-none shadow'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs sm:text-sm font-medium text-teal-600 dark:text-teal-400 mb-1">
                      {message.senderName}
                    </p>
                  )}
                  
                  {/* Text Message */}
                  {message.type === 'text' && (
                    <p className="text-sm sm:text-base whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                  
                  {/* Voice Message */}
                  {message.type === 'voice' && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button
                        onClick={() => toggleAudioPlay(message.id, message.content)}
                        className={`p-2 sm:p-2.5 rounded-full flex-shrink-0 ${isOwn ? 'bg-teal-700 hover:bg-teal-800' : 'bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500'}`}
                      >
                        {playingAudio === message.id ? (
                          <FaPause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : (
                          <FaPlay className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`h-1 sm:h-1.5 rounded-full ${isOwn ? 'bg-teal-400' : 'bg-gray-300 dark:bg-slate-500'}`}>
                          <div className="h-full w-0 bg-teal-200 rounded-full" />
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm flex-shrink-0 font-medium">{message.duration ? formatTime(message.duration) : '0:00'}</span>
                    </div>
                  )}
                  
                  {/* Document Message */}
                  {message.type === 'document' && (
                    <button
                      onClick={() => {
                        setSelectedMedia({ url: message.content, type: 'document', fileName: message.fileName });
                        setShowMediaPreview(true);
                      }}
                      className="flex items-center space-x-2 hover:underline text-blue-500 dark:text-blue-400 w-full text-left"
                    >
                      <FaFileAlt className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base truncate">{message.fileName || 'Document'}</span>
                    </button>
                  )}
                  
                  {/* Image Message */}
                  {message.type === 'image' && (
                    <button
                      onClick={() => {
                        setSelectedMedia({ url: message.content, type: 'image', fileName: message.fileName });
                        setShowMediaPreview(true);
                      }}
                      className="block w-full text-left hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={message.content}
                        alt="Shared image"
                        width={300}
                        height={250}
                        unoptimized
                        className="max-w-full rounded-lg h-auto max-h-48 sm:max-h-64 object-cover"
                      />
                    </button>
                  )}
                  
                  <p className={`text-xs sm:text-sm mt-1 font-medium ${isOwn ? 'text-teal-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-3 sm:px-4 py-3 bg-red-50 dark:bg-red-900/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-sm sm:text-base text-red-600 dark:text-red-400 truncate font-medium">Recording... {formatTime(recordingTime)}</span>
          </div>
        </div>
      )}

      {/* Uploading indicator / progress */}
      {uploading && (
        <div className="px-3 sm:px-4 py-2 bg-blue-50 dark:bg-blue-900/20 flex-shrink-0">
          <LinearProgress
            progress={uploadProgress.progress}
            status={uploadProgress.status}
            fileName={uploadProgress.status === 'uploading' ? 'Uploading...' : undefined}
            size="sm"
            onCancel={() => {}}
          />
        </div>
      )}

      {/* Input */}
      {readOnly ? (
        <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-center flex-shrink-0">
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
            This chat is closed. You can no longer send messages.
          </p>
        </div>
      ) : (
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0" style={{ paddingBottom: `max(12px, env(safe-area-inset-bottom))` }}>
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* File attachment */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || isRecording}
              className="p-2 sm:p-2.5 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <FaPaperclip className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Text input */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (isRecording) {
                    sendOnStopRef.current = true;
                    stopRecording();
                  } else {
                    handleSendMessage();
                  }
                }
              }}
              onFocus={handleInputFocus}
              placeholder="Type a message..."
              disabled={isRecording || uploading}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-slate-600 rounded-full focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-base sm:text-base disabled:opacity-50"
              style={{ fontSize: '16px' }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />

            {/* Voice controls */}
            {!newMessage.trim() && (
              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={uploading}
                    className="p-2 sm:p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    <FaMicrophone className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        sendOnStopRef.current = false;
                        stopRecording();
                      }}
                      className="p-2 sm:p-2.5 text-gray-500 hover:text-red-500"
                      title="Discard recording"
                    >
                      <FaTrash className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => {
                        sendOnStopRef.current = true;
                        stopRecording();
                      }}
                      disabled={uploading}
                      className="p-2 sm:p-2.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50"
                      title="Send recording"
                    >
                      <FaPaperPlane className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Send button for text */}
            {newMessage.trim() && (
              <button
                onClick={handleSendMessage}
                disabled={sending || uploading}
                className="p-2 sm:p-2.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <FaPaperPlane className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {showMediaPreview && selectedMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-sm p-1 sm:p-4 overflow-hidden">
          <div className="relative w-full h-full max-w-3xl max-h-screen flex items-center justify-center">
            <button
              className="absolute top-3 right-3 sm:top-6 sm:right-6 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-full p-2.5 sm:p-3.5 shadow hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none z-20 flex-shrink-0"
              onClick={() => {
                setShowMediaPreview(false);
                setSelectedMedia(null);
              }}
              aria-label="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-full h-full flex items-center justify-center bg-black rounded-lg overflow-auto">
              {selectedMedia.type === 'image' && (
                <Image
                  src={selectedMedia.url}
                  alt={selectedMedia.fileName || 'Chat image'}
                  width={800}
                  height={600}
                  className="max-h-full max-w-full object-contain"
                  unoptimized
                />
              )}
              {selectedMedia.type === 'document' && (
                <div className="w-full h-full flex flex-col items-center justify-center text-white p-4">
                  <FaFileAlt className="w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-4" />
                  <p className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-center px-4">{selectedMedia.fileName || 'Document'}</p>
                  <a
                    href={selectedMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="mt-2 sm:mt-4 px-4 sm:px-6 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm sm:text-base font-semibold transition-colors"
                  >
                    Download Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
