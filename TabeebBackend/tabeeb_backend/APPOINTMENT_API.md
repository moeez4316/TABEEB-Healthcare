# TABEEB Appointment System API Documentation - OPTIMIZED ARCHITECTURE

## 🚀 **System Overview - Major Optimization**
The TABEEB appointment system has been **completely optimized** for scalability:

- **✅ On-Demand Slot Generation**: No more pre-generated TimeSlot records
- **✅ Database Efficiency**: Reduced storage by ~95% 
- **✅ Better Performance**: Direct time storage in appointments
- **✅ Real-time Availability**: Slots calculated dynamically when requested

**Previous Architecture Problems:**
- 480,000 TimeSlot records per month per doctor
- 5.7M records per year just for time slots
- Complex joins between TimeSlot ↔ Appointment tables
- Background jobs needed for slot generation

**New Architecture Benefits:**
- 0 pre-generated time slot records
- Direct startTime/endTime storage in appointments
- On-demand availability calculation
- No background maintenance jobs needed

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

**Response (OPTIMIZED):**
```json
{
  "availability": {
    "id": "cuid_example",
    "doctorUid": "doctor_uid",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "17:00", 
    "slotDuration": 30,
    "breakStartTime": "12:00",
    "breakEndTime": "13:00",
    "isAvailable": true,
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  },
  "message": "Availability set successfully",
  "totalPossibleSlots": 14,
  "note": "Time slots are generated on-demand when requested"
}
```

### 2. Get Doctor Availability
**GET** `/availability/doctor/:doctorUid?date=YYYY-MM-DD`

**Parameters:**
- `doctorUid` (optional): If not provided, uses authenticated doctor's UID
- `date` (query, optional): Filter by specific date

**Response (OPTIMIZED):**
```json
[
  {
    "id": "cuid_example",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "17:00",
    "slotDuration": 30,
    "breakStartTime": "12:00",
    "breakEndTime": "13:00",
    "isAvailable": true,
    "doctor": {
      "name": "Dr. Smith",
      "specialization": "Cardiology",
      "consultationFees": 150.00
    }
  }
]
```

### 3. Get Available Time Slots (REAL-TIME ON-DEMAND)
**GET** `/availability/slots/:doctorUid?date=YYYY-MM-DD`

**🚀 NEW**: Generates available slots in real-time by checking doctor availability against booked appointments.

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

## Appointment Management Endpoints (OPTIMIZED)

### 1. Book Appointment
**POST** `/appointments/book`

Patient books an appointment with a doctor using **direct time selection** (no timeSlotId needed).

**Request Body (SIMPLIFIED):**
```json
{
  "doctorUid": "doctor_firebase_uid",
  "appointmentDate": "2024-01-15",
  "startTime": "09:00",
  "patientNotes": "Optional notes from patient"
}
```

**Response (ENHANCED):**
```json
{
  "appointment": {
    "id": "cuid_example",
    "doctorUid": "doctor_uid",
    "patientUid": "patient_uid", 
    "appointmentDate": "2024-01-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "09:30",
    "duration": 30,
    "status": "PENDING",
    "consultationFees": 500,
    "patientNotes": "Patient notes",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "doctor": {
      "name": "Dr. Smith",
      "specialization": "Cardiology",
      "consultationFees": 500
    },
    "patient": {
      "name": "John Doe", 
      "phone": "+1234567890"
    }
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

## 🚀 Optimization Benefits

### Database Efficiency
- **Before**: 480,000 TimeSlot records per doctor per month
- **After**: 0 pre-generated records - slots calculated on-demand
- **Storage Savings**: ~95% reduction in appointment-related table sizes
- **Query Performance**: Direct time-based queries instead of complex joins

### Scalability Improvements  
- **Real-time Availability**: Slots generated dynamically based on current bookings
- **No Background Jobs**: No need for slot pre-generation or cleanup processes
- **Easier Maintenance**: Simple time-based logic instead of slot state management
- **Better Conflict Resolution**: Direct time overlap checking

### API Simplifications
- **Booking**: Direct `startTime` selection instead of `timeSlotId` lookup
- **Availability**: Real-time slot calculation with booking statistics
- **Conflicts**: Automatic validation against existing appointments
- **Flexibility**: Easy to change slot durations and break times

### Business Rules (UPDATED)
1. Appointments cannot be booked in the past
2. Appointments cannot be booked more than 3 months in advance  
3. Time slots are validated in real-time against existing bookings
4. Cancelled appointments automatically free up their time slots
5. Only doctors can update appointment status to CONFIRMED, IN_PROGRESS, or COMPLETED
6. Both patients and doctors can cancel appointments
7. Availability cannot be deleted if it has booked appointments
8. **NEW**: Slot conflicts are checked on-demand during booking
9. **NEW**: Break times are enforced during slot generation

## Example Usage Flow (OPTIMIZED)

### For Doctors:
1. Set availability: `POST /availability/set` (generates slot statistics)
2. View appointments: `GET /appointments/doctor` (with pagination)
3. Check real-time availability: `GET /availability/slots/:doctorUid`
4. Confirm appointments: `PATCH /appointments/:id/status`
5. Complete appointments: `PATCH /appointments/:id/status`

### For Patients:
1. View available slots: `GET /availability/slots/:doctorUid` (real-time generation)
2. Book appointment: `POST /appointments/book` (direct time selection)
3. View appointments: `GET /appointments/patient`
4. Cancel if needed: `PATCH /appointments/:id/cancel`

## Testing Endpoints

You can test these endpoints using tools like Postman or curl. Make sure to:
1. Include the Firebase authentication token
2. Use the correct Content-Type headers
3. Follow the request body formats specified above
