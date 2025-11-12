# 🚀 Developer Setup Guide

## When You Pull Latest Code

Follow these steps to ensure your local database is in sync:

### Step 1: Pull Latest Code
```bash
git pull origin dev2
```

### Step 2: Install Dependencies (if package.json changed)
```bash
npm install
```

### Step 3: Apply Migrations
```bash
npx prisma migrate deploy
```
**OR** for development (creates database if doesn't exist):
```bash
npx prisma migrate dev
```

### Step 4: Generate Prisma Client
```bash
npx prisma generate
```

### Step 5: Verify Everything Works
```bash
npx prisma migrate status
```

## ✅ What Success Looks Like

You should see:
- "Database schema is up to date!"
- No pending migrations
- `hourlyConsultationRate` field in doctor table

## 🔧 If You Get Migration Errors

### Error: "Migration failed to apply cleanly to shadow database"

**Solution:**
```bash
# Mark problematic migrations as applied
npx prisma migrate resolve --applied <migration-name>

# Then apply new migrations
npx prisma migrate dev
```

### Error: "Drift detected"

**Solution - Use db push (development only!):**
```bash
npx prisma db push
npx prisma generate
```

## 📝 Recent Changes

- **2025-11-12**: Added `hourlyConsultationRate` field to doctor model
  - Migration: `20251112000000_add_doctor_hourly_consultation_rate`
  - Field type: `Decimal(10, 2)` - stores PKR amount per hour
  - Optional field (nullable)

## ⚠️ Important Notes

1. **Never delete migrations** from the `prisma/migrations` folder
2. **Never edit applied migrations** - create new ones instead
3. **Always run `npx prisma generate`** after schema changes
4. For production, use `npx prisma migrate deploy` (not `dev`)
