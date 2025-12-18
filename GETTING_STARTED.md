# 🎯 Getting Started - Education CRM System

**Welcome!** This guide will get you up and running in minutes.

---

## 🚀 Three Ways to Get Started

Choose the method that works best for you:

### Option 1: One-Line Setup (Fastest) ⚡

**macOS/Linux:**
```bash
git clone <repository-url> && cd CRM-System && ./setup.sh && npm run dev
```

**Windows:**
```bash
git clone <repository-url> && cd CRM-System && setup.bat && npm run dev
```

Then open: http://localhost:3000

---

### Option 2: NPM Setup Command (Recommended) 📦

```bash
# 1. Clone repository
git clone <repository-url>
cd CRM-System

# 2. Run automated setup
npm run setup

# 3. Start development server
npm run dev
```

Then open: http://localhost:3000

---

### Option 3: Manual Setup (Step by Step) 🛠️

```bash
# 1. Clone repository
git clone <repository-url>
cd CRM-System

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env and update JWT_SECRET

# 4. Setup database
npx prisma db push

# 5. Seed initial data
npx tsx scripts/seed-roles-and-permissions.ts

# 6. Start server
npm run dev
```

Then open: http://localhost:3000

---

## 🔑 Default Login Credentials

After setup, login with:

- **Email:** `admin@example.com`
- **Password:** `admin123`

⚠️ **Important:** Change this password in production!

---

## ✅ Verify Installation

After starting the server, you should see:

1. ✅ Terminal shows: `Ready - started server on 0.0.0.0:3000`
2. ✅ Browser opens to login page
3. ✅ Login works with default credentials
4. ✅ Dashboard loads without errors

---

## 📚 What to Read Next

### New Users
1. [USER_GUIDE.md](./USER_GUIDE.md) - How to use the system
2. [FEATURES_README.md](./FEATURES_README.md) - What can it do?
3. [DASHBOARD_README.md](./DASHBOARD_README.md) - Dashboard overview

### Administrators
1. [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup
2. [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
3. [ACTIVITY_LOGS_README.md](./ACTIVITY_LOGS_README.md) - Monitoring

### Developers
1. [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines
2. [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) - Architecture
3. [README.md](./README.md) - Complete documentation

---

## 🆘 Having Issues?

### Server won't start?
```bash
# Check if port is in use
lsof -i :3000

# Try different port
PORT=3001 npm run dev
```

### Can't login?
```bash
# Reseed database
npm run setup:seed
```

### Database errors?
```bash
# Reset database
npm run db:reset
```

### Need more help?
- Check [SETUP_GUIDE.md - Troubleshooting](./SETUP_GUIDE.md#troubleshooting)
- Review [INSTALL_CHECKLIST.md](./INSTALL_CHECKLIST.md)
- Check error messages carefully

---

## 🎯 Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:studio        # Open database GUI
npm run db:reset         # Reset database (⚠️ deletes data)
npm run setup:seed       # Reseed data

# Setup
npm run setup            # Complete setup process
npm run setup:env        # Create .env file
npm run setup:db         # Setup database only
```

---

## 🎉 Success Checklist

You're ready to go when:

- [x] Server is running (`npm run dev`)
- [x] No errors in terminal
- [x] Browser shows login page
- [x] Can login with default credentials
- [x] Dashboard loads successfully
- [x] Navigation menu works

---

## 💡 Pro Tips

### For Development
1. Keep terminal open to see logs
2. Use `npm run db:studio` to view database
3. Check browser console for frontend errors
4. Use `ctrl+c` to stop the server

### For Testing
1. Create test data to see features
2. Try different user roles
3. Test on different browsers
4. Clear browser cache if styles look wrong

### For Production
1. Read [DEPLOYMENT.md](./DEPLOYMENT.md) first
2. Use strong JWT_SECRET
3. Use PostgreSQL instead of SQLite
4. Set up regular backups
5. Enable HTTPS

---

## 🌟 Key Features to Try First

After logging in, try these features:

### 1. Dashboard
- View real-time statistics
- See recent activity feed
- Customize theme (light/dark)

### 2. Create an Inquiry
- Click "Inquiries" in sidebar
- Click "Add New Inquiry"
- Fill in student details
- Select programs
- Save

### 3. Create a Campaign
- Click "Campaigns" in sidebar
- Click "Add New Campaign"
- Enter campaign details
- Track performance

### 4. Manage Tasks
- Click "Tasks" in sidebar
- View kanban board
- Drag cards between columns
- Create new tasks

### 5. View Reports (Admin only)
- Click "Activity Logs" for system activity
- Click "Annual Reports" for analytics
- Export to Excel or PDF

---

## 📊 System Requirements

### Minimum
- Node.js 18+
- 2GB RAM
- 1GB disk space
- Modern browser

### Recommended
- Node.js 20+
- 4GB+ RAM
- 5GB+ disk space
- Chrome/Firefox/Safari latest

---

## 🔒 Security Notes

### Development
- Default credentials are for development only
- .env file is automatically gitignored
- JWT_SECRET should be changed for production

### Production
- Use strong, random JWT_SECRET
- Change default admin password
- Use PostgreSQL instead of SQLite
- Enable HTTPS
- Set up regular backups
- Review security checklist in [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📞 Getting Help

If you're stuck:

1. ✅ Check this guide first
2. 📖 Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for details
3. ✅ Use [INSTALL_CHECKLIST.md](./INSTALL_CHECKLIST.md) to verify
4. 🔍 Search existing issues on GitHub
5. 💬 Ask for help (include error messages)

---

## 🎊 What's Included

After setup, you get:

✅ **Complete CRM System** - Full-featured application  
✅ **User Management** - Role-based access control  
✅ **Inquiry Management** - Student inquiries and tracking  
✅ **Campaign Management** - Marketing campaign tracking  
✅ **Task Management** - Kanban board with drag-and-drop  
✅ **Reports & Analytics** - Excel and PDF exports  
✅ **Activity Logging** - Complete audit trail  
✅ **Responsive Design** - Works on all devices  
✅ **Dark Mode** - Built-in theme switcher  
✅ **300+ Pages of Documentation** - Comprehensive guides  

---

## 🚀 Ready to Start?

Pick a setup method above and you'll be running in minutes!

**Need more details?** See [README_SETUP.md](./README_SETUP.md) for all setup documentation.

---

**Version:** 2.0  
**Last Updated:** November 2025  
**Status:** ✅ Production Ready

**Made with ❤️ for Education**

