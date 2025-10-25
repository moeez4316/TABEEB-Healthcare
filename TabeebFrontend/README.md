# TABEEB Frontend 💊

> A modern, responsive healthcare platform built with Next.js 15, TypeScript, and Tailwind CSS.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [User Roles & Dashboards](#user-roles--dashboards)
- [Key Features](#key-features)
- [PWA Support](#pwa-support)
- [Styling & Theming](#styling--theming)
- [State Management](#state-management)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🌟 Overview

TABEEB Frontend is a cutting-edge healthcare web application that provides:

- **Patient Portal**: Book appointments, manage medical records, AI health chat
- **Doctor Portal**: Manage availability, appointments, prescriptions, patient records
- **Admin Portal**: Verify doctors, view analytics, manage platform
- **Progressive Web App**: Installable on all devices
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Mobile-first, works on all screen sizes

## 🛠 Tech Stack

### Core Technologies
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide React icons
- **Animations**: Framer Motion
- **State Management**: Redux Toolkit
- **Forms**: React Hook Form
- **Authentication**: Firebase Authentication

### Key Dependencies
- **next-pwa**: Progressive Web App support
- **@tanstack/react-query**: Server state management
- **firebase**: Authentication and real-time features
- **framer-motion**: Smooth animations
- **lucide-react**: Beautiful icons
- **date-fns**: Date manipulation
- **recharts**: Data visualization

## ✨ Features

### For Patients
- 🔐 Secure authentication (email/password, Google)
- 👨‍⚕️ Browse and search doctors by specialty
- 📅 Book appointments with real-time slot availability
- 💬 AI-powered health chat assistant
- 📋 Manage medical records (upload, view, delete)
- 💊 View prescriptions from doctors
- 🔔 Real-time notifications
- 👤 Profile management with avatar upload

### For Doctors
- ✅ Multi-step verification process
- 📅 Set availability and manage schedule
- 🏥 View and manage appointments
- 💊 Create digital prescriptions
- 📊 Dashboard with statistics
- 👥 Patient management
- 📝 Appointment history
- 💳 Profile with fees and specialization

### For Admins
- 🔐 Secure admin login (separate from user auth)
- ✅ Approve/reject doctor verifications
- 📊 Comprehensive analytics dashboard
- 📈 Platform statistics and metrics
- 👥 User management overview
- 🔍 Verification document review

### General Features
- 🌙 Dark mode support
- 📱 Fully responsive (mobile, tablet, desktop)
- ⚡ Progressive Web App (PWA)
- 🎨 Beautiful UI with smooth animations
- ♿ Accessibility features
- 🔒 Secure routes with authentication guards
- 🌐 SEO optimized

## 📁 Project Structure

```
TabeebFrontend/
├── public/
│   ├── tabeeb_logo.png          # App logo
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service worker
│   └── icons/                   # PWA icons
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page (redirects)
│   │   ├── globals.css          # Global styles
│   │   ├── about/               # About page
│   │   ├── privacy-policy/      # Privacy policy
│   │   ├── landing-page/        # Marketing landing
│   │   ├── select-role/         # Role selection
│   │   ├── auth/                # Authentication
│   │   ├── Patient/             # Patient dashboard
│   │   │   ├── dashboard/
│   │   │   ├── appointments/
│   │   │   ├── book-appointment/
│   │   │   ├── doctors/
│   │   │   ├── medical-records/
│   │   │   ├── prescriptions/
│   │   │   └── ai-chat/
│   │   ├── Doctor/              # Doctor dashboard
│   │   │   ├── Dashboard/
│   │   │   ├── Appointments/
│   │   │   ├── availability/
│   │   │   ├── verification/
│   │   │   └── Calendar/
│   │   └── admin/               # Admin panel
│   │       ├── login/
│   │       ├── dashboard/
│   │       ├── verification/
│   │       └── analytics/
│   ├── components/              # Reusable components
│   │   ├── Sidebar.tsx
│   │   ├── SidebarAdmin.tsx
│   │   ├── SidebarDoctor.tsx
│   │   ├── Toast.tsx
│   │   ├── RouteGuard.tsx
│   │   ├── VerificationGuard.tsx
│   │   ├── appointment/
│   │   ├── prescription/
│   │   ├── profile/
│   │   ├── shared/
│   │   └── VideoCall/
│   ├── lib/                     # Utilities
│   │   ├── firebase.ts          # Firebase config
│   │   ├── auth-context.tsx     # Auth provider
│   │   ├── dateUtils.ts
│   │   └── profile-utils.ts
│   ├── store/                   # Redux store
│   │   ├── store.ts
│   │   ├── StoreProvider.tsx
│   │   └── slices/
│   │       ├── patientSlice.ts
│   │       └── doctorSlice.ts
│   ├── types/                   # TypeScript types
│   │   ├── index.ts
│   │   ├── appointment.ts
│   │   └── prescription.ts
│   └── middleware.ts            # Next.js middleware
├── .env.local                   # Environment variables
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── package.json
```

## ✅ Prerequisites

Before you begin, ensure you have:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version

### Required Accounts
- Firebase project for authentication
- Backend API running (see Backend README)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/moeez4316/TABEEB-Healthcare.git
cd TABEEB-Healthcare/TabeebFrontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env.local` file in the root directory with your configuration.

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5002

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# App Configuration
NEXT_PUBLIC_APP_NAME=TABEEB
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password and Google)
4. Go to Project Settings > General
5. Scroll to "Your apps" and click Web icon
6. Copy the Firebase config values to `.env.local`

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

Application will start at `http://localhost:3000`

### Build for Production

```bash
# Create optimized production build
npm run build

# Test production build locally
npm start
```

### Lint and Type Check

```bash
# Run ESLint
npm run lint

# Type check with TypeScript
npx tsc --noEmit
```

## 📦 Building for Production

### Production Build Process

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Build application
npm run build
```

This will:
- ✅ Compile TypeScript
- ✅ Optimize images and assets
- ✅ Generate static pages
- ✅ Create service worker for PWA
- ✅ Bundle and minify code

### Build Output

```
.next/
├── static/          # Static assets
├── server/          # Server-side code
└── standalone/      # Standalone deployment
```

## 👥 User Roles & Dashboards

### Patient Dashboard (`/Patient/dashboard`)
- View upcoming appointments
- Quick actions (book appointment, AI chat)
- Medical records summary
- Health statistics

### Doctor Dashboard (`/Doctor/Dashboard`)
- Today's appointments
- Pending verifications status
- Quick actions (set availability, view appointments)
- Statistics (total patients, appointments)

### Admin Dashboard (`/admin/dashboard`)
- Platform statistics
- Pending verifications count
- Quick actions (review verifications, analytics)
- Recent activity

## 🎨 Key Features

### 1. Authentication System
- **Patient/Doctor**: Firebase authentication
- **Admin**: JWT-based authentication (separate)
- **Route Guards**: Automatic redirection based on role
- **Verification Guard**: Doctors must be verified

### 2. Appointment System
- Real-time slot availability
- Filter by date and specialty
- Booking confirmation
- Status tracking (pending, confirmed, completed, cancelled)
- Appointment history

### 3. Medical Records
- Upload documents (PDF, images)
- Cloudinary-based storage
- View and download records
- Delete functionality

### 4. Prescription Management
- Digital prescription creation
- View prescription history
- Medication details
- Duration tracking

### 5. Admin Analytics
- Verification status breakdown
- Platform growth metrics
- Approval/rejection rates
- Real-time statistics

### 6. Dark Mode
- System preference detection
- Manual toggle
- Persistent preference
- Smooth transitions

## 📱 PWA Support

### Features
- ✅ Installable on all devices
- ✅ Offline fallback page
- ✅ Service worker caching
- ✅ App-like experience
- ✅ Custom app icons

### Installation
Users can install TABEEB as an app:
- **Desktop**: Click install icon in address bar
- **Mobile**: "Add to Home Screen" option
- **iOS**: Share > Add to Home Screen

### Configuration
See `public/manifest.json` and `next.config.ts` for PWA settings.

## 🎨 Styling & Theming

### Tailwind CSS
- Utility-first CSS framework
- Custom color palette (teal, emerald primary)
- Responsive breakpoints
- Dark mode classes

### Color Scheme
```css
Primary: Teal (500-600)
Secondary: Emerald (500-600)
Success: Green (500-600)
Error: Red (500-600)
Warning: Amber (500-600)
```

### Dark Mode
```tsx
// Use dark mode classes
<div className="bg-white dark:bg-slate-900">
  <p className="text-slate-900 dark:text-white">Content</p>
</div>
```

## 🗃 State Management

### Redux Toolkit
- Global state management
- Patient profile state
- Doctor profile state
- Unsaved changes tracking

### React Query
- Server state management
- Automatic caching
- Background refetching
- Optimistic updates

### Local Storage
- Auth tokens
- User preferences
- Admin tokens (separate)

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables on Vercel
1. Go to Project Settings > Environment Variables
2. Add all variables from `.env.local`
3. Redeploy application

### Other Platforms

#### Netlify
```bash
# Build command
npm run build

# Publish directory
.next
```

#### Custom Server
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Domain Configuration
1. Update `NEXT_PUBLIC_APP_URL` in environment variables
2. Configure CORS in backend for your domain
3. Update Firebase authorized domains

## 🔧 Troubleshooting

### Common Issues

#### Build Errors

**ESLint Errors**
```bash
# Fix automatically
npm run lint -- --fix
```

**TypeScript Errors**
```bash
# Check for type errors
npx tsc --noEmit

# Generate types
npm run build
```

#### Runtime Issues

**Firebase Not Initialized**
- Check environment variables are set
- Verify Firebase config is correct
- Ensure Firebase project is active

**API Connection Failed**
- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings on backend

**Images Not Loading**
- Configure `remotePatterns` in `next.config.ts`
- Check Cloudinary URLs are accessible

### Development Tips

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for outdated packages
npm outdated

# Update packages
npm update
```

## 📊 Performance Optimization

### Implemented Optimizations
- ✅ Image optimization with Next.js Image
- ✅ Code splitting and lazy loading
- ✅ Static page generation where possible
- ✅ API route caching
- ✅ Font optimization
- ✅ Minified production build

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)

## 🔒 Security Best Practices

- ✅ Environment variables for sensitive data
- ✅ Firebase security rules configured
- ✅ HTTPS in production
- ✅ Input validation and sanitization
- ✅ Protected API routes
- ✅ Secure authentication flow
- ✅ XSS protection
- ✅ CSRF protection

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new files
- Follow ESLint configuration
- Use Tailwind CSS for styling
- Write meaningful commit messages

## 📝 License

This project is part of the TABEEB Healthcare platform.

## 🤝 Support

For issues and questions:
- Email: support@tabeeb.com
- GitHub Issues: [Create an issue](https://github.com/moeez4316/TABEEB-Healthcare/issues)

## 🎯 Future Enhancements

- [ ] Video consultation integration (WebRTC)
- [ ] Real-time chat between doctor and patient
- [ ] Push notifications
- [ ] Payment gateway integration
- [ ] Pharmacy integration
- [ ] Lab test booking
- [ ] Mobile apps (React Native)
- [ ] Multi-language support (Urdu)

---

**Built with ❤️ for Pakistan's healthcare** 🇵🇰