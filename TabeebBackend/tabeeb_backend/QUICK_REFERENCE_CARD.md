# 🎴 Quick Reference Card

## Two-Tier Video Call System

---

### 👨‍⚕️ DOCTOR

**Authentication:** JWT Token ✅  
**Lobby:** Bypasses (Direct Entry) ✅  
**Moderator:** Yes ✅  
**Privacy:** Starts Muted 🔇📷

**API Call:**
```bash
POST /api/video-calls/initiate
Authorization: Bearer DOCTOR_FIREBASE_TOKEN
Body: { "appointmentId": "..." }
```

**Response:**
```json
{
  "jitsiToken": "eyJ...",
  "meetingLink": "https://...?jwt=eyJ...&config.startWithAudioMuted=true&config.startWithVideoMuted=true",
  "isModerator": true,
  "lobbyBypass": true
}
```

**User Experience:**
```
Click "Start Call"
    ↓
Opens Jitsi
    ↓
✅ Enters Room Directly (muted)
    ↓
🔔 Sees "Patient waiting in lobby"
    ↓
Clicks [Admit]
    ↓
🎉 Consultation Begins
```

---

### 👤 PATIENT

**Authentication:** Simple Link (No JWT) ⭕  
**Lobby:** Waits for Admission ⏳  
**Moderator:** No ❌  
**Privacy:** Starts Muted 🔇📷

**API Call:**
```bash
POST /api/video-calls/initiate
Authorization: Bearer PATIENT_FIREBASE_TOKEN
Body: { "appointmentId": "..." }
```

**Response:**
```json
{
  "jitsiToken": null,
  "meetingLink": "https://...?userInfo.displayName=Jane&config.startWithAudioMuted=true&config.startWithVideoMuted=true",
  "isModerator": false,
  "lobbyBypass": false,
  "note": "You will be placed in the lobby..."
}
```

**User Experience:**
```
Click "Join Call"
    ↓
Opens Jitsi
    ↓
⏳ Placed in Lobby (muted)
    ↓
Sees "Waiting for moderator..."
    ↓
[Waits for doctor to admit]
    ↓
✅ Enters Room
    ↓
🎉 Consultation Begins
```

---

## 🔑 Key Differences

| | Doctor | Patient |
|-|--------|---------|
| **JWT** | ✅ | ❌ |
| **Moderator** | ✅ | ❌ |
| **Lobby Bypass** | ✅ | ❌ |
| **Starts Muted** | ✅ | ✅ |
| **Can Admit** | ✅ | ❌ |

---

## 🔗 URL Comparison

**Doctor URL:**
```
https://cloud.sehat.dpdns.org/appointment_123
  ?jwt=eyJhbG...
  &config.startWithAudioMuted=true
  &config.startWithVideoMuted=true
```

**Patient URL:**
```
https://cloud.sehat.dpdns.org/appointment_123
  ?userInfo.displayName=Jane
  &config.startWithAudioMuted=true
  &config.startWithVideoMuted=true
```

---

## 📝 Frontend Code

```javascript
// Same for both doctor and patient:
const response = await fetch('/api/video-calls/initiate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ appointmentId })
});

const { meetingLink, note } = await response.json();

// Show note if patient
if (note) alert(note);

// Open meeting
window.open(meetingLink, '_blank');
```

---

## ✅ Benefits

1. **Automatic Lobby** - Works out-of-box
2. **More Secure** - Patients can't manipulate tokens
3. **Privacy First** - Both start muted
4. **Professional** - Doctor admits patient
5. **Simple** - No complex configuration

---

## 🧪 Quick Test

```bash
# Run test script
npx ts-node test-video-call.ts

# Start server
npm run dev

# Test doctor endpoint
curl -X POST http://localhost:3000/api/video-calls/initiate \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -d '{"appointmentId": "test"}'

# Test patient endpoint
curl -X POST http://localhost:3000/api/video-calls/initiate \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -d '{"appointmentId": "test"}'
```

---

## 📚 Documentation

- `TWO_TIER_VIDEO_CALL_SYSTEM.md` - Complete guide
- `QUICK_START_TWO_TIER_SYSTEM.md` - Quick start
- `DOCTOR_VS_PATIENT_COMPARISON.md` - Visual comparison
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Implementation summary

---

## ⚙️ Environment Variables

```env
JITSI_DOMAIN=cloud.sehat.dpdns.org
JITSI_APP_ID=tabeeb
JITSI_APP_SECRET=your_secret_here
```

---

## 🎯 Summary

**Doctors:** JWT + Direct Entry + Moderator Powers + Muted Start  
**Patients:** Simple Link + Lobby Wait + No Powers + Muted Start  
**Result:** Professional, Secure, Privacy-First Video Calls! 🎉
