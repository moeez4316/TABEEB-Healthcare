# Prescription API Testing Guide

## Overview
This document provides comprehensive testing instructions for the TABEEB Prescription API endpoints. Use Postman, Insomnia, or any API client to test these endpoints.

## Base URL
```
http://localhost:3000/api/prescriptions
```

## Authentication
All endpoints require authentication. Include the Firebase JWT token in the Authorization header:
```
Authorization: Bearer <firebase-jwt-token>
```

### Getting Firebase Token for Testing

**Method 1: From Frontend App**
1. Login to TABEEB app (as doctor or patient)
2. Open browser DevTools → Network tab
3. Make any API call and copy the Authorization header token

**Method 2: Use Existing User Tokens**
1. Check your database for existing doctor/patient UIDs
2. Use Firebase Admin SDK to generate custom tokens
3. Exchange custom token for ID token using Firebase Auth

**Method 3: Quick Test Setup**
```bash
# Run the backend server first
cd TabeebBackend/tabeeb_backend
npm run dev

# Server should start on http://localhost:3000
```

## API Endpoints

### 1. Create Prescription
**Endpoint:** `POST /api/prescriptions/`
**Authorization:** Doctor only (verified through database)
**Description:** Create a new prescription
**Validation:** Includes medicine validation, duplicate checking, length limits

**Headers:**
```
Authorization: Bearer <firebase-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "patientUid": "patient-firebase-uid",
  "appointmentId": "appointment-id-optional",
  "diagnosis": "Common cold and fever",
  "notes": "Patient presented with symptoms of cold and mild fever",
  "instructions": "Take medications as prescribed and rest",
  "medicines": [
    {
      "medicineName": "Paracetamol",
      "dosage": "500mg",
      "frequency": "2 times daily",
      "duration": "5 days",
      "instructions": "Take after meals",
      "timing": "After meals"
    },
    {
      "medicineName": "Amoxicillin",
      "dosage": "250mg",
      "frequency": "3 times daily",
      "duration": "7 days",
      "instructions": "Complete the full course",
      "timing": "Before meals"
    }
  ]
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Prescription created successfully",
  "data": {
    "id": "prescription-id",
    "prescriptionId": "unique-prescription-id",
    "doctorUid": "doctor-uid",
    "patientUid": "patient-uid",
    "patientName": "John Doe",
    "patientAge": 30,
    "patientGender": "Male",
    "diagnosis": "Common cold and fever",
    "medicines": [...],
    "doctor": {...},
    "patient": {...},
    "appointment": {...}
  }
}
```

### 2. Get Doctor's Prescriptions
**Endpoint:** `GET /api/prescriptions/doctor`
**Authorization:** Doctor only
**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `isActive` (optional, default: 'true')

**Headers:**
```
Authorization: Bearer <firebase-jwt-token>
```

**Example:** `GET /api/prescriptions/doctor?page=1&limit=5&isActive=true`

**Expected Response (200):**
```json
{
  "success": true,
  "data": [...prescriptions],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 3. Get Patient's Prescriptions
**Endpoint:** `GET /api/prescriptions/patient`
**Authorization:** Patient only
**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Headers:**
```
Authorization: Bearer <firebase-jwt-token>
```

**Example:** `GET /api/prescriptions/patient?page=1&limit=10`

### 4. Get Prescription by ID
**Endpoint:** `GET /api/prescriptions/:prescriptionId`
**Authorization:** Doctor who created it OR Patient who received it
**Description:** Get detailed prescription information

**Headers:**
```
Authorization: Bearer <firebase-jwt-token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "prescription-id",
    "prescriptionId": "unique-prescription-id",
    "patientName": "John Doe",
    "patientAge": 30,
    "diagnosis": "Common cold",
    "medicines": [...],
    "doctor": {...},
    "patient": {...},
    "appointment": {...},
    "createdAt": "2024-10-09T10:30:00Z"
  }
}
```

### 5. Update Prescription
**Endpoint:** `PUT /api/prescriptions/:prescriptionId`
**Authorization:** Doctor who created it
**Description:** Update prescription details

**Headers:**
```
Authorization: Bearer <firebase-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "diagnosis": "Updated diagnosis",
  "notes": "Updated notes",
  "instructions": "Updated instructions",
  "medicines": [
    {
      "medicineName": "Updated Medicine",
      "dosage": "250mg",
      "frequency": "2 times daily",
      "duration": "7 days",
      "instructions": "Take with food",
      "timing": "With meals"
    }
  ]
}
```

### 6. Delete Prescription (Soft Delete)
**Endpoint:** `DELETE /api/prescriptions/:prescriptionId`
**Authorization:** Doctor who created it
**Description:** Mark prescription as inactive

**Headers:**
```
Authorization: Bearer <firebase-jwt-token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Prescription deleted successfully"
}
```

### 7. Get Prescription Statistics
**Endpoint:** `GET /api/prescriptions/doctor/stats`
**Authorization:** Doctor only
**Description:** Get prescription statistics for dashboard

**Headers:**
```
Authorization: Bearer <firebase-jwt-token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "totalPrescriptions": 45,
    "activePrescriptions": 40,
    "inactivePrescriptions": 5,
    "thisMonthPrescriptions": 12
  }
}
```

### 8. Get Appointment Prescriptions
**Endpoint:** `GET /api/prescriptions/appointment/:appointmentId`
**Authorization:** Doctor OR Patient involved in appointment
**Description:** Get all prescriptions for a specific appointment

**Headers:**
```
Authorization: Bearer <firebase-jwt-token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "prescription-id",
      "prescriptionId": "unique-id",
      "diagnosis": "Common cold",
      "medicines": [...],
      "doctor": {...},
      "createdAt": "2024-10-09T10:30:00Z"
    }
  ]
}
```

## Testing Scenarios

### Prerequisites for Testing
1. **Start Backend Server**: `npm run dev` in tabeeb_backend folder
2. **Database**: Ensure MySQL/database is running
3. **Firebase Token**: Get valid token for doctor/patient
4. **Existing Data**: Have at least one doctor and patient in database

### Scenario 1: Doctor Creates Prescription (RECOMMENDED START)
1. **Get Doctor Token** - Login as doctor, get Firebase JWT
2. **Find Patient UID** - Use existing patient or create one
3. **Create Prescription** - POST to `/api/prescriptions/`
4. **Verify Creation** - GET `/api/prescriptions/:prescriptionId`
5. **Check Doctor's List** - GET `/api/prescriptions/doctor`

**Sample Test Data:**
```json
{
  "patientUid": "your-patient-uid-here",
  "diagnosis": "Test prescription",
  "medicines": [
    {
      "medicineName": "Test Medicine",
      "dosage": "100mg",
      "frequency": "2 times daily",
      "duration": "3 days"
    }
  ]
}
```

### Scenario 2: Patient Views Prescriptions
1. **Login as Patient** - Get Firebase token
2. **Get Patient Prescriptions** - Use endpoint #4
3. **View Specific Prescription** - Use endpoint #5

### Scenario 3: Appointment-Based Prescription
1. **Create Appointment** (use appointment endpoints)
2. **Complete Appointment** - Mark as COMPLETED
3. **Create Prescription from Appointment** - Use endpoint #2
4. **View Appointment Prescriptions** - Use endpoint #9

### Scenario 4: Doctor Updates Prescription
1. **Create Prescription** - Use endpoint #1
2. **Update Prescription** - Use endpoint #6
3. **Verify Update** - Use endpoint #5

### Scenario 5: Authorization Testing
1. **No Token Test** - Remove Authorization header → Should get 401
2. **Invalid Token Test** - Use fake token → Should get 401  
3. **Wrong User Test** - Patient tries to create prescription → Should get 404 (Doctor not found)
4. **Cross-Access Test** - Doctor A tries to view Doctor B's prescription → Should get 404
5. **Invalid IDs Test** - Use non-existent prescription/appointment IDs → Should get 404

### Scenario 6: Validation Testing
1. **Missing Medicine Test** - Send empty medicines array → Should get 400
2. **Duplicate Medicine Test** - Send same medicine twice → Should get 400
3. **Long Text Test** - Send diagnosis > 500 chars → Should get 400
4. **Invalid Patient Test** - Use non-existent patientUid → Should get 404
5. **Missing Required Fields** - Omit medicineName, dosage, etc. → Should get 400

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["medicines", 0, "medicineName"],
      "message": "Medicine name is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Unauthorized: You can only view your own prescriptions"
}
```

### 404 Not Found
```json
{
  "error": "Prescription not found or access denied"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Failed to create prescription"
}
```

## Test Data Examples

### Sample Doctor UID
```
doctor-uid-12345
```

### Sample Patient UID
```
patient-uid-67890
```

### Sample Appointment ID
```
appointment-id-abc123
```

### Sample Prescription ID
```
prescription-uuid-def456
```

## Notes for Testing

### Critical Requirements
1. **Authentication Required** - All endpoints need valid Firebase tokens
2. **Database Validation** - Doctor/Patient must exist in database before testing
3. **Server Running** - Backend must be running on `http://localhost:3000`
4. **Appointment Integration** - Appointment must be COMPLETED for endpoint #2

### Testing Tips
5. **Start Simple** - Test basic CREATE first, then move to complex scenarios
6. **Check Database** - Verify records are actually created in database
7. **Pagination** - Test with different page sizes (limit 1-100)
8. **Authorization** - Each user can only see their own data
9. **Medicine Array** - Must have at least one medicine, max 10 medicines
10. **Date Handling** - All timestamps are in UTC format

### Common Issues
- **401 Errors**: Check if Firebase token is valid and not expired
- **404 Errors**: Ensure UIDs exist in database (doctor/patient/appointment)
- **400 Errors**: Check request body format and required fields
- **500 Errors**: Check server logs for database connection issues

### Quick Debug Steps
1. Check server logs for detailed error messages
2. Verify database contains required doctor/patient records
3. Test with Postman's "Console" tab for request/response details
4. Use simple requests first (GET endpoints) before POST/PUT

## Postman Setup

### Environment Variables
Create a new environment in Postman with these variables:
```
base_url: http://localhost:3000/api/prescriptions
firebase_token: your-firebase-jwt-token-here
doctor_uid: existing-doctor-uid-from-database
patient_uid: existing-patient-uid-from-database
appointment_id: completed-appointment-id
prescription_id: created-prescription-id (will be set after first CREATE)
```

### Quick Start Collection
Import this collection for immediate testing:
```json
{
  "info": {
    "name": "TABEEB Prescription API",
    "description": "Complete prescription management endpoints with validation"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{firebase_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api/prescriptions"
    },
    {
      "key": "firebase_token",
      "value": ""
    }
  ]
}
```

### Testing Checklist
- [ ] Server running on localhost:3000
- [ ] Firebase token obtained and set in environment
- [ ] Doctor exists in database
- [ ] Patient exists in database
- [ ] Basic CREATE prescription works
- [ ] GET endpoints return data
- [ ] UPDATE prescription works
- [ ] Authorization testing (401/403 errors)
- [ ] Validation testing (400 errors)
- [ ] Appointment integration tested