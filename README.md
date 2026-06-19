<div align="center">

# 🏥 TABEEB Healthcare Platform


A full-stack digital healthcare platform connecting patients and doctors, built for the Pakistani market.

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black)]()
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20Express-339933)]()
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6)]()
[![MySQL](https://img.shields.io/badge/DB-MySQL%20%2B%20MongoDB-4479A1)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)]()
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)]()

</div>

---

## Overview

TABEEB is a monorepo healthcare platform with three user roles — **Patients**, **Doctors**, and **Admins**. It handles the complete care journey: discovering doctors, booking appointments, video consultations via Jitsi, digital prescriptions, medical record management, online payments (Safepay/PKR), and AI-assisted health queries powered by Google Gemini.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| **State** | Redux Toolkit + Redux Persist, TanStack Query v5 |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MySQL via Prisma ORM |
| **Auth** | Firebase Auth (client) + Firebase Admin SDK (server) |
| **Realtime** | Socket.io with optional Redis adapter |
| **Video Calls** | Jitsi Meet (self-hosted, JWT-based) |
| **File Storage** | Cloudinary |
| **Payments** | Safepay (PKR, sandbox + production) |
| **Email** | Resend (transactional emails via `tabeebemail.me`) |
| **AI** | Google Gemini API (`gemini-2.5-flash`) |
| **Infra** | Docker, Nginx, PM2 |

---

## Project Structure

```
TABEEB-Healthcare/
│
├── TabeebFrontend/                    # Next.js 15 app
│   └── src/
│       ├── app/
│       │   ├── Patient/               # Patient dashboard
│       │   │   ├── dashboard/
│       │   │   ├── appointments/
│       │   │   ├── book-appointment/
│       │   │   ├── prescriptions/
│       │   │   ├── medication/
│       │   │   ├── medical-records/
│       │   │   ├── doctors/
│       │   │   ├── payment/
│       │   │   ├── reviews/
│       │   │   ├── blogs/
│       │   │   ├── ai-chat/
│       │   │   └── image-analysis/
│       │   ├── Doctor/                # Doctor dashboard
│       │   │   ├── Dashboard/
│       │   │   ├── Appointments/
│       │   │   ├── Calendar/
│       │   │   ├── availability/
│       │   │   ├── verification/
│       │   │   ├── Reviews/
│       │   │   ├── blogs/
│       │   │   └── ai-chat/
│       │   ├── admin/                 # Admin panel
│       │   │   ├── dashboard/
│       │   │   ├── verification/
│       │   │   ├── users/
│       │   │   ├── doctors/
│       │   │   ├── analytics/
│       │   │   ├── complaints/
│       │   │   ├── financial-aid/
│       │   │   ├── payments/
│       │   │   ├── inbox/
│       │   │   ├── platform-reviews/
│       │   │   ├── blogs/
│       │   │   ├── admins/
│       │   │   └── login/
│       │   ├── auth/                  # Login, registration, role selection
│       │   ├── doctors/               # Public doctor discovery
│       │   ├── blogs/                 # Public blog listing
│       │   └── landing-page/
│       ├── components/
│       ├── lib/                       # API clients, hooks
│       ├── store/                     # Redux slices & store
│       └── types/
│
├── TabeebBackend/
│   └── tabeeb_backend/
│       └── src/
│           ├── routes/                # 20 route files (see API section)
│           ├── controllers/           # 25 controllers
│           ├── services/              # Business logic
│           ├── middleware/            # Auth, rate limiter, validators
│           ├── realtime/              # Socket.io server
│           ├── lib/                   # Prisma + Mongoose clients
│           ├── config/                # Firebase, Resend config
│           └── utils/                 # Auto-slot generation, scrapers
│
├── TabeebBackend/ML_Server/           # MedLlama Node.js service (legacy)
├── docker-compose.yml
├── docker-compose.prebuilt.yml
├── nginx/
├── start-local.ps1                    # Windows startup script
└── start-local.sh                     # Linux/Mac startup script
```

---

## Features

### Patient
- Browse and filter doctors by specialization, location, fee, rating
- Book in-person or video appointments
- Online payment via Safepay (PKR)
- Track prescriptions with progress tracking and status (Active / Expiring / Expired)
- Upload and manage medical records (images, PDFs, reports) via Cloudinary
- AI health assistant (Gemini) — medical chat and image analysis
- Medicine alternative search with live prices scraped from dvago.pk
- Post-consultation reviews for doctors
- PWA — installable on mobile and desktop

### Doctor
- Manage professional profile, qualifications, specializations, fees
- Submit PMDC license for verification (live PMDC API lookup + DB cache)
- Set weekly availability templates; slots auto-generated 30 days ahead (runs daily at 2 AM)
- Accept/cancel appointments; update status
- Create digital prescriptions with diagnosis, medicines, dosage, duration
- Conduct video consultations via Jitsi (doctor is moderator with JWT; patient joins via lobby)
- Write and publish blog articles
- AI chat assistant

### Admin
- Separate login with username/password + TOTP 2FA
- Review and approve/reject doctor PMDC verification
- Full user management (patients, doctors, admin accounts)
- Platform analytics dashboard
- Manage complaints, financial aid requests, platform reviews
- Admin mailbox (inbox)
- Bootstrap superadmin on first startup via env config

### Realtime (Socket.io)
- Authenticated connections: Firebase token for patients/doctors, JWT for admins
- Room-based broadcasting: `user:{uid}`, `role:{role}`, `doctor:{uid}`, `patient:{uid}`
- Events: `appointment.updated`, `verification.updated`
- Optional Redis adapter for horizontal scaling

### Transactional Emails (Resend)
- Appointment confirmation, doctor notification, cancellation, reminder
- Prescription ready notification
- Verification approved / rejected
- Welcome email for new users
- OTP / magic-link for email verification and password reset
- Admin credentials email with TOTP setup instructions

---

## API Routes

| Prefix | Description |
|---|---|
| `GET /api/health` | Health check |
| `/api/user` | User profile |
| `/api/auth` | OTP, verify-link, password reset |
| `/api/doctor` | Doctor profiles, public search |
| `/api/patient` | Patient data |
| `/api/appointments` | Booking, status management |
| `/api/availability` | Weekly templates, daily slots |
| `/api/prescriptions` | Prescription CRUD |
| `/api/records` | Medical records (Cloudinary + MySQL) |
| `/api/video-calls` | Jitsi token generation |
| `/api/reviews` | Doctor ratings & reviews |
| `/api/platform-reviews` | Platform-level reviews |
| `/api/blogs` | Doctor blog articles |
| `/api/upload` | Cloudinary file uploads |
| `/api/email` | Triggered emails |
| `/api/ai` | Gemini chat, doc summarization, medicine search |
| `/api/safepay` | Payment session, webhook, redirect |
| `/api/verification` | PMDC lookup, doctor verification |
| `/api/admin` | Admin management, analytics, complaints |

---

## Quick Start

### Prerequisites

- Node.js v18+
- MySQL 8.0+
- MongoDB (or MongoDB Atlas URI)
- Docker & Docker Compose *(recommended)*
- Firebase project
- Cloudinary account
- Resend account (for emails)
- Safepay account (for payments — sandbox available)
- Google Gemini API key

### Option A — Docker

```bash
git clone https://github.com/moeez4316/TABEEB-Healthcare.git
cd TABEEB-Healthcare

# Configure .env files (see below), then:
docker-compose up --build
```

**Windows:**
```powershell
.\start-local.ps1
```

**Linux/Mac:**
```bash
chmod +x start-local.sh && ./start-local.sh
```

Services run at:
- Frontend → `http://localhost:3000`
- Backend → `http://localhost:5002`

### Option B — Manual

```bash
# Backend
cd TabeebBackend/tabeeb_backend
npm install
cp .env.example .env          # fill in values
npx prisma generate
npx prisma db push
npm run dev                   # :5002

# Frontend (new terminal)
cd TabeebFrontend
npm install
# create .env.local (see below)
npm run dev                   # :3000
```

---

## Environment Variables

### Backend — `TabeebBackend/tabeeb_backend/.env`

```env
PORT=5002
NODE_ENV=development

# Database
DATABASE_URL="mysql://root:password@localhost:3306/tabeeb_db"

# Firebase Admin SDK
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Resend (email)
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
RESEND_REPLY_TO="support@yourdomain.com"

# Google Gemini AI
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-2.5-flash"

# Jitsi Video Calls
JITSI_APP_ID="your_app_id"
JITSI_APP_SECRET="your_app_secret"
JITSI_DOMAIN="your.jitsi.domain"

# Safepay (Pakistan payments)
SAFEPAY_API_KEY="sec_..."
SAFEPAY_SECRET_KEY="your_secret"
SAFEPAY_ENVIRONMENT="sandbox"
SAFEPAY_BASE_URL="https://sandbox.api.getsafepay.com"
SAFEPAY_WEBHOOK_URL="https://your-public-url/api/safepay/webhook"
FRONTEND_URL="http://localhost:3000"

# Admin bootstrap
BOOTSTRAP_SUPERADMIN_USERNAME="admin"
BOOTSTRAP_SUPERADMIN_EMAIL="admin@yourdomain.com"
BOOTSTRAP_SUPERADMIN_PASSWORD="SecurePassword@123"
ADMIN_JWT_SECRET="your-admin-jwt-secret"
ADMIN_SKIP_2FA=true              # set false in production

# Socket.io
WS_PATH=/ws
WS_CORS_ORIGIN=http://localhost:3000

# Redis (optional — Socket.io horizontal scaling)
# REDIS_URL=redis://:password@localhost:6379/0

# Rate limiting
RATE_LIMIT_ENABLED=false
```

### Frontend — `TabeebFrontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5002

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

NEXT_PUBLIC_JITSI_APP_ID=your_jitsi_app_id
NEXT_PUBLIC_JITSI_SECRET=your_jitsi_secret
```

> **Note:** Never commit `.env` files. All env files are gitignored.

---

## Deployment

Production uses prebuilt Docker images with Nginx as reverse proxy:

```bash
# Build and push images (Windows)
.\build-and-push.ps1

# Deploy (Linux server)
./deploy-prebuilt.sh
```

For HTTPS, run `nginx/init-letsencrypt.sh` first to provision SSL certificates. The deploy script registers a cron job for automatic renewal.

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "feat: your feature"`
4. Open a Pull Request against `dev`

---

## License

MIT License
