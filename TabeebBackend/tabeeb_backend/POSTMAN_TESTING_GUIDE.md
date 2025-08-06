# TABEEB Appointment System - Complete Postman Testing Guide

## 🚀 Prerequisites

1. **Backend Server Running**: `http://localhost:5002`
2. **Firebase Authentication**: You'll need valid Firebase JWT tokens for testing
3. **Database**: MySQL database with proper schema and MongoDB for medical records
4. **Postman**: Latest version installed

## 📋 Base Configuration

### Environment Variables (Set in Postman)
- `base_url`: `http://localhost:5002`
- `auth_token`: `Bearer <your_firebase_jwt_token>`

## 🔐 Authentication Setup

### Getting Firebase JWT Token
1. Use your frontend to login a user
2. Extract the JWT token from the browser's localStorage or use Firebase Admin SDK
3. Add to Postman Authorization header: `Bearer <token>`

### User Roles
- **Doctor**: Can manage availability and appointments
- **Patient**: Can book and view appointments  
- **Admin**: Can manage users and view analytics

---

## 📋 API Testing Flow

### 🏥 1. Doctor Availability Management

#### 1.1 Set Doctor Availability
**POST** `{{base_url}}/api/availability/set`

**Headers:**
```
Authorization: Bearer <doctor_token>
Content-Type: application/json
```

**Body:**
```json
{
  "date": "2024-08-15",
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDuration": 30,
  "breakStartTime": "12:00",
  "breakEndTime": "13:00",
  "isAvailable": true
}
```

**Expected Response (201):**
```json
{
  "availability": {
    "id": "cm0abc123",
    "doctorUid": "doctor_uid_123",
    "date": "2024-08-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "17:00",
    "slotDuration": 30,
    "timeSlots": [...],
    "createdAt": "2024-08-05T12:00:00.000Z"
  },
  "message": "Availability set successfully",
  "slotsGenerated": 14
}
```

#### 1.2 Get Doctor Availability
**GET** `{{base_url}}/api/availability/doctor?date=2024-08-15`

**Headers:**
```
Authorization: Bearer <doctor_token>
```

**Expected Response (200):**
```json
[
  {
    "id": "cm0abc123",
    "date": "2024-08-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "17:00",
    "slotDuration": 30,
    "isAvailable": true,
    "timeSlots": [
      {
        "id": "slot_123",
        "startTime": "09:00",
        "endTime": "09:30",
        "isBooked": false
      }
    ]
  }
]
```

#### 1.3 Get Available Slots (Public - for patients)
**GET** `{{base_url}}/api/availability/slots/{{doctor_uid}}?date=2024-08-15`

**Headers:**
```
Authorization: Bearer <patient_token>
```

**Expected Response (200):**
```json
[
  {
    "id": "slot_123",
    "startTime": "09:00",
    "endTime": "09:30",
    "isBooked": false,
    "availabilityId": "cm0abc123"
  },
  {
    "id": "slot_124",
    "startTime": "09:30",
    "endTime": "10:00",
    "isBooked": false,
    "availabilityId": "cm0abc123"
  }
]
```

#### 1.4 Update Availability
**PUT** `{{base_url}}/api/availability/{{availability_id}}`

**Headers:**
```
Authorization: Bearer <doctor_token>
Content-Type: application/json
```

**Body:**
```json
{
  "date": "2025-08-15",
  "startTime": "10:00",
  "endTime": "16:00",
  "slotDuration": 45,
  "breakStartTime": "12:30",
  "breakEndTime": "13:30",
  "isAvailable": true
}
```

**Note:** Use the CUID format for `availability_id` (e.g., `cmdymt60b0001ufl8cfl0nzpv`)
**Note:** `breakStartTime` and `breakEndTime` are optional. If provided, time slots during break time will be excluded.

#### 1.5 Delete Availability
**DELETE** `{{base_url}}/api/availability/{{availability_id}}`

**Headers:**
```
Authorization: Bearer <doctor_token>
```

### 🩺 2. Appointment Management

#### 2.1 Book Appointment (Patient)
**POST** `{{base_url}}/api/appointments/book`

**Headers:**
```
Authorization: Bearer <patient_token>
Content-Type: application/json
```

**Body:**
```json
{
  "doctorUid": "doctor_firebase_uid",
  "timeSlotId": "slot_123",
  "appointmentDate": "2024-08-15",
  "patientNotes": "Having headache and fever since 2 days"
}
```

**Expected Response (201):**
```json
{
  "appointment": {
    "id": "appt_123",
    "doctorUid": "doctor_uid",
    "patientUid": "patient_uid",
    "appointmentDate": "2024-08-15T00:00:00.000Z",
    "appointmentTime": "09:00",
    "duration": 30,
    "status": "PENDING",
    "consultationFees": 500,
    "patientNotes": "Having headache and fever since 2 days",
    "doctor": {
      "name": "Dr. John Smith",
      "specialization": "General Medicine",
      "consultationFees": 500
    },
    "patient": {
      "name": "Jane Doe",
      "phone": "+1234567890",
      "email": "jane@example.com"
    }
  },
  "message": "Appointment booked successfully"
}
```

#### 2.2 Get Doctor Appointments
**GET** `{{base_url}}/api/appointments/doctor?status=PENDING&date=2024-08-15&page=1&limit=10`

**Headers:**
```
Authorization: Bearer <doctor_token>
```

**Query Parameters:**
- `status` (optional): PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- `date` (optional): YYYY-MM-DD
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Expected Response (200):**
```json
{
  "appointments": [
    {
      "id": "appt_123",
      "appointmentDate": "2024-08-15T00:00:00.000Z",
      "appointmentTime": "09:00",
      "status": "PENDING",
      "patient": {
        "name": "Jane Doe",
        "phone": "+1234567890",
        "email": "jane@example.com",
        "gender": "Female",
        "dob": "1990-01-01T00:00:00.000Z"
      },
      "patientNotes": "Having headache and fever since 2 days"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### 2.3 Get Patient Appointments
**GET** `{{base_url}}/api/appointments/patient?upcoming=true`

**Headers:**
```
Authorization: Bearer <patient_token>
```

**Query Parameters:**
- `status` (optional): Filter by status
- `upcoming` (optional): true for future appointments only

**Expected Response (200):**
```json
[
  {
    "id": "appt_123",
    "appointmentDate": "2024-08-15T00:00:00.000Z",
    "appointmentTime": "09:00",
    "status": "PENDING",
    "consultationFees": 500,
    "doctor": {
      "name": "Dr. John Smith",
      "specialization": "General Medicine",
      "phone": "+1234567890",
      "email": "doctor@example.com"
    },
    "patientNotes": "Having headache and fever since 2 days"
  }
]
```

#### 2.4 Update Appointment Status (Doctor Only)
**PATCH** `{{base_url}}/api/appointments/{{appointment_id}}/status`

**Headers:**
```
Authorization: Bearer <doctor_token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "CONFIRMED",
  "doctorNotes": "Patient consultation confirmed. Please arrive 10 minutes early.",
  "cancelReason": null
}
```

**Valid Status Values:**
- `PENDING` → `CONFIRMED`
- `CONFIRMED` → `IN_PROGRESS`
- `IN_PROGRESS` → `COMPLETED`
- Any status → `CANCELLED`

**Expected Response (200):**
```json
{
  "appointment": {
    "id": "appt_123",
    "status": "CONFIRMED",
    "doctorNotes": "Patient consultation confirmed. Please arrive 10 minutes early.",
    "updatedAt": "2024-08-05T12:30:00.000Z"
  },
  "message": "Appointment confirmed successfully"
}
```

#### 2.5 Cancel Appointment (Patient or Doctor)
**PATCH** `{{base_url}}/api/appointments/{{appointment_id}}/cancel`

**Headers:**
```
Authorization: Bearer <patient_or_doctor_token>
Content-Type: application/json
```

**Body:**
```json
{
  "cancelReason": "Emergency came up, need to reschedule"
}
```

**Expected Response (200):**
```json
{
  "appointment": {
    "id": "appt_123",
    "status": "CANCELLED",
    "cancelReason": "Emergency came up, need to reschedule",
    "updatedAt": "2024-08-05T12:45:00.000Z"
  },
  "message": "Appointment cancelled successfully"
}
```

#### 2.6 Get Appointment Details
**GET** `{{base_url}}/api/appointments/{{appointment_id}}`

**Headers:**
```
Authorization: Bearer <patient_or_doctor_token>
```

**Expected Response (200):**
```json
{
  "id": "appt_123",
  "appointmentDate": "2024-08-15T00:00:00.000Z",
  "appointmentTime": "09:00",
  "duration": 30,
  "status": "CONFIRMED",
  "patientNotes": "Having headache and fever since 2 days",
  "doctorNotes": "Patient consultation confirmed",
  "consultationFees": 500,
  "doctor": {
    "name": "Dr. John Smith",
    "specialization": "General Medicine",
    "qualification": "MBBS, MD",
    "phone": "+1234567890",
    "email": "doctor@example.com"
  },
  "patient": {
    "name": "Jane Doe",
    "phone": "+1234567890",
    "email": "jane@example.com",
    "gender": "Female",
    "dob": "1990-01-01T00:00:00.000Z",
    "medicalHistory": "No major medical history"
  },
  "timeSlot": {
    "startTime": "09:00",
    "endTime": "09:30"
  }
}
```

#### 2.7 Get Appointment Statistics
**GET** `{{base_url}}/api/appointments/stats/overview`

**Headers:**
```
Authorization: Bearer <patient_or_doctor_token>
```

**Expected Response (200):**
```json
{
  "total": 25,
  "today": 3,
  "upcoming": 8,
  "pending": 5,
  "completed": 15,
  "thisWeek": 7
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Doctor Flow
1. Doctor sets availability for next week
2. Doctor views their availability
3. Doctor updates availability times
4. Doctor views appointments for the day
5. Doctor confirms pending appointments
6. Doctor completes appointments

### Scenario 2: Complete Patient Flow
1. Patient searches for available slots for a specific doctor
2. Patient books an appointment
3. Patient views their upcoming appointments
4. Patient cancels an appointment if needed

### Scenario 3: Error Testing
1. Try booking with invalid date formats
2. Try booking past appointments
3. Try accessing appointments of other users
4. Try booking already booked slots
5. Test validation errors

---

## 🔍 Common Test Cases

### Authentication Tests
- **401 Unauthorized**: No token provided
- **403 Forbidden**: Wrong user role accessing restricted endpoint

### Validation Tests
- **400 Bad Request**: Invalid date formats, missing required fields
- **404 Not Found**: Non-existent appointment/availability IDs

### Business Logic Tests
- **Slot Booking**: Ensure slots become unavailable after booking
- **Cancellation**: Ensure slots become available after cancellation
- **Time Conflicts**: Cannot book overlapping appointments

---

## 📊 Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PATCH operations |
| 201 | Created | Successful POST operations |
| 400 | Bad Request | Validation errors, invalid data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side errors |

---

## 🐛 Debugging Tips

1. **Check Server Logs**: Monitor the terminal running `npm run dev`
2. **Verify Authentication**: Ensure Firebase tokens are valid and not expired
3. **Database State**: Check if the appointment/availability exists in the database
4. **Time Zones**: Ensure dates are in correct format (YYYY-MM-DD)
5. **ID Formats**: Use proper CUID format for IDs (e.g., `cmdymt60b0001ufl8cfl0nzpv`), not UUID format
6. **Date Validation**: Ensure dates are not in the past and within acceptable range

---

## 🔄 Postman Collection Structure

Create these folders in Postman:

```
TABEEB Appointment System/
├── Authentication/
├── Doctor Availability/
│   ├── Set Availability
│   ├── Get Availability
│   ├── Update Availability
│   └── Delete Availability
├── Appointments/
│   ├── Book Appointment
│   ├── Get Doctor Appointments
│   ├── Get Patient Appointments
│   ├── Update Status
│   ├── Cancel Appointment
│   ├── Get Details
│   └── Get Statistics
└── Error Cases/
    ├── Invalid Tokens
    ├── Validation Errors
    └── Business Logic Errors
```

This comprehensive guide should help you thoroughly test your appointment system! 🚀
