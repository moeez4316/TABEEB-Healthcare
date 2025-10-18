# 🚀 Quick Start: Two-Tier Video Call System

## TL;DR

**Doctors get JWT tokens, patients get simple links. Lobby works automatically!**

---

## 📋 Quick Reference

### Doctor Join:
```javascript
// API Request
POST /api/video-calls/initiate
Body: { "appointmentId": "appt_123" }
Headers: { "Authorization": "Bearer DOCTOR_FIREBASE_TOKEN" }

// Response
{
  "jitsiToken": "eyJ...",  // ✅ Has token
  "meetingLink": "https://...?jwt=eyJ...&config.startWithAudioMuted=true&config.startWithVideoMuted=true",
  "isModerator": true,
  "lobbyBypass": true      // ✅ Bypasses lobby
}

// What happens:
1. Opens link → Enters room DIRECTLY
2. Starts with mic/camera MUTED
3. Sees lobby notification when patient arrives
4. Clicks "Admit" to let patient in
```

### Patient Join:
```javascript
// API Request
POST /api/video-calls/initiate
Body: { "appointmentId": "appt_123" }
Headers: { "Authorization": "Bearer PATIENT_FIREBASE_TOKEN" }

// Response
{
  "jitsiToken": null,      // ❌ No token
  "meetingLink": "https://...?userInfo.displayName=Jane%20Smith&config.startWithAudioMuted=true&config.startWithVideoMuted=true",
  "isModerator": false,
  "lobbyBypass": false,    // ❌ Goes to lobby
  "note": "You will be placed in the lobby. Please wait for the doctor to admit you."
}

// What happens:
1. Opens link → Placed in LOBBY automatically
2. Starts with mic/camera MUTED
3. Sees "Waiting for moderator..." message
4. Waits until doctor admits them
5. Enters room after admission
```

---

## 🔄 Complete Flow

```
DOCTOR                                  PATIENT
──────                                  ───────

1. Click "Start Call"                  1. Click "Join Call"
         ↓                                      ↓
2. POST /initiate                      2. POST /initiate
   (with doctor token)                    (with patient token)
         ↓                                      ↓
3. Get JWT token                       3. Get simple link
   + Meeting link                         (no JWT)
         ↓                                      ↓
4. Open link in browser                4. Open link in browser
         ↓                                      ↓
5. ✅ ENTER ROOM DIRECTLY              5. ⏳ PLACED IN LOBBY
   (mic & camera muted)                   (mic & camera muted)
         ↓                                      ↓
6. See notification:                   6. See message:
   "Jane Smith is waiting"                "Waiting for moderator..."
         ↓                                      ↓
7. Click [Admit] button                7. [Waiting...]
         ↓                                      ↓
   ═══════════════════════════════════════════════
            PATIENT ADMITTED - CALL BEGINS
   ═══════════════════════════════════════════════
         ↓                                      ↓
8. Both in same room                   8. Both in same room
   (mic & camera still muted)             (mic & camera still muted)
         ↓                                      ↓
9. Unmute when ready                   9. Unmute when ready
         ↓                                      ↓
10. Start consultation! 🎉             10. Start consultation! 🎉
```

---

## 💡 Key Points

### Why This Works:
1. **Doctor has JWT** = Jitsi recognizes them as moderator with lobby bypass
2. **Patient has no JWT** = Jitsi automatically places them in lobby
3. **No server config needed** = Works out-of-the-box with any Jitsi
4. **Both start muted** = URL parameter `config.startWithAudioMuted=true&config.startWithVideoMuted=true`

### Security:
- ✅ Patients can't bypass lobby (no JWT to modify)
- ✅ Only doctors can be moderators
- ✅ Doctor controls who enters the room
- ✅ Both users control their own audio/video

### Privacy:
- ✅ Mic muted by default
- ✅ Camera muted by default
- ✅ Doctor can prepare before admitting patient
- ✅ Patient can prepare in lobby before admission

---

## 🧪 Testing

### Test Script:
```bash
# Run the test to verify everything works
npx ts-node test-video-call.ts
```

### Manual Testing:
```bash
# 1. Test Doctor Endpoint
curl -X POST http://localhost:3000/api/video-calls/initiate \
  -H "Authorization: Bearer YOUR_DOCTOR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "test_123"}'

# Should get: jitsiToken (present), lobbyBypass: true

# 2. Test Patient Endpoint
curl -X POST http://localhost:3000/api/video-calls/initiate \
  -H "Authorization: Bearer YOUR_PATIENT_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "test_123"}'

# Should get: jitsiToken: null, lobbyBypass: false
```

### Browser Testing:
1. Open doctor's `meetingLink` → Should enter room directly (mic/camera muted)
2. Open patient's `meetingLink` → Should see lobby screen (mic/camera muted)
3. Doctor should see lobby notification
4. Doctor clicks "Admit" → Patient enters room
5. Both unmute when ready

---

## 📝 Frontend Code Examples

### React Example:
```jsx
const JoinVideoCall = ({ appointmentId, userRole }) => {
  const [loading, setLoading] = useState(false);
  
  const joinCall = async () => {
    setLoading(true);
    
    const token = await firebase.auth().currentUser.getIdToken();
    
    const response = await fetch('/api/video-calls/initiate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ appointmentId })
    });
    
    const data = await response.json();
    
    // Show note to patient about lobby
    if (userRole === 'patient' && data.note) {
      alert(data.note); // Or use a nice modal/toast
    }
    
    // Open meeting link
    window.open(data.meetingLink, '_blank');
    
    setLoading(false);
  };
  
  return (
    <button onClick={joinCall} disabled={loading}>
      {userRole === 'doctor' ? 'Start Call' : 'Join Call'}
    </button>
  );
};
```

### Angular Example:
```typescript
joinVideoCall(appointmentId: string, userRole: string) {
  this.loading = true;
  
  this.auth.currentUser.getIdToken().then(token => {
    this.http.post('/api/video-calls/initiate', 
      { appointmentId },
      { headers: { 'Authorization': `Bearer ${token}` } }
    ).subscribe(data => {
      // Show lobby note for patients
      if (userRole === 'patient' && data.note) {
        this.showNotification(data.note);
      }
      
      // Open meeting
      window.open(data.meetingLink, '_blank');
      
      this.loading = false;
    });
  });
}
```

### Vue Example:
```vue
<template>
  <button @click="joinCall" :disabled="loading">
    {{ userRole === 'doctor' ? 'Start Call' : 'Join Call' }}
  </button>
</template>

<script>
export default {
  data() {
    return { loading: false }
  },
  methods: {
    async joinCall() {
      this.loading = true;
      
      const token = await firebase.auth().currentUser.getIdToken();
      
      const response = await fetch('/api/video-calls/initiate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appointmentId: this.appointmentId })
      });
      
      const data = await response.json();
      
      if (this.userRole === 'patient' && data.note) {
        this.$toast.info(data.note);
      }
      
      window.open(data.meetingLink, '_blank');
      
      this.loading = false;
    }
  }
}
</script>
```

---

## ⚙️ Configuration

### Environment Variables (.env):
```bash
# Jitsi Configuration
JITSI_DOMAIN=cloud.sehat.dpdns.org
JITSI_APP_ID=tabeeb
JITSI_APP_SECRET=your_secret_key_here

# Database
DATABASE_URL="mysql://user:password@localhost:3306/tabeeb_backend"

# Firebase (for authentication)
# ... your Firebase config
```

### Verify Setup:
```bash
# Check environment variables are loaded
node -e "require('dotenv').config(); console.log('JITSI_DOMAIN:', process.env.JITSI_DOMAIN)"
```

---

## 🔍 Troubleshooting

### Problem: Patient not going to lobby
**Solution:** Make sure patient's URL does NOT have a JWT parameter. It should only have `userInfo.displayName` and config parameters.

### Problem: Doctor stuck in lobby
**Solution:** Check that doctor's JWT token includes `lobby_bypass: true` in the context.user object.

### Problem: Both users muted but can't unmute
**Solution:** That's expected! They start muted for privacy. Users manually unmute using Jitsi's UI buttons.

### Problem: Lobby notification not appearing for doctor
**Solution:** Ensure your Jitsi server supports lobby feature. Most cloud/self-hosted instances do by default.

---

## 📚 Related Documentation

- `TWO_TIER_VIDEO_CALL_SYSTEM.md` - Complete technical documentation
- `VIDEO_CALL_DOCUMENTATION.md` - API reference for all endpoints
- `QUICK_VIDEO_CALL_GUIDE.md` - Original implementation guide
- `LOBBY_SYSTEM_EXPLAINED.md` - Old lobby system (deprecated)

---

## ✅ Checklist

Before deploying:
- [ ] Environment variables set correctly
- [ ] Test with real doctor and patient accounts
- [ ] Verify lobby works (patient waits, doctor admits)
- [ ] Check both start with mic/camera muted
- [ ] Test admit/reject functionality
- [ ] Update frontend to handle two response types
- [ ] Add user notifications (lobby waiting message)
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

---

**🎉 You're all set! The two-tier system provides automatic lobby functionality with better security and privacy.**
