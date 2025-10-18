# Video Call Feature - Quick Start Guide

## ✅ What Was Implemented

### 1. Database Schema
- **VideoCall Model**: Tracks video call sessions with statuses
- **VideoCallStatus Enum**: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, FAILED, NO_SHOW
- **One-to-One Relationship**: Each appointment can have one video call
- **Tracking Fields**: Join times, duration, start/end times

### 2. JWT Token Generation Service (`videoCallService.ts`)
- **Jitsi JWT Token Generation**: Secure token creation using HS256 algorithm
- **Room Naming**: Uses appointment ID as unique room identifier
- **Role-Based Access**: Doctors get moderator privileges automatically
- **Time-Limited**: Tokens expire after 3 hours (configurable)
- **Meeting Link Generation**: Full Jitsi URL with embedded JWT

### 3. Video Call Controller (`videoCallController.ts`)
**5 Endpoints:**
- `POST /api/video-calls/initiate` - Create video call and get token
- `GET /api/video-calls/token/:appointmentId` - Regenerate token
- `PATCH /api/video-calls/:appointmentId/status` - Update call status
- `GET /api/video-calls/:appointmentId` - Get call details
- `GET /api/video-calls` - List user's video calls

### 4. Routes & Integration
- Routes configured with authentication middleware
- Integrated into main Express app at `/api/video-calls`

---

## 🎯 How It Works

### Token Generation Process

```typescript
// 1. User requests video call for appointment
POST /api/video-calls/initiate
Body: { "appointmentId": "clxxx123" }

// 2. Backend generates JWT with this structure:
{
  aud: "tabeeb",                          // Your app ID
  iss: "tabeeb",                          // Issuer
  sub: "cloud.sehat.dpdns.org",          // Your Jitsi domain
  room: "appointment_clxxx123",          // Unique room name
  exp: 1729252800,                       // Expiry timestamp (3 hours)
  moderator: true,                       // True for doctor, false for patient
  context: {
    user: {
      name: "Dr. John Doe",              // User's name
      email: "doctor@example.com",        // User's email
      avatar: "https://...",              // Profile image (optional)
      lobby_bypass: true                  // Direct entry without waiting
    }
  }
}

// 3. Token is signed with JITSI_APP_SECRET using HS256
const token = jwt.sign(payload, JITSI_APP_SECRET, { algorithm: 'HS256' });

// 4. Frontend receives:
{
  "jitsiToken": "eyJhbGciOiJIUzI1NiIs...",
  "meetingLink": "https://cloud.sehat.dpdns.org/appointment_clxxx123?jwt=eyJhbGci...",
  "userRole": "doctor",
  "isModerator": true
}
```

### Why Use Appointment ID as Room Name?
1. **Uniqueness**: Each appointment has a unique ID (CUID)
2. **Security**: Only participants can generate valid tokens
3. **Consistency**: Same room for all participants of that appointment
4. **Traceability**: Easy to track which call belongs to which appointment

---

## 🚀 Frontend Integration (React Example)

### Step 1: Initiate Call Button
```jsx
const VideoCallButton = ({ appointmentId }) => {
  const [loading, setLoading] = useState(false);

  const startVideoCall = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5002/api/video-calls/initiate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appointmentId })
      });

      const data = await response.json();
      
      // Option 1: Open in new window
      window.open(data.meetingLink, '_blank');
      
      // Option 2: Navigate to video call page
      // navigate(`/video-call/${appointmentId}`, { state: { token: data.jitsiToken } });
      
    } catch (error) {
      console.error('Failed to start call:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={startVideoCall} disabled={loading}>
      {loading ? 'Starting...' : 'Start Video Call'}
    </button>
  );
};
```

### Step 2: Embed Jitsi (Full Page Component)
```jsx
import React, { useEffect, useRef } from 'react';

const VideoCallPage = ({ appointmentId, jitsiToken }) => {
  const jitsiContainer = useRef(null);

  useEffect(() => {
    // Load Jitsi External API script
    const script = document.createElement('script');
    script.src = 'https://cloud.sehat.dpdns.org/external_api.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const domain = 'cloud.sehat.dpdns.org';
      const roomName = `appointment_${appointmentId}`;

      const options = {
        roomName: roomName,
        jwt: jitsiToken,
        width: '100%',
        height: '100vh',
        parentNode: jitsiContainer.current,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);

      // When user joins
      api.addEventListener('videoConferenceJoined', () => {
        console.log('Joined call');
        updateCallStatus('join');
      });

      // When user leaves
      api.addEventListener('videoConferenceLeft', () => {
        console.log('Left call');
        updateCallStatus('end');
        api.dispose();
        // Navigate back to appointment page
        window.location.href = `/appointments/${appointmentId}`;
      });

      return () => {
        api.dispose();
      };
    };
  }, [appointmentId, jitsiToken]);

  const updateCallStatus = async (action) => {
    await fetch(`http://localhost:5002/api/video-calls/${appointmentId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action })
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div ref={jitsiContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default VideoCallPage;
```

---

## 📝 API Usage Examples

### Example 1: Doctor Initiates Call
```bash
POST http://localhost:5002/api/video-calls/initiate
Headers:
  Authorization: Bearer {doctor_firebase_token}
Body:
  {
    "appointmentId": "clxxx123"
  }

Response:
  {
    "message": "Video call initiated successfully",
    "videoCall": {
      "id": "clyyy456",
      "appointmentId": "clxxx123",
      "roomName": "appointment_clxxx123",
      "status": "SCHEDULED"
    },
    "jitsiToken": "eyJhbGciOiJIUzI1NiIs...",
    "meetingLink": "https://cloud.sehat.dpdns.org/appointment_clxxx123?jwt=...",
    "userRole": "doctor",
    "isModerator": true,
    "expiresIn": "3 hours"
  }
```

### Example 2: Patient Joins Call
```bash
GET http://localhost:5002/api/video-calls/token/clxxx123
Headers:
  Authorization: Bearer {patient_firebase_token}

Response:
  {
    "message": "Token retrieved successfully",
    "videoCall": {
      "id": "clyyy456",
      "appointmentId": "clxxx123",
      "roomName": "appointment_clxxx123",
      "status": "IN_PROGRESS"
    },
    "jitsiToken": "eyJhbGciOiJIUzI1NiIs...",
    "meetingLink": "https://cloud.sehat.dpdns.org/appointment_clxxx123?jwt=...",
    "userRole": "patient",
    "isModerator": false,
    "expiresIn": "3 hours"
  }
```

### Example 3: Update Status When User Joins
```bash
PATCH http://localhost:5002/api/video-calls/clxxx123/status
Headers:
  Authorization: Bearer {firebase_token}
Body:
  {
    "action": "join"
  }

Response:
  {
    "message": "Video call status updated successfully",
    "videoCall": {
      "id": "clyyy456",
      "appointmentId": "clxxx123",
      "status": "IN_PROGRESS",
      "startedAt": "2025-10-18T10:30:00.000Z",
      "doctorJoinedAt": "2025-10-18T10:30:05.000Z",
      "patientJoinedAt": "2025-10-18T10:31:00.000Z"
    }
  }
```

### Example 4: End Call
```bash
PATCH http://localhost:5002/api/video-calls/clxxx123/status
Headers:
  Authorization: Bearer {firebase_token}
Body:
  {
    "action": "end"
  }

Response:
  {
    "message": "Video call status updated successfully",
    "videoCall": {
      "id": "clyyy456",
      "status": "COMPLETED",
      "startedAt": "2025-10-18T10:30:00.000Z",
      "endedAt": "2025-10-18T11:00:00.000Z",
      "duration": 1800  // 30 minutes in seconds
    }
  }
```

---

## 🔐 Security Features

1. **Authentication Required**: All endpoints require Firebase token
2. **Authorization Check**: Only appointment participants can access
3. **JWT Signing**: Tokens signed with secret key
4. **Time-Limited**: Tokens expire after 3 hours
5. **Role-Based**: Doctors automatically get moderator role
6. **Unique Rooms**: Each appointment has unique room name

---

## 📊 Status Lifecycle

```
User clicks "Start Video Call"
           ↓
    Status: SCHEDULED (VideoCall created)
           ↓
Doctor/Patient joins (action: "join")
           ↓
Both participants joined
           ↓
    Status: IN_PROGRESS
           ↓
User clicks "End Call" (action: "end")
           ↓
    Status: COMPLETED
           ↓
Appointment status → COMPLETED
```

---

## 🧪 Testing Checklist

- [x] Database migration applied
- [x] Prisma Client generated
- [x] JWT token generation works
- [x] VideoCallStatus enum available
- [x] Environment variables configured
- [ ] Test with Postman
- [ ] Test doctor can initiate call
- [ ] Test patient can join call
- [ ] Test status updates work
- [ ] Test token expiry handling
- [ ] Test unauthorized access blocked

---

## 📦 What's Included

### Files Created:
1. `prisma/schema.prisma` - Updated with VideoCall model
2. `prisma/migrations/20251018101253_add_video_call/migration.sql` - Database migration
3. `src/services/videoCallService.ts` - JWT token generation
4. `src/controllers/videoCallController.ts` - API endpoints
5. `src/routes/videoCallRoutes.ts` - Route definitions
6. `VIDEO_CALL_DOCUMENTATION.md` - Complete documentation
7. `test-video-call.ts` - Test script

### Dependencies Added:
- `jsonwebtoken` - JWT token generation
- `@types/jsonwebtoken` - TypeScript types

---

## 🎓 Key Concepts Explained

### Why JWT Tokens?
- **Secure**: Tokens are cryptographically signed
- **Stateless**: No need to store tokens in database
- **Time-Limited**: Automatic expiry prevents abuse
- **Role-Based**: Embedded user information and permissions

### Why Appointment ID as Room Name?
- **Uniqueness**: CUIDs are globally unique
- **Traceability**: Easy to link calls to appointments
- **Security**: Participants need valid appointment access

### Why Moderator Role for Doctors?
- **Control**: Doctors can manage the call
- **Professional**: Maintains doctor-patient hierarchy
- **Features**: Access to advanced Jitsi features

---

## 🚨 Common Issues & Solutions

### Issue 1: TypeScript Errors
**Problem**: "Property 'videoCall' does not exist"
**Solution**: 
```bash
npx prisma generate
# Restart TypeScript server in VS Code: Ctrl+Shift+P → "Restart TS Server"
```

### Issue 2: Token Invalid
**Problem**: "Token verification failed"
**Solution**: Check that:
- JITSI_APP_SECRET matches Prosody config
- JITSI_DOMAIN matches your Jitsi server
- Token hasn't expired (3 hours default)

### Issue 3: Room Not Found
**Problem**: "Room does not exist"
**Solution**: Verify appointment ID is correct and video call was initiated

---

## 📞 Support

For issues:
1. Check `VIDEO_CALL_DOCUMENTATION.md` for detailed info
2. Run `npm run test` to verify setup
3. Check browser console for errors
4. Verify Jitsi server is running
5. Check environment variables are set

---

## 🎉 You're All Set!

Start your server and test:
```bash
npm run dev
```

Then use Postman or your frontend to test the endpoints!
