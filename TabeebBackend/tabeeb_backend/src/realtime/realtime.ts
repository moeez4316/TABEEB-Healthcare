import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import admin from '../config/firebase';
import prisma from '../lib/prisma';
import crypto from 'crypto';

export type AppEventType =
  | 'appointment.updated'
  | 'verification.updated';

export type AppEvent = {
  id: string;
  schemaVersion: number;
  type: AppEventType;
  occurredAt: string;
  correlationId?: string;
  actor: { role: 'doctor' | 'patient' | 'admin' | 'system'; uid?: string };
  entity: { type: string; id: string; version?: number };
  audience: { users?: string[]; roles?: string[]; rooms?: string[] };
  payload: Record<string, unknown>;
};

type EventInput = Omit<AppEvent, 'id' | 'occurredAt' | 'schemaVersion'>;

type SocketUser = { uid: string; role: 'doctor' | 'patient' | 'admin' };

let io: Server | null = null;

const schemaVersion = Number(process.env.REALTIME_EVENT_SCHEMA_VERSION ?? 1);

const normalizeOrigin = (val?: string) => {
  if (!val) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
};

const resolveRooms = (audience: AppEvent['audience']) => {
  const rooms = new Set<string>();
  audience.users?.forEach(uid => rooms.add(`user:${uid}`));
  audience.roles?.forEach(role => rooms.add(`role:${role}`));
  audience.rooms?.forEach(room => rooms.add(room));
  return Array.from(rooms);
};

const authenticateSocket = async (token?: string): Promise<SocketUser> => {
  if (!token) throw new Error('missing token');

  // Try Firebase token first (doctor/patient)
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const [doctor, patient] = await Promise.all([
      prisma.doctor.findUnique({
        where: { uid: decoded.uid },
        select: { isActive: true }
      }),
      prisma.patient.findUnique({
        where: { uid: decoded.uid },
        select: { isActive: true }
      })
    ]);

    if (doctor) {
      if (!doctor.isActive) throw new Error('account deactivated');
      return { uid: decoded.uid, role: 'doctor' };
    }
    if (patient) {
      if (!patient.isActive) throw new Error('account deactivated');
      return { uid: decoded.uid, role: 'patient' };
    }
  } catch {
    // fall through to admin JWT
  }

  const secret = process.env.ADMIN_JWT_SECRET || 'tabeeb-admin-secret-key-2026';
  const decoded = jwt.verify(token, secret) as { username: string; role: string };
  if (decoded.role !== 'admin') throw new Error('invalid admin token');
  return { uid: decoded.username, role: 'admin' };
};

export const initRealtime = async (server: HttpServer) => {
  const allowedOrigins = normalizeOrigin(process.env.WS_CORS_ORIGIN);
  const allowAllOrigins = allowedOrigins.length === 0 || allowedOrigins.includes('*');

  io = new Server(server, {
    path: process.env.WS_PATH ?? '/ws',
    cors: {
      origin: (origin, callback) => {
        if (allowAllOrigins || !origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('CORS not allowed'), false);
      },
      credentials: true
    },
    pingInterval: Number(process.env.WS_PING_INTERVAL_MS ?? 25000),
    pingTimeout: Number(process.env.WS_PING_TIMEOUT_MS ?? 60000)
  });

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Realtime: Redis adapter connected');
    } catch (err) {
      console.error('Realtime: Redis adapter failed, running without adapter', err);
    }
  } else {
    console.warn('Realtime: REDIS_URL not set, running without adapter');
  }

  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token as string | undefined;
      const headerToken = (socket.handshake.headers.authorization || '') as string;
      const token = authToken || headerToken.replace('Bearer ', '').trim();
      const user = await authenticateSocket(token);
      socket.data.user = user;
      return next();
    } catch (err) {
      console.error('Realtime auth failed:', err instanceof Error ? err.message : err);
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as SocketUser;

    socket.join(`user:${user.uid}`);
    socket.join(`role:${user.role}`);
    if (user.role === 'doctor') socket.join(`doctor:${user.uid}`);
    if (user.role === 'patient') socket.join(`patient:${user.uid}`);
    console.log(`Realtime connected: ${user.role}:${user.uid}`);
  });
};

export const publishEvent = (event: EventInput) => {
  if (!io) return;

  const full: AppEvent = {
    id: crypto.randomUUID(),
    schemaVersion,
    occurredAt: new Date().toISOString(),
    ...event
  };

  const rooms = resolveRooms(full.audience);
  if (rooms.length === 0) return;

  for (const room of rooms) {
    io.to(room).emit('domain.event', full);
  }
};
