# Video Call Feature Documentation

## Overview
The video call feature integrates Jitsi Meet for secure video consultations between doctors and patients. Each appointment can have a video call session with JWT-based authentication.

---

## Architecture

### Database Schema
**VideoCall Model:**
- `id`: Unique identifier
- `appointmentId`: Links to appointment (unique, one-to-one)
- `roomName`: Jitsi room name (format: `appointment_{appointmentId}`)
- `status`: Current status (enum)
- `startedAt`: When call actually started
- `endedAt`: When call ended
- `duration`: Call duration in seconds
- `doctorJoinedAt`: When doctor joined
- `patientJoinedAt`: When patient joined
- `createdAt`, `updatedAt`: Timestamps

**VideoCallStatus Enum:**
- `SCHEDULED` - Call is scheduled but not started
- `IN_PROGRESS` - Call is currently active
- `COMPLETED` - Call ended successfully
- `CANCELLED` - Call was cancelled
- `FAILED` - Call failed due to technical issues
- `NO_SHOW` - Participant(s) didn't join

---

## How JWT Token Generation Works

### Token Structure
```typescript
{
  aud: "tabeeb",                    // App ID (audience)
  iss: "tabeeb",                    // Issuer
  sub: "cloud.sehat.dpdns.org",    // Domain (subject)
  room: "appointment_{appointmentId}", // Unique room name
  exp: 1234567890,                  // Expiration timestamp
  moderator: true/false,            // Doctor = true, Patient = false
  context: {
    user: {
      name: "Dr. John Doe",         // User's display name
      email: "doctor@example.com",   // User's email
      avatar: "url",                 // Optional profile image
      lobby_bypass: true             // Skip waiting room
    }
  }
}
```

### Security Features
1. **JWT Signing**: Tokens are signed with `JITSI_APP_SECRET` using HS256 algorithm
2. **Time-Limited**: Tokens expire after 3 hours (configurable)
3. **Role-Based**: Doctors get moderator privileges automatically
4. **Appointment-Based**: Each appointment gets a unique room name
5. **Authenticated**: Only appointment participants can generate tokens

### Token Flow
```
1. Doctor/Patient requests video call for appointment
2. Backend verifies user has access to appointment
3. Backend generates JWT with user details and appointment ID
4. Token is signed with secret key
5. Frontend receives token + meeting link
6. User opens Jitsi with JWT in URL
7. Jitsi validates token against Prosody config
8. User joins video call
```

---

## API Endpoints

### 1. Initiate Video Call
**POST** `/api/video-calls/initiate`

Initiates a video call for an appointment and returns JWT token.

**Request Headers:**
```
Authorization: Bearer {firebase_token}
```

**Request Body:**
```json
{
  "appointmentId": "clxxx123456789"
}
```

**Response (200 OK):**
```json
{
  "message": "Video call initiated successfully",
  "videoCall": {
    "id": "clyyy987654321",
    "appointmentId": "clxxx123456789",
    "roomName": "appointment_clxxx123456789",
    "status": "SCHEDULED"
  },
  "jitsiToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "meetingLink": "https://cloud.sehat.dpdns.org/appointment_clxxx123456789?jwt=eyJhbGci...",
  "userRole": "doctor",
  "isModerator": true,
  "expiresIn": "3 hours"
}
```

**Validation:**
- Appointment must exist
- User must be doctor or patient of the appointment
- Appointment status must be CONFIRMED or IN_PROGRESS

---

### 2. Get Video Call Token
**GET** `/api/video-calls/token/:appointmentId`

Retrieves or regenerates JWT token for existing video call.

**Request Headers:**
```
Authorization: Bearer {firebase_token}
```

**Response (200 OK):**
```json
{
  "message": "Token retrieved successfully",
  "videoCall": {
    "id": "clyyy987654321",
    "appointmentId": "clxxx123456789",
    "roomName": "appointment_clxxx123456789",
    "status": "IN_PROGRESS"
  },
  "jitsiToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "meetingLink": "https://cloud.sehat.dpdns.org/appointment_clxxx123456789?jwt=eyJhbGci...",
  "userRole": "patient",
  "isModerator": false,
  "expiresIn": "3 hours"
}
```

**Use Case:** When token expires and user needs a fresh token to rejoin.

---

### 3. Update Video Call Status
**PATCH** `/api/video-calls/:appointmentId/status`

Updates video call status based on user actions.

**Request Headers:**
```
Authorization: Bearer {firebase_token}
```

**Request Body:**
```json
{
  "action": "join" // or "start", "end", "cancel", "failed"
}
```

**Actions:**
- `join`: User joined the call (tracks doctorJoinedAt/patientJoinedAt)
- `start`: Explicitly start the call (sets status to IN_PROGRESS)
- `end`: End the call (calculates duration, marks COMPLETED)
- `cancel`: Cancel the call
- `failed`: Mark call as failed

**Response (200 OK):**
```json
{
  "message": "Video call status updated successfully",
  "videoCall": {
    "id": "clyyy987654321",
    "appointmentId": "clxxx123456789",
    "roomName": "appointment_clxxx123456789",
    "status": "IN_PROGRESS",
    "startedAt": "2025-10-18T10:30:00.000Z",
    "doctorJoinedAt": "2025-10-18T10:30:05.000Z",
    "patientJoinedAt": "2025-10-18T10:31:00.000Z",
    "createdAt": "2025-10-18T10:00:00.000Z",
    "updatedAt": "2025-10-18T10:31:00.000Z"
  }
}
```

**Automatic Status Changes:**
- When both doctor and patient join → status changes to IN_PROGRESS
- When call ends → appointment status changes to COMPLETED

---

### 4. Get Video Call Details
**GET** `/api/video-calls/:appointmentId`

Retrieves complete video call details including participants.

**Response (200 OK):**
```json
{
  "message": "Video call details retrieved successfully",
  "appointment": {
    "id": "clxxx123456789",
    "appointmentDate": "2025-10-18",
    "startTime": "10:00",
    "endTime": "10:30",
    "status": "IN_PROGRESS"
  },
  "videoCall": {
    "id": "clyyy987654321",
    "appointmentId": "clxxx123456789",
    "roomName": "appointment_clxxx123456789",
    "status": "IN_PROGRESS",
    "startedAt": "2025-10-18T10:30:00.000Z",
    "duration": null,
    "doctorJoinedAt": "2025-10-18T10:30:05.000Z",
    "patientJoinedAt": "2025-10-18T10:31:00.000Z"
  },
  "doctor": {
    "uid": "doctor123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "doctor@example.com",
    "profileImageUrl": "https://..."
  },
  "patient": {
    "uid": "patient456",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "patient@example.com",
    "profileImageUrl": "https://..."
  }
}
```

---

### 5. Get User's Video Calls
**GET** `/api/video-calls?status=IN_PROGRESS`

Lists all video calls for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by VideoCallStatus

**Response (200 OK):**
```json
{
  "message": "Video calls retrieved successfully",
  "count": 5,
  "videoCalls": [
    {
      "id": "clyyy987654321",
      "appointmentId": "clxxx123456789",
      "roomName": "appointment_clxxx123456789",
      "status": "COMPLETED",
      "startedAt": "2025-10-18T10:30:00.000Z",
      "endedAt": "2025-10-18T11:00:00.000Z",
      "duration": 1800,
      "appointment": {
        "id": "clxxx123456789",
        "appointmentDate": "2025-10-18",
        "startTime": "10:00",
        "status": "COMPLETED",
        "doctor": { ... },
        "patient": { ... }
      }
    }
  ]
}
```

---

## Frontend Integration Guide

### Step 1: Initiate Call (Doctor or Patient)
```javascript
// When user clicks "Start Video Call" button
const initiateCall = async (appointmentId) => {
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
    
    // Store token and meeting link
    const { jitsiToken, meetingLink, isModerator } = data;
    
    // Open Jitsi in new window or iframe
    window.open(meetingLink, '_blank');
    
  } catch (error) {
    console.error('Failed to initiate call:', error);
  }
};
```

### Step 2: Embed Jitsi in Your App
```javascript
// Option 1: Use Jitsi IFrame API
const startVideoCall = (appointmentId, jitsiToken) => {
  const domain = 'cloud.sehat.dpdns.org';
  const roomName = `appointment_${appointmentId}`;
  
  const options = {
    roomName: roomName,
    jwt: jitsiToken,
    width: '100%',
    height: 700,
    parentNode: document.querySelector('#jitsi-container'),
    configOverwrite: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'closedcaptions', 'desktop',
        'fullscreen', 'fodeviceselection', 'hangup', 'chat',
        'recording', 'etherpad', 'settings', 'raisehand',
        'videoquality', 'filmstrip', 'stats', 'shortcuts',
        'tileview', 'download', 'help', 'mute-everyone'
      ],
    },
  };
  
  const api = new JitsiMeetExternalAPI(domain, options);
  
  // Listen to events
  api.addEventListener('videoConferenceJoined', () => {
    updateCallStatus(appointmentId, 'join');
  });
  
  api.addEventListener('videoConferenceLeft', () => {
    updateCallStatus(appointmentId, 'end');
  });
  
  return api;
};
```

### Step 3: Update Call Status
```javascript
const updateCallStatus = async (appointmentId, action) => {
  try {
    await fetch(`http://localhost:5002/api/video-calls/${appointmentId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action })
    });
  } catch (error) {
    console.error('Failed to update status:', error);
  }
};
```

### Step 4: Handle Token Expiry
```javascript
// Regenerate token if expired (after 3 hours)
const getNewToken = async (appointmentId) => {
  try {
    const response = await fetch(
      `http://localhost:5002/api/video-calls/token/${appointmentId}`,
      {
        headers: {
          'Authorization': `Bearer ${firebaseToken}`
        }
      }
    );
    
    const data = await response.json();
    return data.jitsiToken;
  } catch (error) {
    console.error('Failed to get new token:', error);
  }
};
```

---

## React Example Component

```jsx
import React, { useEffect, useRef, useState } from 'react';

const VideoCallComponent = ({ appointmentId, firebaseToken }) => {
  const jitsiContainer = useRef(null);
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Get token
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/video-calls/initiate`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firebaseToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ appointmentId })
          }
        );
        
        const data = await response.json();
        
        // Initialize Jitsi
        const domain = 'cloud.sehat.dpdns.org';
        const options = {
          roomName: data.videoCall.roomName,
          jwt: data.jitsiToken,
          width: '100%',
          height: 700,
          parentNode: jitsiContainer.current,
        };
        
        const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
        
        // Event listeners
        jitsiApi.addEventListener('videoConferenceJoined', () => {
          updateStatus('join');
        });
        
        jitsiApi.addEventListener('videoConferenceLeft', () => {
          updateStatus('end');
          jitsiApi.dispose();
        });
        
        setApi(jitsiApi);
        setLoading(false);
        
      } catch (error) {
        console.error('Failed to initialize call:', error);
        setLoading(false);
      }
    };
    
    const updateStatus = async (action) => {
      await fetch(
        `${process.env.REACT_APP_API_URL}/api/video-calls/${appointmentId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${firebaseToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action })
        }
      );
    };
    
    initializeCall();
    
    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, [appointmentId, firebaseToken]);

  return (
    <div>
      {loading && <div>Loading video call...</div>}
      <div ref={jitsiContainer} style={{ height: '700px', width: '100%' }} />
    </div>
  );
};

export default VideoCallComponent;
```

---

## Environment Variables

Add to `.env`:
```env
JITSI_APP_ID=tabeeb
JITSI_APP_SECRET=ca51d0048c67a49f9a698b053b1460a4ed783d07cf442bae6a819e74864fe57e
JITSI_DOMAIN=cloud.sehat.dpdns.org
```

---

## Error Handling

### Common Errors

**400 Bad Request:**
- Missing appointmentId
- Appointment not in CONFIRMED/IN_PROGRESS status

**403 Forbidden:**
- User not part of appointment
- Unauthorized access attempt

**404 Not Found:**
- Appointment doesn't exist
- Video call not initiated

**500 Internal Server Error:**
- Jitsi configuration missing
- Database connection issues

---

## Status Flow Diagram

```
SCHEDULED → IN_PROGRESS → COMPLETED
    ↓            ↓
CANCELLED    FAILED
    ↓
NO_SHOW
```

---

## Testing

### Test with Postman

1. **Initiate Call:**
```bash
POST http://localhost:5002/api/video-calls/initiate
Headers:
  Authorization: Bearer {your_firebase_token}
Body:
  {
    "appointmentId": "your_appointment_id"
  }
```

2. **Get Token:**
```bash
GET http://localhost:5002/api/video-calls/token/{appointmentId}
Headers:
  Authorization: Bearer {your_firebase_token}
```

3. **Update Status:**
```bash
PATCH http://localhost:5002/api/video-calls/{appointmentId}/status
Headers:
  Authorization: Bearer {your_firebase_token}
Body:
  {
    "action": "join"
  }
```

---

## Security Considerations

1. **Token Expiry**: Tokens expire after 3 hours - users need to regenerate
2. **Moderator Role**: Only doctors get moderator privileges
3. **Room Naming**: Uses appointment ID to prevent room collision
4. **Authentication**: All endpoints require Firebase authentication
5. **Authorization**: Only appointment participants can access the call
6. **Lobby Bypass**: Trusted users bypass waiting room for better UX

---

## Database Queries

```sql
-- Get all active video calls
SELECT * FROM video_calls WHERE status = 'IN_PROGRESS';

-- Get call statistics for a doctor
SELECT 
  COUNT(*) as total_calls,
  SUM(duration) as total_duration,
  AVG(duration) as avg_duration
FROM video_calls vc
JOIN appointments a ON vc.appointmentId = a.id
WHERE a.doctorUid = 'doctor_uid' AND vc.status = 'COMPLETED';

-- Get calls that weren't completed
SELECT * FROM video_calls 
WHERE status IN ('CANCELLED', 'FAILED', 'NO_SHOW');
```

---

## Future Enhancements

1. **Recording**: Add call recording functionality
2. **Screen Sharing**: Enable screen sharing features
3. **Waiting Room**: Add virtual waiting room
4. **Chat History**: Store chat messages
5. **Call Quality**: Track network quality metrics
6. **Notifications**: Send notifications when call starts
7. **Multi-party**: Support group consultations
8. **Analytics**: Track call duration and quality

---

## Support

For issues or questions:
- Check Jitsi logs at your domain
- Verify JWT token structure
- Ensure Prosody is configured correctly
- Check firewall rules for video/audio ports
