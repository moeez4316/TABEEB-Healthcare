import { db } from './firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  Timestamp,
  getDocs,
  where
} from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'patient' | 'doctor';
  senderName: string;
  type: 'text' | 'voice' | 'document' | 'image';
  content: string; // text message or cloudinary URL
  fileName?: string; // for documents
  duration?: number; // for voice messages in seconds
  createdAt: Timestamp | null;
  read: boolean;
}

export interface ChatRoom {
  appointmentId: string;
  doctorUid: string;
  patientUid: string;
  doctorName: string;
  patientName: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  createdAt: Timestamp;
}

// Get messages collection reference
const getMessagesRef = (appointmentId: string) => {
  return collection(db, 'chats', appointmentId, 'messages');
};

// Send a text message
export const sendTextMessage = async (
  appointmentId: string,
  senderId: string,
  senderRole: 'patient' | 'doctor',
  senderName: string,
  content: string
) => {
  const messagesRef = getMessagesRef(appointmentId);
  
  const message = {
    senderId,
    senderRole,
    senderName,
    type: 'text',
    content,
    createdAt: serverTimestamp(),
    read: false
  };

  const docRef = await addDoc(messagesRef, message);
  
  // Update last message in chat room
  const chatRoomRef = doc(db, 'chats', appointmentId);
  await updateDoc(chatRoomRef, {
    lastMessage: content.substring(0, 100),
    lastMessageAt: serverTimestamp()
  }).catch(() => {
    // Chat room might not exist yet, that's okay
  });

  return docRef.id;
};

// Send a media message (voice, document, image)
export const sendMediaMessage = async (
  appointmentId: string,
  senderId: string,
  senderRole: 'patient' | 'doctor',
  senderName: string,
  type: 'voice' | 'document' | 'image',
  cloudinaryUrl: string,
  fileName?: string,
  duration?: number
) => {
  const messagesRef = getMessagesRef(appointmentId);
  
  // Build message object - only include defined fields (Firestore rejects undefined)
  const message: Record<string, unknown> = {
    senderId,
    senderRole,
    senderName,
    type,
    content: cloudinaryUrl,
    createdAt: serverTimestamp(),
    read: false
  };
  
  // Only add optional fields if they have values
  if (fileName) message.fileName = fileName;
  if (duration !== undefined && duration > 0) message.duration = duration;

  const docRef = await addDoc(messagesRef, message);
  
  // Update last message in chat room
  const chatRoomRef = doc(db, 'chats', appointmentId);
  const lastMessageText = type === 'voice' ? '🎤 Voice message' : 
                          type === 'document' ? `📄 ${fileName || 'Document'}` :
                          '🖼️ Image';
  
  await updateDoc(chatRoomRef, {
    lastMessage: lastMessageText,
    lastMessageAt: serverTimestamp()
  }).catch(() => {});

  return docRef.id;
};

// Subscribe to messages in real-time
export const subscribeToMessages = (
  appointmentId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const messagesRef = getMessagesRef(appointmentId);
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessage));
    callback(messages);
  });
};

// Mark messages as read
export const markMessagesAsRead = async (
  appointmentId: string,
  currentUserId: string
) => {
  const messagesRef = getMessagesRef(appointmentId);
  // Simple query - just get all unread messages, filter client-side to avoid composite index
  const q = query(messagesRef, where('read', '==', false));

  const snapshot = await getDocs(q);
  
  // Filter out messages from current user (we only mark others' messages as read)
  const updates = snapshot.docs
    .filter(docSnapshot => docSnapshot.data().senderId !== currentUserId)
    .map(docSnapshot => 
      updateDoc(doc(messagesRef, docSnapshot.id), { read: true })
    );

  await Promise.all(updates);
};

// Initialize chat room (call this when appointment is confirmed)
export const initializeChatRoom = async (
  appointmentId: string,
  doctorUid: string,
  patientUid: string,
  doctorName: string,
  patientName: string
) => {
  const chatRoomRef = doc(db, 'chats', appointmentId);
  
  await setDoc(chatRoomRef, {
    appointmentId,
    doctorUid,
    patientUid,
    doctorName,
    patientName,
    createdAt: serverTimestamp()
  }, { merge: true });

  return appointmentId;
};
