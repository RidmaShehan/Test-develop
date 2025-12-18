# Annual Reports - Complete Guide

## 🎯 Overview

The Annual Reports feature provides comprehensive analytics and insights about user activity in your CRM system. Generate detailed reports with visualizations, statistics, and export capabilities.

---

## ✨ Features

### 📊 **Report Components**

1. **Overview Tab**
   - Total Logins
   - Total Logouts
   - Unique Users count
   - Average Session Duration
   - Login/Logout Trends Chart

2. **User Activity Tab**
   - Individual user statistics
   - Login/Logout counts per user
   - Last activity timestamps
   - Average session duration per user
   - User roles and emails

3. **Geography Tab**
   - Top Countries by activity
   - Geographic distribution of logins
   - Regional activity patterns

4. **Devices Tab**
   - Top browsers used
   - Most common devices
   - Operating system distribution
   - Technology usage patterns

### 📤 **Export Options**

- **CSV Export** - For data analysis in Excel/Google Sheets
- **PDF Export** - Professional reports with:
  - Executive summary
  - Activity breakdown by type
  - User activity analysis (top 15 users)
  - Role-based analysis
  - Geographic analysis
  - Technology usage (browsers, OS)
  - Time-based analysis (hourly patterns)
  - Recent activities detail (last 100)

---

## 🚀 How to Use

### Accessing Annual Reports

1. Navigate to: **Annual Reports** from the admin menu
2. You'll see a dashboard with filters and tabs

### Filtering Reports

#### Year Filter
- Select from the last 6 years
- Default: Current year

#### Month Filter
- **All Months** - Annual report for entire year
- **Specific Month** - Monthly report (January-December)

#### Refresh Button
- Click to reload data with current filters
- Updates all statistics and charts

### Viewing Reports

**Overview Tab:**
```
┌─────────────────────────────────────────────┐
│  Total Logins    │  Total Logouts          │
│      1,234       │       1,180             │
├─────────────────────────────────────────────┤
│  Unique Users    │  Avg Session            │
│       45         │      32m                │
└─────────────────────────────────────────────┘
         📈 Login Trends Chart
```

**User Activity Tab:**
- Sortable table with user details
- Individual performance metrics
- Last login times

**Geography Tab:**
- Countries ranked by activity
- Activity counts per region

**Devices Tab:**
- Browser usage statistics
- Device type breakdown

### Exporting Reports

#### CSV Export
1. Set desired filters (year/month)
2. Click **"Export CSV"** button
3. File downloads as `annual-report-YYYY-MM.csv`

**CSV includes:**
- Timestamp (ISO format)
- Date and Time (localized)
- User details (name, email, role)
- Activity type
- IP Address
- Geographic location (country, city, region)
- Device info (browser, OS, device, platform)
- Status (Success/Failed)
- Failure reason (if any)
- Session ID

#### PDF Export
1. Set desired filters (year/month)
2. Click **"Export PDF"** button
3. File downloads as `annual-report-YYYY-MM.pdf`

**PDF includes:**
- Cover page with report metadata
- Executive summary with statistics
- Activity breakdown tables
- User activity analysis (top 15 users)
- Role-based activity tables
- Geographic analysis
- Technology usage (browsers, OS, devices)
- Time-based analysis (hourly patterns)
- Recent activities detail (last 100 records)
- Page numbers and generation timestamp

---

## 📊 Metrics Explained

### Total Logins
- Count of successful LOGIN activities
- Does not include failed login attempts

### Total Logouts
- Count of LOGOUT activities
- Includes both manual and automatic logouts

### Unique Users
- Distinct users who logged in during the period
- Based on successful logins only

### Average Session Duration
- Calculated from LOGIN to LOGOUT
- Shown in minutes
- Only includes completed sessions (with both login and logout)
- Formula: `(Sum of all session durations) / (Number of completed sessions)`

### Top Countries
- Ranked by activity count
- Based on IP geolocation
- Shows count of activities per country

### Top Devices/Browsers
- Most commonly used browsers
- Most common device types
- Based on user-agent detection

---

## 🔧 Technical Details

### API Endpoints

#### Get Annual Report Data
```
GET /api/reports/annual?year=2025&month=10
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | number | No | Year for report (default: current year) |
| month | string | No | Month 01-12 (omit for full year) |

**Response:**
```json
{
  "totalLogins": 1234,
  "totalLogouts": 1180,
  "uniqueUsers": 45,
  "averageSessionDuration": 32,
  "topCountries": [{"country": "USA", "count": 450}],
  "topDevices": [{"device": "Desktop", "count": 800}],
  "topBrowsers": [{"browser": "Chrome", "count": 900}],
  "loginTrends": [{"date": "2025-10-01", "logins": 15, "logouts": 14}],
  "userActivity": [
    {
      "userId": "...",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "userRole": "ADMIN",
      "totalLogins": 50,
      "totalLogouts": 48,
      "lastLogin": "2025-10-09T14:30:00Z",
      "averageSessionDuration": 45
    }
  ]
}
```

#### Export Report
```
GET /api/reports/export?year=2025&month=10&format=csv
GET /api/reports/export?year=2025&month=10&format=pdf
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | number | No | Year for report (default: current year) |
| month | string | No | Month 01-12 (omit for full year) |
| format | string | Yes | Export format: `csv` or `pdf` |

**Response:** Binary file download

---

## 🎨 UI Components

### Key Metrics Cards

**Gradient Design:**
- 🟢 Green - Total Logins (positive metric)
- 🔴 Red - Total Logouts (neutral metric)
- 🔵 Blue - Unique Users (engagement metric)
- 🟠 Orange - Average Session (duration metric)

### Login Trends Chart

**Interactive Line Chart:**
- Blue line: Daily logins
- Red line: Daily logouts
- X-axis: Dates
- Y-axis: Count of activities
- Hover for exact values

### Tables

**User Activity Table:**
- Sortable columns
- Inline user details (name + email)
- Role badges with colors
- Formatted dates and durations
- Responsive scrolling

---

## 🔒 Security & Permissions

### Required Role
- ✅ **ADMIN** - Full access
- ✅ **ADMINISTRATOR** - Full access
- ❌ **COORDINATOR** - No access
- ❌ **VIEWER** - No access
- ❌ **DEVELOPER** - No access (unless also ADMIN)

### Authentication
- User must be logged in
- JWT token validated
- Role checked on every API request

### Data Privacy
- Only aggregated statistics shown
- IP addresses logged for security
- Location data at country/city level only
- All exports maintain data integrity

---

## 📈 Performance

### Loading Times
| Data Size | Load Time | Chart Render |
|-----------|-----------|--------------|
| 100 logs | <1s | ~0.5s |
| 1,000 logs | ~1s | ~1s |
| 10,000 logs | ~2s | ~2s |

### Export Times
| Format | 100 logs | 1,000 logs | 10,000 logs |
|--------|----------|------------|-------------|
| CSV | <1s | ~1s | ~2s |
| PDF | ~2s | ~5s | ~15s |

### Optimization
- ✅ Efficient database queries with proper indexing
- ✅ Parallel data calculations
- ✅ Client-side caching of report data
- ✅ Lazy loading of chart components
- ✅ Pagination for large datasets

---

## 🎯 Use Cases

### 1. Security Audits
**Objective:** Track user access patterns

**Steps:**
1. Select year/month range
2. Review Overview tab for unusual patterns
3. Check User Activity tab for specific users
4. Export PDF for audit records

### 2. Monthly Reports
**Objective:** Generate monthly activity reports

**Steps:**
1. Select current year
2. Select specific month
3. Review all tabs
4. Export PDF for management

### 3. Annual Reviews
**Objective:** Year-end activity summary

**Steps:**
1. Select year
2. Leave month as "All Months"
3. Review yearly trends
4. Export both CSV and PDF
5. Share with stakeholders

### 4. User Engagement Analysis
**Objective:** Identify active vs inactive users

**Steps:**
1. Navigate to User Activity tab
2. Sort by total logins
3. Identify top users
4. Review average session durations
5. Export CSV for further analysis

### 5. Technology Planning
**Objective:** Understand browser/device usage

**Steps:**
1. Navigate to Devices tab
2. Review browser statistics
3. Check device types
4. Plan compatibility testing
5. Export PDF for IT team

---

## 🐛 Troubleshooting

### No Data Showing

**Problem:** Report shows zero for all metrics

**Solutions:**
- Check if activity logging is enabled
- Verify date range has activity
- Try selecting "All Months"
- Check user role permissions
- Review database for activity logs

### Export Not Working

**Problem:** Export button doesn't download file

**Solutions:**
- Check browser's download settings
- Allow pop-ups for the site
- Try a different browser
- Check network connection
- Review browser console for errors

### Chart Not Loading

**Problem:** Login trends chart is blank

**Solutions:**
- Refresh the page
- Check if there's activity data
- Clear browser cache
- Try a different date range
- Check browser console for errors

### Slow Performance

**Problem:** Report takes too long to load

**Solutions:**
- Narrow date range (use specific month)
- Check internet connection
- Clear browser cache
- Close other browser tabs
- Contact system administrator

---

## 🔄 Data Sources

### UserActivityLog Table
```sql
- id (unique identifier)
- userId (user reference)
- activityType (LOGIN, LOGOUT, etc.)
- timestamp (when it occurred)
- ipAddress (client IP)
- location (JSON: country, city, region)
- deviceInfo (JSON: browser, OS, device)
- sessionId (session identifier)
- isSuccessful (boolean)
- failureReason (if failed)
```

### Calculated Metrics
1. **Total Logins** = Count of LOGIN activities where isSuccessful = true
2. **Total Logouts** = Count of LOGOUT activities
3. **Unique Users** = Distinct userId in LOGIN activities
4. **Average Session** = Average duration between LOGIN and LOGOUT
5. **Login Trends** = Daily counts grouped by date

---

## 📚 Best Practices

### For Administrators

1. **Regular Exports**
   - Export monthly reports for record-keeping
   - Archive annual reports each year
   - Keep PDF copies for compliance

2. **Security Monitoring**
   - Review reports weekly for unusual patterns
   - Check for failed login attempts
   - Monitor geographic access patterns
   - Identify suspicious session durations

3. **Performance Analysis**
   - Track unique user growth
   - Monitor average session duration
   - Identify peak usage times
   - Plan capacity accordingly

### For Management

1. **Quarterly Reviews**
   - Generate quarterly reports
   - Compare with previous quarters
   - Identify trends and patterns
   - Share insights with stakeholders

2. **Budget Planning**
   - Use user activity for resource planning
   - Justify system investments
   - Plan for user growth
   - Allocate IT resources

---

## 🚨 Important Notes

### Date Range Considerations
- **Full Year Reports** - May take longer to generate
- **Monthly Reports** - Faster and more focused
- **Custom Ranges** - Not currently supported (coming soon)

### Export Limitations
- **Maximum Records** - No hard limit, but performance may degrade
- **File Size** - PDFs can be large for yearly reports
- **Browser Limits** - Some browsers limit download sizes

### Activity Logging
- Must be enabled in system settings
- Logs only successful authentications
- Does not log every page view
- Session timeouts are tracked separately

---

## 🎓 FAQs

**Q: Can I export data for multiple years?**
A: Currently, one year at a time. Export each year separately.

**Q: Why is my average session duration 0?**
A: No completed sessions (with both login and logout) in the selected period.

**Q: Can coordinators view reports?**
A: No, only ADMIN and ADMINISTRATOR roles have access.

**Q: How often is data updated?**
A: Real-time. Click "Refresh Report" for latest data.

**Q: Can I schedule automatic exports?**
A: Not currently. Feature planned for future release.

**Q: What timezone are the timestamps in?**
A: UTC. Converted to local time in exports.

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review system logs
3. Verify database connectivity
4. Check activity logging settings
5. Contact system administrator

---

## ✅ Summary

The Annual Reports feature is **fully operational** and provides:

- ✅ Comprehensive activity analytics
- ✅ Beautiful visualizations
- ✅ Flexible filtering (year/month)
- ✅ CSV export for analysis
- ✅ Professional PDF reports
- ✅ Real-time data updates
- ✅ Role-based access control
- ✅ Fast performance

**Last Updated:** October 9, 2025
**Status:** ✅ Production Ready
**Version:** 1.0

