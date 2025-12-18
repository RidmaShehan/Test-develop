# 🚀 Quick Setup Guide - Reports & Activity Logging

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install jspdf jspdf-autotable
```

### 2. Database Setup
```bash
# Run migrations
npx prisma db push

# Seed system settings
npm run seed:system-settings
```

### 3. Enable Activity Logging
1. Login as admin user
2. Go to "Activity Logs" in sidebar
3. Toggle "Enable Activity Logging" to ON
4. Click "Save Settings"

### 4. Test the System
1. Go to "Annual Reports"
2. Select year and month
3. Click "Export CSV" - should download file
4. Click "Export PDF" - should download PDF with tables

## 🔧 Configuration

### Required Environment Variables
```bash
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
```

### Optional Configuration
```bash
# For enhanced geolocation (optional)
GEOLOCATION_API_KEY="your-api-key"
```

## 📊 What You Get

### Activity Logging
- ✅ **Automatic Login/Logout Tracking**
- ✅ **IP Address & Location Detection**
- ✅ **Device & Browser Information**
- ✅ **Session Management**
- ✅ **Failed Login Monitoring**

### Report Features
- ✅ **CSV Export** - 18 columns of detailed data
- ✅ **PDF Export** - Professional multi-page reports
- ✅ **Interactive Charts** - Login trends visualization
- ✅ **Real-time Monitoring** - Live activity dashboard
- ✅ **Role-based Access** - Admin-only features

### Analytics
- ✅ **User Activity Rankings**
- ✅ **Geographic Distribution**
- ✅ **Technology Usage Patterns**
- ✅ **Time-based Analysis**
- ✅ **Success Rate Tracking**

## 🎯 User Roles & Access

### Admin Users (Full Access)
- `admin@example.com` / `password`
- `john.admin@company.com` / `admin123`

### Features Available
- ✅ View Activity Logs
- ✅ Generate Annual Reports
- ✅ Export CSV/PDF
- ✅ Configure Logging Settings
- ✅ Access All Analytics

## 📱 Usage Examples

### Generate Monthly Report
1. Go to "Annual Reports"
2. Select year: 2025
3. Select month: September
4. Click "Export PDF"
5. Download contains comprehensive analysis

### Monitor Real-time Activity
1. Go to "Activity Logs"
2. View live activity feed
3. Filter by user, activity type, or date
4. Export filtered data if needed

### Analyze Login Trends
1. Go to "Annual Reports" → "Overview"
2. View interactive login trends chart
3. See daily login/logout patterns
4. Analyze peak usage times

## 🛠️ Troubleshooting

### Export Not Working?
```bash
# Check if packages are installed
npm list jspdf jspdf-autotable

# Restart development server
npm run dev
```

### No Activity Data?
1. Check if logging is enabled in Activity Logs
2. Try logging in/out to generate test data
3. Verify database connection

### Permission Denied?
1. Ensure you're logged in as ADMIN or ADMINISTRATOR
2. Check user role in database
3. Clear browser cache and re-login

## 📈 Success Indicators

### System Working Correctly When:
- ✅ Activity Logs dashboard shows recent activities
- ✅ Annual Reports displays data and charts
- ✅ CSV export downloads with data
- ✅ PDF export generates multi-page report
- ✅ Login/Logout activities are automatically logged

### Performance Tips
- **Large Datasets**: Use month filtering for faster exports
- **Real-time Monitoring**: Activity logs update automatically
- **Export Optimization**: PDF generation may take 10-30 seconds for large datasets

## 🎉 You're Ready!

Once you see activity data in the logs and can export reports, your reporting system is fully operational!

### Next Steps
- Monitor user activity patterns
- Generate regular reports for stakeholders
- Analyze login trends for security insights
- Use geographic data for user distribution analysis

---

**Need Help?** Check the full [REPORTS_README.md](./REPORTS_README.md) for detailed documentation.
