# TABEEB Backend 🏥

> A comprehensive healthcare management system backend built with Express.js, Prisma, and MongoDB.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🌟 Overview

TABEEB Backend is a robust Node.js/Express.js API server that powers the TABEEB healthcare platform. It provides comprehensive functionality for:

- **User Management**: Doctors, Patients, and Admin authentication
- **Appointment System**: Smart scheduling with on-demand slot generation
- **Doctor Verification**: Multi-step verification workflow with admin approval
- **Medical Records**: Secure storage and retrieval using MongoDB
- **Prescription Management**: Digital prescription creation and tracking
- **Reviews & Complaints**: Patient feedback and complaint management system
- **Doctor Profiles**: Public-facing profiles with stats, reviews, and blogs
- **Blog System**: Content management for health articles by doctors
- **Video Consultations**: Video call session management
- **Analytics**: Real-time platform statistics and insights
- **Admin Dashboard**: Comprehensive admin panel with user management

## 🛠 Tech Stack

### Core Technologies
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Databases**: 
  - MySQL (via Prisma ORM) - Structured data
  - MongoDB (via Mongoose) - Medical records

### Key Dependencies
- **Authentication**: Firebase Admin SDK (JWT)
- **File Storage**: Cloudinary
- **ORM**: Prisma (MySQL), Mongoose (MongoDB)
- **Security**: bcryptjs, CORS
- **Development**: ts-node, nodemon

## 📁 Project Structure

```
tabeeb_backend/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   └── migrations/                # Database migrations
├── src/
│   ├── config/
│   │   ├── db.ts                 # MongoDB connection
│   │   └── firebase.ts           # Firebase Admin setup
│   ├── controllers/              # Business logic
│   │   ├── adminController.ts
│   │   ├── appointmentController.ts
│   │   ├── availabilityController.ts
│   │   ├── doctorController.ts
│   │   ├── patientController.ts
│   │   ├── prescriptionController.ts
│   │   ├── userController.ts
│   │   ├── verificationController.ts
│   │   ├── medicalRecordController.ts
│   │   ├── publicDoctorController.ts
│   │   ├── reviewController.ts
│   │   ├── blogController.ts
│   │   └── videoCallController.ts
│   ├── middleware/               # Request processing
│   │   ├── verifyToken.ts       # JWT authentication
│   │   ├── adminAuth.ts         # Admin authorization
│   │   └── appointmentValidation.ts
│   ├── routes/                  # API endpoints
│   │   ├── adminRoutes.ts
│   │   ├── appointmentRoutes.ts
│   │   ├── availabilityRoutes.ts
│   │   ├── doctorRoutes.ts
│   │   ├── patientRoutes.ts
│   │   ├── prescriptionRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── verificationRoutes.ts
│   │   ├── medicalRecords.ts
│   │   ├── reviewRoutes.ts
│   │   ├── blogRoutes.ts
│   │   ├── videoCallRoutes.ts
│   │   └── uploadRoutes.ts
│   ├── services/
│   │   └── uploadService.ts     # Cloudinary integration
│   ├── utils/
│   │   └── slotGenerator.ts     # On-demand slot generation
│   ├── models/
│   │   └── MedicalRecord.ts     # MongoDB schema
│   ├── lib/
│   │   └── prisma.ts            # Prisma client
│   └── index.ts                 # Application entry point
├── .env                         # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL**: v8.0 or higher
- **MongoDB**: v6.0 or higher
- **Git**: Latest version

### Required Accounts
- Firebase project with Admin SDK credentials
- Cloudinary account for file storage

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/moeez4316/TABEEB-Healthcare.git
cd TABEEB-Healthcare/TabeebBackend/tabeeb_backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` with your configuration (see [Environment Variables](#environment-variables) section).

### 4. Initialize Databases

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed database with sample data
npx prisma db seed
```

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5002
NODE_ENV=development

# Database URLs
DATABASE_URL="mysql://username:password@localhost:3306/tabeeb_db"
MONGODB_URI="mongodb://localhost:27017/tabeeb_medical_records"

# Firebase Configuration
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# JWT Secret (for admin authentication)
JWT_SECRET="your-secure-jwt-secret"

# CORS Configuration
FRONTEND_URL="http://localhost:3000"
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Navigate to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Extract the credentials and add to `.env`

### Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Navigate to Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Add to `.env` file

## 💾 Database Setup

### MySQL Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE tabeeb_db;
EXIT;

# Run Prisma migrations
npx prisma migrate deploy

# View database in Prisma Studio
npx prisma studio
```

### MongoDB Setup

```bash
# Start MongoDB service
mongod --dbpath /path/to/data

# Or if using MongoDB as a service
sudo systemctl start mongodb
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

Server will start at `http://localhost:5002`

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Using Different Ports

```bash
# Specify custom port
PORT=8080 npm run dev
```

## 📚 API Documentation

### Base URL
```
http://localhost:5002/api
```

### Authentication
Most endpoints require authentication via Firebase JWT token in the Authorization header:
```
Authorization: Bearer <your-firebase-jwt-token>
```

### API Endpoints

#### User Authentication
```http
POST   /api/user/register          # Register new user (Doctor/Patient)
GET    /api/user/profile/:uid      # Get user profile
PUT    /api/user/profile/:uid      # Update user profile
```

#### Doctor Management
```http
GET    /api/doctor/:uid                             # Get doctor profile
PUT    /api/doctor/profile                          # Update doctor profile
GET    /api/doctor/search                           # Search doctors by specialty
GET    /api/doctor/profile/:doctorUid               # Get public doctor profile with stats
GET    /api/doctor/profile/:doctorUid/availability-summary  # Get 7-day availability
GET    /api/doctor/stats                            # Get doctor dashboard statistics
```

#### Patient Management
```http
GET    /api/patient/:uid           # Get patient profile
PUT    /api/patient/:uid           # Update patient profile
GET    /api/patient/appointments   # Get patient appointments
```

#### Availability Management
```http
POST   /api/availability/set                    # Set doctor availability
GET    /api/availability/doctor/:doctorUid      # Get doctor's availability
GET    /api/availability/slots/:doctorUid       # Get available time slots
PUT    /api/availability/:id                    # Update availability
DELETE /api/availability/:id                    # Delete availability
```

#### Appointment System
```http
POST   /api/appointments/book                   # Book appointment
GET    /api/appointments/doctor                 # Get doctor's appointments
GET    /api/appointments/patient                # Get patient's appointments
PATCH  /api/appointments/:id/status             # Update appointment status
PATCH  /api/appointments/:id/cancel             # Cancel appointment
GET    /api/appointments/:id                    # Get appointment details
GET    /api/appointments/stats/overview         # Get statistics
```

#### Doctor Verification
```http
POST   /api/verification/submit                 # Submit verification documents
GET    /api/verification/status/:doctorUid      # Check verification status
GET    /api/verification/pending                # Get pending verifications (Admin)
POST   /api/verification/approve                # Approve doctor (Admin)
POST   /api/verification/reject                 # Reject doctor (Admin)
```

#### Admin Operations
```http
POST   /api/admin/login                         # Admin login
POST   /api/admin/verify                        # Verify admin credentials
GET    /api/admin/dashboard/stats               # Get dashboard statistics
GET    /api/admin/users                         # Get all users (doctors & patients)
POST   /api/admin/users/suspend                 # Suspend user account
POST   /api/admin/users/activate                # Activate user account
GET    /api/admin/doctors                       # Get all doctors with verification
```

#### Reviews & Complaints
```http
POST   /api/reviews/create                      # Create review/complaint (Patient)
GET    /api/reviews/doctor/:doctorUid           # Get public reviews (non-complaints)
GET    /api/reviews/doctor/:doctorUid/rating    # Get doctor's public rating
GET    /api/reviews/my-reviews                  # Get doctor's own reviews (Doctor)
GET    /api/reviews/admin/complaints            # Get all complaints (Admin)
PATCH  /api/reviews/admin/:reviewId/action      # Update complaint action (Admin)
DELETE /api/reviews/:reviewId                   # Delete review (Patient)
```

#### Blog System
```http
POST   /api/blogs/create                        # Create blog (Doctor/Admin)
GET    /api/blogs                               # Get all published blogs
GET    /api/blogs/:blogId                       # Get single blog
PUT    /api/blogs/:blogId                       # Update blog
DELETE /api/blogs/:blogId                       # Delete blog
GET    /api/blogs/author/:authorUid             # Get blogs by author
GET    /api/blogs/search                        # Search blogs by keyword/tags
```

#### Video Consultations
```http
POST   /api/video-calls/create                  # Create video session (Doctor)
GET    /api/video-calls/appointment/:appointmentId  # Get video session
PATCH  /api/video-calls/:videoCallId/status     # Update session status
POST   /api/video-calls/:videoCallId/end        # End video session
```

#### Medical Records
```http
POST   /api/records/upload                      # Upload medical record
GET    /api/records/patient/:patientUid         # Get patient's records
GET    /api/records/:id                         # Get specific record
DELETE /api/records/:id                         # Delete record
```

#### Prescriptions
```http
POST   /api/prescription/create                 # Create prescription
GET    /api/prescription/appointment/:id        # Get by appointment
GET    /api/prescription/patient/:patientUid    # Get patient prescriptions
GET    /api/prescription/doctor/:doctorUid      # Get doctor prescriptions
```

### Response Formats

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes
- `200` - Success (GET, PATCH)
- `201` - Created (POST)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## ✨ Key Features

### 1. On-Demand Slot Generation
- **Scalability**: No pre-generated time slots
- **Efficiency**: Slots generated when needed
- **Flexibility**: Dynamic break time handling
- **Weekly Templates**: Auto-generate availability based on templates

### 2. Multi-Database Architecture
- **MySQL**: Structured data (users, appointments, verifications)
- **MongoDB**: Unstructured data (medical records, documents)

### 3. Secure Authentication
- **Firebase JWT**: Industry-standard authentication
- **Role-based Access**: Doctor, Patient, Admin roles
- **Admin Panel**: Separate JWT-based admin authentication

### 4. File Management
- **Cloudinary Integration**: Secure cloud storage
- **Medical Documents**: Verification documents, medical records
- **Blog Images**: Cover images for blog posts
- **Optimized Delivery**: CDN-based file serving

### 5. Real-time Analytics
- **Dashboard Statistics**: Live platform metrics
- **Verification Tracking**: Approval/rejection rates
- **User Growth**: Doctor and patient analytics
- **Rating Analytics**: Review statistics and distributions

### 6. Doctor Profile System
- **Public Profiles**: Comprehensive doctor profiles with verification badges
- **Statistics Aggregation**: Unique patients, appointments, rating distribution
- **Review Integration**: Display non-complaint reviews on profile
- **Blog Integration**: Show doctor's published articles
- **Availability Preview**: 7-day availability summary

### 7. Reviews & Complaints Management
- **Patient Reviews**: Rating and feedback system
- **Complaint Handling**: Separate complaint workflow
- **Admin Management**: Review complaints with notes and actions
- **Rating Calculation**: Automatic average rating updates
- **Rating Distribution**: 1-5 stars breakdown

### 8. Blog System
- **Content Management**: Full CRUD for blog posts
- **Draft/Published**: Workflow for content approval
- **Tag System**: Categorization and search by tags
- **Author Attribution**: Link blogs to doctor profiles
- **Search Functionality**: Keyword and tag-based search

### 9. Video Consultation System
- **Session Management**: Create and track video calls
- **Room Generation**: Unique room names per session
- **Status Tracking**: SCHEDULED → IN_PROGRESS → COMPLETED
- **Duration Tracking**: Automatic session duration calculation
- **Appointment Integration**: Link video calls to appointments

## 🏗 Architecture

### Request Flow
```
Client Request
    ↓
Express.js Server
    ↓
Middleware (Auth, Validation)
    ↓
Controllers (Business Logic)
    ↓
Prisma/Mongoose (Database)
    ↓
Response to Client
```

### Database Schema
- See `prisma/schema.prisma` for MySQL schema
- See `src/models/MedicalRecord.ts` for MongoDB schema
- Full documentation: `BACKEND_FLOW_DOCUMENTATION.md`

## 🚢 Deployment

### Production Checklist
- ✅ Environment variables configured
- ✅ Database migrations applied
- ✅ Firebase service account configured
- ✅ Cloudinary credentials set
- ✅ CORS configured for production domains
- ✅ SSL certificates installed
- ✅ Database backups automated
- ✅ Error logging implemented
- ✅ Health check endpoints added

### Deployment Platforms

#### Recommended Platforms
- **Backend**: Railway, Render, Heroku, DigitalOcean
- **MySQL**: PlanetScale, Railway, AWS RDS
- **MongoDB**: MongoDB Atlas

#### Example: Deploying to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# Deploy
railway up
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check MongoDB is running
sudo systemctl status mongodb

# Verify connection strings in .env
```

#### Prisma Client Errors
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

#### Port Already in Use
```bash
# Find process using port 5002
lsof -i :5002

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=8080 npm run dev
```

#### Firebase Authentication Issues
- Verify Firebase credentials in `.env`
- Check service account has correct permissions
- Ensure Firebase project ID matches

### Logs and Debugging

```bash
# View application logs
npm run dev --verbose

# Check Prisma queries
DEBUG=prisma:* npm run dev

# Database logs
tail -f /var/log/mysql/error.log
```

## 📖 Additional Resources

- [Full Backend Flow Documentation](./BACKEND_FLOW_DOCUMENTATION.md)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is part of the TABEEB Healthcare platform.

## 🤝 Support

For issues and questions:
- Email: support@tabeeb.com
- GitHub Issues: [Create an issue](https://github.com/moeez4316/TABEEB-Healthcare/issues)

---

**Built with ❤️ for Pakistan's healthcare** 🇵🇰
