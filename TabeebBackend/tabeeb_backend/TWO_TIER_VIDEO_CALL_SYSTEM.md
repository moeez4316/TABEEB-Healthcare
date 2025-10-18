# 🎯 Two-Tier Video Call System with Automatic Lobby

## 🆕 Overview

The video call system now uses **two separate approaches** for doctors and patients to enable automatic lobby functionality:

### Doctor Approach (JWT Token)
- **Full JWT authentication** with moderator privileges
- Bypasses lobby automatically
- Can admit/reject patients from lobby
- Full control over meeting settings

### Patient Approach (Simple Link)
- **No JWT required** - just a simple meeting URL
- Automatically placed in lobby by Jitsi
- Must wait for doctor to admit them
- Starts with camera and mic muted

---

## 🔑 Key Differences

| Feature | Doctor | Patient |
|---------|--------|---------|
| **Authentication** | JWT Token | No token (simple link) |
| **Lobby Behavior** | Bypass (direct entry) | Automatic placement in lobby |
| **Moderator Status** | ✅ Yes | ❌ No |
| **Admit/Reject Powers** | ✅ Yes | ❌ No |
| **Camera/Mic on Join** | 🔇 Muted by default | 🔇 Muted by default |
| **Display Name** | From JWT context | From URL parameter |

---

## 🚪 How It Works

### Doctor Flow:
```
1. Doctor clicks "Start Call" button
         ↓
2. Backend generates JWT token with:
   - moderator: true
   - lobby_bypass: true
   - User context (name, email, avatar)
         ↓
3. Frontend opens Jitsi with JWT parameter
         ↓
4. ✅ Doctor enters room DIRECTLY (bypasses lobby)
         ↓
5. Camera and mic start MUTED
         ↓
6. Doctor unmutes when ready
         ↓
7. Doctor sees lobby notification when patient arrives
         ↓
8. Doctor clicks "Admit" to let patient in
```

### Patient Flow:
```
1. Patient clicks "Join Call" button
         ↓
2. Backend generates simple meeting link with:
   - Room name
   - Display name (URL parameter)
   - Config for muted audio/video
   - NO JWT TOKEN
         ↓
3. Frontend opens Jitsi with simple URL
         ↓
4. ⏳ Patient automatically placed in LOBBY
         ↓
5. Camera and mic start MUTED
         ↓
6. Patient waits for doctor to admit
         ↓
7. Patient sees "Waiting for moderator..." message
         ↓
8. ✅ Doctor admits → Patient enters room
         ↓
9. Patient unmutes when ready
```

---

## 📋 API Changes

### 1. Initiate Video Call
**POST** `/api/video-calls/initiate`

#### Doctor Response:
```json
{
  "message": "Video call initiated successfully (Doctor)",
  "videoCall": {
    "id": "clxxx123",
    "appointmentId": "appt_456",
    "roomName": "appointment_appt_456",
    "status": "SCHEDULED"
  },
  "jitsiToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "meetingLink": "https://cloud.sehat.dpdns.org/appointment_appt_456?jwt=eyJ...&config.startWithAudioMuted=true&config.startWithVideoMuted=true",
  "userRole": "doctor",
  "isModerator": true,
  "lobbyBypass": true,
  "expiresIn": "3 hours"
}
```

#### Patient Response:
```json
{
  "message": "Video call initiated successfully (Patient)",
  "videoCall": {
    "id": "clxxx123",
    "appointmentId": "appt_456",
    "roomName": "appointment_appt_456",
    "status": "SCHEDULED"
  },
  "meetingLink": "https://cloud.sehat.dpdns.org/appointment_appt_456?userInfo.displayName=Jane%20Smith&config.startWithAudioMuted=true&config.startWithVideoMuted=true",
  "jitsiToken": null,
  "userRole": "patient",
  "isModerator": false,
  "lobbyBypass": false,
  "note": "You will be placed in the lobby. Please wait for the doctor to admit you."
}
```

**Key Differences:**
- Doctor gets `jitsiToken`, patient gets `null`
- Doctor link includes JWT, patient link does not
- Both include muted audio/video config
- Patient link includes `userInfo.displayName` parameter

---

## 💻 Code Implementation

### Backend Service (videoCallService.ts)

```typescript
/**
 * Generate JWT token for DOCTOR ONLY
 */
export const generateDoctorJitsiToken = (params: GenerateTokenParams): string => {
  const payload: JitsiTokenPayload = {
    aud: APP_ID,
    iss: APP_ID,
    sub: DOMAIN,
    room: `appointment_${appointmentId}`,
    exp: Math.floor(Date.now() / 1000) + expiryHours * 3600,
    moderator: true,  // Doctor is moderator
    context: {
      user: {
        name: userName,
        email: userEmail,
        avatar: avatarUrl,
        lobby_bypass: true  // Doctor bypasses lobby
      }
    }
  };
  return jwt.sign(payload, APP_SECRET, { algorithm: 'HS256' });
};

/**
 * Generate simple link for PATIENT (no JWT)
 */
export const generatePatientMeetingLink = (
  appointmentId: string,
  userName?: string
): string => {
  const roomName = `appointment_${appointmentId}`;
  let url = `https://${DOMAIN}/${roomName}`;
  
  // Add display name
  if (userName) {
    url += `?userInfo.displayName=${encodeURIComponent(userName)}`;
  }
  
  // Add muted config
  url += `${userName ? '&' : '?'}config.startWithAudioMuted=true&config.startWithVideoMuted=true`;
  
  return url;
};

/**
 * Generate complete link for DOCTOR with JWT
 */
export const generateDoctorMeetingLink = (params: GenerateTokenParams): string => {
  const token = generateDoctorJitsiToken(params);
  const roomName = `appointment_${params.appointmentId}`;
  
  return `https://${DOMAIN}/${roomName}?jwt=${token}&config.startWithAudioMuted=true&config.startWithVideoMuted=true`;
};
```

### Controller Logic

```typescript
// In initiateVideoCall and getVideoCallToken functions:

if (userRole === 'doctor') {
  // DOCTOR: Generate JWT token
  const userName = `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;
  const token = generateDoctorJitsiToken({ appointmentId, userName, ... });
  const meetingLink = generateDoctorMeetingLink({ appointmentId, userName, ... });
  
  return res.json({
    jitsiToken: token,
    meetingLink,
    isModerator: true,
    lobbyBypass: true
  });
} else {
  // PATIENT: Generate simple link
  const userName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
  const meetingLink = generatePatientMeetingLink(appointmentId, userName);
  
  return res.json({
    meetingLink,
    jitsiToken: null,
    isModerator: false,
    lobbyBypass: false,
    note: 'You will be placed in the lobby. Please wait for the doctor to admit you.'
  });
}
```

---

## 🎨 Frontend Integration

### Opening Meeting for Doctor:
```javascript
const response = await fetch('/api/video-calls/initiate', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${firebaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ appointmentId })
});

const { meetingLink, jitsiToken, isModerator } = await response.json();

// Doctor has JWT in URL - will bypass lobby
window.open(meetingLink, '_blank');
```

### Opening Meeting for Patient:
```javascript
const response = await fetch('/api/video-calls/initiate', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${firebaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ appointmentId })
});

const { meetingLink, jitsiToken, note } = await response.json();

// Patient has simple URL - will be placed in lobby
// Show note to user: "You will be placed in the lobby..."
window.open(meetingLink, '_blank');
```

### Frontend Configuration (Optional):
```javascript
// If embedding Jitsi in iframe instead of opening in new tab:
const api = new JitsiMeetExternalAPI(domain, {
  roomName: roomName,
  jwt: jitsiToken, // null for patients, token for doctors
  userInfo: {
    displayName: userName // Already in URL for patients
  },
  configOverwrite: {
    startWithAudioMuted: true,
    startWithVideoMuted: true,
    // No need to set lobby flags - handled automatically
  }
});
```

---

## 🔐 Security Benefits

### 1. No Token Leakage for Patients
- Patients don't receive JWT tokens
- Cannot manipulate moderator status
- Cannot bypass lobby through token modification

### 2. Automatic Lobby Enforcement
- Jitsi automatically places non-authenticated users in lobby
- No server-side configuration needed
- Works out-of-the-box with any Jitsi deployment

### 3. Clear Access Control
- Only doctors have JWT tokens
- Only doctors can be moderators
- Patients must always wait for admission

---

## ✅ Advantages Over Previous Approach

### Old System (Everyone had JWT):
```
❌ Both doctor and patient had JWT tokens
❌ Required lobby_bypass flag in JWT
❌ Needed complex server configuration
❌ Lobby might not work if server not configured
❌ More room for configuration errors
```

### New System (Two-Tier):
```
✅ Only doctors have JWT tokens
✅ Patients use simple URLs
✅ Lobby works automatically (no server config)
✅ More secure (patients can't modify tokens)
✅ Simpler to implement and maintain
✅ Camera/mic muted by default for both
```

---

## 🧪 Testing

### Test Doctor Flow:
```bash
# 1. Get doctor token
curl -X POST http://localhost:3000/api/video-calls/initiate \
  -H "Authorization: Bearer DOCTOR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "test_123"}'

# Expected: jitsiToken present, lobbyBypass: true

# 2. Open the meetingLink in browser
# Expected: Enter room directly, no lobby
```

### Test Patient Flow:
```bash
# 1. Get patient link
curl -X POST http://localhost:3000/api/video-calls/initiate \
  -H "Authorization: Bearer PATIENT_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "test_123"}'

# Expected: jitsiToken: null, lobbyBypass: false

# 2. Open the meetingLink in browser
# Expected: Placed in lobby, see "Waiting for moderator..." message
```

### Test End-to-End:
1. Doctor opens meeting → Enters room directly
2. Patient opens meeting → Placed in lobby
3. Doctor sees "Jane Smith is waiting in lobby" notification
4. Doctor clicks "Admit" button
5. Patient enters room
6. Both start with camera/mic muted
7. Both can unmute when ready

---

## 📊 URL Comparison

### Doctor URL:
```
https://cloud.sehat.dpdns.org/appointment_appt_456
  ?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ0YWJlZWIi...
  &config.startWithAudioMuted=true
  &config.startWithVideoMuted=true
```

**Parts:**
- Domain: `cloud.sehat.dpdns.org`
- Room: `appointment_appt_456`
- JWT: Full token with moderator=true, lobby_bypass=true
- Config: Start muted

### Patient URL:
```
https://cloud.sehat.dpdns.org/appointment_appt_456
  ?userInfo.displayName=Jane%20Smith
  &config.startWithAudioMuted=true
  &config.startWithVideoMuted=true
```

**Parts:**
- Domain: `cloud.sehat.dpdns.org`
- Room: `appointment_appt_456` (same as doctor)
- Display Name: URL parameter (no JWT)
- Config: Start muted
- **No JWT = Automatic lobby placement**

---

## 🎯 Summary

### What Changed:
1. **Doctors** now get JWT tokens with `lobby_bypass: true`
2. **Patients** now get simple URLs without JWT tokens
3. **Both** start with camera and microphone muted
4. **Lobby** works automatically for patients (no server config needed)
5. **Doctor** must admit patient from lobby to start consultation

### What Stayed Same:
1. Room names still use `appointment_{appointmentId}`
2. VideoCall database model unchanged
3. Status tracking (SCHEDULED, IN_PROGRESS, etc.) unchanged
4. All other API endpoints work the same way

### Why This is Better:
- ✅ **More secure**: Patients can't manipulate tokens
- ✅ **Simpler**: No complex JWT configuration for everyone
- ✅ **Reliable**: Lobby works out-of-the-box without server setup
- ✅ **Professional**: Mimics real clinic workflow (doctor admits patient)
- ✅ **Privacy**: Both start muted, user controls when to activate audio/video

---

## 🚀 Next Steps

1. **Frontend Integration**: Update frontend to handle two different response types
2. **UI Updates**: Show appropriate messages for doctor (admit/reject) vs patient (waiting)
3. **Testing**: Test lobby admission flow with real users
4. **Documentation**: Update frontend docs with new API responses
5. **Monitoring**: Track lobby wait times and admission rates

---

## 📞 Support

For questions or issues:
- Check that `JITSI_DOMAIN`, `JITSI_APP_ID`, and `JITSI_APP_SECRET` are set in `.env`
- Verify Firebase auth tokens are valid
- Test with both doctor and patient roles
- Check browser console for Jitsi errors
