# ✅ Installation Checklist

Use this checklist to ensure your CRM system is set up correctly on any computer.

---

## Pre-Installation Checklist

- [ ] **Node.js installed** (v18 or higher)
  ```bash
  node --version
  ```
  Expected: `v18.x.x` or higher

- [ ] **npm installed** (v9 or higher)
  ```bash
  npm --version
  ```
  Expected: `9.x.x` or higher

- [ ] **Git installed**
  ```bash
  git --version
  ```

- [ ] **Code editor ready** (VS Code, WebStorm, etc.)

---

## Installation Steps

### Step 1: Clone Repository ✅
- [ ] Repository cloned to local machine
  ```bash
  git clone <repository-url>
  cd CRM-System
  ```

### Step 2: Install Dependencies ✅
- [ ] Dependencies installed successfully
  ```bash
  npm install
  ```
- [ ] No error messages during installation
- [ ] `node_modules` folder created

### Step 3: Environment Variables ✅
- [ ] `.env.example` file exists in root directory
- [ ] `.env` file created (copied from `.env.example`)
  ```bash
  cp .env.example .env
  ```
- [ ] `JWT_SECRET` updated in `.env` file
- [ ] `DATABASE_URL` configured (default SQLite is fine for development)
- [ ] AWS S3 credentials added (optional, only if using S3)

### Step 4: Database Setup ✅
- [ ] Database schema pushed
  ```bash
  npx prisma db push
  ```
- [ ] `prisma/dev.db` file created
- [ ] No error messages during database setup

### Step 5: Seed Initial Data ✅
- [ ] Roles and permissions seeded
  ```bash
  npx tsx scripts/seed-roles-and-permissions.ts
  ```
- [ ] Success message displayed
- [ ] Admin user created

### Step 6: Start Development Server ✅
- [ ] Development server started
  ```bash
  npm run dev
  ```
- [ ] Server running without errors
- [ ] Port number displayed (usually 3000 or 3001)

### Step 7: Access Application ✅
- [ ] Browser opened to `http://localhost:3000` (or displayed port)
- [ ] Login page loads successfully
- [ ] No console errors in browser DevTools

### Step 8: Test Login ✅
- [ ] Logged in with default credentials:
  - Email: `admin@example.com`
  - Password: `admin123`
- [ ] Dashboard loads after login
- [ ] User menu shows admin name

---

## Post-Installation Verification

### Basic Functionality Tests

#### Dashboard
- [ ] Dashboard loads without errors
- [ ] Statistics display (may show zeros if no data)
- [ ] Recent activity section visible
- [ ] Navigation sidebar visible

#### Navigation
- [ ] All menu items clickable
- [ ] Pages load without errors:
  - [ ] Dashboard
  - [ ] Inquiries
  - [ ] Campaigns
  - [ ] Tasks
  - [ ] Programs
  - [ ] Settings

#### Create Test Data
- [ ] Created a test inquiry
- [ ] Created a test campaign
- [ ] Created a test task
- [ ] All data saved successfully

#### User Features
- [ ] Profile dropdown works
- [ ] Theme switcher works (Light/Dark)
- [ ] Logout works
- [ ] Can log back in

---

## Troubleshooting Checklist

If something isn't working, check these:

### Installation Issues
- [ ] Node.js version is 18 or higher
- [ ] No error messages in terminal
- [ ] `node_modules` folder exists and is not empty
- [ ] Internet connection stable during install

### Environment Variable Issues
- [ ] `.env` file exists in root directory
- [ ] `.env` file has `JWT_SECRET` set
- [ ] No extra spaces in `.env` values
- [ ] `.env` file not in `.gitignore` exception list

### Database Issues
- [ ] `prisma/dev.db` file exists
- [ ] No other applications using the database
- [ ] Prisma client generated (`node_modules/.prisma` exists)
- [ ] Seed script completed successfully

### Server Issues
- [ ] Port not already in use
  ```bash
  # Check what's using port 3000
  lsof -i :3000
  ```
- [ ] No firewall blocking the port
- [ ] Terminal shows "Ready" message

### Browser Issues
- [ ] Browser cache cleared
- [ ] No ad blockers interfering
- [ ] JavaScript enabled
- [ ] Browser console shows no errors

### Login Issues
- [ ] Seed script ran successfully
- [ ] Using correct email: `admin@example.com`
- [ ] Using correct password: `admin123`
- [ ] Database has user data (check with Prisma Studio)

---

## Optional Setup Checklist

### AWS S3 Setup (Optional)
- [ ] AWS account created
- [ ] S3 bucket created
- [ ] IAM user created with S3 permissions
- [ ] Access keys generated
- [ ] Credentials added to `.env`:
  - [ ] `AWS_REGION`
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_S3_BUCKET_NAME`
- [ ] Test file upload works

### Production Database Setup (Optional)
- [ ] PostgreSQL/MySQL database created
- [ ] Connection URL obtained
- [ ] `DATABASE_URL` updated in `.env`
- [ ] Database schema pushed
- [ ] Initial data seeded

---

## Development Tools Checklist

### Recommended VS Code Extensions
- [ ] ESLint
- [ ] Prettier
- [ ] TypeScript and JavaScript
- [ ] Prisma
- [ ] Tailwind CSS IntelliSense
- [ ] ES7+ React/Redux/React-Native snippets

### Useful Database Tools
- [ ] **Prisma Studio** (built-in, run with `npx prisma studio`)
  - Visual database editor
  - No installation needed
- [ ] **DB Browser for SQLite** (optional)
  - Desktop app for SQLite
  - Good for advanced queries

---

## Performance Checklist

### After Installation
- [ ] Build works without errors
  ```bash
  npm run build
  ```
- [ ] Production mode starts successfully
  ```bash
  npm start
  ```
- [ ] Pages load in under 3 seconds
- [ ] No console warnings or errors

---

## Security Checklist

### Development
- [ ] `.env` file in `.gitignore`
- [ ] `.env.example` has no real secrets
- [ ] `JWT_SECRET` is not the default value
- [ ] Database file not committed to git

### Before Production
- [ ] Strong `JWT_SECRET` generated
- [ ] Production database configured
- [ ] Default admin password changed
- [ ] HTTPS configured
- [ ] Environment variables secured
- [ ] Regular backups scheduled

---

## Final Verification

Run this command to verify everything:

```bash
# This should complete without errors
npm run build && npm start
```

If the build succeeds and server starts, your installation is complete! ✅

---

## Quick Commands Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open database GUI
npx prisma studio

# Reset database (deletes all data!)
npx prisma db push --force-reset

# Reseed database
npx tsx scripts/seed-roles-and-permissions.ts

# Check for linting errors
npm run lint
```

---

## Getting Help

If you're stuck:

1. ✅ Review this checklist completely
2. 📖 Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions
3. 🔍 Check [SETUP_GUIDE.md - Troubleshooting](./SETUP_GUIDE.md#troubleshooting)
4. 📚 Review [README.md](./README.md) for feature documentation
5. 💬 Ask for help (include error messages and what you've tried)

---

## Success! 🎉

When all boxes are checked:

✅ **Installation Complete**  
✅ **Database Ready**  
✅ **Server Running**  
✅ **Application Accessible**  
✅ **Login Working**  

**You're ready to use the Education CRM System!**

---

**Next Steps:**
1. Read [USER_GUIDE.md](./USER_GUIDE.md) to learn how to use the system
2. Explore [FEATURES_README.md](./FEATURES_README.md) to see all features
3. Check [DASHBOARD_README.md](./DASHBOARD_README.md) for dashboard features
4. Start creating inquiries and managing your data!

---

**Version:** 2.0  
**Last Updated:** November 2025  
**Status:** ✅ Production Ready

