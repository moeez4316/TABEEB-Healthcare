# 🏥 TABEEB Healthcare Platform

> A comprehensive digital healthcare platform connecting doctors and patients with advanced appointment management, medical records, prescription tracking, and telemedicine capabilities.

[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)]()
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black)]()
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20Express-green)]()
[![Database](https://img.shields.io/badge/Database-MySQL%20%2B%20MongoDB-blue)]()
[![Authentication](https://img.shields.io/badge/Auth-Firebase-orange)]()

## 🌟 Overview

TABEEB (طبیب - Arabic for "Doctor") is a modern healthcare platform built to streamline medical consultations, appointment management, and patient care. The platform serves three main user types: **Patients**, **Doctors**, and **Administrators**, each with specialized interfaces and capabilities.

## 🏗️ Architecture

### Frontend (Next.js 15 + React 19)
- **Framework**: Next.js 15 with App Router
- **UI**: TailwindCSS with responsive design
- **State Management**: Redux Toolkit + TanStack Query
- **Authentication**: Firebase Auth
- **PWA**: Progressive Web App support with offline capabilities
- **Real-time**: Auto-refreshing data with smart caching

### Backend (Node.js + Express)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with middleware architecture  
- **Databases**: 
  - **MySQL** (Prisma ORM): User profiles, appointments, prescriptions
  - **MongoDB** (Mongoose): Medical records, file metadata
- **File Storage**: Cloudinary for images and documents
- **Authentication**: Firebase Admin SDK for token verification

### AI/ML Integration
- **MedLlama**: Medical AI assistant for diagnosis support
- **Document Processing**: AI-powered medical record analysis

## ✨ Key Features

### 👨‍⚕️ Doctor Features
- **Professional Profile Management**: Complete profile with specializations, qualifications
- **Verification System**: PMDC license and document verification
- **Availability Management**: Set working hours, breaks, and time slots
- **Appointment Management**: View, manage, and update patient appointments
- **Prescription System**: 
  - Create digital prescriptions with medicine tracking
  - Duration-based progress monitoring
  - Real-time prescription updates
- **Patient Records**: Access shared medical records during consultations
- **Dashboard**: Comprehensive overview with appointment statistics

### 👤 Patient Features  
- **Profile Management**: Complete medical history and personal information
- **Doctor Discovery**: Search and filter doctors by specialization, location
- **Appointment Booking**: Real-time availability and easy booking flow
- **Medical Records**: Upload, organize, and share medical documents
- **Prescription Tracking**: 
  - Visual progress indicators for medicine schedules
  - Expiration alerts and completion tracking
  - Dual-view mode (tracking vs. list view)
- **Appointment History**: Complete consultation history with notes

### 🛡️ Admin Features
- **Doctor Verification**: Review and approve doctor applications
- **Platform Management**: User oversight and system administration
- **Analytics Dashboard**: Platform usage and performance metrics

## 🚀 Technology Stack

### Frontend Dependencies
```json
{
  "@reduxjs/toolkit": "^2.9.0",
  "@tanstack/react-query": "^5.90.2", 
  "firebase": "^12.0.0",
  "next": "^15.4.2",
  "react": "^19.0.0",
  "tailwindcss": "^3.4.17"
}
```

### Backend Dependencies
```json
{
  "@prisma/client": "^6.12.0",
  "express": "^4.21.7",
  "firebase-admin": "^12.8.1",
  "cloudinary": "^2.7.0",
  "mongoose": "^8.9.3",
  "zod": "^3.24.1"
}
```

## 📁 Project Structure

```
TABEEB-Healthcare/
├── TabeebFrontend/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/                    # App Router pages
│   │   │   ├── Patient/           # Patient dashboard & features
│   │   │   ├── Doctor/            # Doctor dashboard & features  
│   │   │   ├── admin/             # Admin management interface
│   │   │   └── auth/              # Authentication flows
│   │   ├── components/            # Reusable UI components
│   │   │   ├── appointment/       # Appointment booking flow
│   │   │   ├── prescription/      # Medicine tracking components
│   │   │   └── shared/            # Common UI elements
│   │   ├── lib/                   # API clients & utilities
│   │   ├── store/                 # Redux state management
│   │   ├── types/                 # TypeScript definitions
│   │   └── utils/                 # Helper functions
│   └── public/                    # Static assets & PWA files
│
├── TabeebBackend/                 # Node.js Backend
│   └── tabeeb_backend/
│       ├── src/
│       │   ├── controllers/       # API endpoint handlers
│       │   ├── middleware/        # Auth & validation middleware
│       │   ├── routes/            # Express route definitions
│       │   ├── services/          # Business logic services
│       │   ├── lib/               # Database clients
│       │   └── types/             # TypeScript definitions
│       ├── prisma/                # Database schema & migrations
│       └── docs/                  # API documentation
│
└── ML_Server/                     # AI/ML Services
    ├── medllama.js               # Medical AI integration
    └── package.json              # ML dependencies
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **MySQL** database
- **MongoDB** database  
- **Firebase** project with Authentication enabled
- **Cloudinary** account for file storage

### 1. Clone Repository
```bash
git clone https://github.com/moeez4316/TABEEB-Healthcare.git
cd TABEEB-Healthcare
```

### 2. Backend Setup
```bash
cd TabeebBackend/tabeeb_backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database URLs, Firebase config, etc.

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### 3. Frontend Setup  
```bash
cd TabeebFrontend

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your Firebase config, API URLs, etc.

# Start development server
npm run dev
```

### 4. ML Server Setup (Optional)
```bash
cd ML_Server

# Install dependencies  
npm install

# Start ML services
npm start
```

## 🔧 Environment Configuration

### Backend (.env)
```env
DATABASE_URL="mysql://user:password@localhost:3306/tabeeb"
MONGODB_URI="mongodb://localhost:27017/tabeeb_records"
FIREBASE_SERVICE_ACCOUNT_KEY="path/to/serviceAccountKey.json"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key" 
CLOUDINARY_API_SECRET="your_api_secret"
JWT_SECRET="your_jwt_secret"
PORT=5000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
```

## 🚦 Running the Application

### Development Mode
```bash
# Start backend (Terminal 1)
cd TabeebBackend/tabeeb_backend && npm run dev

# Start frontend (Terminal 2) 
cd TabeebFrontend && npm run dev

# Start ML server (Terminal 3 - Optional)
cd ML_Server && npm start
```

### Production Mode
```bash
# Build and start backend
cd TabeebBackend/tabeeb_backend
npm run build
npm start

# Build and start frontend
cd TabeebFrontend  
npm run build
npm start
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Services**: http://localhost:8000

## 📋 API Documentation

### Authentication
All API endpoints (except public routes) require Firebase JWT tokens:
```javascript
headers: {
  'Authorization': 'Bearer <firebase_jwt_token>',
  'Content-Type': 'application/json'
}
```

### Key Endpoints

#### User Management
- `POST /api/auth/register` - User registration
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

#### Appointments  
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment
- `GET /api/doctors/availability/:doctorId` - Check doctor availability

#### Prescriptions
- `POST /api/prescriptions` - Create prescription  
- `GET /api/prescriptions/patient` - Get patient prescriptions
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription

#### Medical Records (MongoDB)
- `POST /api/medical-records` - Upload medical record
- `GET /api/medical-records` - List patient records
- `DELETE /api/medical-records/:id` - Delete record

## 🔐 Authentication & Security

### Multi-Role Authentication
- **Firebase Authentication**: Email/password, phone, social logins
- **Role-based Access Control**: Patient, Doctor, Admin roles
- **JWT Token Validation**: Secure API access
- **Route Protection**: Frontend and backend route guards

### Data Security
- **Encrypted Storage**: Sensitive data encryption
- **HIPAA Compliance**: Medical data protection standards
- **File Validation**: Secure document upload with type checking
- **SQL Injection Protection**: Parameterized queries with Prisma

## 🏥 Core Workflows

### Patient Journey
1. **Registration** → Profile completion → Email verification
2. **Doctor Search** → Filter by specialization → View profiles  
3. **Appointment Booking** → Select time slot → Confirmation
4. **Medical Records** → Upload documents → Share with doctor
5. **Consultation** → Video/in-person → Receive prescription
6. **Prescription Tracking** → Monitor progress → Get refills

### Doctor Journey  
1. **Registration** → Profile setup → Document verification (PMDC)
2. **Verification** → Admin review → Account approval
3. **Availability Setup** → Set working hours → Manage calendar
4. **Patient Management** → View appointments → Access shared records
5. **Consultations** → Conduct sessions → Create prescriptions
6. **Prescription Management** → Track patient compliance → Update treatments

## 📊 Recent Features & Innovations

### 🔥 Medicine Tracking System (Latest)
- **Duration-based Progress**: Visual progress bars for medicine schedules
- **Status Indicators**: Active, Expiring (≤2 days), Expired, Completed
- **Dual View Modes**: Tracking view with progress cards vs. traditional list view
- **Real-time Updates**: Progress automatically updates when doctors modify durations
- **Smart Calculations**: Backend computes end dates from medicine durations

### 💊 Prescription Management  
- **Digital Prescriptions**: Complete medicine details with dosage, frequency
- **Progress Tracking**: Visual indicators for treatment completion
- **Cache Optimization**: Real-time UI updates across doctor/patient views
- **Professional UI**: Custom confirmation modals for deletion

### 📅 Optimized Appointment System
- **On-demand Slot Generation**: No pre-generated time slots (95% database reduction)
- **Real-time Availability**: Dynamic slot calculation based on doctor schedules
- **Break Time Management**: Multiple break periods with conflict prevention
- **Smart Booking**: Automatic end time calculation and validation

## 🔄 Data Flow & Caching Strategy

### Frontend Caching (TanStack Query)
- **Patient Prescriptions**: 30-second stale time with auto-refetch
- **Doctor Appointments**: Real-time invalidation on mutations
- **Medical Records**: Background refresh on focus
- **User Profiles**: Cache until explicit update

### Database Optimization
- **Indexed Queries**: Strategic database indexing for performance
- **Efficient Relations**: Optimized Prisma relations and includes
- **Transaction Safety**: Atomic operations for data consistency

## 🚀 Performance & Scalability

### Frontend Optimizations
- **App Router**: Next.js 15 with optimized routing
- **Code Splitting**: Dynamic imports and lazy loading
- **PWA Features**: Offline capability and caching
- **Image Optimization**: Next.js Image component with Cloudinary

### Backend Optimizations  
- **Database Connection Pooling**: Efficient connection management
- **Caching Layers**: Redis-ready architecture
- **File Storage**: Cloudinary CDN for global file delivery
- **API Rate Limiting**: Protection against abuse

## 🎯 Future Roadmap

### Short-term (Next Release)
- [ ] **Video Consultations**: WebRTC-based telemedicine
- [ ] **Payment Integration**: Stripe/PayPal for consultation fees  
- [ ] **Notifications**: Push notifications for appointments
- [ ] **Mobile App**: React Native version

### Medium-term
- [ ] **AI Diagnosis**: Enhanced MedLlama integration
- [ ] **Lab Integration**: Lab report management
- [ ] **Pharmacy Network**: Prescription fulfillment
- [ ] **Insurance Claims**: Insurance provider integration

### Long-term Vision
- [ ] **Multi-language Support**: Urdu, Arabic localization
- [ ] **Hospital Networks**: Multi-facility management
- [ ] **Analytics Dashboard**: Advanced reporting
- [ ] **API Marketplace**: Third-party integrations

## 👥 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`) 
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support & Community

- **Documentation**: [Wiki](https://github.com/moeez4316/TABEEB-Healthcare/wiki)
- **Issues**: [GitHub Issues](https://github.com/moeez4316/TABEEB-Healthcare/issues)
- **Discussions**: [GitHub Discussions](https://github.com/moeez4316/TABEEB-Healthcare/discussions)
- **Email**: support@tabeeb-healthcare.com

## 🏆 Acknowledgments

- **Firebase**: Authentication and real-time features
- **Cloudinary**: File storage and image optimization  
- **Prisma**: Type-safe database access
- **Next.js Team**: Amazing React framework
- **TanStack Query**: Powerful data fetching and caching

---

<div align="center">

**Built with ❤️ for better healthcare accessibility**

[🌟 Star this repo](https://github.com/moeez4316/TABEEB-Healthcare) | [🐛 Report Bug](https://github.com/moeez4316/TABEEB-Healthcare/issues) | [💡 Request Feature](https://github.com/moeez4316/TABEEB-Healthcare/issues)

</div>