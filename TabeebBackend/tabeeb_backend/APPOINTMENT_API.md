# TABEEB Appointment System API Documentation

## Overview
The TABEEB appointment system provides comprehensive functionality for managing doctor availability and patient appointments. This system uses MySQL for structured appointment data and maintains the existing MongoDB system for medical records.

## Base URL
```
http://localhost:5002/api
```

## Authentication
All endpoints require authentication via Firebase JWT token in the Authorization header:
```
Authorization: Bearer <firebase_jwt_token>
```

## Availability Management Endpoints

### 1. Set Doctor Availability
**POST** `/availability/set`

Sets availability slots for a doctor on a specific date.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDuration": 30,
  "breakStartTime": "12:00",
  "breakEndTime": "13:00",
  "isAvailable": true
}
```

**Response:**
```json
{
  "availability": {
    "id": "uuid",
    "doctorUid": "doctor_uid",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "17:00",
    "slotDuration": 30,
    "timeSlots": [...]
  },
  "message": "Availability set successfully",
  "slotsGenerated": 14
}
```

### 2. Get Doctor Availability
**GET** `/availability/doctor/:doctorUid?date=YYYY-MM-DD`

**Parameters:**
- `doctorUid` (optional): If not provided, uses authenticated doctor's UID
- `date` (query, optional): Filter by specific date

**Response:**
```json
[
  {
    "id": "uuid",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "17:00",
    "slotDuration": 30,
    "isAvailable": true,
    "timeSlots": [...]
  }
]
```

### 3. Get Available Time Slots
**GET** `/availability/slots/:doctorUid?date=YYYY-MM-DD`

Get available (non-booked) time slots for a specific doctor and date.

**Response:**
```json
[
  {
    "id": "slot_uuid",
    "startTime": "09:00",
    "endTime": "09:30",
    "isBooked": false,
    "availabilityId": "availability_uuid"
  }
]
```

### 4. Update Availability
**PUT** `/availability/:id`

Update existing availability settings.

### 5. Delete Availability
**DELETE** `/availability/:id`

Delete availability (only if no booked appointments exist).

### 6. Get Weekly Schedule
**GET** `/availability/schedule/:doctorUid?week=YYYY-MM-DD`

Get a weekly view of doctor's schedule.

## Appointment Management Endpoints

### 1. Book Appointment
**POST** `/appointments/book`

Patient books an appointment with a doctor.

**Request Body:**
```json
{
  "doctorUid": "doctor_firebase_uid",
  "timeSlotId": "time_slot_uuid",
  "appointmentDate": "2024-01-15",
  "patientNotes": "Optional notes from patient"
}
```

**Response:**
```json
{
  "appointment": {
    "id": "uuid",
    "doctorUid": "doctor_uid",
    "patientUid": "patient_uid",
    "appointmentDate": "2024-01-15T00:00:00.000Z",
    "appointmentTime": "09:00",
    "duration": 30,
    "status": "PENDING",
    "consultationFees": 500,
    "doctor": {...},
    "patient": {...}
  },
  "message": "Appointment booked successfully"
}
```

### 2. Get Doctor Appointments
**GET** `/appointments/doctor?status=PENDING&date=2024-01-15&page=1&limit=10`

Get appointments for the authenticated doctor.

**Query Parameters:**
- `status` (optional): Filter by appointment status
- `date` (optional): Filter by specific date
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:**
```json
{
  "appointments": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 3. Get Patient Appointments
**GET** `/appointments/patient?status=PENDING&upcoming=true`

Get appointments for the authenticated patient.

**Query Parameters:**
- `status` (optional): Filter by appointment status
- `upcoming` (optional): If true, only return future appointments

### 4. Update Appointment Status
**PATCH** `/appointments/:id/status`

Doctor updates appointment status.

**Request Body:**
```json
{
  "status": "CONFIRMED",
  "doctorNotes": "Optional notes from doctor",
  "cancelReason": "Required if status is CANCELLED"
}
```

**Valid Statuses:**
- `PENDING`: Initial status when booked
- `CONFIRMED`: Doctor confirmed the appointment
- `IN_PROGRESS`: Appointment is currently happening
- `COMPLETED`: Appointment finished successfully
- `CANCELLED`: Appointment was cancelled

### 5. Cancel Appointment
**PATCH** `/appointments/:id/cancel`

Cancel an appointment (available to both patient and doctor).

**Request Body:**
```json
{
  "cancelReason": "Reason for cancellation"
}
```

### 6. Get Appointment Details
**GET** `/appointments/:id`

Get detailed information about a specific appointment.

### 7. Get Appointment Statistics
**GET** `/appointments/stats/overview`

Get appointment statistics for dashboard.

**Response:**
```json
{
  "total": 125,
  "today": 5,
  "upcoming": 15,
  "pending": 8,
  "completed": 100,
  "thisWeek": 12
}
```

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "error": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error message"
}
```

## Data Models

### Appointment Status Flow
```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
    ↓         ↓           ↓
CANCELLED  CANCELLED   CANCELLED
```

### Time Slot Duration Options
- Minimum: 15 minutes
- Maximum: 180 minutes (3 hours)
- Common options: 15, 30, 45, 60 minutes

### Business Rules
1. Appointments cannot be booked in the past
2. Appointments cannot be booked more than 3 months in advance
3. Time slots become unavailable once booked
4. Cancelled appointments free up their time slots
5. Only doctors can update appointment status to CONFIRMED, IN_PROGRESS, or COMPLETED
6. Both patients and doctors can cancel appointments
7. Availability cannot be deleted if it has booked appointments

## Example Usage Flow

### For Doctors:
1. Set availability: `POST /availability/set`
2. View appointments: `GET /appointments/doctor`
3. Confirm appointments: `PATCH /appointments/:id/status`
4. Complete appointments: `PATCH /appointments/:id/status`

### For Patients:
1. View available slots: `GET /availability/slots/:doctorUid`
2. Book appointment: `POST /appointments/book`
3. View appointments: `GET /appointments/patient`
4. Cancel if needed: `PATCH /appointments/:id/cancel`

## Testing Endpoints

You can test these endpoints using tools like Postman or curl. Make sure to:
1. Include the Firebase authentication token
2. Use the correct Content-Type headers
3. Follow the request body formats specified above
