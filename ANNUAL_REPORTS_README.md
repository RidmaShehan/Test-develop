# Annual Reports - User Guide

## 📊 Overview

Annual Reports provide comprehensive analysis of user activity in your CRM system. Generate detailed reports with statistics, visualizations, and export to Excel or PDF for strategic planning and compliance.

---

## 🎯 How to Access

1. **Sign in** as ADMIN or ADMINISTRATOR
2. Navigate to **"Annual Reports"** in the sidebar
3. View comprehensive activity analytics

**URL:** `http://localhost:3001/annual-reports`

**Required Role:** ADMIN or ADMINISTRATOR only

---

## 📈 Dashboard Overview

### Report Filters (Top Section)

#### Year Selector
- **Options:** Last 6 years
- **Default:** Current year
- **Purpose:** Select reporting period

#### Month Selector
- **Options:** All Months or specific month (Jan-Dec)
- **Default:** All Months (full year)
- **Purpose:** Narrow to monthly report

#### Refresh Button
- **Action:** Reload data with current filters
- **Use:** Update after system changes

**Example Filters:**
```
Year: 2025
Month: October
= Shows: October 2025 data only

Year: 2025  
Month: All Months
= Shows: Full year 2025 data
```

---

## 📊 Dashboard Tabs

### Tab 1: Overview

#### Key Metrics (4 Gradient Cards)

**🟢 Total Logins**
- Count of successful logins
- Shows user engagement
- Green gradient background

**🔴 Total Logouts**
- Count of logout activities
- Includes manual and auto logouts
- Rose gradient background

**🔵 Unique Users**
- Distinct users who logged in
- Shows active user base
- Blue gradient background

**🟠 Average Session**
- Mean session duration in minutes
- Calculated: LOGIN to LOGOUT time
- Orange gradient background

#### Login Trends Chart
- **Type:** Interactive line graph
- **Blue Line:** Daily logins
- **Red Line:** Daily logouts
- **X-Axis:** Dates
- **Y-Axis:** Count
- **Hover:** See exact values

**How to Read:**
- Peaks = High activity days
- Valleys = Low activity days
- Gap between lines = Active sessions

---

### Tab 2: User Activity

**Purpose:** Individual user statistics

**Table Columns:**
- **User:** Name and email
- **Role:** User's system role
- **Total Logins:** Lifetime login count
- **Total Logouts:** Lifetime logout count
- **Last Login:** Most recent login date
- **Avg Session:** Average time per session

**Use Cases:**
- Identify most active users
- Find inactive accounts
- Analyze user engagement
- Plan training needs

**How to Use:**
```
1. Review Total Logins column
2. Sort by most active users
3. Check Last Login for inactive users
4. Review Avg Session for engagement
```

---

### Tab 3: Geography

**Purpose:** Activity by location

**Displays:**
- **Top Countries:** Ranked by activity
- **Activity Count:** Number per country
- **Visual List:** Easy scanning

**Example:**
```
United States: 450 activities
Canada: 120 activities
United Kingdom: 85 activities
```

**Use Cases:**
- Understand user distribution
- Plan regional support
- Verify expected locations
- Identify unusual access

---

### Tab 4: Devices

**Purpose:** Technology usage statistics

#### Top Devices Section
- Most common device types
- Activity count per device
- Percentage distribution

#### Top Browsers Section
- Most used browsers
- Activity count per browser
- Usage percentages

**Example:**
```
Browsers:
Chrome: 900 (72.9%)
Firefox: 200 (16.2%)
Safari: 100 (8.1%)

Devices:
Desktop: 800 (64.8%)
Mobile: 350 (28.4%)
Tablet: 84 (6.8%)
```

**Use Cases:**
- Plan browser compatibility
- Optimize for common devices
- Support decisions
- Technology planning

---

## 📤 Export Features

### Export to Excel (.xlsx)

**Button:** "Export Excel" (green spreadsheet icon)

**What You Get:**
6 comprehensive worksheets in one file:

#### 1. Summary Sheet
- Report period
- Generation timestamp
- Total activities
- Total logins/logouts
- Unique users
- Success rate percentage

#### 2. All Activities Sheet
18 columns of detailed data:
- Timestamp (full date/time)
- Date (separate)
- Time (separate)
- User Name
- User Email
- User Role
- Activity Type
- Status
- IP Address
- Country, City, Region
- Browser, OS, Device, Platform
- Session ID
- Failure Reason

#### 3. User Summary Sheet
Per-user statistics:
- User Name & Email
- Role
- Total Activities
- Logins & Logouts
- Last Activity timestamp

#### 4. Geographic Analysis Sheet
- Country
- Activities count
- Percentage of total

#### 5. Browsers Sheet
- Browser name
- Count
- Percentage

#### 6. Operating Systems Sheet
- OS name
- Count
- Percentage

**How to Export:**
```
1. Select Year and Month
2. Click "Export Excel"
3. File downloads: annual-report-YYYY-MM.xlsx
4. Open in Excel/Google Sheets/Numbers
```

**Use Excel For:**
- Detailed data analysis
- Pivot tables
- Custom charts
- Advanced calculations
- Sorting and filtering
- Quarterly comparisons

---

### Export to PDF

**Button:** "Export PDF" (document icon)

**What You Get:**
Professional multi-page report with:

#### Page 1: Cover Page
- Title: "Education CRM Annual Activity Report"
- Report period
- Generation date
- Total records count

#### Page 2: Executive Summary
- Activity statistics table
- Success rates
- Key metrics overview

#### Page 3: Activity Breakdown
- Activities by type
- Percentages
- Color-coded tables

#### Page 4: User Activity Analysis
- Top 15 most active users
- Rankings
- Individual statistics

#### Page 5: Role-Based Analysis
- Activities by user role
- Unique users per role
- Percentage breakdowns

#### Page 6: Geographic Analysis
- Activity by country
- City distribution (if data available)

#### Page 7: Technology Usage
- Browser statistics (top 10)
- Operating system distribution (top 10)

#### Page 8: Time-Based Analysis
- Hourly activity patterns
- 24-hour breakdown
- Peak usage identification

#### Page 9: Recent Activities
- Last 100 activities detail
- Full information
- Formatted table

**How to Export:**
```
1. Select Year and Month
2. Click "Export PDF"
3. File downloads: annual-report-YYYY-MM.pdf
4. Open in any PDF viewer
```

**Use PDF For:**
- Management presentations
- Compliance reports
- Board meetings
- Client reporting
- Archival (print-ready)
- Easy sharing via email

---

## 📊 Understanding the Metrics

### Total Logins
- **Counts:** Successful LOGIN activities only
- **Excludes:** Failed login attempts
- **Use:** Measure system usage

### Total Logouts
- **Includes:** Manual logouts
- **Includes:** Automatic logouts
- **Includes:** Session timeouts
- **Use:** Session completion tracking

### Unique Users
- **Calculation:** Distinct user IDs with logins
- **Period:** Based on selected date range
- **Use:** Active user count

### Average Session Duration
- **Formula:** Total session time / Number of sessions
- **Unit:** Minutes
- **Calculation:** Time between LOGIN and LOGOUT
- **Note:** Only includes completed sessions

---

## 🎯 Common Use Cases

### Use Case 1: Monthly Report for Management

**Goal:** Generate October 2025 report for board meeting

**Steps:**
```
1. Select Year: 2025
2. Select Month: October
3. Review all 4 tabs
4. Click "Export PDF"
5. Review PDF report
6. Email to stakeholders
```

**Time:** 10 minutes

---

### Use Case 2: Quarterly Data Analysis

**Goal:** Analyze Q3 2025 data in Excel

**Steps:**
```
1. Month 1: July 2025
   - Export to Excel (save as Q3-July.xlsx)
2. Month 2: August 2025
   - Export to Excel (save as Q3-August.xlsx)
3. Month 3: September 2025
   - Export to Excel (save as Q3-September.xlsx)
4. Combine in master spreadsheet
5. Create pivot tables
6. Generate comparison charts
```

**Time:** 30 minutes

---

### Use Case 3: Security Audit

**Goal:** Review last 30 days for compliance

**Steps:**
```
1. Select current month
2. Navigate to Geography tab
3. Verify all locations are expected
4. Check User Activity tab for unusual patterns
5. Export PDF for documentation
6. File in compliance folder
```

**Time:** 15 minutes

---

### Use Case 4: Year-End Summary

**Goal:** Create 2025 annual summary

**Steps:**
```
1. Select Year: 2025
2. Select Month: All Months
3. Review Overview tab metrics
4. Export Excel for detailed analysis
5. Export PDF for official report
6. Archive both files
```

**Time:** 20 minutes

---

### Use Case 5: Technology Planning

**Goal:** Decide which browsers to support

**Steps:**
```
1. Select last 12 months data
2. Navigate to Devices tab
3. Review Top Browsers statistics
4. Export Excel for detailed breakdown
5. Analyze percentage distributions
6. Make support decisions
```

**Time:** 30 minutes

---

## 📈 Data Analysis Tips

### Compare Periods

**Monthly Comparison:**
```
1. Export January to Excel
2. Export February to Excel
3. Compare metrics side-by-side
4. Identify trends
```

**Year-over-Year:**
```
1. Export 2024 full year
2. Export 2025 full year
3. Compare growth
4. Calculate percentages
```

### Find Patterns

**Peak Times:**
1. Export to Excel
2. Create pivot table by hour
3. Identify busiest times
4. Plan system maintenance

**User Trends:**
1. Review User Activity tab
2. Sort by Total Logins
3. Identify power users
4. Find inactive accounts

---

## ⚡ Performance

### Load Times
- **Dashboard:** < 2 seconds
- **Chart Rendering:** < 1 second
- **Tab Switching:** Instant

### Export Times
- **Excel (1K records):** 2-3 seconds
- **PDF (1K records):** 5-8 seconds
- **Excel (10K records):** 5-8 seconds
- **PDF (10K records):** 20-30 seconds

### Data Limits
- **Display:** All available data
- **Export Excel:** Unlimited
- **Export PDF:** Optimized for 10,000+ records

---

## 🔧 Troubleshooting

### No Data Showing
**Cause:** No activities in selected period

**Solutions:**
1. Change year/month selection
2. Select "All Months"
3. Check if activity logging enabled
4. Verify database has data

### Chart Not Loading
**Cause:** Browser or data issue

**Solutions:**
1. Refresh the page
2. Clear browser cache
3. Try different browser
4. Check console for errors

### Export Taking Too Long
**Cause:** Large dataset

**Solutions:**
1. Narrow date range (select specific month)
2. Be patient (large PDFs take time)
3. Use Excel for large datasets
4. Export during off-peak hours

### Excel File Won't Open
**Cause:** Software compatibility

**Solutions:**
1. Use Excel 2007 or later
2. Try Google Sheets
3. Use LibreOffice Calc
4. Re-download file

---

## 📱 Responsive Design

### Desktop (1200px+)
- Full 4-column card layout
- Side-by-side tabs
- Full charts visible

### Tablet (768px-1199px)
- 2-column cards
- Stacked tabs
- Scrollable charts

### Mobile (<768px)
- Single column
- Vertical stacking
- Touch-optimized
- Swipe-friendly charts

---

## 🎓 Best Practices

### Regular Reporting

**✅ DO:**
- Generate monthly reports
- Archive all exports
- Review trends regularly
- Share with stakeholders
- Document findings

**❌ DON'T:**
- Wait for year-end
- Skip monthly reviews
- Ignore unusual patterns
- Delete old reports

### Data Management

**✅ DO:**
- Use consistent file naming
- Organize by year/month
- Store securely
- Backup important reports
- Version control

**❌ DON'T:**
- Mix different periods
- Lose track of exports
- Share publicly
- Overwrite old files

---

## 🔒 Security & Permissions

### Access Control
- **Required:** ADMIN or ADMINISTRATOR role
- **Enforced:** API level authentication
- **Verified:** Each request

### Data Privacy
- Aggregated statistics shown
- Individual user data protected
- IP addresses logged for security
- Location at city/country level only

---

## 🆘 Support

### Common Questions

**Q: Can I export specific users only?**
A: Not directly, but use Activity Logs for user-specific exports.

**Q: How far back does data go?**
A: As far back as activity logging was enabled.

**Q: Can I schedule automatic exports?**
A: Not currently, manual export required.

**Q: Why are my sessions showing 0m average?**
A: No completed sessions (LOGIN + LOGOUT pairs) in period.

**Q: Can I customize the PDF design?**
A: Not currently, fixed professional template.

---

## ✅ Quick Reference

### Export Formats
| Format | Best For | Worksheets | Time |
|--------|----------|------------|------|
| Excel | Data analysis | 6 sheets | 2-5s |
| PDF | Reports & sharing | Multi-page | 5-20s |

### Report Periods
| Selection | Shows |
|-----------|-------|
| Year + All Months | Full year data |
| Year + Specific Month | One month only |
| Current Year + All Months | Year-to-date |

---

## 📚 Related Features

- **Activity Logs:** Detailed activity tracking
- **Dashboard:** Quick overview
- **User Management:** Manage accounts
- **Settings:** Configure preferences

---

**Annual Reports Status:** ✅ Fully Operational  
**Export Formats:** ✅ Excel (6 sheets) & PDF  
**Last Updated:** October 9, 2025  
**Version:** 2.0

**Make data-driven decisions with comprehensive reports!** 📊

