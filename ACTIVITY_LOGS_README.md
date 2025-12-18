# Activity Logs - User Guide

## 📋 Overview

Activity Logs track all user login/logout activities in your CRM system. Monitor who accessed the system, when, from where, and on what device. Export data for security audits and compliance.

---

## 🎯 How to Access

1. **Sign in** as ADMIN or ADMINISTRATOR
2. Navigate to **"Activity Logs"** in the sidebar
3. View all user activity history

**URL:** `http://localhost:3001/activity-logs`

**Required Role:** ADMIN or ADMINISTRATOR only

---

## 📊 What You'll See

### Main Dashboard Sections

#### 1. **Filters** (Top Section)

**Search Box:**
- Search by user name or email
- Real-time filtering
- Case-insensitive

**Activity Type Dropdown:**
- All activities (default)
- LOGIN
- LOGOUT
- SESSION_TIMEOUT
- PASSWORD_CHANGE
- PROFILE_UPDATE

**Date Range:**
- Start Date selector
- End Date selector
- Filter activities by date range

#### 2. **Activity Logs Table**

Displays all activities with columns:

| Column | Description |
|--------|-------------|
| **Icon** | Visual activity type indicator |
| **User** | Name and email of user |
| **Role** | User's role (ADMIN, COORDINATOR, etc.) |
| **Activity** | Type of activity performed |
| **Status** | Success (green) or Failed (red) |
| **Timestamp** | Exact date and time |
| **IP Address** | User's IP address |
| **Location** | City and Country |
| **Device** | Browser and Operating System |

#### 3. **Pagination**

- **Rows per page:** 50 (default)
- **Navigation:** Previous/Next buttons
- **Total count:** Shows total activities

---

## 📤 Export Features

### Export to Excel (.xlsx)

**Button:** "Export Excel" (green spreadsheet icon)

**What You Get:**
- Professional Excel workbook
- 14 columns of detailed data
- Auto-sized columns
- Ready for analysis

**Excel Columns:**
1. Timestamp (full date/time)
2. User Name
3. User Email
4. User Role
5. Activity Type
6. Status (Success/Failed)
7. IP Address
8. Country
9. City
10. Browser
11. Operating System
12. Device
13. Session ID
14. Failure Reason (if any)

**How to Export:**
```
1. Apply filters (optional)
2. Click "Export Excel" button
3. File downloads: activity-logs-YYYY-MM-DD.xlsx
4. Open in Excel/Google Sheets
```

**Use Excel Export For:**
- Data analysis with pivot tables
- Sorting and filtering
- Creating charts
- Advanced calculations
- Sharing with analysts

---

### Export to PDF

**Button:** "Export PDF" (document icon)

**What You Get:**
- Professional landscape report
- Formatted table
- Color-coded headers
- Alternating row colors
- Page numbers

**PDF Includes:**
- Cover information
- Activity count
- Formatted table with 9 key columns
- Generation timestamp
- Page numbers

**How to Export:**
```
1. Apply filters (optional)
2. Click "Export PDF" button
3. File downloads: activity-logs-YYYY-MM-DD.pdf
4. Open in any PDF viewer
```

**Use PDF Export For:**
- Security audit reports
- Compliance documentation
- Management presentations
- Printing for meetings
- Archival purposes

---

## 🔍 How to Use Filters

### Filter by Activity Type

**Example 1: View Only Logins**
```
1. Click Activity Type dropdown
2. Select "Login"
3. Table shows only login activities
4. Export filters applied
```

**Example 2: View Failed Attempts**
```
1. Click Activity Type dropdown
2. Select "Login"
3. Scan Status column for red "Failed" badges
4. Investigate suspicious failures
```

### Filter by Date Range

**Example: Last 30 Days**
```
1. Set Start Date: 30 days ago
2. Set End Date: Today
3. Table updates automatically
4. Export only this date range
```

**Example: Specific Month**
```
1. Set Start Date: Sept 1, 2025
2. Set End Date: Sept 30, 2025
3. View September activities only
4. Export monthly report
```

### Search for User

**Example: Find John's Activities**
```
1. Type "John" in Search box
2. Table filters to John's activities
3. View all his login/logout times
4. Export John's activity log
```

---

## 🎨 Visual Indicators

### Activity Type Icons

- ✅ **LOGIN** - Green checkmark
- ❌ **LOGOUT** - Red X
- ⏰ **SESSION_TIMEOUT** - Yellow clock
- 🔒 **PASSWORD_CHANGE** - Blue shield
- 👤 **PROFILE_UPDATE** - Purple user

### Status Badges

- **Success** - Green badge with checkmark
- **Failed** - Red badge with X
- **Logged Out** - Gray badge (for logouts)

---

## 📊 Understanding the Data

### Timestamp
- **Format:** Full date and time
- **Timezone:** Server timezone (UTC)
- **Sorting:** Most recent first

### IP Address
- **Shows:** User's internet IP
- **Purpose:** Security tracking
- **Use:** Identify unusual locations

### Location
- **Accuracy:** City and country level
- **Source:** IP geolocation
- **Privacy:** No precise coordinates

### Device Info
- **Browser:** Chrome, Firefox, Safari, etc.
- **OS:** Windows, macOS, Linux, etc.
- **Device:** Desktop, Mobile, Tablet

### Session ID
- **Purpose:** Track user sessions
- **Unique:** Per login session
- **Use:** Link related activities

---

## 🔒 Security Auditing

### Daily Security Check

**Steps:**
```
1. View today's activities
2. Check for unusual login times
3. Verify IP addresses match expected locations
4. Look for failed login attempts
5. Investigate any anomalies
```

### Weekly Security Review

**Steps:**
```
1. Filter last 7 days
2. Export to Excel
3. Analyze login patterns
4. Check for after-hours access
5. Review failed attempts
6. Document findings
```

### Monthly Compliance Report

**Steps:**
```
1. Filter by month
2. Export to PDF
3. Add cover letter
4. Submit to compliance team
5. Archive report
```

---

## 📈 Common Use Cases

### Use Case 1: Track User Access
**Goal:** See when John logged in last week

**Steps:**
```
1. Search: "John"
2. Set dates: Last 7 days
3. Activity Type: "Login"
4. View results
```

### Use Case 2: Security Audit
**Goal:** Find failed login attempts

**Steps:**
```
1. Activity Type: "Login"
2. Scan Status column for red "Failed"
3. Check IP addresses and locations
4. Investigate suspicious attempts
```

### Use Case 3: Generate Monthly Report
**Goal:** Create report for management

**Steps:**
```
1. Filter: Last month's dates
2. Click "Export PDF"
3. Review PDF
4. Email to management
```

### Use Case 4: Analyze Peak Times
**Goal:** Find busiest login times

**Steps:**
```
1. Export last month to Excel
2. Create pivot table by hour
3. Analyze login patterns
4. Plan system maintenance
```

### Use Case 5: User Activity Report
**Goal:** Report on specific user

**Steps:**
```
1. Search: User's name
2. Filter: Date range
3. Export to Excel
4. Analyze activity patterns
```

---

## ⚡ Performance

### Data Limits
- **Display:** 50 activities per page
- **Export:** Up to 10,000 records
- **Load Time:** < 2 seconds typical

### Optimization Tips
- Use date filters for large datasets
- Export smaller date ranges
- Search by specific user
- Filter by activity type

---

## 🔧 Troubleshooting

### No Activities Showing
**Cause:** Activity logging might be disabled

**Solutions:**
1. Check Settings tab
2. Enable "User Activity Logging"
3. Wait for new activities
4. Refresh page

### Export Button Not Working
**Cause:** Browser or permissions issue

**Solutions:**
1. Check browser download settings
2. Allow pop-ups from site
3. Verify ADMIN role
4. Try different browser

### Filters Not Working
**Cause:** Data not loaded or cache issue

**Solutions:**
1. Refresh the page
2. Clear filters and reapply
3. Check date range validity
4. Clear browser cache

### PDF Won't Open
**Cause:** PDF viewer issue

**Solutions:**
1. Download Adobe Reader
2. Try different PDF viewer
3. Re-download the file
4. Check file isn't corrupted

---

## 📱 Responsive Design

### Desktop View
- Full table with all columns
- Side-by-side filters
- Optimal for analysis

### Tablet View
- Horizontal scrolling
- Condensed columns
- Touch-friendly buttons

### Mobile View
- Vertical stacking
- Essential columns only
- Swipe to view more

---

## 🎓 Best Practices

### Security Monitoring

**✅ DO:**
- Check daily for unusual patterns
- Export weekly for review
- Document security incidents
- Track after-hours access
- Monitor failed attempts

**❌ DON'T:**
- Ignore failed login attempts
- Skip regular reviews
- Share exports publicly
- Disable activity logging

### Data Management

**✅ DO:**
- Export monthly for archives
- Keep reports organized
- Use consistent naming
- Store securely
- Backup important logs

**❌ DON'T:**
- Export everything at once
- Leave reports unsecured
- Delete original logs
- Skip date filters

---

## 📊 System Settings

### Enable/Disable Logging

**Location:** Settings tab in Activity Logs

**Toggle:**
- **ON** - Logs all activities (recommended)
- **OFF** - Stops logging new activities

**Note:** Existing logs remain even when disabled

---

## 🆘 Support

### Common Questions

**Q: Can I delete activity logs?**
A: No, logs are permanent for security and compliance.

**Q: How long are logs kept?**
A: Indefinitely, or per your data retention policy.

**Q: Can users see their own logs?**
A: No, only ADMIN and ADMINISTRATOR roles can view.

**Q: Are passwords logged?**
A: No, only that a password change occurred, not the password itself.

**Q: Can I customize columns?**
A: Not currently, but exports include all data.

---

## ✅ Quick Reference

### Button Functions
| Button | Action | Output |
|--------|--------|--------|
| Export Excel | Download Excel file | .xlsx file with 14 columns |
| Export PDF | Download PDF report | .pdf file with formatted table |
| Filters | Refine displayed data | Updated table view |

### Activity Types
| Type | Icon | Description |
|------|------|-------------|
| LOGIN | ✅ Green | User logged in |
| LOGOUT | ❌ Red | User logged out |
| SESSION_TIMEOUT | ⏰ Yellow | Session expired |
| PASSWORD_CHANGE | 🔒 Blue | Password updated |
| PROFILE_UPDATE | 👤 Purple | Profile modified |

---

## 📚 Related Features

- **User Management:** Manage user accounts
- **Annual Reports:** Comprehensive activity analysis
- **Settings:** Configure system preferences
- **Dashboard:** Quick activity overview

---

**Activity Logs Status:** ✅ Fully Operational  
**Export Features:** ✅ Excel & PDF Ready  
**Last Updated:** October 9, 2025  
**Version:** 2.0

**Monitor your CRM security with confidence!** 🔒

