# TABEEB Backend - Complete System Flow Documentation

## 🏗️ System Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   Databases     │
│   (Next.js)     │◄──►│   (Express.js)   │◄──►│ MySQL + MongoDB │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Firebase Auth  │
                       │   (JWT Tokens)   │
                       └──────────────────┘
```

## 📁 Backend Directory Structure

```
src/
├── config/
│   ├── db.ts              # MongoDB connection
│   └── firebase.ts        # Firebase admin configuration
├── controllers/           # Business logic handlers
│   ├── appointmentController.ts    # Appointment CRUD operations
│   ├── availabilityController.ts  # Doctor availability management
│   ├── doctorController.ts        # Doctor profile management
│   ├── patientController.ts       # Patient profile management
│   ├── adminController.ts         # Admin operations
│   ├── userController.ts          # User authentication
│   ├── medicalRecordController.ts # Medical records (MongoDB)
│   └── verificationController.ts  # Doctor verification
├── middleware/            # Request processing middleware
│   ├── verifyToken.ts             # JWT authentication
│   ├── appointmentValidation.ts   # Appointment data validation
│   └── adminAuth.ts               # Admin role authorization
├── routes/                # API endpoint definitions
│   ├── appointmentRoutes.ts       # /api/appointments/*
│   ├── availabilityRoutes.ts      # /api/availability/*
│   ├── doctorRoutes.ts            # /api/doctor/*
│   ├── patientRoutes.ts           # /api/patient/*
│   ├── adminRoutes.ts             # /api/admin/*
│   ├── userRoutes.ts              # /api/user/*
│   ├── medicalRecords.ts          # /api/records/*
│   └── verificationRoutes.ts      # /api/verification/*
├── lib/
│   └── prisma.ts          # Prisma client instance
├── models/
│   └── MedicalRecord.ts   # MongoDB schema (Mongoose)
├── services/
│   └── uploadService.ts   # Cloudinary file uploads
├── utils/
│   └── timeSlotGenerator.ts       # Time slot utility functions
├── types/
│   └── express/           # TypeScript type extensions
└── index.ts               # Application entry point
```

## 🗄️ Database Architecture

### MySQL (Prisma) - Structured Data
```sql
-- Users and Authentication
User (uid, role)
Doctor (uid, name, email, specialization, fees, ...)
Patient (uid, name, email, dob, gender, ...)
Verification (doctorUid, isVerified, status, ...)

-- Appointment System
DoctorAvailability (id, doctorUid, date, startTime, endTime, ...)
TimeSlot (id, availabilityId, startTime, endTime, isBooked)
Appointment (id, doctorUid, patientUid, timeSlotId, status, ...)
```

### MongoDB (Mongoose) - Medical Records
```javascript
MedicalRecord {
  patientUid: String,
  doctorUid: String,
  title: String,
  description: String,
  fileUrl: String,        // Cloudinary URL
  uploadDate: Date,
  fileType: String
}
```

## 🔄 Complete Backend Flow

### 1. 🚀 Application Startup Flow

```mermaid
graph TD
    A[npm run dev] --> B[Load Environment Variables]
    B --> C[Initialize Express App]
    C --> D[Connect to MongoDB]
    D --> E[Setup Middleware]
    E --> F[Setup Routes]
    F --> G[Start Server on Port 5002]
    G --> H[Ready to Accept Requests]
```

**Code Path:** `src/index.ts`
1. Load environment variables from `.env`
2. Initialize Express application
3. Connect to MongoDB using Mongoose
4. Setup CORS and JSON parsing middleware
5. Register API routes
6. Start server on port 5002

### 2. 🔐 Authentication Flow

```mermaid
graph TD
    A[Client Request] --> B{Has Authorization Header?}
    B -->|No| C[Return 401 Unauthorized]
    B -->|Yes| D[Extract JWT Token]
    D --> E[Verify with Firebase Admin]
    E -->|Invalid| F[Return 401 Unauthorized]
    E -->|Valid| G[Extract User Info]
    G --> H[Attach to req.user]
    H --> I[Continue to Route Handler]
```

**Code Path:** `src/middleware/verifyToken.ts`
1. Extract JWT token from Authorization header
2. Verify token using Firebase Admin SDK
3. Extract user UID and role from token
4. Attach user info to request object
5. Continue to next middleware/controller

### 3. 🏥 Doctor Availability Management Flow

#### Setting Availability
```mermaid
graph TD
    A[Doctor Sets Availability] --> B[Validate Request Data]
    B --> C{Availability Exists for Date?}
    C -->|Yes| D[Update Existing Availability]
    C -->|No| E[Create New Availability]
    D --> F[Delete Old Time Slots]
    E --> F
    F --> G[Generate New Time Slots]
    G --> H[Save to Database]
    H --> I[Return Availability + Slots]
```

**Code Path:** `src/controllers/availabilityController.ts`
1. **Validation**: Check date, time format, slot duration
2. **Business Logic**: Check for existing availability
3. **Time Slot Generation**: Create slots with break times
4. **Database Operations**: Save availability and time slots
5. **Response**: Return created availability with slot count

#### Getting Available Slots
```mermaid
graph TD
    A[Patient Requests Slots] --> B[Find Doctor Availability]
    B --> C[Filter Available Time Slots]
    C --> D[Return Non-Booked Slots]
```

### 4. 📅 Appointment Booking Flow

```mermaid
graph TD
    A[Patient Books Appointment] --> B[Validate Request]
    B --> C[Verify Time Slot Exists]
    C --> D{Is Slot Available?}
    D -->|No| E[Return Error: Slot Booked]
    D -->|Yes| F[Start Database Transaction]
    F --> G[Create Appointment Record]
    G --> H[Mark Time Slot as Booked]
    H --> I[Commit Transaction]
    I --> J[Return Appointment Details]
```

**Code Path:** `src/controllers/appointmentController.ts`
1. **Validation**: Check required fields, date format
2. **Availability Check**: Verify slot exists and is not booked
3. **Transaction**: Atomically create appointment and mark slot
4. **Response**: Return complete appointment with doctor/patient info

### 5. 📊 Appointment Management Flow

#### Doctor Views Appointments
```mermaid
graph TD
    A[Doctor Requests Appointments] --> B[Extract Query Parameters]
    B --> C[Build Database Query]
    C --> D[Apply Filters: status, date]
    D --> E[Apply Pagination]
    E --> F[Execute Query]
    F --> G[Return Appointments + Pagination]
```

#### Status Updates
```mermaid
graph TD
    A[Doctor Updates Status] --> B[Validate New Status]
    B --> C[Check Ownership]
    C --> D[Update Appointment]
    D --> E{Status = CANCELLED?}
    E -->|Yes| F[Free Time Slot]
    E -->|No| G[Return Updated Appointment]
    F --> G
```

### 6. 🏥 Medical Records Flow (MongoDB)

```mermaid
graph TD
    A[Upload Medical Record] --> B[Upload File to Cloudinary]
    B --> C[Get Cloudinary URL]
    C --> D[Save Record to MongoDB]
    D --> E[Return Record Details]
```

**Code Path:** `src/controllers/medicalRecordController.ts`
1. **File Upload**: Upload to Cloudinary storage
2. **Database Save**: Store metadata in MongoDB
3. **Response**: Return record with file URL

### 7. ✅ Doctor Verification Flow

```mermaid
graph TD
    A[Doctor Submits Documents] --> B[Upload to Cloudinary]
    B --> C[Save Verification Record]
    C --> D[Set Status: PENDING]
    D --> E[Admin Reviews]
    E --> F{Admin Decision}
    F -->|Approve| G[Set Status: APPROVED]
    F -->|Reject| H[Set Status: REJECTED + Reason]
    G --> I[Doctor Can Accept Appointments]
    H --> J[Doctor Must Resubmit]
```

## 🛣️ API Route Structure

### Core Routes
```
/api/user/*           - User authentication and profile
/api/doctor/*         - Doctor profile management
/api/patient/*        - Patient profile management
/api/admin/*          - Admin operations
/api/verification/*   - Doctor verification process
/api/records/*        - Medical records (MongoDB)
/api/appointments/*   - Appointment management (MySQL)
/api/availability/*   - Doctor availability (MySQL)
```

### Appointment System Routes
```
POST   /api/availability/set                    # Doctor sets availability
GET    /api/availability/doctor/:doctorUid      # Get doctor availability
GET    /api/availability/slots/:doctorUid       # Get available slots
PUT    /api/availability/:id                    # Update availability
DELETE /api/availability/:id                    # Delete availability

POST   /api/appointments/book                   # Patient books appointment
GET    /api/appointments/doctor                 # Doctor's appointments
GET    /api/appointments/patient                # Patient's appointments
PATCH  /api/appointments/:id/status             # Update appointment status
PATCH  /api/appointments/:id/cancel             # Cancel appointment
GET    /api/appointments/:id                    # Get appointment details
GET    /api/appointments/stats/overview         # Dashboard statistics
```

## 🔐 Security & Authorization

### Role-Based Access Control
```typescript
// Different user roles have different permissions
Doctor: {
  - Manage own availability
  - View/update own appointments
  - Access patient details for appointments
  - Update appointment status
}

Patient: {
  - View available doctor slots
  - Book appointments
  - View own appointments
  - Cancel own appointments
}

Admin: {
  - Verify doctors
  - View system analytics
  - Manage user accounts
}
```

### Data Protection
- **JWT Authentication**: Firebase-based token verification
- **Data Validation**: Comprehensive input validation middleware
- **Database Security**: Prisma ORM for SQL injection prevention
- **File Security**: Cloudinary for secure file storage

## 📈 Performance Optimizations

### Database Indexing
```sql
-- MySQL indexes for fast queries
INDEX (doctorUid) ON appointments
INDEX (patientUid) ON appointments
INDEX (appointmentDate) ON appointments
INDEX (status) ON appointments
INDEX (doctorUid, date) ON doctor_availability
```

### Query Optimization
- **Pagination**: Limit large result sets
- **Selective Joins**: Only include needed related data
- **Database Transactions**: Ensure data consistency

## 🔄 Error Handling Strategy

### HTTP Status Codes
- **200**: Successful GET/PATCH operations
- **201**: Successful resource creation
- **400**: Client errors (validation, bad request)
- **401**: Authentication required
- **403**: Insufficient permissions
- **404**: Resource not found
- **500**: Server errors

### Error Response Format
```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-08-05T12:00:00.000Z"
}
```

## 🚀 Deployment Considerations

### Environment Variables
```env
DATABASE_URL="mysql://user:password@localhost:3306/tabeeb_db"
MONGODB_URI="mongodb://localhost:27017/tabeeb_medical_records"
FIREBASE_PROJECT_ID="your-project-id"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
PORT=5002
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Firebase service account configured
- [ ] Cloudinary credentials set
- [ ] CORS configured for production domains
- [ ] Error logging implemented
- [ ] Health check endpoints added

This comprehensive backend flow documentation should give you a complete understanding of how the TABEEB appointment system works! 🏥✨
