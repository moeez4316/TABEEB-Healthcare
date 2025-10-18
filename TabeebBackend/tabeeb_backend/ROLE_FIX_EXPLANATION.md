# 🔧 Role Detection Fix

## Problem
The backend was returning **"Patient"** even when the frontend said **"Doctor"** because it was relying on `req.user?.role` from the Firebase token custom claims, which might not be set correctly.

## Solution
Changed the role detection to check **actual appointment data** instead of relying on Firebase token claims.

### Before (Unreliable):
```typescript
const userRole = req.user?.role; // ❌ Depends on Firebase custom claims

if (userRole === 'doctor') {
  // Generate doctor token
}
```

### After (Reliable):
```typescript
// ✅ Verify against actual appointment data
const isDoctor = appointment.doctorUid === userUid;
const isPatient = appointment.patientUid === userUid;

if (isDoctor) {
  // Generate doctor token
}
```

## Why This is Better

| Method | Reliability | Security |
|--------|------------|----------|
| **Firebase token role claim** | ❌ Can be missing/incorrect | ⚠️ Trusts token blindly |
| **Appointment data check** | ✅ Always accurate | ✅ Verifies actual appointment ownership |

## What Changed

### 3 Functions Updated:

1. **`initiateVideoCall`** (Line 68-71)
   - Added: `const isDoctor = appointment.doctorUid === userUid`
   - Changed: `if (userRole === 'doctor')` → `if (isDoctor)`

2. **`getVideoCallToken`** (Line 168-171)
   - Added: `const isDoctor = appointment.doctorUid === userUid`
   - Changed: `if (userRole === 'doctor')` → `if (isDoctor)`

3. **`updateVideoCallStatus`** (Line 266-269)
   - Added: `const isDoctor = appointment.doctorUid === userUid`
   - Changed: `if (userRole === 'doctor')` → `if (isDoctor)`

## Testing

Now when you call the endpoint:
```bash
POST /api/video-call/initiate
Body: { "appointmentId": "cmgw6thkw000kg29wfres8b4x" }
```

**The backend will:**
1. ✅ Fetch the appointment from database
2. ✅ Check if `appointment.doctorUid === req.user.uid`
3. ✅ If TRUE → Return doctor response with JWT
4. ✅ If FALSE → Check if `appointment.patientUid === req.user.uid`
5. ✅ Return appropriate response based on actual appointment data

## Expected Behavior

### Doctor's Request:
- User UID matches `appointment.doctorUid`
- Response includes: `jitsiToken: "eyJhbGci..."` (413 chars)
- Response includes: `lobbyBypass: true`
- Response includes: `isModerator: true`

### Patient's Request:
- User UID matches `appointment.patientUid`
- Response includes: `jitsiToken: null`
- Response includes: `lobbyBypass: false`
- Response includes: `isModerator: false`

## Security Benefits

1. **Cannot fake doctor access** - Even if someone manipulates Firebase custom claims, they still need to be the actual doctor assigned to the appointment
2. **Database is source of truth** - Role is determined by actual appointment assignment, not token claims
3. **No role parameter needed** - Frontend doesn't need to send role, backend figures it out
4. **Prevents privilege escalation** - Patient cannot get doctor JWT even with modified token

✅ **Your system is now more secure and reliable!**
