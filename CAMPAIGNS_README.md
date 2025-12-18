# Campaigns - User Guide with PDF Export

## 📊 Overview

Campaigns track your marketing and outreach efforts. Create campaigns, assign seekers, add analytics, and export comprehensive PDF reports for each campaign.

---

## 🎯 How to Access

1. **Sign in** to your CRM account
2. Navigate to **"Campaigns"** in the sidebar
3. View all campaigns and manage them

**URL:** `http://localhost:3001/campaigns`

**Required Role:** Any authenticated user (permissions vary by role)

---

## 📤 Quick Export Options

### Export All Campaigns to Excel

**NEW FEATURE!** Export all your campaigns to a comprehensive Excel file.

**Button Location:** Top-right of Campaigns page header

**What You Get:**
- Single .xlsx file with 6 worksheets
- All campaigns with complete data
- Calculated KPIs and metrics
- Seekers from all campaigns
- Budget and ROI analysis

**How to Use:**
```
1. Click "Export All to Excel" button (top-right)
2. Wait 2-5 seconds
3. File downloads: all-campaigns-report-YYYY-MM-DD.xlsx
4. Open and analyze!
```

**6 Worksheets Include:**
1. Campaigns Summary (26 columns)
2. Campaign Seekers (all seekers)
3. Performance Metrics (analytics)
4. Budget & ROI (financial analysis)
5. Overview (system statistics)
6. Seekers by Stage (pipeline)

**Perfect For:**
- Executive reports
- ROI analysis
- Platform comparison
- Budget planning
- Strategic decisions

📖 **Detailed Guide:** See `ALL_CAMPAIGNS_EXCEL_EXPORT.md`

---

## 📋 Campaigns Table

### Table Columns

| Column | Description |
|--------|-------------|
| **☑️ Checkbox** | Select for bulk actions |
| **Image** | Campaign visual (click to edit) |
| **Campaign Name** | Title of the campaign |
| **Type** | Platform/channel (with icon) |
| **Status** | Current state (badge) |
| **Target Audience** | Who campaign reaches |
| **Duration** | Start and end dates |
| **Budget** | Allocated funds |
| **Reach** | Number reached (click to edit) |
| **Analytics** | Performance metrics (click to edit) |
| **Created** | Creation date |
| **Actions** | Operation buttons |

---

## 🎯 Campaign Types

Each type has a unique icon:

- 📘 **Facebook** - Facebook campaigns
- 📸 **Instagram** - Instagram campaigns
- 🎵 **TikTok** - TikTok campaigns
- ▶️ **YouTube** - YouTube campaigns
- 📰 **Newspaper** - Print media
- 📺 **TV Ads** - Television advertising
- 📻 **Radio** - Radio broadcasts
- 🌐 **Web Ads** - Online advertising
- 🎪 **Exhibition** - Trade shows/events
- 👥 **Friend Said** - Referrals
- ⭐ **Recommended** - Recommendations

---

## 🚦 Campaign Status

### Status Badges (Color-Coded)

**⚪ DRAFT** (Gray)
- Campaign being planned
- Not yet active
- Can edit freely

**🟢 ACTIVE** (Green)
- Currently running
- Tracking metrics
- Can pause anytime

**🟡 PAUSED** (Yellow)
- Temporarily stopped
- Can reactivate
- Metrics preserved

**🔵 COMPLETED** (Blue)
- Successfully finished
- Results finalized
- Historical record

**🔴 CANCELLED** (Red)
- Stopped permanently
- Not completed
- Archived

---

## 🎬 Action Buttons

Each campaign row has these buttons:

### 👁️ View
- **Action:** Opens campaign details
- **Shows:** Full information
- **Use:** Review campaign overview

### ✏️ Edit
- **Action:** Opens edit dialog
- **Allows:** Modify campaign details
- **Fields:** Name, description, dates, budget, etc.

### 📄 Export PDF
- **Action:** Generates comprehensive PDF report for individual campaign
- **Color:** Blue (stands out)
- **Position:** Between Edit and Pause/Play
- **Downloads:** campaign-name-YYYY-MM-DD.pdf
- **Use:** Individual campaign reporting

### ⏸️ Pause / ▶️ Play
- **Pause:** Changes ACTIVE → PAUSED
- **Play:** Changes PAUSED/DRAFT → ACTIVE
- **Use:** Control campaign state

### 🗑️ Delete
- **Action:** Moves to trash bin
- **Color:** Red
- **Recoverable:** Yes, from trash
- **Use:** Remove unwanted campaigns

---

## 📄 PDF Export Feature

### How to Export a Campaign

**Simple Method:**
```
1. Find your campaign in the table
2. Locate the Actions column
3. Click the blue PDF icon (📄)
4. Wait 1-3 seconds
5. PDF downloads automatically
```

**What Happens:**
1. Button shows loading state
2. System generates comprehensive report
3. PDF creates with all campaign data
4. File downloads to your device
5. Success notification appears

### PDF Filename Format
```
campaign-{name}-{date}.pdf

Examples:
- campaign-summer-2025-instagram-2025-10-09.pdf
- campaign-fall-registration-drive-2025-10-09.pdf
- campaign-open-house-facebook-2025-10-09.pdf
```

---

## 📊 PDF Report Contents

### Page 1: Cover Page
**Header Section:**
- Blue gradient banner
- "Campaign Report" title
- Campaign name prominently displayed

**Overview Table:**
| Field | Details |
|-------|---------|
| Campaign Name | Full name |
| Type | Platform/channel |
| Status | Current state (color-coded) |
| Target Audience | Demographic details |
| Start Date | Campaign launch |
| End Date | Campaign end (or "Ongoing") |
| Budget | Total allocated |
| Reach | People reached |
| Total Seekers | Inquiries generated |
| Created By | Staff member |
| Created On | Creation date |
| Description | Full campaign description |

---

### Page 2: Analytics (if available)

**Performance Metrics Table:**
- **Views:** Total impressions
- **Net Follows:** New followers/subscribers
- **Total Watch Time:** Engagement duration (minutes)
- **Average Watch Time:** Per-view duration (seconds)
- **Total Interactions:** All engagements
- **Reactions:** Likes, loves, etc.
- **Comments:** User comments count
- **Shares:** Content shared
- **Saves:** Bookmarks/saves
- **Link Clicks:** CTA clicks

**Key Insights Section:**
- Engagement Rate: (Interactions / Views) × 100
- Average Watch Time in seconds
- Total Reach summary

---

### Page 3: Campaign Seekers

**Seekers Table:**
Numbered list with columns:
1. # (sequence)
2. Full Name
3. Phone Number
4. Email Address
5. City
6. Stage (NEW, QUALIFIED, etc.)
7. Added On (date)

**Seekers by Stage Analysis:**
- Stage name
- Count
- Percentage of total
- Sorted by count (highest first)

Example:
```
QUALIFIED: 45 (36.0%)
CONNECTED: 30 (24.0%)
NEW: 25 (20.0%)
CONSIDERING: 25 (20.0%)
```

---

### Page 4: Campaign Summary

**Key Performance Indicators:**

| KPI | Calculation | Example |
|-----|-------------|---------|
| Total Reach | Direct metric | 50,000 |
| Total Views | Direct metric | 45,000 |
| Total Interactions | Sum of all | 8,900 |
| Total Seekers Generated | Count | 125 |
| **Conversion Rate** | (Seekers / Reach) × 100 | 0.25% |
| **Cost Per Seeker** | Budget / Seekers | $40.00 |
| **ROI Metric** | (Interactions / Budget) × 100 | 178% |

**Campaign Status Box:**
- Color-coded status badge
- Visual indicator of current state

**Report Footer:**
- Generation date and time
- Generated by (user name)
- Page numbers on all pages

---

## 📊 Understanding the Metrics

### Conversion Rate
**Formula:** (Total Seekers / Total Reach) × 100

**Example:**
```
125 seekers from 50,000 reach
= (125 / 50,000) × 100
= 0.25% conversion rate
```

**Good Range:** 0.1% - 1.0% (varies by industry)

---

### Cost Per Seeker
**Formula:** Budget / Total Seekers

**Example:**
```
$5,000 budget, 125 seekers
= $5,000 / 125
= $40.00 per seeker
```

**Use:** Budget planning and campaign comparison

---

### ROI Metric
**Formula:** (Total Interactions / Budget) × 100

**Example:**
```
8,900 interactions, $5,000 budget
= (8,900 / 5,000) × 100
= 178% ROI
```

**Interpretation:** Higher = better engagement per dollar

---

### Engagement Rate
**Formula:** (Total Interactions / Views) × 100

**Example:**
```
8,900 interactions, 45,000 views
= (8,900 / 45,000) × 100
= 19.78% engagement rate
```

**Good Range:** 1% - 5% (varies by platform)

---

## 🎯 Common Use Cases

### Use Case 1: Campaign Performance Review

**Goal:** Review how Instagram campaign performed

**Steps:**
```
1. Find campaign in table
2. Note key metrics (reach, analytics)
3. Click PDF export button
4. Review comprehensive report
5. Identify successes and improvements
```

**Time:** 5 minutes

---

### Use Case 2: Client Reporting

**Goal:** Send campaign results to education fair partner

**Steps:**
```
1. Export campaign PDF
2. Review for accuracy
3. Add cover email
4. Send to stakeholder
5. Follow up for feedback
```

**Time:** 10 minutes

---

### Use Case 3: Budget Justification

**Goal:** Justify next quarter's budget request

**Steps:**
```
1. Export PDFs for last quarter's campaigns
2. Compare cost per seeker
3. Calculate average ROI
4. Create summary presentation
5. Submit to management
```

**Time:** 30 minutes

---

### Use Case 4: Campaign Comparison

**Goal:** Decide between Facebook vs Instagram

**Steps:**
```
1. Export PDF for Facebook campaign
2. Export PDF for Instagram campaign
3. Compare:
   - Cost per seeker
   - Engagement rate
   - Total seekers
   - ROI metrics
4. Make data-driven decision
```

**Time:** 15 minutes

---

### Use Case 5: Historical Archive

**Goal:** Archive all 2025 campaigns

**Steps:**
```
1. Filter campaigns: Status = COMPLETED
2. Export PDF for each
3. Organize in folder: "2025-Campaigns"
4. Store securely
5. Reference for future planning
```

**Time:** Variable (depends on count)

---

## 🎨 PDF Design Features

### Professional Appearance
- Clean, modern layout
- Color-coded sections
- Easy-to-read tables
- Consistent formatting

### Color Scheme
- **Blue:** Headers and primary elements
- **Green:** Positive metrics
- **Red:** Negative/alert items
- **Gray:** Neutral information

### Tables
- Alternating row colors
- Bold headers
- Auto-sized columns
- Professional borders

### Status Indicators
- Color-coded badges:
  - DRAFT: Gray
  - ACTIVE: Green
  - PAUSED: Yellow
  - COMPLETED: Blue
  - CANCELLED: Red

---

## ⚡ Performance

### Export Times
| Campaign Size | Seekers | Time |
|---------------|---------|------|
| Small | 0-50 | 1-2s |
| Medium | 51-200 | 2-3s |
| Large | 201-500 | 3-5s |
| Very Large | 500+ | 5-8s |

### PDF File Sizes
| Seekers | File Size |
|---------|-----------|
| 0-50 | ~150KB |
| 51-200 | ~300KB |
| 201-500 | ~600KB |
| 500+ | ~1MB |

---

## 🔧 Troubleshooting

### Export Button Not Working
**Symptoms:** Click doesn't download file

**Solutions:**
1. Check browser download settings
2. Allow pop-ups for site
3. Check network connection
4. Try different browser
5. Check browser console

### PDF Won't Open
**Symptoms:** Downloaded file doesn't open

**Solutions:**
1. Download Adobe Reader
2. Try different PDF viewer
3. Re-download the file
4. Check file isn't corrupted
5. Verify disk space

### Missing Data in PDF
**Symptoms:** Some sections empty

**Solutions:**
1. Add missing campaign data
2. Enter analytics metrics
3. Assign seekers to campaign
4. Update reach numbers
5. Re-export after updates

### Slow Export
**Symptoms:** Takes longer than expected

**Solutions:**
1. Normal for large campaigns (500+ seekers)
2. Be patient (may take 5-10 seconds)
3. Close other applications
4. Check internet speed
5. Try during off-peak hours

---

## 🎓 Best Practices

### When to Export

**✅ DO Export:**
- After campaign completion
- Before presenting to stakeholders
- Monthly for active campaigns
- When making strategic decisions
- For historical archive

**❌ DON'T Export:**
- Every minor update
- Incomplete campaigns (unless testing)
- Without reviewing data first

### File Management

**✅ DO:**
- Use consistent folder structure
- Name files clearly
- Include dates in folders
- Backup important reports
- Archive by year/quarter

**❌ DON'T:**
- Mix different campaigns
- Delete without backup
- Share without review
- Lose track of versions

---

## 📱 Responsive Design

### Desktop
- Full table visible
- All columns displayed
- Optimal for management

### Tablet
- Horizontal scroll
- Touch-friendly buttons
- Readable text

### Mobile
- Vertical stacking
- Essential columns only
- Swipe to see more

---

## 🔒 Security & Permissions

### Who Can Export
- Any authenticated user can view campaigns
- Export requires campaign access
- Role-based permissions apply

### Data Privacy
- Only assigned campaigns visible
- Seeker data properly secured
- PDF generated server-side
- Secure download

---

## 📊 Campaign Management Tips

### Setting Up Campaigns

**Required Fields:**
- Campaign Name (descriptive)
- Type (platform/channel)
- Target Audience (demographic)
- Start Date (launch)
- Status (initial state)

**Optional but Recommended:**
- End Date
- Budget
- Description
- Image/visual

### Adding Analytics

**Track These Metrics:**
- Views (impressions)
- Interactions (engagement)
- Follows (audience growth)
- Clicks (CTA performance)
- Watch time (content quality)

### Managing Seekers

**Steps:**
1. Campaign creates interest
2. Seekers contact you
3. Add seekers to system
4. Assign to campaign
5. Track in campaign PDF

---

## 🆘 Support

### Common Questions

**Q: Can I edit the PDF after export?**
A: No, PDFs are read-only. Update campaign and re-export.

**Q: Can I export multiple campaigns at once?**
A: Not currently. Export individually as needed.

**Q: How long are PDFs stored?**
A: Only on your device. Re-export anytime.

**Q: Can I customize PDF design?**
A: Not currently. Fixed professional template.

**Q: What if analytics are missing?**
A: PDF shows "N/A" for missing data. Add analytics and re-export.

---

## ✅ Quick Reference

### PDF Report Sections
| Section | Contains |
|---------|----------|
| Cover | Campaign overview |
| Analytics | Performance metrics |
| Seekers | Complete list + stages |
| Summary | KPIs and calculations |

### Key Metrics
| Metric | Formula | Purpose |
|--------|---------|---------|
| Conversion Rate | Seekers/Reach × 100 | Efficiency |
| Cost Per Seeker | Budget/Seekers | Value |
| ROI | Interactions/Budget × 100 | Engagement |

---

## 📚 Related Features

- **Seekers:** Manage inquiries
- **Tasks:** Follow-up actions
- **Dashboard:** Quick overview
- **Reports:** System-wide analytics

---

**Campaigns Status:** ✅ Fully Operational  
**PDF Export:** ✅ Ready  
**Last Updated:** October 9, 2025  
**Version:** 2.0

**Track your campaigns and prove their success!** 📊

