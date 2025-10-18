# 🎭 Doctor vs Patient: Side-by-Side Comparison

## Quick Visual Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DOCTOR (Moderator)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Authentication:    JWT Token ✅                                    │
│  Token Example:     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...       │
│  Moderator:         true                                            │
│  Lobby Bypass:      true                                            │
│  Can Admit/Reject:  Yes ✅                                          │
│                                                                     │
│  Meeting Link:                                                      │
│  https://cloud.sehat.dpdns.org/appointment_123                      │
│    ?jwt=eyJhbGci...                                                 │
│    &config.startWithAudioMuted=true                                 │
│    &config.startWithVideoMuted=true                                 │
│                                                                     │
│  Join Experience:                                                   │
│  ┌─────────────────────────────────┐                               │
│  │  🎥 Prejoin Screen             │                               │
│  │                                 │                               │
│  │  [Camera Preview] (muted)       │                               │
│  │  [Mic Indicator] (muted)        │                               │
│  │                                 │                               │
│  │  [Join Meeting] ────────────────┼──> ✅ ENTER ROOM DIRECTLY    │
│  └─────────────────────────────────┘                               │
│                                                                     │
│  In Meeting:                                                        │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  📹 Video Call Room                                 │           │
│  │                                                     │           │
│  │  🔔 Jane Smith is waiting in the lobby             │           │
│  │     [Admit] [Reject]                                │           │
│  │                                                     │           │
│  │  🔇 Mic: Muted                                     │           │
│  │  📷 Camera: Off                                    │           │
│  │                                                     │           │
│  │  Controls: 🎤❌ 📹❌ 🖥️ 💬 ⚙️ 🔴                  │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         PATIENT (Participant)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Authentication:    Simple URL ⭕                                   │
│  Token:             null (no JWT)                                   │
│  Moderator:         false                                           │
│  Lobby Bypass:      false                                           │
│  Can Admit/Reject:  No ❌                                           │
│                                                                     │
│  Meeting Link:                                                      │
│  https://cloud.sehat.dpdns.org/appointment_123                      │
│    ?userInfo.displayName=Jane%20Smith                               │
│    &config.startWithAudioMuted=true                                 │
│    &config.startWithVideoMuted=true                                 │
│                                                                     │
│  Join Experience:                                                   │
│  ┌─────────────────────────────────┐                               │
│  │  🎥 Prejoin Screen             │                               │
│  │                                 │                               │
│  │  [Camera Preview] (muted)       │                               │
│  │  [Mic Indicator] (muted)        │                               │
│  │                                 │                               │
│  │  [Join Meeting] ────────────────┼──> ⏳ PLACED IN LOBBY        │
│  └─────────────────────────────────┘                               │
│                                                                     │
│  In Lobby:                                                          │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  ⏳ Waiting Room                                    │           │
│  │                                                     │           │
│  │  Please wait, the moderator will                    │           │
│  │  let you in soon.                                   │           │
│  │                                                     │           │
│  │  🔇 Mic: Muted                                     │           │
│  │  📷 Camera: Off                                    │           │
│  │                                                     │           │
│  │  [Leave Meeting]                                    │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  After Admission:                                                   │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  📹 Video Call Room                                 │           │
│  │                                                     │           │
│  │  [Doctor's Video]                                   │           │
│  │                                                     │           │
│  │  🔇 Mic: Muted                                     │           │
│  │  📷 Camera: Off                                    │           │
│  │                                                     │           │
│  │  Controls: 🎤❌ 📹❌ 💬 🖥️ 🔴                      │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Response Comparison

### Doctor's Response:
```json
{
  "message": "Video call initiated successfully (Doctor)",
  "videoCall": {
    "id": "clxxx123",
    "appointmentId": "appt_456",
    "roomName": "appointment_appt_456",
    "status": "SCHEDULED"
  },
  "jitsiToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ0YWJlZWIiLCJpc3MiOiJ0YWJlZWIiLCJzdWIiOiJjbG91ZC5zZWh...",
  "meetingLink": "https://cloud.sehat.dpdns.org/appointment_appt_456?jwt=eyJ...&config.startWithAudioMuted=true&config.startWithVideoMuted=true",
  "userRole": "doctor",
  "isModerator": true,          // ✅ Can control meeting
  "lobbyBypass": true,          // ✅ Skips lobby
  "expiresIn": "3 hours"
}
```

### Patient's Response:
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
  "jitsiToken": null,           // ❌ No token
  "userRole": "patient",
  "isModerator": false,         // ❌ Cannot control meeting
  "lobbyBypass": false,         // ❌ Must go through lobby
  "note": "You will be placed in the lobby. Please wait for the doctor to admit you."
}
```

---

## Timeline Comparison

```
TIME    DOCTOR                               PATIENT
════    ══════                               ═══════

0:00    Clicks "Start Call"                  Clicks "Join Call"
        
0:01    API generates JWT token              API generates simple link
        
0:02    Opens Jitsi with JWT                 Opens Jitsi without JWT
        
0:03    ✅ Enters room directly              ⏳ Placed in lobby
        (mic & camera muted)                  (mic & camera muted)
        
0:04    🔔 Sees lobby notification:          Sees waiting message:
        "Jane Smith is waiting"              "Waiting for moderator..."
        
0:05    Reviews notification                 [Waits patiently]
        
0:06    Clicks [Admit] button                [Still waiting]
        
0:07    ═══════════════════════════════════════════════════════
              PATIENT ADMITTED - BOTH IN ROOM
        ═══════════════════════════════════════════════════════
        
0:08    Both users in same room              Both users in same room
        Both still muted                     Both still muted
        
0:09    Doctor unmutes mic                   Patient unmutes mic
        
0:10    🎙️ Conversation begins! 🎙️          🎙️ Conversation begins! 🎙️
```

---

## Features Comparison Table

| Feature | Doctor | Patient |
|---------|--------|---------|
| **JWT Token** | ✅ Yes | ❌ No |
| **Moderator Status** | ✅ Yes | ❌ No |
| **Lobby Bypass** | ✅ Yes | ❌ No (goes to lobby) |
| **Can Admit Others** | ✅ Yes | ❌ No |
| **Can Reject Others** | ✅ Yes | ❌ No |
| **Can End Meeting for All** | ✅ Yes | ❌ No |
| **Can Mute Others** | ✅ Yes | ❌ No |
| **Can Remove Participants** | ✅ Yes | ❌ No |
| **Starts Muted (Audio)** | ✅ Yes | ✅ Yes |
| **Starts Muted (Video)** | ✅ Yes | ✅ Yes |
| **Can Unmute Self** | ✅ Yes | ✅ Yes |
| **Can Turn On Camera** | ✅ Yes | ✅ Yes |
| **Can Share Screen** | ✅ Yes | ✅ Yes |
| **Can Use Chat** | ✅ Yes | ✅ Yes |
| **Must Wait in Lobby** | ❌ No | ✅ Yes |
| **Needs Admission** | ❌ No | ✅ Yes |

---

## URL Breakdown

### Doctor's URL:
```
https://cloud.sehat.dpdns.org/appointment_appt_456
│      │                       │
│      │                       └─> Room Name (unique per appointment)
│      │
│      └─> Your Jitsi Domain
│
└─> HTTPS protocol

?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
│    │
│    └─> Full JWT token with:
│         - moderator: true
│         - lobby_bypass: true
│         - User context (name, email, avatar)
│
└─> Query parameter

&config.startWithAudioMuted=true
│                           │
│                           └─> Value: true
│
└─> Jitsi config parameter (mic starts muted)

&config.startWithVideoMuted=true
│                           │
│                           └─> Value: true
│
└─> Jitsi config parameter (camera starts off)
```

### Patient's URL:
```
https://cloud.sehat.dpdns.org/appointment_appt_456
│      │                       │
│      │                       └─> Room Name (same as doctor's room)
│      │
│      └─> Your Jitsi Domain
│
└─> HTTPS protocol

?userInfo.displayName=Jane%20Smith
│                     │
│                     └─> Patient's name (URL encoded)
│
└─> Jitsi parameter to show display name

&config.startWithAudioMuted=true
│
└─> Mic starts muted

&config.startWithVideoMuted=true
│
└─> Camera starts off

⚠️ Notice: NO JWT token in patient's URL!
   This is what triggers automatic lobby placement.
```

---

## Security Comparison

### Doctor (JWT Token):
```
✅ Authenticated by JWT signature
✅ Token includes expiry time (3 hours)
✅ Token signed with secret key
✅ Token tampering detected automatically
✅ Can be revoked server-side
✅ Contains user context (name, email, avatar)
✅ Moderator status verified cryptographically
```

### Patient (Simple URL):
```
✅ No token to steal or manipulate
✅ Cannot bypass lobby (no authentication)
✅ Cannot claim moderator status
✅ Display name is just for UI (not trusted)
✅ Jitsi enforces lobby automatically
✅ Doctor must explicitly admit them
✅ More secure (fewer attack vectors)
```

---

## Code Comparison

### Backend - Doctor Token Generation:
```typescript
// For DOCTOR
const token = generateDoctorJitsiToken({
  appointmentId: "appt_123",
  userName: "Dr. John Doe",
  userEmail: "doctor@example.com",
  avatarUrl: "https://...",
  expiryHours: 3
});

// Generates JWT with:
{
  moderator: true,
  context: {
    user: {
      lobby_bypass: true  // ← Doctor bypasses lobby
    }
  }
}
```

### Backend - Patient Link Generation:
```typescript
// For PATIENT
const link = generatePatientMeetingLink(
  "appt_123",
  "Jane Smith"
);

// Returns simple URL:
// https://...?userInfo.displayName=Jane%20Smith
//            &config.startWithAudioMuted=true
//            &config.startWithVideoMuted=true
// No JWT = Automatic lobby placement
```

---

## Troubleshooting by Role

### Doctor Issues:

**Problem:** "I'm stuck in the lobby!"
- ✅ Check: JWT token includes `lobby_bypass: true`
- ✅ Check: Token not expired (valid for 3 hours)
- ✅ Check: Using correct meeting link with JWT

**Problem:** "I can't admit the patient!"
- ✅ Check: JWT token has `moderator: true`
- ✅ Check: Patient has actually joined (check notifications)
- ✅ Check: Look for lobby notification panel in Jitsi UI

### Patient Issues:

**Problem:** "I'm not going to the lobby!"
- ✅ Check: URL does NOT have a JWT token
- ✅ Check: Using patient endpoint, not doctor endpoint
- ✅ Check: Getting the correct response with `lobbyBypass: false`

**Problem:** "I'm waiting too long!"
- ✅ Check: Doctor has joined the meeting
- ✅ Check: Doctor has seen the lobby notification
- ✅ Tip: Implement a "notify doctor" button in frontend

---

## Summary

### 🎯 Key Takeaway:
**Doctors have full control with JWT tokens.**  
**Patients have simple access with automatic lobby placement.**

### ✅ Benefits:
1. **Automatic Lobby** - No server configuration needed
2. **Better Security** - Patients can't manipulate tokens
3. **Clear Roles** - Doctor admits, patient waits
4. **Privacy First** - Both start muted
5. **Professional** - Mimics real clinic workflow

### 🚀 Ready to Use:
- Backend implemented ✅
- Documentation complete ✅
- Tests passing ✅
- Lobby working automatically ✅
- Muted by default ✅

**Just integrate the frontend and you're good to go!**
