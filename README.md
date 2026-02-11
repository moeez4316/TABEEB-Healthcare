<div align="center">

# 🏥 TABEEB Healthcare Platform

### *Revolutionizing Healthcare Access Through Technology*

> A comprehensive, full-stack digital healthcare platform connecting doctors and patients with advanced appointment management, medical records, prescription tracking, AI-powered diagnosis support, and telemedicine capabilities.

[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)]()
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black)]()
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20Express-green)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)]()
[![Database](https://img.shields.io/badge/Database-MySQL%20%2B%20MongoDB-blue)]()
[![Authentication](https://img.shields.io/badge/Auth-Firebase-orange)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)]()
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8)]()
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)]()

[Features](#-key-features) • [Quick Start](#-quick-start) • [Documentation](#-detailed-setup) • [Architecture](#-architecture) • [API](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [For Patients](#-patient-features)
  - [For Doctors](#-doctor-features)
  - [For Administrators](#-admin-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
  - [Using Docker (Recommended)](#using-docker-recommended)
  - [Manual Setup](#manual-setup)
- [Detailed Setup](#-detailed-setup)
- [Environment Configuration](#-environment-configuration)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Authentication & Security](#-authentication--security)
- [Core Workflows](#-core-workflows)
- [Recent Features](#-recent-features--innovations)
- [Performance & Scalability](#-performance--scalability)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Future Roadmap](#-future-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support--community)

---

## 🌟 Overview

**TABEEB** (طبیب - Arabic/Urdu for "Doctor") is a modern, production-ready healthcare platform designed to bridge the gap between patients and healthcare providers. Built with cutting-edge technologies, TABEEB provides a seamless digital healthcare experience that prioritizes user experience, security, and scalability.

### 🎯 Mission

To democratize healthcare access by providing an intuitive, secure, and comprehensive digital platform that connects patients with qualified doctors, streamlines medical workflows, and maintains complete medical records in one centralized location.

### 👥 User Roles

The platform serves three distinct user types, each with specialized interfaces and capabilities:

- **👤 Patients**: Book appointments, manage medical records, track prescriptions, consult with doctors
- **👨‍⚕️ Doctors**: Manage availability, conduct consultations, create prescriptions, access patient records
- **🛡️ Administrators**: Verify doctors, manage users, monitor platform analytics, handle complaints

### 🏆 What Makes TABEEB Special?

- ✅ **Fully Open Source**: Complete source code with MIT license
- ✅ **Production Ready**: Deployed with real users and active development
- ✅ **Modern Tech Stack**: Built with Next.js 15, React 19, Node.js, TypeScript
- ✅ **Dual Database**: MySQL for relational data + MongoDB for medical documents
- ✅ **PWA Support**: Installable on all devices with offline capabilities
- ✅ **AI Integration**: Medical AI assistant for diagnosis support
- ✅ **Real-time Updates**: Live appointment syncing and prescription tracking
- ✅ **Docker Ready**: Complete containerization for easy deployment
- ✅ **Responsive Design**: Mobile-first approach, works on all screen sizes
- ✅ **Comprehensive**: Handles entire patient journey from booking to prescription

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

---

## ✨ Key Features

### 👤 Patient Features  

#### 🔍 **Doctor Discovery & Booking**
- **Advanced Search**: Filter doctors by specialization, location, rating, and availability
- **Doctor Profiles**: View detailed profiles with qualifications, experience, reviews, and fees
- **Real-time Availability**: Check available time slots instantly
- **Smart Booking**: Book appointments with just a few clicks
- **Multiple Appointment Types**: Support for in-person and video consultations

#### 📋 **Medical Records Management**
- **Document Upload**: Securely upload lab reports, X-rays, prescriptions, and medical documents
- **Cloud Storage**: All files stored securely on Cloudinary CDN
- **Easy Sharing**: Share specific records with doctors during consultations
- **Organization**: Categorize and manage records by type and date
- **File Preview**: View documents directly in the browser

#### 💊 **Prescription Tracking System** (Latest Feature)
- **Visual Progress Bars**: Track medicine intake progress at a glance
- **Duration-based Tracking**: Automatic calculation of start and end dates
- **Status Indicators**: 
  - 🟢 **Active**: Currently taking medicine
  - 🟡 **Expiring**: Less than 2 days remaining
  - 🔴 **Expired**: Past end date
  - ✅ **Completed**: Successfully completed course
- **Dual View Modes**: 
  - **Tracking View**: Card-based layout with progress indicators
  - **List View**: Compact table view for quick reference
- **Real-time Updates**: Automatically syncs when doctor modifies prescriptions
- **Medicine Details**: Complete information including dosage, frequency, and instructions

#### 📅 **Appointment Management**
- **Upcoming Appointments**: View all scheduled consultations
- **Appointment History**: Access past consultation records
- **Status Tracking**: Real-time updates on appointment status
- **Rescheduling**: Easy appointment modification
- **Notifications**: Reminders for upcoming appointments

#### 💬 **AI Health Assistant**
- **Medical Chatbot**: AI-powered health query assistance
- **Symptom Checker**: Get preliminary insights on symptoms
- **Health Tips**: Receive personalized health recommendations

#### 👤 **Profile Management**
- **Complete Profile**: Medical history, allergies, chronic conditions
- **Personal Information**: Contact details, emergency contacts
- **Document Verification**: ID and profile verification
- **Privacy Controls**: Manage data sharing preferences

---

### 👨‍⚕️ Doctor Features

#### 🏥 **Professional Profile Management**
- **Rich Profiles**: Comprehensive profile with photo, bio, and credentials
- **Specializations**: Multiple specialization support
- **Qualifications**: Display degrees, certifications, and training
- **Experience Details**: Years of practice, hospital affiliations
- **Fee Management**: Set consultation fees for different appointment types
- **Availability Status**: Control when you appear in patient searches

#### ✅ **Verification System**
- **PMDC License Verification**: Upload and verify medical license
- **Document Submission**: Submit required professional documents
- **Admin Review**: Multi-step verification process
- **Badge Display**: Verified doctor badge on profile
- **Status Tracking**: Real-time verification status updates

#### 📅 **Availability & Schedule Management**
- **Working Hours**: Set daily working hours for each day of the week
- **Break Times**: Configure multiple break periods with start and end times
- **Smart Scheduling**: System automatically calculates available slots
- **On-demand Slots**: No pre-generation needed (95% database reduction)
- **Conflict Prevention**: Automatic overlap detection and prevention
- **Availability Toggle**: Quickly enable/disable availability
- **Time Zone Support**: Handle appointments across time zones

#### 📋 **Appointment Management**
- **Dashboard Overview**: See all appointments at a glance
- **Status Management**: Update appointment status (confirmed, completed, cancelled)
- **Patient Details**: Access patient profiles and medical history
- **Appointment Notes**: Add consultation notes for each appointment
- **Filtering & Search**: Find appointments by date, status, or patient
- **Calendar View**: Visual representation of appointments

#### 💊 **Prescription Management System**
- **Digital Prescriptions**: Create comprehensive digital prescriptions
- **Medicine Database**: Rich medicine information with dosage and frequency
- **Duration Control**: Set treatment duration for each medicine
- **Progress Monitoring**: See patient compliance through progress tracking
- **Real-time Updates**: Modify prescriptions with instant patient notifications
- **Prescription History**: View all prescriptions issued to a patient
- **Print & Export**: Generate printable prescription PDFs
- **Template Support**: Save frequently used prescription templates

#### 📂 **Patient Records Access**
- **Shared Records**: View medical records shared by patients
- **Document Viewer**: Preview lab reports, X-rays, and documents
- **Medical History**: Access complete patient medical history
- **Consultation Notes**: Review notes from previous consultations
- **Secure Access**: HIPAA-compliant data handling

#### 📊 **Analytics Dashboard**
- **Appointment Statistics**: Total, completed, cancelled appointments
- **Revenue Tracking**: Earnings overview and trends
- **Patient Analytics**: New vs. returning patient metrics
- **Popular Time Slots**: Identify peak booking times
- **Review Ratings**: Monitor patient feedback and ratings

#### 📝 **Blog & Content Management**
- **Write Articles**: Share health tips and medical knowledge
- **Content Editor**: Rich text editor for formatting
- **Image Upload**: Add images to articles
- **Publish Control**: Draft, publish, and unpublish articles
- **Engagement Metrics**: View article views and engagement

---

### 🛡️ Admin Features

#### ✅ **Doctor Verification Management**
- **Verification Queue**: Review pending doctor applications
- **Document Review**: View and verify PMDC licenses and certificates
- **Approval Workflow**: Approve or reject applications with reasons
- **Verification Status**: Track verification stages
- **Communication**: Contact doctors for additional documentation

#### 👥 **User Management**
- **User Directory**: View all registered users (patients, doctors, admins)
- **Account Control**: Enable, disable, or delete user accounts
- **Role Management**: Assign and modify user roles
- **Activity Monitoring**: Track user login and activity
- **Search & Filter**: Find users by name, email, role, or status

#### 📊 **Platform Analytics Dashboard**
- **User Metrics**: Total users, active users, growth trends
- **Appointment Statistics**: Booking rates, completion rates
- **Revenue Analytics**: Platform earnings and doctor revenue
- **Engagement Metrics**: Active users, session duration
- **Doctor Performance**: Top doctors by appointments and ratings
- **Geographic Distribution**: User distribution by location

#### 🚨 **Complaint Management**
- **Complaint System**: Receive and manage patient complaints
- **Priority Levels**: Categorize complaints by severity
- **Status Tracking**: Open, in-progress, resolved complaints
- **Response System**: Communicate with complainants
- **Resolution Notes**: Document complaint resolution

#### ⚙️ **Platform Settings**
- **Configuration**: Manage platform-wide settings
- **Feature Flags**: Enable/disable features
- **Maintenance Mode**: Control platform availability
- **Announcement System**: Post system-wide announcements

---

## 🚀 Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.4.2 | React framework with App Router, SSR, and static generation |
| **React** | 19.0.0 | UI library with latest features (Server Components, Suspense) |
| **TypeScript** | 5.x | Type-safe JavaScript for better DX and fewer bugs |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework for rapid UI development |
| **Redux Toolkit** | 2.9.0 | State management with optimized Redux patterns |
| **TanStack Query** | 5.90.2 | Data fetching, caching, and synchronization |
| **Firebase** | 12.0.0 | Authentication, real-time database, cloud messaging |
| **Framer Motion** | ^11.x | Animation library for smooth transitions |
| **React Hook Form** | ^7.x | Performant form validation |
| **Zod** | ^3.24.1 | TypeScript-first schema validation |
| **Lucide React** | Latest | Beautiful, consistent icon set |
| **Next PWA** | ^5.6.0 | Progressive Web App support with Workbox |
| **Axios** | ^1.7.x | HTTP client for API requests |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime environment |
| **Express.js** | 4.21.7 | Fast, minimalist web framework |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Prisma** | 6.12.0 | Modern ORM for MySQL database |
| **Mongoose** | 8.9.3 | MongoDB ODM for medical records |
| **Firebase Admin** | 12.8.1 | Server-side Firebase authentication |
| **Cloudinary** | 2.7.0 | Cloud storage for medical documents and images |
| **Zod** | 3.24.1 | Runtime type checking and validation |
| **MySQL** | 8.0+ | Relational database for structured data |
| **MongoDB** | 6.0+ | NoSQL database for medical documents |
| **CORS** | ^2.8.5 | Cross-Origin Resource Sharing middleware |
| **Helmet** | ^8.x | Security headers middleware |
| **Express Rate Limit** | ^7.x | API rate limiting |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Docker** | Containerization for consistent environments |
| **PM2** | Process manager for Node.js applications |
| **Prisma Studio** | Visual database editor |
| **ESLint** | Code linting and formatting |
| **Prettier** | Code formatter |
| **Husky** | Git hooks for pre-commit checks |

### Infrastructure & DevOps

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting with automatic deployments |
| **Railway** | Backend hosting with database management |
| **Caddy** | Reverse proxy with automatic HTTPS |
| **GitHub Actions** | CI/CD pipeline |
| **Cloudinary CDN** | Global content delivery network |
| **Firebase Hosting** | Alternative frontend hosting |

### Third-Party Services

| Service | Integration |
|---------|-------------|
| **Firebase Auth** | Email/password, phone, social authentication |
| **Cloudinary** | Image upload, optimization, and CDN |
| **MedLlama** | AI medical assistant and diagnosis support |
| **Google Analytics** | User behavior tracking |
| **Sentry** | Error tracking and monitoring (optional) |

---

## 📊 Recent Features & Innovations
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

## � Project Structure

```
TABEEB-Healthcare/
├── 📱 TabeebFrontend/                 # Next.js 15 Frontend Application
│   ├── src/
│   │   ├── app/                       # App Router pages & layouts
│   │   │   ├── Patient/              # Patient dashboard & features
│   │   │   ├── Doctor/               # Doctor dashboard & features  
│   │   │   ├── admin/                # Admin management interface
│   │   │   ├── auth/                 # Authentication flows (login, register)
│   │   │   ├── doctors/              # Doctor discovery & profiles
│   │   │   ├── blogs/                # Blog articles and content
│   │   │   └── api/                  # API route handlers
│   │   ├── components/               # Reusable UI components
│   │   │   ├── appointment/          # Appointment booking flow
│   │   │   ├── prescription/         # Medicine tracking components
│   │   │   ├── chat/                 # Chat interface components
│   │   │   ├── VideoCall/            # Video consultation components
│   │   │   └── shared/               # Common UI elements (cards, buttons)
│   │   ├── lib/                      # API clients & utilities
│   │   │   ├── api/                  # API service functions
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   └── verification/         # Verification utilities
│   │   ├── store/                    # Redux Toolkit state management
│   │   │   ├── slices/               # Redux slices (auth, user, etc.)
│   │   │   └── store.ts              # Store configuration
│   │   ├── types/                    # TypeScript type definitions
│   │   └── utils/                    # Helper functions
│   ├── public/                       # Static assets & PWA files
│   │   ├── manifest.json             # PWA manifest
│   │   ├── sw.js                     # Service worker
│   │   └── workbox-*.js              # Workbox caching library
│   ├── Dockerfile                    # Docker configuration
│   └── package.json                  # Dependencies & scripts
│
├── 🔧 TabeebBackend/                  # Node.js Backend Services
│   └── tabeeb_backend/
│       ├── src/
│       │   ├── controllers/          # API endpoint handlers
│       │   │   ├── appointmentController.ts
│       │   │   ├── prescriptionController.ts
│       │   │   ├── userController.ts
│       │   │   └── doctorController.ts
│       │   ├── middleware/           # Express middleware
│       │   │   ├── auth.ts           # JWT authentication
│       │   │   └── validation.ts     # Request validation
│       │   ├── routes/               # Express route definitions
│       │   ├── services/             # Business logic services
│       │   ├── lib/                  # Database clients
│       │   │   ├── prisma.ts         # Prisma client (MySQL)
│       │   │   └── mongodb.ts        # MongoDB client
│       │   ├── config/               # Configuration files
│       │   │   ├── db.ts             # Database config
│       │   │   └── firebase.ts       # Firebase admin config
│       │   └── types/                # TypeScript definitions
│       ├── prisma/                   # Prisma ORM
│       │   ├── schema.prisma         # Database schema
│       │   └── migrations/           # Database migrations
│       ├── Dockerfile                # Docker configuration
│       └── package.json              # Dependencies & scripts
│
├── 🤖 ML_Server/                      # AI/ML Services
│   ├── medllama.js                   # Medical AI integration
│   ├── package.json                  # ML dependencies
│   └── README.md                     # ML server documentation
│
├── 🐳 Docker Configuration            # Container orchestration
│   ├── docker-compose.yml            # Development compose file
│   ├── docker-compose.prebuilt.yml   # Production compose file
│   └── Caddyfile                     # Caddy reverse proxy config
│
├── 📜 Deployment Scripts              # Deployment automation
│   ├── build-and-push.sh             # Linux/Mac build script
│   ├── build-and-push.ps1            # Windows PowerShell script
│   ├── start-local.sh                # Local dev startup (Linux/Mac)
│   ├── start-local.ps1               # Local dev startup (Windows)
│   ├── deploy-oracle.sh              # Oracle Cloud deployment
│   └── deploy-prebuilt.sh            # Production deployment
│
└── 📚 Documentation                   # Project documentation
    ├── README.md                     # Main documentation (this file)
    ├── QUICKSTART.md                 # Quick start guide
    ├── DEPLOYMENT.md                 # Deployment guide
    └── BACKEND_FLOW_DOCUMENTATION.md # Backend workflow docs
```

---

## 🚀 Quick Start

Get TABEEB running on your local machine in minutes!

### ⚡ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://www.mysql.com/downloads/)
- **MongoDB** (v6.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Docker & Docker Compose** (Optional, but recommended) - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/downloads)

### 🎯 External Services Required

You'll need accounts for the following services:

1. **Firebase** - [Create Project](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Generate Service Account Key
   
2. **Cloudinary** - [Sign Up](https://cloudinary.com/)
   - Get Cloud Name, API Key, and API Secret

---

### 🐳 Using Docker (Recommended)

Docker provides the easiest way to get started with all services pre-configured.

#### Option 1: Development Mode with Hot Reload

```bash
# 1. Clone the repository
git clone https://github.com/moeez4316/TABEEB-Healthcare.git
cd TABEEB-Healthcare

# 2. Configure environment variables
# Create .env files in TabeebBackend/tabeeb_backend and TabeebFrontend
# See Environment Configuration section below

# 3. Start all services with Docker Compose
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000
# - MySQL: localhost:3306
# - MongoDB: localhost:27017
```

#### Option 2: Production Mode (Prebuilt Images)

```bash
# Use prebuilt images for production deployment
docker-compose -f docker-compose.prebuilt.yml up -d

# Access via reverse proxy at http://localhost
```

#### Windows Users

```powershell
# Use the PowerShell startup script
.\start-local.ps1
```

#### Linux/Mac Users

```bash
# Use the shell script
chmod +x start-local.sh
./start-local.sh
```

---

### 🔧 Manual Setup

For development without Docker:

#### Step 1: Clone Repository

```bash
git clone https://github.com/moeez4316/TABEEB-Healthcare.git
cd TABEEB-Healthcare
```

#### Step 2: Setup MySQL Database

```sql
-- Create database
CREATE DATABASE tabeeb;

-- Create user (optional)
CREATE USER 'tabeeb_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON tabeeb.* TO 'tabeeb_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Step 3: Setup MongoDB

```bash
# Start MongoDB service
# On Windows (if installed as service):
net start MongoDB

# On Linux:
sudo systemctl start mongod

# On Mac:
brew services start mongodb-community
```

#### Step 4: Backend Setup

```bash
cd TabeebBackend/tabeeb_backend

# Install dependencies
npm install

# Create environment file
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Linux/Mac

# Edit .env with your configuration (see Environment Configuration section)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed database with sample data
npx prisma db seed

# Start development server
npm run dev

# Backend will be running at http://localhost:5000
```

#### Step 5: Frontend Setup

```bash
# Open new terminal window
cd TabeebFrontend

# Install dependencies
npm install

# Create environment file
copy .env.local.example .env.local  # Windows
# OR
cp .env.local.example .env.local    # Linux/Mac

# Edit .env.local with your configuration

# Start development server
npm run dev

# Frontend will be running at http://localhost:3000
```

#### Step 6: ML Server Setup (Optional)

```bash
# Open new terminal window
cd ML_Server

# Install dependencies
npm install

# Create environment file if needed
copy .env.example .env  # Windows

# Start ML services
npm start

# ML Server will be running at http://localhost:8000
```

### 🎉 Access the Application

Once all services are running:

1. 🌐 **Open your browser**: Navigate to `http://localhost:3000`
2. 📝 **Create an account**: Click "Register" and choose your role (Patient/Doctor)
3. ✅ **Complete profile**: Fill in your profile information
4. 🚀 **Start exploring**: 
   - **Patients**: Search for doctors and book appointments
   - **Doctors**: Set up availability and manage appointments
   - **Admins**: Access admin panel at `/admin`

### 🔑 Default Admin Account (for testing)

If you seeded the database, use these credentials:

```
Email: admin@tabeeb.com
Password: admin123
```

**⚠️ Important**: Change these credentials in production!

---

## 🔧 Detailed Setup

## 🔧 Environment Configuration

### 🔐 Security Note

**Never commit `.env` files to version control!** All `.env` files are git-ignored by default.

---

### Backend Environment Variables

Create `.env` file in `TabeebBackend/tabeeb_backend/`:

```env
# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# MySQL Database (Prisma)
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="mysql://root:password@localhost:3306/tabeeb"

# MongoDB Database (Mongoose)
# Format: mongodb://HOST:PORT/DATABASE
MONGODB_URI="mongodb://localhost:27017/tabeeb_records"

# Alternative MongoDB Atlas (Cloud)
# MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/tabeeb_records"

# ==========================================
# FIREBASE CONFIGURATION
# ==========================================

# Path to Firebase Service Account Key JSON
# Get from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
FIREBASE_SERVICE_ACCOUNT_KEY="./config/serviceAccountKey.json"

# Alternative: Inline JSON (for cloud deployments)
# FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"..."}'

# ==========================================
# CLOUDINARY CONFIGURATION
# ==========================================

# Get from: Cloudinary Dashboard > Account Details
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# ==========================================
# SERVER CONFIGURATION
# ==========================================

# Server Port
PORT=5000

# Node Environment (development, production, test)
NODE_ENV="development"

# JWT Secret (for additional token signing - not primary auth)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# ==========================================
# CORS CONFIGURATION
# ==========================================

# Allowed origins (comma-separated for multiple origins)
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"

# ==========================================
# API KEYS (Optional)
# ==========================================

# For AI/ML Services
ML_SERVER_URL="http://localhost:8000"
ML_API_KEY="your_ml_api_key"

# ==========================================
# EMAIL CONFIGURATION (Optional - for notifications)
# ==========================================

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"

# ==========================================
# RATE LIMITING (Optional)
# ==========================================

RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # 100 requests per window
```

#### 📝 How to Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Settings** (⚙️) → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file as `serviceAccountKey.json` in `TabeebBackend/tabeeb_backend/config/`

---

### Frontend Environment Variables

Create `.env.local` file in `TabeebFrontend/`:

```env
# ==========================================
# API CONFIGURATION
# ==========================================

# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:5000"

# Alternative for production
# NEXT_PUBLIC_API_URL="https://api.tabeeb-healthcare.com"

# ==========================================
# FIREBASE CONFIGURATION (Client SDK)
# ==========================================

# Get from: Firebase Console > Project Settings > General > Your Apps > Web App
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"

# ==========================================
# APPLICATION CONFIGURATION
# ==========================================

# Site URL (for SEO and PWA)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Application Name
NEXT_PUBLIC_APP_NAME="TABEEB Healthcare"

# ==========================================
# CLOUDINARY (Frontend Upload - Optional)
# ==========================================

# Upload Preset (create in Cloudinary Dashboard)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your_upload_preset"

# ==========================================
# ANALYTICS (Optional)
# ==========================================

# Google Analytics
NEXT_PUBLIC_GA_TRACKING_ID="G-XXXXXXXXXX"

# ==========================================
# FEATURE FLAGS (Optional)
# ==========================================

# Enable/disable features
NEXT_PUBLIC_ENABLE_VIDEO_CALL="true"
NEXT_PUBLIC_ENABLE_AI_CHAT="true"
NEXT_PUBLIC_ENABLE_PWA="true"

# ==========================================
# DEVELOPMENT FLAGS
# ==========================================

# Show debug information
NEXT_PUBLIC_DEBUG_MODE="false"

# API Request Logging
NEXT_PUBLIC_LOG_API_REQUESTS="true"
```

#### 🔥 How to Get Firebase Client Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Settings** (⚙️) → **Project Settings**
4. Scroll to **Your apps** section
5. If no web app exists, click **Add app** → **Web** (</>) icon
6. Register your app with a nickname
7. Copy the configuration values shown

---

### ML Server Environment Variables (Optional)

Create `.env` file in `ML_Server/`:

```env
# ==========================================
# ML SERVER CONFIGURATION
# ==========================================

# Server Port
PORT=8000

# Model Configuration
MODEL_PATH="./models/medllama"
MODEL_VERSION="v1.0"

# API Keys
ML_API_KEY="your_secure_api_key"

# ==========================================
# BACKEND API CONNECTION
# ==========================================

BACKEND_API_URL="http://localhost:5000"
BACKEND_API_KEY="your_backend_api_key"
```

---

### 🔄 Quick Environment Setup

#### Using Example Files

Both frontend and backend include example environment files:

```bash
# Backend
cd TabeebBackend/tabeeb_backend
cp .env.example .env
# Edit .env with your values

# Frontend
cd TabeebFrontend
cp .env.local.example .env.local
# Edit .env.local with your values
```

#### Automated Setup Script (Coming Soon)

```bash
# Run setup script to interactively configure environments
npm run setup
```

---

### ⚠️ Common Configuration Issues

| Issue | Solution |
|-------|----------|
| **"Firebase token invalid"** | Check if `FIREBASE_SERVICE_ACCOUNT_KEY` path is correct and file exists |
| **"Database connection failed"** | Verify MySQL is running and `DATABASE_URL` credentials are correct |
| **"MongoDB connection error"** | Ensure MongoDB service is running on specified port |
| **"Cloudinary upload failed"** | Verify `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are correct |
| **"CORS error"** | Add frontend URL to `ALLOWED_ORIGINS` in backend `.env` |
| **"Cannot connect to backend"** | Ensure `NEXT_PUBLIC_API_URL` matches backend `PORT` |

---

### 🚀 Production Environment Configuration

For production deployments, ensure:

1. ✅ Use strong `JWT_SECRET` (generate with `openssl rand -base64 32`)
2. ✅ Set `NODE_ENV="production"`
3. ✅ Use production database URLs (not localhost)
4. ✅ Enable HTTPS for all API endpoints
5. ✅ Restrict `ALLOWED_ORIGINS` to your production domains only
6. ✅ Use environment variables from your hosting platform (Vercel, Railway, etc.)
7. ✅ Never expose API keys in client-side code
8. ✅ Enable rate limiting and security headers

---

## 🚦 Running the Application

### Development Mode

Open three terminal windows:

#### Terminal 1: Backend Server

```bash
cd TabeebBackend/tabeeb_backend
npm run dev

# Output:
# 🚀 Server running on http://localhost:5000
# ✅ MySQL Database connected
# ✅ MongoDB connected
# ✅ Firebase Admin initialized
```

#### Terminal 2: Frontend Server

```bash
cd TabeebFrontend
npm run dev

# Output:
# ▲ Next.js 15.4.2
# - Local:        http://localhost:3000
# - Ready in 2.3s
```

#### Terminal 3: ML Server (Optional)

```bash
cd ML_Server
npm start

# Output:
# 🤖 ML Server running on http://localhost:8000
# ✅ Model loaded successfully
```

---

### Production Mode

#### Build Applications

```bash
# Build Backend
cd TabeebBackend/tabeeb_backend
npm run build
npm start

# Build Frontend
cd TabeebFrontend
npm run build
npm start
```

#### Using Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd TabeebBackend/tabeeb_backend
pm2 start npm --name "tabeeb-backend" -- start

# Start frontend
cd TabeebFrontend
pm2 start npm --name "tabeeb-frontend" -- start

# View status
pm2 status

# View logs
pm2 logs

# Save configuration
pm2 save
pm2 startup
```

---

### 🔍 Verify Installation

Once all services are running, verify:

1. **Backend Health Check**: Visit `http://localhost:5000/health`
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-02-10T12:00:00.000Z",
     "database": {
       "mysql": "connected",
       "mongodb": "connected"
     }
   }
   ```

2. **Frontend**: Visit `http://localhost:3000`
   - Should see landing page
   - Try registering a new account

3. **Database**: Check if tables were created
   ```bash
   # MySQL
   npx prisma studio
   # Opens Prisma Studio at http://localhost:5555
   
   # MongoDB
   mongosh tabeeb_records
   show collections
   ```

---

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

### 👤 Patient Journey

```mermaid
graph LR
    A[Visit Platform] --> B[Register/Login]
    B --> C[Complete Profile]
    C --> D[Search Doctors]
    D --> E[Book Appointment]
    E --> F[Upload Medical Records]
    F --> G[Consultation]
    G --> H[Receive Prescription]
    H --> I[Track Medicine Progress]
    I --> J[Follow-up/Review]
```

#### Detailed Patient Flow

1. **🔐 Registration & Authentication**
   - Visit landing page
   - Click "Register" → Select "Patient" role
   - Provide email and password
   - Verify email through Firebase
   - Redirected to profile completion

2. **📝 Profile Completion**
   - Upload profile picture
   - Enter personal details (name, age, gender, blood group)
   - Add medical history (allergies, chronic conditions)
   - Provide emergency contact information
   - Set location/city

3. **🔍 Doctor Discovery**
   - Browse doctors on homepage
   - Filter by:
     - Specialization (Cardiologist, Dermatologist, etc.)
     - Location/City
     - Consultation fee range
     - Rating (4+ stars, 5 stars)
     - Availability (Today, This Week)
   - View doctor profiles with full details

4. **📅 Appointment Booking**
   - Click "Book Appointment" on doctor profile
   - Select appointment type (In-Person / Video Call)
   - Choose available date from calendar
   - Pick time slot from available options
   - Add reason for visit (optional)
   - Confirm booking
   - Receive confirmation notification

5. **📋 Medical Records Management**
   - Navigate to "Medical Records" section
   - Upload documents (lab reports, X-rays, prescriptions):
     - Click "Upload" button
     - Select file (PDF, JPG, PNG)
     - Add title and description
     - Categorize by type
   - Organize records by date or category
   - Share specific records with doctor before consultation

6. **💬 Consultation**
   - Receive appointment reminder
   - Join video call (if virtual) or visit clinic
   - Doctor reviews shared medical records
   - Discuss symptoms and concerns
   - Receive diagnosis and treatment plan

7. **💊 Prescription Management**
   - Receive digital prescription from doctor
   - View prescription details:
     - Medicine names with dosage
     - Frequency (e.g., "3 times daily")
     - Duration (e.g., "7 days")
     - Additional instructions
   - Track medicine progress:
     - Visual progress bars
     - Start date and calculated end date
     - Status indicators (Active, Expiring, Expired, Completed)
   - Set reminders for medicine intake
   - Toggle between Tracking View and List View

8. **⭐ Post-Consultation**
   - Mark medicines as taken
   - Upload follow-up reports if needed
   - Rate and review doctor
   - Book follow-up appointment if required

---

### 👨‍⚕️ Doctor Journey

```mermaid
graph LR
    A[Register as Doctor] --> B[Verification Process]
    B --> C[Profile Setup]
    C --> D[Set Availability]
    D --> E[Receive Appointments]
    E --> F[Review Patient Records]
    F --> G[Conduct Consultation]
    G --> H[Create Prescription]
    H --> I[Track Patient Progress]
```

#### Detailed Doctor Flow

1. **🔐 Registration & Verification**
   - Register with doctor role
   - Complete basic profile
   - Upload verification documents:
     - PMDC License (required)
     - Medical Degree Certificate
     - Experience Certificate
     - ID Card
   - Submit for admin verification
   - Wait for approval (1-3 business days)
   - Receive verification confirmation

2. **🏥 Professional Profile Setup**
   - Add profile picture and banner
   - Write professional bio
   - Add specializations (multiple allowed)
   - List qualifications and degrees
   - Add experience details
   - Set consultation fees (in-person and video)
   - Add clinic address and contact
   - Set working hours for each day
   - Configure break times

3. **📅 Availability Management**
   - Access "Availability" settings
   - For each day of the week:
     - Set working hours (e.g., 9:00 AM - 5:00 PM)
     - Add break times (e.g., 1:00 PM - 2:00 PM lunch)
   - System automatically generates available slots
   - Toggle "Available for appointments" on/off
   - Block specific dates for holidays

4. **📋 Appointment Management**
   - View appointments on dashboard:
     - Upcoming appointments
     - Past consultations
     - Cancelled appointments
   - Filter by date, status, or patient
   - See patient details and reason for visit
   - Update appointment status:
     - Confirm booking
     - Mark as completed
     - Cancel with reason
   - Add consultation notes

5. **📂 Patient Records Review**
   - Before consultation, review:
     - Patient profile and medical history
     - Uploaded medical records (reports, X-rays)
     - Previous prescriptions from other doctors
     - Allergies and chronic conditions
   - Download or view documents in browser

6. **💊 Prescription Creation**
   - After consultation, create prescription:
     - Click "Create Prescription" for appointment
     - Add medicines:
       - Medicine name
       - Dosage (e.g., "500mg")
       - Frequency (e.g., "2 times daily", "3 times daily")
       - Duration (e.g., "7 days", "14 days")
       - Additional instructions
     - Add multiple medicines to same prescription
     - Save and send to patient
   - Patient receives instant notification
   - Prescription appears in patient's dashboard with progress tracking

7. **📊 Dashboard & Analytics**
   - View statistics:
     - Total appointments
     - Completed consultations
     - Pending appointments
     - Total earnings
   - Check patient reviews and ratings
   - Monitor prescription compliance
   - Analyze appointment trends

8. **✏️ Content Creation (Optional)**
   - Write blog articles on health topics
   - Share medical knowledge
   - Educate patients
   - Build online presence

---

### 🛡️ Admin Journey

```mermaid
graph LR
    A[Admin Login] --> B[Review Doctor Applications]
    B --> C[Verify Documents]
    C --> D{Approve?}
    D -->|Yes| E[Activate Doctor Account]
    D -->|No| F[Reject with Reason]
    E --> G[Monitor Platform]
    F --> G
    G --> H[Handle Complaints]
    H --> I[View Analytics]
```

#### Detailed Admin Flow

1. **🔑 Admin Access**
   - Login with admin credentials
   - Access admin dashboard at `/admin`
   - View platform overview

2. **✅ Doctor Verification**
   - Navigate to "Pending Verifications"
   - Review doctor applications:
     - Check PMDC license validity
     - Verify medical degree
     - Review experience certificates
     - Check completeness of profile
   - Actions:
     - **Approve**: Activate doctor account
     - **Reject**: Provide rejection reason
     - **Request Info**: Ask for additional documents
   - Send notification to doctor

3. **👥 User Management**
   - View all users (patients, doctors, admins)
   - Search and filter users
   - View user details and activity
   - Actions:
     - Suspend accounts
     - Delete accounts
     - Reset passwords
     - Change roles

4. **🚨 Complaint Management**
   - Review patient complaints
   - Categorize by severity
   - Assign to team members
   - Communicate with complainants
   - Take action (warning, suspension)
   - Mark as resolved

5. **📊 Platform Analytics**
   - Monitor key metrics:
     - Total users (patients, doctors)
     - Active appointments
     - Platform revenue
     - User growth trends
   - Generate reports
   - Identify issues or trends

---

---

## 🚀 Deployment

### 📦 Deployment Options

TABEEB supports multiple deployment strategies:

1. **🐳 Docker Deployment** (Recommended)
2. **☁️ Cloud Platform Deployment** (Vercel, Railway, Render)
3. **🖥️ VPS Deployment** (DigitalOcean, AWS EC2, Oracle Cloud)
4. **🏢 On-Premise Deployment** (Self-hosted servers)

---

### 🐳 Docker Deployment (Recommended)

#### Prerequisites
- Docker & Docker Compose installed
- Domain name (optional, for production)
- SSL certificate (optional, for HTTPS)

#### Quick Deploy with Docker Compose

```bash
# 1. Clone repository
git clone https://github.com/moeez4316/TABEEB-Healthcare.git
cd TABEEB-Healthcare

# 2. Configure environment variables
# Edit .env files in TabeebBackend/tabeeb_backend and TabeebFrontend

# 3. Build and start with Docker Compose
docker-compose up -d --build

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

#### Using Pre-built Images

```bash
# Pull and run pre-built images
docker-compose -f docker-compose.prebuilt.yml up -d

# Services will be available at:
# - Frontend: http://localhost:80
# - Backend: http://localhost:5000
```

#### Docker Compose Services

The `docker-compose.yml` includes:

- **Frontend**: Next.js application (port 3000)
- **Backend**: Express.js API (port 5000)
- **MySQL**: Database (port 3306)
- **MongoDB**: Document database (port 27017)
- **Caddy**: Reverse proxy with automatic HTTPS (port 80, 443)

#### Custom Docker Build

```bash
# Build backend
cd TabeebBackend/tabeeb_backend
docker build -t tabeeb-backend .

# Build frontend
cd TabeebFrontend
docker build -t tabeeb-frontend .

# Run containers
docker run -d -p 5000:5000 --name tabeeb-backend tabeeb-backend
docker run -d -p 3000:3000 --name tabeeb-frontend tabeeb-frontend
```

#### Docker Deployment Scripts

**Windows (PowerShell):**
```powershell
.\build-and-push.ps1
```

**Linux/Mac:**
```bash
chmod +x build-and-push.sh
./build-and-push.sh
```

---

### ☁️ Cloud Platform Deployment

#### 1. Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd TabeebFrontend
vercel --prod

# Configure environment variables in Vercel Dashboard
```

**Backend on Railway:**

1. Visit [Railway.app](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `TabeebBackend/tabeeb_backend`
4. Add environment variables
5. Railway will auto-deploy

**Databases:**
- Railway provides managed MySQL and MongoDB
- Or use MongoDB Atlas for MongoDB

---

#### 2. Render (Full Stack)

**Deploy Backend:**

1. Visit [Render.com](https://render.com/)
2. New → Web Service
3. Connect GitHub repo
4. Root directory: `TabeebBackend/tabeeb_backend`
5. Build command: `npm install && npx prisma generate && npm run build`
6. Start command: `npm start`
7. Add environment variables
8. Create

**Deploy Frontend:**

1. New → Static Site
2. Root directory: `TabeebFrontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `.next`
5. Add environment variables
6. Create

---

#### 3. AWS EC2 Deployment

**Setup EC2 Instance:**

```bash
# 1. Connect to EC2
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install MySQL and MongoDB
sudo apt-get install mysql-server mongodb

# 4. Install PM2
sudo npm install -g pm2

# 5. Clone repository
git clone https://github.com/moeez4316/TABEEB-Healthcare.git
cd TABEEB-Healthcare

# 6. Setup backend
cd TabeebBackend/tabeeb_backend
npm install
npx prisma generate
npx prisma db push
pm2 start npm --name "tabeeb-backend" -- start

# 7. Setup frontend
cd ../../TabeebFrontend
npm install
npm run build
pm2 start npm --name "tabeeb-frontend" -- start

# 8. Save PM2 configuration
pm2 save
pm2 startup

# 9. Setup Nginx reverse proxy
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/tabeeb
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/tabeeb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

#### 4. Oracle Cloud (Free Tier)

Use the included deployment script:

```bash
chmod +x deploy-oracle.sh
./deploy-oracle.sh
```

This script will:
1. Setup Oracle Cloud compute instance
2. Install dependencies
3. Configure firewall
4. Deploy application with Docker
5. Setup automatic SSL with Caddy

---

### 🔒 SSL/HTTPS Configuration

#### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

#### Using Caddy (Automatic HTTPS)

Caddy in `docker-compose.yml` automatically handles SSL:

```yaml
caddy:
  image: caddy:2
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
```

**Caddyfile:**
```
your-domain.com {
    reverse_proxy frontend:3000
    
    handle /api/* {
        reverse_proxy backend:5000
    }
}
```

---

### 📊 Post-Deployment Checklist

- [ ] **Environment Variables**: All secrets configured securely
- [ ] **Database**: Migrations run successfully
- [ ] **SSL**: HTTPS enabled and working
- [ ] **Firewall**: Only necessary ports open (80, 443)
- [ ] **Monitoring**: Error tracking setup (Sentry, LogRocket)
- [ ] **Backups**: Automated database backups configured
- [ ] **Performance**: CDN configured for static assets
- [ ] **Security**: Security headers enabled
- [ ] **Testing**: All critical paths tested in production
- [ ] **Documentation**: Deployment process documented

---

### 🔍 Monitoring & Maintenance

#### Application Monitoring

```bash
# View logs with PM2
pm2 logs

# Monitor CPU and memory
pm2 monit

# Check application status
pm2 status
```

#### Database Backups

**MySQL Backup:**
```bash
# Automated daily backup
0 2 * * * /usr/bin/mysqldump -u root -p'password' tabeeb > /backups/tabeeb_$(date +\%Y\%m\%d).sql
```

**MongoDB Backup:**
```bash
# Automated daily backup
0 2 * * * /usr/bin/mongodump --db tabeeb_records --out /backups/mongo_$(date +\%Y\%m\%d)
```

#### Health Checks

```bash
# Backend health check
curl https://your-domain.com/api/health

# Frontend health check
curl https://your-domain.com/

# Database connection check
curl https://your-domain.com/api/health/db
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 🐛 Installation Issues

##### Issue: `npm install` fails with ERROR

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

##### Issue: Prisma Client not generated

**Solution:**
```bash
# Generate Prisma Client
npx prisma generate

# If still fails, try:
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

##### Issue: Port already in use

**Solution:**
```bash
# Find process using port (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Kill process (Windows PowerShell)
Stop-Process -Id <PID> -Force

# Find process using port (Linux/Mac)
lsof -i :3000

# Kill process (Linux/Mac)
kill -9 <PID>
```

---

#### 🔥 Firebase Issues

##### Issue: "Firebase token invalid" error

**Solutions:**
1. Check if `serviceAccountKey.json` exists in correct location
2. Verify JSON file is valid (not corrupted)
3. Ensure file path in `.env` is correct
4. Check if Firebase project is active

```bash
# Verify Firebase config
node -e "console.log(require('./config/serviceAccountKey.json'))"
```

##### Issue: "Firebase app already initialized"

**Solution:**
```typescript
// In firebase config, check for existing instance
import { getApps, initializeApp } from 'firebase/app';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
```

---

#### 💾 Database Issues

##### Issue: MySQL connection refused

**Solutions:**
1. Check if MySQL service is running:
   ```bash
   # Windows
   net start MySQL80
   
   # Linux
   sudo systemctl start mysql
   
   # Mac
   brew services start mysql
   ```

2. Verify credentials in `DATABASE_URL`
3. Check if port 3306 is open:
   ```bash
   telnet localhost 3306
   ```

##### Issue: Prisma migration failed

**Solution:**
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Push schema without migration
npx prisma db push

# If issues persist, manually create database
mysql -u root -p
CREATE DATABASE tabeeb;
EXIT;

# Then run migrations
npx prisma db push
```

##### Issue: MongoDB connection error

**Solutions:**
1. Check if MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Linux
   sudo systemctl start mongod
   
   # Mac
   brew services start mongodb-community
   ```

2. Verify `MONGODB_URI` format
3. Check MongoDB logs:
   ```bash
   # Linux/Mac
   tail -f /var/log/mongodb/mongod.log
   
   # Windows
   cat C:\Program Files\MongoDB\Server\6.0\log\mongod.log
   ```

---

#### 🌐 CORS Issues

##### Issue: CORS error when accessing API

**Solution:**

1. Add frontend URL to backend CORS configuration:

```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-domain.com'
  ],
  credentials: true
}));
```

2. Update `.env` file:
```env
ALLOWED_ORIGINS="http://localhost:3000,https://your-domain.com"
```

---

#### 📦 Build Issues

##### Issue: Next.js build fails

**Solutions:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear TypeScript cache
rm -rf .tsbuildinfo

# Rebuild
npm run build
```

##### Issue: TypeScript errors during build

**Solution:**
```bash
# Check TypeScript errors
npm run type-check

# If errors are in node_modules, try:
npm install --legacy-peer-deps

# Update TypeScript
npm install -D typescript@latest
```

---

#### 🔐 Authentication Issues

##### Issue: Cannot login/register

**Checklist:**
1. ✅ Firebase project enabled Authentication (Email/Password)
2. ✅ Frontend has correct Firebase config
3. ✅ Backend has correct Firebase admin config
4. ✅ User email is verified (check Firebase Console)

##### Issue: "Token expired" errors

**Solution:**
```typescript
// Refresh token before API calls
const token = await auth.currentUser?.getIdToken(true);
```

---

#### 💊 Prescription Tracking Issues

##### Issue: Progress bars not updating

**Solutions:**
1. Check if dates are correctly calculated
2. Verify medicine duration is set
3. Clear React Query cache:
   ```typescript
   queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
   ```

4. Check browser console for errors

---

#### 🏥 Appointment Issues

##### Issue: No available slots showing

**Solutions:**
1. Check if doctor has set availability
2. Verify working hours are configured
3. Ensure break times don't overlap working hours
4. Check if doctor marked as "available"

```sql
-- Check doctor availability in MySQL
SELECT * FROM DoctorAvailability WHERE doctorId = 'doctor-id';
SELECT * FROM BreakTime WHERE doctorId = 'doctor-id';
```

---

#### 🚀 Performance Issues

##### Issue: Slow page load times

**Solutions:**
1. Enable Next.js Image Optimization
2. Implement lazy loading:
   ```typescript
   import dynamic from 'next/dynamic';
   const Component = dynamic(() => import('./Component'));
   ```

3. Check database query performance
4. Add database indexes:
   ```prisma
   @@index([field])
   ```

5. Use Redis for caching (optional)

---

#### 🐳 Docker Issues

##### Issue: Docker containers won't start

**Solutions:**
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose up --build

# Remove volumes and rebuild
docker-compose down -v
docker-compose up --build
```

##### Issue: "Cannot connect to Docker daemon"

**Solution:**
```bash
# Windows: Start Docker Desktop

# Linux: Start Docker service
sudo systemctl start docker

# Mac: Ensure Docker Desktop is running
```

---

### 📞 Getting Help

If you're still experiencing issues:

1. **Check existing issues**: [GitHub Issues](https://github.com/moeez4316/TABEEB-Healthcare/issues)
2. **Create new issue**: Provide:
   - Error message (full stack trace)
   - Steps to reproduce
   - Environment (OS, Node version, etc.)
   - Screenshots
3. **Email support**: support@tabeeb-healthcare.com
4. **Discord community**: [Join our Discord](#) (coming soon)

---

## 📊 Recent Features & Innovations

### 🔥 Latest Updates (February 2026)

#### 💊 **Advanced Medicine Tracking System**

The most comprehensive prescription tracking system for digital healthcare platforms:

**Key Features:**
- **Duration-based Progress Calculation**: Automatic start and end date calculation based on medicine duration
- **Real-time Progress Bars**: Visual representation of treatment completion percentage
- **Smart Status Indicators**:
  - 🟢 **Active**: Medicine course in progress
  - 🟡 **Expiring**: Less than 2 days remaining (alert state)
  - 🔴 **Expired**: Past end date (requires attention)
  - ✅ **Completed**: Successfully completed treatment
- **Dual View Modes**:
  - **Tracking View**: Card-based layout with large progress indicators
  - **List View**: Compact table format for quick reference
- **Synchronized Updates**: Real-time synchronization between doctor and patient views
- **Cache Optimization**: Intelligent React Query caching for instant UI updates

**Technical Implementation:**
- Backend calculates end dates: `startDate + duration days`
- Frontend calculates progress: `(today - startDate) / (endDate - startDate) × 100%`
- Status derived from comparison of dates and progress percentage
- TanStack Query manages cache invalidation across multiple views

**User Experience Impact:**
- Patients can visualize their treatment progress at a glance
- Doctors can monitor patient compliance more effectively
- Reduces forgotten doses and improves treatment outcomes
- Professional UI with smooth animations via Framer Motion

---

#### ⚡ **Optimized Appointment System**

Revolutionary on-demand slot generation system:

**Before (Old System):**
- ❌ Pre-generated time slots stored in database
- ❌ Slots created days/weeks in advance
- ❌ Complex slot management and cleanup
- ❌ Database bloat with thousands of slot records
- ❌ Inconsistent availability updates

**After (New System):**
- ✅ **95% database size reduction** (no pre-generated slots)
- ✅ On-demand slot calculation based on doctor schedules
- ✅ Real-time availability computation
- ✅ Automatic conflict detection with existing appointments
- ✅ Smart break time handling
- ✅ Instant availability updates when doctor changes schedule

**How It Works:**
```typescript
// Frontend requests available slots
GET /api/doctors/availability/:doctorId?date=2026-02-10

// Backend dynamically calculates slots:
1. Fetch doctor's working hours for that day
2. Fetch all break times
3. Fetch existing appointments
4. Calculate available time ranges
5. Generate 30-minute slots
6. Return only available slots
```

**Benefits:**
- Faster booking experience for patients
- No stale slot data
- Easier schedule management for doctors
- Better scalability for platform growth

---

#### 🎨 **Modern UI/UX Enhancements**

**Prescription Management:**
- Custom confirmation modals for critical actions
- Smooth animations and transitions
- Responsive design for all screen sizes
- Loading skeletons for better perceived performance
- Toast notifications for user feedback
- Empty states with helpful illustrations

**Dashboard Improvements:**
- Card-based layouts with hover effects
- Quick action buttons
- Status badges with color coding
- Sorting and filtering capabilities
- Search functionality
- Export options

**Performance Optimizations:**
- Image lazy loading with Next.js Image component
- Code splitting and dynamic imports
- Optimized bundle size with tree-shaking
- Font optimization with `next/font`
- Reduced JavaScript execution time

---

### 🎯 Coming Soon

#### 🎥 **Video Consultations** (In Development)

- WebRTC-based peer-to-peer video calls
- Screen sharing for reviewing documents
- Chat during video calls
- Call recording (with consent)
- Waiting room functionality
- Mobile device support

**Tech Stack:**
- WebRTC for P2P communication
- Socket.io for signaling
- TURN/STUN servers for NAT traversal
- Encrypted video streams

---

#### 💳 **Payment Integration** (Planned)

- Stripe integration for consultation fees
- PayPal support
- Razorpay for South Asian market
- Payment history and invoices
- Refund management
- Multiple currency support

---

#### 📱 **Push Notifications** (Planned)

- Appointment reminders (24h, 1h before)
- New prescription notifications
- Doctor messages
- Platform announcements
- Medicine reminders
- Review requests

**Implementation:**
- Firebase Cloud Messaging (FCM)
- Web Push API for browsers
- Background service workers
- Notification preferences

---

#### 🧠 **Enhanced AI Features** (Research Phase)

- **Symptom Analysis**: AI-powered preliminary diagnosis
- **Medical Report Analysis**: Automatic extraction of key information
- **Prescription Recommendations**: AI suggests common prescriptions
- **Health Risk Assessment**: Predict potential health risks
- **Chatbot Improvements**: More natural conversation flow

**Technologies:**
- OpenAI GPT-4 API
- Custom medical knowledge base
- Natural Language Processing (NLP)
- Machine Learning models trained on medical data

---

### 🏆 Innovation Highlights

#### 1. **Hybrid Database Architecture**

**Why Hybrid?**
- **MySQL (Prisma)**: For relational data with complex relationships
  - User profiles, appointments, prescriptions
  - ACID compliance for critical data
  - Efficient joins and queries
  
- **MongoDB (Mongoose)**: For document storage
  - Medical records with varying structures
  - Large file metadata
  - Flexible schema for diverse document types

**Benefits:**
- Best tool for each job
- Performance optimization
- Scalability for different data types

---

#### 2. **Smart Caching Strategy**

**Multi-layer Caching:**

| Layer | Technology | Purpose | TTL |
|-------|------------|---------|-----|
| **Browser** | TanStack Query | API response caching | 30s-5m |
| **CDN** | Cloudinary | Image/file delivery | Permanent |
| **Database** | Prisma | Query result caching | 1m |
| **Service Worker** | Workbox | Offline support | 24h |

**Query Invalidation:**
- Automatic invalidation on mutations
- Manual invalidation for critical updates
- Optimistic updates for instant UI feedback

---

#### 3. **Progressive Web App (PWA)**

**Features:**
- ✅ Installable on all devices
- ✅ Offline functionality
- ✅ Push notifications (coming soon)
- ✅ Background sync
- ✅ Add to home screen
- ✅ App-like experience

**Implementation:**
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});
```

**Workbox Configuration:**
- Cache-first strategy for static assets
- Network-first for API calls
- Background sync for offline actions

---

#### 4. **Type Safety Across Stack**

**End-to-End TypeScript:**
- Frontend: React components, hooks, utilities
- Backend: API routes, services, database queries
- Shared types between frontend and backend
- Zod schemas for runtime validation

**Benefits:**
- Catch errors at compile time
- Better IDE autocomplete
- Easier refactoring
- Self-documenting code

```typescript
// Shared types
interface Prescription {
  id: string;
  medicines: Medicine[];
  startDate: Date;
  patientId: string;
}

// Zod validation
const prescriptionSchema = z.object({
  medicines: z.array(medicineSchema),
  patientId: z.string().uuid(),
});
```

---

#### 5. **Security Best Practices**

**Authentication:**
- Firebase Authentication with JWT tokens
- Token refresh on expiration
- Role-based access control (RBAC)
- Protected API routes with middleware

**Data Protection:**
- Encrypted database connections (TLS)
- Input validation with Zod
- SQL injection prevention with Prisma
- XSS prevention with React
- CSRF protection
- Rate limiting on API endpoints

**File Upload Security:**
- File type validation
- File size limits
- Virus scanning (optional with ClamAV)
- Secure upload URLs with signatures

**HIPAA Compliance Considerations:**
- PHI data encryption at rest and in transit
- Access logging and audit trails
- User authentication and authorization
- Automatic session timeout
- Data backup and disaster recovery

---

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

---

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

---

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

This project is licensed under the **MIT License**.

### What this means:
- ✅ **Commercial Use**: You can use this project for commercial purposes
- ✅ **Modification**: You can modify and distribute your changes  
- ✅ **Distribution**: You can distribute the original or modified code
- ✅ **Private Use**: You can use this project privately
- ⚖️ **Attribution Required**: You must include the original license and copyright notice

### Healthcare Data Compliance
While the code is open source under MIT License, please note:
- 🏥 **HIPAA Compliance**: Ensure proper healthcare data handling in your deployment
- 🔒 **Patient Privacy**: Implement appropriate security measures for medical data
- 📋 **Local Regulations**: Comply with healthcare regulations in your jurisdiction
- 🛡️ **Security Audits**: Conduct security reviews before handling real patient data

### Disclaimer
This software is provided "as is" without warranty of any kind. The authors are not responsible for any healthcare decisions made using this platform. Always consult qualified medical professionals for medical advice.

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