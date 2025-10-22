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

## 🚀 **MAJOR OPTIMIZATION - On-Demand Slot Generation**

**✅ Scalability Improvement:**
- **Before**: Pre-generated 5.7M TimeSlot records per year (480K/month)
- **After**: 0 pre-generated slots - all generated on-demand
- **Database Size Reduction**: ~95% smaller appointment system tables
- **Performance**: Faster queries, no background slot generation jobs needed

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
│   └── slotGenerator.ts           # On-demand slot generation utilities (OPTIMIZED)
├── types/
│   └── express/           # TypeScript type extensions
└── index.ts               # Application entry point
```

## 🗄️ Database Architecture

### MySQL (Prisma) - Structured Data (OPTIMIZED)
```sql
-- Users and Authentication
User (uid, role)
Doctor (uid, name, email, specialization, fees, ...)
Patient (uid, name, email, dob, gender, ...)
Verification (doctorUid, isVerified, status, documents, ...)

-- Admin System
Admin (id, email, password)

-- Optimized Appointment System (No TimeSlot table!)
DoctorAvailability (id, doctorUid, date, startTime, endTime, slotDuration, ...)
Appointment (id, doctorUid, patientUid, appointmentDate, startTime, endTime, ...)
BreakTime (id, availabilityId, startTime, endTime)
Prescription (id, appointmentId, doctorUid, patientUid, medications, ...)
-- ❌ TimeSlot table REMOVED for scalability
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

### 2.1 🔐 Admin Authentication Flow

```mermaid
graph TD
    A[Admin Login Request] --> B[Validate Credentials]
    B --> C{Credentials Valid?}
    C -->|No| D[Return 401 Invalid Credentials]
    C -->|Yes| E[Generate JWT Token]
    E --> F[Return Token + Admin Info]
    F --> G[Client Stores Token]
    G --> H[Include Token in Requests]
    H --> I[Backend Verifies Admin Token]
```

**Code Path:** `src/controllers/adminController.ts` + `src/middleware/adminAuth.ts`
1. Admin submits email/password via `/api/admin/login`
2. Backend validates credentials against Admin table (bcrypt password comparison)
3. Generate JWT token with admin identifier
4. Return token to frontend
5. Frontend includes token in Authorization header for protected admin routes
6. `authenticateAdminFromHeaders` middleware verifies token on each request
7. Admin can access verification approvals, dashboard stats, etc.

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

**Code Path:** `src/controllers/verificationController.ts` + `src/controllers/adminController.ts`
1. **Doctor Submission**: Doctor uploads verification documents (license, certificates)
2. **File Storage**: Documents uploaded to Cloudinary, URLs saved in Verification table
3. **Status**: Verification record created with status='pending'
4. **Admin Review**: Admin accesses pending verifications via `/api/verification/pending`
5. **Approval/Rejection**: Admin uses `/api/verification/approve` or `/api/verification/reject`
6. **Status Update**: Verification status updated in database
7. **Frontend Notification**: Toast notifications displayed on frontend for approval/rejection

### 8. 📊 Admin Analytics Flow

```mermaid
graph TD
    A[Admin Dashboard Request] --> B[Verify Admin Token]
    B --> C[Query Verification Stats]
    C --> D[Query Doctor/Patient Counts]
    D --> E[Calculate Metrics]
    E --> F[Return Analytics Data]
```

**Code Path:** `src/controllers/adminController.ts::getDashboardStats`
1. **Authentication**: Verify admin token via middleware
2. **Data Aggregation**: Query Prisma for:
   - Total verifications (all statuses)
   - Pending verifications (status='pending')
   - Approved verifications (status='approved')
   - Rejected verifications (status='rejected')
   - Total doctors count
   - Total patients count
3. **Response Structure**:
```json
{
  "totalVerifications": number,
  "pendingVerifications": number,
  "approvedVerifications": number,
  "rejectedVerifications": number,
  "totalDoctors": number,
  "totalPatients": number,
  "recentActivity": []
}
```
4. **Frontend Display**: Admin analytics page shows:
   - Verification status breakdown (approved/pending/rejected percentages)
   - Platform growth metrics (total users, doctor/patient ratio)
   - Key metrics (approval rate, rejection rate)
   - Quick actions (navigate to verification page)

## 🛣️ API Route Structure

### Core Routes
```
/api/user/*           - User authentication and profile
/api/doctor/*         - Doctor profile management
/api/patient/*        - Patient profile management
/api/admin/*          - Admin operations and analytics
/api/verification/*   - Doctor verification process
/api/records/*        - Medical records (MongoDB)
/api/appointments/*   - Appointment management (MySQL)
/api/availability/*   - Doctor availability (MySQL)
/api/prescription/*   - Prescription management
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

POST   /api/prescription/create                 # Doctor creates prescription
GET    /api/prescription/appointment/:id        # Get prescription by appointment
GET    /api/prescription/patient/:patientUid    # Get patient's prescriptions
GET    /api/prescription/doctor/:doctorUid      # Get doctor's prescriptions
```

### Admin Routes
```
POST   /api/admin/login                         # Admin login (JWT-based)
POST   /api/admin/verify                        # Verify admin credentials
GET    /api/admin/dashboard/stats               # Dashboard analytics
                                                 # Returns: totalDoctors, totalPatients,
                                                 # totalVerifications, pendingVerifications,
                                                 # approvedVerifications, rejectedVerifications

POST   /api/verification/submit                 # Doctor submits verification
GET    /api/verification/status/:doctorUid      # Check verification status
POST   /api/verification/approve                # Admin approves doctor (requires admin auth)
POST   /api/verification/reject                 # Admin rejects doctor (requires admin auth)
GET    /api/verification/pending                # Get all pending verifications (admin only)
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
  - Verify doctors (approve/reject)
  - View system analytics (dashboard stats)
  - Access verification records
  - View platform statistics (doctors, patients, verifications)
  - Manage doctor verification workflow
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
- [ ] Admin credentials securely stored
- [ ] JWT secret keys configured
- [ ] Database indexes optimized

## 📱 Frontend Integration Points

### Admin Dashboard Integration
**Frontend Path:** `TabeebFrontend/src/app/admin/`

1. **Login Page** (`admin/login/page.tsx`)
   - JWT-based authentication
   - Credentials validation
   - Token storage in localStorage
   - "Back to Home" navigation button

2. **Dashboard** (`admin/dashboard/page.tsx`)
   - Overview statistics cards
   - Quick actions (verification review, analytics)
   - Real-time data fetching

3. **Analytics Page** (`admin/analytics/page.tsx`)
   - API: `GET /api/admin/dashboard/stats`
   - Data visualization:
     - Total doctors, patients, verifications
     - Verification status breakdown (approved/pending/rejected)
     - Platform growth metrics
     - Approval/rejection rates
   - Responsive grid layout with dark mode support

4. **Verification Page** (`admin/verification/page.tsx`)
   - API: `GET /api/verification/pending`
   - API: `POST /api/verification/approve`
   - API: `POST /api/verification/reject`
   - Toast notifications for approve/reject actions
   - Document preview and review workflow

### Data Flow Example: Admin Analytics
```
1. Admin navigates to /admin/analytics
2. Frontend fetches: GET /api/admin/dashboard/stats (with admin token)
3. Backend authenticateAdminFromHeaders middleware verifies token
4. adminController.getDashboardStats queries database
5. Response returned with verification stats
6. Frontend displays data with percentage calculations
7. User sees real-time metrics and visualizations
```

## 🔧 Recent Updates & Optimizations

### Analytics System (October 2025)
- ✅ Fixed data structure mismatch between API and frontend
- ✅ Updated TypeScript interfaces to match API response
- ✅ Corrected percentage calculations for verification status
- ✅ Implemented proper approval/rejection rate calculations
- ✅ Added comprehensive admin analytics dashboard
- ✅ Integrated toast notifications for admin actions

### Admin Sidebar
- ✅ Fixed TypeScript errors with NavigationItem interface
- ✅ Added proper icon type definitions
- ✅ Activated Analytics navigation option

### Build Optimizations
- ✅ Fixed all ESLint errors (escaped quotes/apostrophes)
- ✅ Removed unused imports
- ✅ Fixed React Hook dependencies
- ✅ Production build successful (30 pages generated)

This comprehensive backend flow documentation should give you a complete understanding of how the TABEEB appointment system works! 🏥✨
