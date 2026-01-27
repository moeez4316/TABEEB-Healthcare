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
      // done
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
      <div className="flex items-center justify-between px-4 py-3 bg-teal-600 dark:bg-teal-700 text-white">
        <div>
          <h3 className="font-semibold">
            Chat with {currentUserRole === 'doctor' ? patientName : `Dr. ${doctorName}`}
          </h3>
          <p className="text-xs text-teal-100">Appointment Chat</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-teal-700 dark:hover:bg-teal-600 rounded-full transition-colors">
            <FaTimes className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>No messages yet. Start the conversation!</p>
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
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-teal-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-none shadow'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1">
                      {message.senderName}
                    </p>
                  )}
                  
                  {/* Text Message */}
                  {message.type === 'text' && (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                  
                  {/* Voice Message */}
                  {message.type === 'voice' && (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleAudioPlay(message.id, message.content)}
                        className={`p-2 rounded-full ${isOwn ? 'bg-teal-700 hover:bg-teal-800' : 'bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500'}`}
                      >
                        {playingAudio === message.id ? (
                          <FaPause className="w-3 h-3" />
                        ) : (
                          <FaPlay className="w-3 h-3" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className={`h-1 rounded-full ${isOwn ? 'bg-teal-400' : 'bg-gray-300 dark:bg-slate-500'}`}>
                          <div className="h-full w-0 bg-teal-200 rounded-full" />
                        </div>
                      </div>
                      <span className="text-xs">{message.duration ? formatTime(message.duration) : '0:00'}</span>
                    </div>
                  )}
                  
                  {/* Document Message */}
                  {message.type === 'document' && (
                    <a
                      href={message.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 hover:underline"
                    >
                      <FaFileAlt className="w-4 h-4" />
                      <span className="text-sm truncate">{message.fileName || 'Document'}</span>
                    </a>
                  )}
                  
                  {/* Image Message */}
                  {message.type === 'image' && (
                    <a href={message.content} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={message.content}
                        alt="Shared image"
                        width={400}
                        height={300}
                        unoptimized
                        className="max-w-full rounded-lg max-h-48 object-cover"
                      />
                    </a>
                  )}
                  
                  <p className={`text-xs mt-1 ${isOwn ? 'text-teal-200' : 'text-gray-500 dark:text-gray-400'}`}>
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
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-600 dark:text-red-400">Recording... {formatTime(recordingTime)} — press send or discard</span>
          </div>
        
        </div>
      )}

      {/* Uploading indicator / progress */}
      {uploading && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20">
          <LinearProgress
            progress={uploadProgress.progress}
            status={uploadProgress.status}
            fileName={uploadProgress.status === 'uploading' ? 'Uploading...' : undefined}
            size="sm"
            onCancel={() => {
              // No-op for now; uploads are not cancellable from here
            }}
          />
        </div>
      )}

      {/* Input */}
      {readOnly ? (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            This chat is closed. You can no longer send messages.
          </p>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center space-x-2">
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
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
          >
            <FaPaperclip className="w-5 h-5" />
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
                  // mark to send when recorder stops and stop
                  sendOnStopRef.current = true;
                  stopRecording();
                } else {
                  handleSendMessage();
                }
              }
            }}
            placeholder="Type a message..."
            disabled={isRecording || uploading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-full focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50"
          />

          {/* Voice controls */}
          {!newMessage.trim() && (
            <div className="flex items-center space-x-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={uploading}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  <FaMicrophone className="w-5 h-5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      // discard: ensure we don't send on stop
                      sendOnStopRef.current = false;
                      stopRecording();
                    }}
                    className="p-2 text-gray-500 hover:text-red-500"
                    title="Discard recording"
                  >
                    <FaTrash />
                  </button>
                  <button
                    onClick={() => {
                      // send: mark send and stop recorder; upload will proceed onstop
                      sendOnStopRef.current = true;
                      stopRecording();
                    }}
                    disabled={uploading}
                    className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50"
                    title="Send recording"
                  >
                    <FaPaperPlane className="w-4 h-4" />
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
              className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              <FaPaperPlane className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
