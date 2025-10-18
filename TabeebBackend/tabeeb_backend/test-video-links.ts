import dotenv from 'dotenv';
import { 
  generateDoctorMeetingLink, 
  generatePatientMeetingLink 
} from './src/services/videoCallService';

dotenv.config();

console.log('\n🔗 VIDEO CALL LINKS - DOCTOR vs PATIENT\n');
console.log('='.repeat(100));

// Test data
const testAppointmentId = 'appt_12345';
const doctorName = 'Dr. Sarah Johnson';
const doctorEmail = 'sarah.johnson@hospital.com';
const patientName = 'John Smith';

// Generate links
const doctorLink = generateDoctorMeetingLink({
  appointmentId: testAppointmentId,
  userName: doctorName,
  userEmail: doctorEmail,
});

const patientLink = generatePatientMeetingLink(testAppointmentId, patientName);

// Display in table format
console.log('\n┌─────────────────────────────────────────────────────────────────────────────────────────────┐');
console.log('│                                    DOCTOR VIDEO LINK                                        │');
console.log('├─────────────────────────────────────────────────────────────────────────────────────────────┤');
console.log('│ 🩺 Role: DOCTOR (Moderator)                                                                │');
console.log('│ 👤 Name: Dr. Sarah Johnson                                                                 │');
console.log('│ 🔐 Auth: JWT Token (with moderator + lobby_bypass)                                         │');
console.log('│ 🚪 Lobby: BYPASS (enters directly)                                                         │');
console.log('│ 🔇 Starts: Muted (mic + camera)                                                            │');
console.log('├─────────────────────────────────────────────────────────────────────────────────────────────┤');
console.log('│ 🔗 LINK:                                                                                    │');
console.log(`│ ${doctorLink.substring(0, 93)}│`);

// Split long URL into multiple lines if needed
if (doctorLink.length > 93) {
  const remainingDoctor = doctorLink.substring(93);
  const chunkSize = 93;
  for (let i = 0; i < remainingDoctor.length; i += chunkSize) {
    const chunk = remainingDoctor.substring(i, i + chunkSize);
    console.log(`│ ${chunk.padEnd(93)}│`);
  }
}

console.log('└─────────────────────────────────────────────────────────────────────────────────────────────┘');

console.log('\n┌─────────────────────────────────────────────────────────────────────────────────────────────┐');
console.log('│                                   PATIENT VIDEO LINK                                        │');
console.log('├─────────────────────────────────────────────────────────────────────────────────────────────┤');
console.log('│ 🤒 Role: PATIENT (Participant)                                                             │');
console.log('│ 👤 Name: John Smith                                                                        │');
console.log('│ 🔐 Auth: NO TOKEN (simple URL)                                                             │');
console.log('│ ⏳ Lobby: WAITS (must be admitted by doctor)                                                │');
console.log('│ 🔇 Starts: Muted (mic + camera)                                                            │');
console.log('├─────────────────────────────────────────────────────────────────────────────────────────────┤');
console.log('│ 🔗 LINK:                                                                                    │');
console.log(`│ ${patientLink.padEnd(93)}│`);
console.log('└─────────────────────────────────────────────────────────────────────────────────────────────┘');

console.log('\n📊 LINK ANALYSIS\n');
console.log('='.repeat(100));

// Analyze URLs
const doctorUrl = new URL(doctorLink);
const patientUrl = new URL(patientLink);

console.log('\n🩺 DOCTOR LINK COMPONENTS:');
console.log('─'.repeat(100));
console.log(`   Domain:        ${doctorUrl.hostname}`);
console.log(`   Room:          ${doctorUrl.pathname}`);
console.log(`   Has JWT:       ✅ YES`);
console.log(`   JWT Length:    ${doctorUrl.searchParams.get('jwt')?.length || 0} characters`);
console.log(`   Audio Muted:   ${doctorUrl.searchParams.get('config.startWithAudioMuted') === 'true' ? '✅ YES' : '❌ NO'}`);
console.log(`   Video Muted:   ${doctorUrl.searchParams.get('config.startWithVideoMuted') === 'true' ? '✅ YES' : '❌ NO'}`);
console.log(`   Display Name:  From JWT context (${doctorName})`);

console.log('\n🤒 PATIENT LINK COMPONENTS:');
console.log('─'.repeat(100));
console.log(`   Domain:        ${patientUrl.hostname}`);
console.log(`   Room:          ${patientUrl.pathname}`);
console.log(`   Has JWT:       ❌ NO`);
console.log(`   Audio Muted:   ${patientUrl.searchParams.get('config.startWithAudioMuted') === 'true' ? '✅ YES' : '❌ NO'}`);
console.log(`   Video Muted:   ${patientUrl.searchParams.get('config.startWithVideoMuted') === 'true' ? '✅ YES' : '❌ NO'}`);
console.log(`   Display Name:  ${patientUrl.searchParams.get('userInfo.displayName')} (URL parameter)`);

console.log('\n📋 COMPARISON TABLE\n');
console.log('='.repeat(100));

const table = `
┌──────────────────────┬─────────────────────────────┬─────────────────────────────┐
│ Component            │ Doctor                      │ Patient                     │
├──────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Same Domain          │ ✅ cloud.sehat.dpdns.org    │ ✅ cloud.sehat.dpdns.org    │
│ Same Room            │ ✅ ${doctorUrl.pathname.substring(0, 18).padEnd(24)}│ ✅ ${patientUrl.pathname.substring(0, 18).padEnd(24)}│
│ JWT Token            │ ✅ YES (${String(doctorUrl.searchParams.get('jwt')?.length).padEnd(3)} chars)        │ ❌ NO                        │
│ Audio Muted          │ ✅ YES                      │ ✅ YES                      │
│ Video Muted          │ ✅ YES                      │ ✅ YES                      │
│ Lobby Behavior       │ 🚪 Bypass (direct entry)    │ ⏳ Wait (needs admission)   │
│ Can Admit Others     │ ✅ YES (moderator)          │ ❌ NO                        │
│ Display Name Source  │ JWT context                 │ URL parameter               │
└──────────────────────┴─────────────────────────────┴─────────────────────────────┘
`;

console.log(table);

console.log('\n🎯 HOW TO USE THESE LINKS\n');
console.log('='.repeat(100));

console.log('\n🩺 FOR DOCTOR:');
console.log('   1. Copy the doctor link above');
console.log('   2. Open in browser');
console.log('   3. Allow camera/microphone access');
console.log('   4. You\'ll enter the room DIRECTLY (no lobby wait)');
console.log('   5. When patient joins, you\'ll see a notification');
console.log('   6. Click "Admit" to let patient into the room');

console.log('\n🤒 FOR PATIENT:');
console.log('   1. Copy the patient link above');
console.log('   2. Open in browser');
console.log('   3. Allow camera/microphone access');
console.log('   4. You\'ll be placed in LOBBY (waiting room)');
console.log('   5. Wait for doctor to admit you');
console.log('   6. Once admitted, you\'ll enter the consultation room');

console.log('\n💡 TIP: Open both links in DIFFERENT browsers or incognito windows to test!\n');
console.log('='.repeat(100));

// Save links to a file for easy access
const fs = require('fs');
const linksOutput = `
VIDEO CALL LINKS - GENERATED ON ${new Date().toLocaleString()}
========================================================================

🩺 DOCTOR LINK:
${doctorLink}

🤒 PATIENT LINK:
${patientLink}

📝 NOTES:
- Doctor enters directly (has JWT token with moderator + lobby_bypass)
- Patient waits in lobby (no JWT token)
- Both start with microphone and camera muted
- Same room: ${doctorUrl.pathname}
- Domain: ${doctorUrl.hostname}

========================================================================
`;

fs.writeFileSync('VIDEO_LINKS.txt', linksOutput);
console.log('\n✅ Links saved to: VIDEO_LINKS.txt\n');
