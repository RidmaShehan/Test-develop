# 📊 Reports & Activity Logging System

## Overview

The Education CRM system includes comprehensive reporting and activity logging capabilities that provide detailed insights into user behavior, system usage, and administrative analytics. This document covers the complete implementation and usage of the reporting system.

## 🎯 Features

### Activity Logging
- **User Login/Logout Tracking**: Automatic logging of all authentication events
- **Geographic Tracking**: IP-based location detection and logging
- **Device Information**: Browser, OS, and device type tracking
- **Session Management**: Complete session lifecycle tracking
- **Security Monitoring**: Failed login attempt tracking

### Report Generation
- **Annual Reports**: Comprehensive yearly activity analysis
- **Monthly Filtering**: Detailed monthly breakdowns
- **Export Capabilities**: CSV and PDF export functionality
- **Visual Analytics**: Interactive charts and trend analysis
- **Role-based Access**: Admin-only report access

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Next.js 15+
- Prisma database
- Required npm packages: `jspdf`, `jspdf-autotable`

### Installation
```bash
npm install jspdf jspdf-autotable
```

## 📋 Database Schema

### User Activity Log Model
```prisma
model UserActivityLog {
  id            String       @id @default(cuid())
  userId        String
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  activityType  ActivityType
  timestamp     DateTime     @default(now())
  ipAddress     String?
  userAgent     String?
  location      Json?        // { country, city, region, latitude, longitude }
  sessionId     String?
  deviceInfo    Json?        // { browser, os, device }
  isSuccessful  Boolean      @default(true)
  failureReason String?
  metadata      Json?        // Additional activity-specific data
  createdAt     DateTime     @default(now())

  @@map("user_activity_logs")
}

enum ActivityType {
  LOGIN
  LOGOUT
  SESSION_TIMEOUT
  PASSWORD_CHANGE
  PROFILE_UPDATE
  SYSTEM_ACCESS
}
```

### System Settings Model
```prisma
model SystemSettings {
  id                String   @id @default(cuid())
  key               String   @unique
  value             String
  description       String?
  isActive          Boolean  @default(true)
  requiresRestart   Boolean  @default(false)
  updatedBy         String?
  updatedAt         DateTime @updatedAt
  createdAt         DateTime @default(now())

  @@map("system_settings")
}
```

## 🔧 Implementation Guide

### 1. Activity Logging Setup

#### Enable Activity Logging
```typescript
// Navigate to Activity Logs dashboard
// Toggle "Enable Activity Logging" switch
// This updates the USER_ACTIVITY_LOGGING_ENABLED setting
```

#### Login Activity Tracking
```typescript
// In login API route (/api/auth/login/route.ts)
import { logLogin, logFailedLogin } from '@/lib/activity-logger'

// For successful login
await logLogin(user.id, request, user.token)

// For failed login
await logFailedLogin(email, request, 'Invalid credentials')
```

#### Logout Activity Tracking
```typescript
// In logout API route (/api/auth/logout/route.ts)
import { logLogout } from '@/lib/activity-logger'

// Extract user ID from token and log logout
const decoded = verifyToken(token)
await logLogout(decoded.id, request, token)
```

### 2. Report Generation

#### CSV Export
```typescript
// API endpoint: /api/reports/export?format=csv&year=2025&month=09
// Returns comprehensive CSV with 18 data columns:
// - Timestamp, Date, Time
// - User Name, Email, Role
// - Activity Type, IP Address
// - Location (Country, City, Region)
// - Device Info (Browser, OS, Device, Platform)
// - Status, Failure Reason, Session ID
```

#### PDF Export
```typescript
// API endpoint: /api/reports/export?format=pdf&year=2025&month=09
// Generates professional multi-page PDF with:
// - Executive Summary with statistics tables
// - Activity breakdown by type
// - User activity analysis (top users)
// - Role-based activity analysis
// - Geographic activity analysis
// - Technology usage analysis (browsers, OS)
// - Time-based activity analysis (hourly)
// - Recent activities detail
```

## 📊 Usage Guide

### Accessing Reports

#### 1. Navigate to Annual Reports
- Click "Annual Reports" in the sidebar
- Only accessible to ADMIN and ADMINISTRATOR roles

#### 2. Filter Reports
- **Year Selection**: Choose from current year back to 5 years
- **Month Selection**: All months or specific month
- **Refresh**: Click "Refresh Report" to update data

#### 3. View Report Sections
- **Overview**: Key metrics and login trends chart
- **User Activity**: Detailed user activity analysis
- **Geography**: Location-based activity analysis
- **Devices**: Technology usage analysis

### Exporting Reports

#### CSV Export
1. Click "Export CSV" button
2. File automatically downloads with format: `annual-report-YYYY-MM.csv`
3. Contains 18 columns of comprehensive data
4. Compatible with Excel, Google Sheets, etc.

#### PDF Export
1. Click "Export PDF" button
2. File automatically downloads with format: `annual-report-YYYY-MM.pdf`
3. Professional multi-page report with tables and analysis
4. Includes executive summary, charts, and detailed logs

### Activity Logs Dashboard

#### Accessing Activity Logs
1. Click "Activity Logs" in the sidebar
2. View real-time activity data
3. Filter by activity type, user, date range
4. Toggle logging on/off

#### Activity Log Features
- **Real-time Monitoring**: Live activity feed
- **Filtering Options**: By type, user, date, status
- **Export Capabilities**: Download filtered data
- **Settings Management**: Enable/disable logging

## 🎨 Visual Components

### Login Trends Chart
- **Interactive Bar Chart**: Daily login/logout visualization
- **Modern Design**: Gradient bars with hover effects
- **Statistics**: Total and average calculations
- **Responsive**: Horizontal scrolling for many data points

### Report Tables
- **Professional Formatting**: Color-coded headers and alternating rows
- **Comprehensive Data**: All activity details in organized tables
- **Export Ready**: Data formatted for CSV/PDF export

## 🔒 Security & Permissions

### Role-based Access
```typescript
// Only ADMIN and ADMINISTRATOR can access reports
if (user.role !== 'ADMIN' && user.role !== 'ADMINISTRATOR') {
  return NextResponse.json(
    { error: 'Access denied. Admin privileges required.' },
    { status: 403 }
  )
}
```

### Data Privacy
- **IP Address Logging**: For security and geographic analysis
- **Location Tracking**: Country/city level (not precise coordinates)
- **Session Management**: Secure session ID tracking
- **User Consent**: Activity logging can be disabled by admins

## 📈 Analytics Features

### Key Metrics
- **Total Logins/Logouts**: Complete activity counts
- **Unique Users**: Distinct user activity
- **Success Rates**: Login success percentages
- **Geographic Distribution**: Activity by location
- **Device Analysis**: Browser and OS usage patterns
- **Time Analysis**: Hourly activity patterns

### Trend Analysis
- **Daily Patterns**: Login/logout trends over time
- **User Rankings**: Most active users
- **Role Performance**: Activity by user roles
- **Technology Trends**: Browser and device usage

## 🛠️ Technical Implementation

### API Endpoints

#### Activity Logs
```typescript
GET /api/user-activity
// Returns paginated activity logs with user details

POST /api/user-activity
// Creates new activity log entry
```

#### System Settings
```typescript
GET /api/system-settings
// Returns system configuration including logging settings

PUT /api/system-settings
// Updates system settings (requires admin access)
```

#### Report Export
```typescript
GET /api/reports/export?format=csv&year=2025&month=09
// Exports CSV report

GET /api/reports/export?format=pdf&year=2025&month=09
// Exports PDF report
```

### Frontend Components

#### Annual Reports Dashboard
```typescript
// Location: /src/components/admin/annual-reports-dashboard.tsx
// Features: Year/month filtering, export buttons, interactive charts
```

#### Activity Logs Dashboard
```typescript
// Location: /src/components/admin/activity-logs-dashboard.tsx
// Features: Real-time logs, filtering, settings management
```

#### Login Trends Chart
```typescript
// Location: /src/components/admin/login-trends-chart.tsx
// Features: Interactive bar chart, modern design, statistics
```

## 🔧 Configuration

### Environment Variables
```bash
# Database connection
DATABASE_URL="your-database-url"

# JWT secret for authentication
JWT_SECRET="your-jwt-secret"

# Optional: External geolocation API
GEOLOCATION_API_KEY="your-api-key"
```

### Database Seeding
```bash
# Seed system settings
npm run seed:system-settings

# Seed roles and permissions
npm run seed:roles-permissions
```

## 📱 Mobile Responsiveness

### Responsive Design
- **Mobile-friendly**: All components work on mobile devices
- **Touch Support**: Interactive elements optimized for touch
- **Responsive Tables**: Horizontal scrolling on small screens
- **Adaptive Charts**: Charts resize for different screen sizes

## 🚨 Troubleshooting

### Common Issues

#### Export Errors
```bash
# Check if jspdf-autotable is properly installed
npm list jspdf-autotable

# Verify database connection
npm run db:status
```

#### Activity Logging Not Working
1. Check if logging is enabled in Activity Logs dashboard
2. Verify database schema is up to date
3. Check server logs for errors

#### Permission Errors
1. Ensure user has ADMIN or ADMINISTRATOR role
2. Check authentication middleware
3. Verify JWT token is valid

### Debug Mode
```typescript
// Enable debug logging
console.log('Activity logging enabled:', loggingEnabled)
console.log('User activity:', activityLogs)
```

## 📚 Additional Resources

### Documentation
- [User Guide](./USER_GUIDE.md) - Complete user documentation
- [Technical Docs](./TECHNICAL_DOCS.md) - Developer documentation
- [API Documentation](./API_DOCS.md) - API reference

### Support
- Check server logs for detailed error messages
- Verify database connectivity
- Ensure all required packages are installed
- Check role permissions for report access

## 🎉 Success Metrics

### Implementation Checklist
- ✅ Activity logging enabled and working
- ✅ Reports accessible to admin users
- ✅ CSV export functional
- ✅ PDF export with charts and tables
- ✅ Real-time activity monitoring
- ✅ Geographic tracking working
- ✅ Device information captured
- ✅ Role-based access control
- ✅ Mobile responsive design

### Performance Considerations
- **Database Indexing**: Ensure proper indexes on timestamp and userId
- **Pagination**: Large datasets are paginated for performance
- **Caching**: Consider caching for frequently accessed reports
- **Export Limits**: Large exports may take time to generate

---

**Last Updated**: September 2025  
**Version**: 1.0.0  
**Maintainer**: Education CRM Development Team
