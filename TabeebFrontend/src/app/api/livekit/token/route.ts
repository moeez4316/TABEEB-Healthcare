import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { AccessToken } from 'livekit-server-sdk';

// Initialize Firebase Admin SDK if not already initialized
if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else if (projectId) {
    initializeApp({ projectId });
  } else {
    initializeApp();
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get('appointmentId');
    const role = searchParams.get('role') || 'patient';

    if (!appointmentId) {
      return NextResponse.json({ message: 'appointmentId is required' }, { status: 400 });
    }

    // Extract Bearer token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (authErr) {
      console.error('Firebase Auth verification failed:', authErr);
      return NextResponse.json({ message: 'Unauthorized: Invalid Firebase session' }, { status: 401 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://cloud.sehat.dpdns.org';

    if (!apiKey || !apiSecret) {
      console.error('LIVEKIT_API_KEY or LIVEKIT_API_SECRET is missing');
      return NextResponse.json({ message: 'LiveKit server credentials configured incorrectly on server' }, { status: 500 });
    }

    const roomName = `call-${appointmentId}`;
    const identity = `${role}-${decodedToken.uid}`;
    const participantName = decodedToken.name || decodedToken.email || `${role.toUpperCase()} (${decodedToken.uid.substring(0, 5)})`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: participantName,
      ttl: '2h',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const jwtToken = await at.toJwt();

    return NextResponse.json({
      token: jwtToken,
      room: roomName,
      serverUrl,
      identity,
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { appointmentId, role = 'patient' } = body;

    if (!appointmentId) {
      return NextResponse.json({ message: 'appointmentId is required' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (authErr) {
      console.error('Firebase Auth verification failed:', authErr);
      return NextResponse.json({ message: 'Unauthorized: Invalid Firebase session' }, { status: 401 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://cloud.sehat.dpdns.org';

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ message: 'LiveKit credentials missing on server' }, { status: 500 });
    }

    const roomName = `call-${appointmentId}`;
    const identity = `${role}-${decodedToken.uid}`;
    const participantName = decodedToken.name || decodedToken.email || `${role.toUpperCase()} (${decodedToken.uid.substring(0, 5)})`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: participantName,
      ttl: '2h',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const jwtToken = await at.toJwt();

    return NextResponse.json({
      token: jwtToken,
      room: roomName,
      serverUrl,
      identity,
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
