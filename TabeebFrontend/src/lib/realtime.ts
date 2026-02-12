import { io, Socket } from 'socket.io-client';

export type RealtimeEvent = {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
};

export const createRealtimeSocket = (token: string): Socket => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const baseUrl = apiUrl.replace(/\/api$/, '');
  return io(baseUrl, {
    path: '/ws',
    // Allow fallback to polling when websocket upgrade is blocked by proxy/network.
    transports: ['websocket', 'polling'],
    auth: { token },
    timeout: 10000,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000
  });
};
