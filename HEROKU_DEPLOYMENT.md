# TABEEB Healthcare - Heroku Deployment & Safe Migration Guide

This guide provides complete instructions to deploy the TABEEB Healthcare application (Backend API & Frontend Web) to **Heroku** without Docker containers.

---

## 🏗 System Architecture on Heroku

```
┌───────────────────────────────────┐        ┌───────────────────────────────────┐
│   TabeebFrontend                  │        │   TabeebBackend                   │
│   (Next.js App)                   │ ──────>│   (Express API & WebSockets)      │
│   App: tabeeb-frontend-web        │        │   App: tabeeb-backend-api         │
└───────────────────────────────────┘        └─────────────────┬─────────────────┘
                                                               │
                                                               │ Safe Migrations
                                                               │ (`prisma migrate deploy`)
                                                               v
                                                 ┌───────────────────────────┐
                                                 │   MySQL Database          │
                                                 │   (JawsDB / PlanetScale / │
                                                 │   Aiven / AWS RDS)        │
                                                 └───────────────────────────┘
```

---

## 🔒 Safe Database Migrations (No `db push` Required)

### Why NOT `prisma db push`?
`npx prisma db push` is designed for prototyping. In production, it can drop columns, reset tables, or corrupt relational schemas without audit trails.

### The Production Migration Solution: `Procfile` Release Phase
Heroku supports a **`release` process** in the `Procfile`. When configured:
```procfile
release: npx prisma migrate deploy
web: npm start
```
1. Before every deployment, Heroku executes `npx prisma migrate deploy` in an isolated environment.
2. Prisma reads your checked-in SQL migration history from `prisma/migrations/`.
3. Only new, pending SQL migrations are applied sequentially and safely.
4. If a migration fails, the deployment halts and the existing web dynos remain running safely.

---

## 🛠 Prerequisites

1. **Heroku Account & Heroku CLI**: Download and install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).
2. **Git**: Ensure your local codebase is committed to Git.
3. **Managed MySQL Database**: Heroku JawsDB add-on or external MySQL database (e.g. PlanetScale, Aiven, AWS RDS, GCP Cloud SQL).

---

## 🚀 Step 1: Login to Heroku CLI

Run the following command in your terminal to authenticate:
```bash
heroku login
```

---

## 🗄 Step 2: Deploy the Backend API (`tabeeb-backend-api`)

### 1. Create the Backend Heroku App
```bash
heroku create tabeeb-backend-api
```

### 2. Provision MySQL Database
If using the **JawsDB MySQL** add-on on Heroku:
```bash
heroku addons:create jawsdb:kitefin --app tabeeb-backend-api
```
*(Note: JawsDB automatically sets the `JAWSDB_URL` environment variable on Heroku. Copy it to `DATABASE_URL`)*

```bash
# Set DATABASE_URL from JAWSDB_URL
heroku config:set DATABASE_URL=$(heroku config:get JAWSDB_URL --app tabeeb-backend-api) --app tabeeb-backend-api
```

If using an **external MySQL database**, set `DATABASE_URL` directly:
```bash
heroku config:set DATABASE_URL="mysql://username:password@hostname:3306/dbname?sslmode=require" --app tabeeb-backend-api
```

### 3. Set Backend Environment Variables
Set all required application secrets and configuration settings:

```bash
# General Server Settings
heroku config:set NODE_ENV=production --app tabeeb-backend-api
heroku config:set FRONTEND_URL="https://tabeeb-frontend-web.herokuapp.com" --app tabeeb-backend-api
heroku config:set ADMIN_JWT_SECRET="your-super-secret-admin-jwt-key" --app tabeeb-backend-api
heroku config:set BOOTSTRAP_SUPERADMIN_PASSWORD="YourSecureBootstrapPassword123!" --app tabeeb-backend-api
heroku config:set RATE_LIMIT_ENABLED=true --app tabeeb-backend-api

# Realtime & WebSockets
heroku config:set WS_CORS_ORIGIN="https://tabeeb-frontend-web.herokuapp.com" --app tabeeb-backend-api
heroku config:set REDIS_URL="redis://:password@redis-host:6379/0" --app tabeeb-backend-api

# Firebase Admin SDK
heroku config:set FIREBASE_PROJECT_ID="tabeeb-001" --app tabeeb-backend-api
heroku config:set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com" --app tabeeb-backend-api
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" --app tabeeb-backend-api

# Cloudinary Storage
heroku config:set CLOUDINARY_CLOUD_NAME="your-cloud-name" --app tabeeb-backend-api
heroku config:set CLOUDINARY_API_KEY="your-api-key" --app tabeeb-backend-api
heroku config:set CLOUDINARY_API_SECRET="your-api-secret" --app tabeeb-backend-api

# Jitsi Video Call
heroku config:set JITSI_APP_ID="tabeeb-healthcare" --app tabeeb-backend-api
heroku config:set JITSI_APP_SECRET="035f90449ce32ae3ad5649d78b536236a197caabe324cd3300deba4ec9b8e13c" --app tabeeb-backend-api
heroku config:set JITSI_DOMAIN="cloud.sehat.dpdns.org" --app tabeeb-backend-api

# Gemini AI Integration
heroku config:set GEMINI_API_KEY="your-gemini-api-key" --app tabeeb-backend-api

# Resend Email & Safepay Payments (Optional)
heroku config:set RESEND_API_KEY="re_xxxxxx" --app tabeeb-backend-api
heroku config:set SAFEPAY_API_KEY="sec_xxxxxx" --app tabeeb-backend-api
heroku config:set SAFEPAY_SECRET_KEY="your-safepay-secret" --app tabeeb-backend-api
```

### 4. Deploy Backend Code using Git Subtree
To deploy the backend subdirectory (`TabeebBackend/tabeeb_backend`) to your backend Heroku app:

```bash
# Add the backend Heroku git remote
git remote add heroku-backend https://git.heroku.com/tabeeb-backend-api.git

# Push the backend directory to Heroku
git subtree push --prefix TabeebBackend/tabeeb_backend heroku-backend main
```

### 5. Verify Backend Release & Migrations
Heroku will build the app, generate Prisma Client (`prisma generate && tsc`), and run the release process:
```bash
# Stream live logs to verify safe migration execution
heroku logs --app tabeeb-backend-api --tail
```
You should see:
```text
Running release command...
Prisma schema loaded from prisma/schema.prisma
Datasource "db": MySQL database
23 migrations found in prisma/migrations
No pending migrations to apply. / Applied 23 migrations.
State changed from starting to up
```

---

## 🌐 Step 3: Deploy the Frontend (`tabeeb-frontend-web`)

> **IMPORTANT**: In Next.js, `NEXT_PUBLIC_*` environment variables are baked into the static build during `next build`. You **MUST** set the Heroku environment variables **BEFORE** deploying the frontend code!

### 1. Create the Frontend Heroku App
```bash
heroku create tabeeb-frontend-web
```

### 2. Set Frontend Environment Variables (BEFORE Deploying Code)
Set the API URL to point to your live backend Heroku service:

```bash
heroku config:set NEXT_PUBLIC_API_URL="https://tabeeb-backend-api.herokuapp.com" --app tabeeb-frontend-web

# Firebase Client Configuration
heroku config:set NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key" --app tabeeb-frontend-web
heroku config:set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com" --app tabeeb-frontend-web
heroku config:set NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id" --app tabeeb-frontend-web
heroku config:set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com" --app tabeeb-frontend-web
heroku config:set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012" --app tabeeb-frontend-web
heroku config:set NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef123456" --app tabeeb-frontend-web

# Jitsi Video Call (Legacy)
heroku config:set NEXT_PUBLIC_JITSI_DOMAIN="cloud.sehat.dpdns.org" --app tabeeb-frontend-web
heroku config:set NEXT_PUBLIC_JITSI_APP_ID="tabeeb-healthcare" --app tabeeb-frontend-web

# LiveKit Video Consultation
heroku config:set LIVEKIT_API_KEY="APIMyVM2q4v6d8y" --app tabeeb-frontend-web
heroku config:set LIVEKIT_API_SECRET="jLRaKbKrmteFL0DduxV3LvAJ64H3R3JPzn2BCfVAaya" --app tabeeb-frontend-web
heroku config:set LIVEKIT_URL="wss://cloud.sehat.dpdns.org" --app tabeeb-frontend-web
heroku config:set LIVEKIT_SOCKET_URL="wss://cloud.sehat.dpdns.org/socket.io/" --app tabeeb-frontend-web
heroku config:set NEXT_PUBLIC_LIVEKIT_URL="wss://cloud.sehat.dpdns.org" --app tabeeb-frontend-web
heroku config:set NEXT_PUBLIC_LIVEKIT_SOCKET_URL="wss://cloud.sehat.dpdns.org/socket.io/" --app tabeeb-frontend-web
heroku config:set NEXT_PUBLIC_JITSI_SECRET="035f90449ce32ae3ad5649d78b536236a197caabe324cd3300deba4ec9b8e13c" --app tabeeb-frontend-web
```

### 3. Deploy Frontend Code using Git Subtree
```bash
# Add the frontend Heroku git remote
git remote add heroku-frontend https://git.heroku.com/tabeeb-frontend-web.git

# Push the frontend directory to Heroku
git subtree push --prefix TabeebFrontend heroku-frontend main
```

---

## ✅ Step 4: Post-Deployment Verification

1. **Verify Backend Health**:
   Open `https://tabeeb-backend-api.herokuapp.com/api/health` in your browser. It should return status `OK`.
2. **Verify Frontend Access**:
   Open `https://tabeeb-frontend-web.herokuapp.com/` in your browser.
3. **Verify Database Connections**:
   Log into the admin portal or sign up a user to ensure database read/write queries complete smoothly.

---

## 🛠 Summary of Configured Files

| File Path | Description |
|---|---|
| [`TabeebBackend/tabeeb_backend/Procfile`](file:///c:/Users/hamma/OneDrive/Desktop/TABEEB-Healthcare/TabeebBackend/tabeeb_backend/Procfile) | Specifies `release: npx prisma migrate deploy` & `web: npm start` |
| [`TabeebBackend/tabeeb_backend/package.json`](file:///c:/Users/hamma/OneDrive/Desktop/TABEEB-Healthcare/TabeebBackend/tabeeb_backend/package.json) | Runs `prisma generate && tsc` in `build` script |
| [`TabeebFrontend/Procfile`](file:///c:/Users/hamma/OneDrive/Desktop/TABEEB-Healthcare/TabeebFrontend/Procfile) | Specifies `web: npm start` |
| [`TabeebFrontend/package.json`](file:///c:/Users/hamma/OneDrive/Desktop/TABEEB-Healthcare/TabeebFrontend/package.json) | Runs `next start -p $PORT` to dynamically bind Heroku port |
