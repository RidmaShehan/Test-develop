# 🚀 Setup Guide - Education CRM System

## Quick Start (5 Minutes)

This guide will help you get the CRM system running on any computer in just a few steps.

---

## Prerequisites

Before you begin, make sure you have installed:

- **Node.js** version 18 or higher ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** (to clone the repository)

### Check Your Versions

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd CRM-System
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages (~2-3 minutes depending on your internet speed).

---

## Step 3: Set Up Environment Variables

### Option A: Quick Setup (Recommended for Testing)

Create a `.env` file in the root directory:

```bash
# On macOS/Linux:
cp .env.example .env

# On Windows (Command Prompt):
copy .env.example .env

# On Windows (PowerShell):
Copy-Item .env.example .env
```

Then edit `.env` and update the `JWT_SECRET`:

```env
JWT_SECRET=your-random-secret-key-here-12345
```

**Note:** For production use, generate a secure random string for `JWT_SECRET`.

### Option B: Manual Setup

Create a file named `.env` in the root directory with the following content:

```env
# Required
JWT_SECRET=your-random-secret-key-here-12345
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"

# Optional (for AWS S3 file storage)
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_S3_BUCKET_NAME=your-bucket-name
```

---

## Step 4: Set Up the Database

### Initialize Database Schema

```bash
npx prisma migrate deploy
```

This applies the Prisma migrations to your PostgreSQL database and creates all necessary tables.

### Seed Initial Data (Roles & Permissions)

```bash
npx tsx scripts/seed-roles-and-permissions.ts
```

This creates:
- Default user roles (ADMIN, COORDINATOR, VIEWER, etc.)
- Permission system
- Default admin user

---

## Step 5: Start the Development Server

```bash
npm run dev
```

The server will start and show you the URL (usually `http://localhost:3000` or `http://localhost:3001`).

---

## Step 6: Access the Application

1. Open your browser
2. Go to `http://localhost:3000` (or the port shown in terminal)
3. Login with default credentials:

**Default Admin Credentials:**
- **Email:** admin@example.com
- **Password:** admin123

---

## 🎉 Success!

Your CRM system is now running. You should see the dashboard after logging in.

---

## Optional Configuration

### Enable AWS S3 for File Storage

If you want to use AWS S3 for storing uploaded files (campaign images, WhatsApp media):

1. Create an AWS account and S3 bucket
2. Get your AWS credentials
3. Add to `.env`:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-bucket-name
```

**Note:** If AWS S3 is not configured, the system will automatically use local file storage.

---

## Troubleshooting

### Problem: Port Already in Use

**Solution:** Stop the process using the port or use a different port:

```bash
# On macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Or specify a different port:
PORT=3001 npm run dev
```

### Problem: Database Errors

**Solution:** Reset the database:

```bash
# Reset & recreate the database schema from Prisma migrations
npx prisma migrate reset --force

# Reseed data
npx tsx scripts/seed-roles-and-permissions.ts
```

### Problem: `npx tsx` Command Not Found

**Solution:** The `tsx` package is in devDependencies. Make sure you ran `npm install` first. If still not working:

```bash
npm install tsx --save-dev
```

### Problem: Cannot Login

**Solution:** Make sure you've run the seed script:

```bash
npx tsx scripts/seed-roles-and-permissions.ts
```

This creates the default admin user.

### Problem: "Module not found" Errors

**Solution:** Clear and reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Production Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Environment Variables for Production

Make sure to set secure values in production:

```env
JWT_SECRET=<use-a-long-random-secure-string>
DATABASE_URL="postgresql://user:password@host:port/database"
NODE_ENV=production
```

**Important Security Notes:**
1. Use a strong, randomly generated `JWT_SECRET`
2. Use a managed PostgreSQL provider and enable SSL
3. Enable HTTPS
4. Set up proper firewall rules
5. Regular database backups

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npx prisma studio` | Open database GUI |
| `npx prisma migrate dev` | Create/apply migrations in development |
| `npx prisma migrate deploy` | Apply migrations in production/CI |
| `npx prisma generate` | Generate Prisma client |
| `npm run lint` | Run linter |

---

## Database Management

### View Database in GUI

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit database records.

### Backup Database

```bash
# PostgreSQL backup (example)
# pg_dump "$DATABASE_URL" > backup.sql
```

### Reset Database (⚠️ Deletes all data)

```bash
npx prisma migrate reset --force
npx tsx scripts/seed-roles-and-permissions.ts
```

---

## Next Steps

After setup, check out these guides:

1. **[FEATURES_README.md](./FEATURES_README.md)** - Overview of all features
2. **[USER_GUIDE.md](./USER_GUIDE.md)** - How to use the system
3. **[DASHBOARD_README.md](./DASHBOARD_README.md)** - Dashboard features
4. **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Complete documentation index

---

## Support

If you encounter issues:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Check the [README.md](./README.md) for more details
3. Review the console output for error messages
4. Check that all prerequisites are installed
5. Make sure you followed all steps in order

---

## System Requirements

### Minimum Requirements
- **CPU:** 2 cores
- **RAM:** 2GB
- **Storage:** 1GB free space
- **OS:** Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

### Recommended Requirements
- **CPU:** 4 cores
- **RAM:** 4GB+
- **Storage:** 5GB+ free space
- **Internet:** Stable connection

---

## What Gets Created During Setup

After completing the setup, you'll have:

- ✅ Node modules installed (~500MB)
- ✅ SQLite database file (`prisma/dev.db`)
- ✅ Prisma client generated
- ✅ Environment variables configured (`.env`)
- ✅ Default admin user created
- ✅ Roles and permissions seeded
- ✅ Development server running

---

## File Storage

The system supports two storage methods:

### Local Storage (Default)
- Files stored in: `public/uploads/`
- Automatically created on first upload
- No additional configuration needed

### AWS S3 (Optional)
- Files stored in your S3 bucket
- Requires AWS credentials in `.env`
- See [Optional Configuration](#enable-aws-s3-for-file-storage)

---

## Security Checklist for Production

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use PostgreSQL/MySQL instead of SQLite
- [ ] Enable HTTPS
- [ ] Set up proper CORS policies
- [ ] Configure firewall rules
- [ ] Regular database backups
- [ ] Update all dependencies regularly
- [ ] Review and update default admin password
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging

---

**Made with ❤️ for Education**

**Version:** 2.0  
**Last Updated:** November 2025  
**Status:** ✅ Production Ready

