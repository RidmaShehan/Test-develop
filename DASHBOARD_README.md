# Dashboard - User Guide

## 📊 Overview

The Dashboard is your central hub for monitoring CRM activity, viewing key metrics, and accessing quick settings. It provides real-time statistics and recent activity updates.

---

## 🎯 How to Access

1. **Sign in** to your CRM account
2. You'll land on the **Dashboard** automatically
3. Or navigate via sidebar: Click **"Dashboard"**

**URL:** `http://localhost:3001/dashboard`

---

## 📈 What You'll See

### 1. **Statistics Cards** (Top Section)

Four key metric cards displaying real-time data:

#### Total Seekers
- **Shows:** Total number of seekers in the system
- **Updates:** Real-time from database
- **Icon:** 👥 Users icon (green)

#### New This Week
- **Shows:** Seekers added in the last 7 days
- **Change:** % increase/decrease from previous week
- **Icon:** 📈 Trending icon (green)
- **Colors:**
  - Green = Positive growth
  - Red = Decline
  - Gray = No change

#### Contact Rate
- **Shows:** Percentage of seekers with interactions
- **Formula:** (Seekers with interactions / Total seekers) × 100
- **Icon:** 📞 Phone icon (green)
- **Example:** 68% = 68 out of 100 seekers have been contacted

#### Pending Tasks
- **Shows:** Open tasks needing attention
- **Includes:** OPEN, TODO, IN_PROGRESS, OVERDUE statuses
- **Change:** % increase/decrease from last week
- **Icon:** ✅ CheckSquare icon (green)
- **Colors:**
  - Green = Fewer tasks (good)
  - Red = More tasks (needs attention)

---

### 2. **Recent Activity** (Left Column)

Shows the last 10 interactions in the system:

#### What It Shows
- **Seeker Name:** Who was contacted
- **Outcome:** Result of the interaction
- **User Name:** Staff member who performed action
- **Time:** Relative time ("2 hours ago")
- **Type:** Visual icon indicating channel

#### Activity Types & Icons
- 📞 **Call** (Green) - Phone calls
- 💬 **WhatsApp** (Blue) - WhatsApp messages
- ✉️ **Email** (Purple) - Email communications
- 👤 **Walk-in** (Orange) - In-person visits

#### How It Works
1. Staff logs an interaction with a seeker
2. Appears instantly in recent activity
3. Shows most recent 10 interactions
4. Updates in real-time
5. Oldest entries drop off automatically

---

### 3. **Quick Settings** (Right Column)

Quick access to commonly used settings:

#### Profile Settings (Tab 1)
- **View:** Your name, email, role
- **Status:** Read-only (contact admin to change)

#### Notification Preferences (Tab 2)
- ✅ Email Notifications
- ✅ SMS Notifications  
- ✅ Task Reminders
- ✅ Weekly Reports
- ✅ Seeker Updates
- ✅ System Alerts

**Toggle ON/OFF** for each notification type

#### Appearance Settings (Tab 3)
- **Theme Selection:**
  - ☀️ Light Mode
  - 🌙 Dark Mode
  - 💻 System (auto)

- **Layout Options:**
  - Collapse Sidebar (save space)
  - Compact Mode (reduce padding)
  - Show User Avatars (display pictures)

#### System Preferences (Tab 4)
- Auto-save Changes
- Session Timeout (minutes)
- Data Retention (days)
- Backup Frequency (daily/weekly/monthly)

#### Save Settings
Click **"Save Settings"** button to apply changes

---

## 🔄 How Data Updates

### Automatic Updates
- **Statistics:** Updates when you refresh the page
- **Recent Activity:** Updates on page refresh
- **Real-time:** New data appears after interactions logged

### Manual Refresh
- Refresh browser to see latest data
- Stats recalculate automatically
- Activity feed pulls most recent 10 entries

---

## 📊 Data Sources

### Statistics Come From:
- **Seekers Table:** Total and new seekers
- **Interactions Table:** Contact rate calculation
- **Tasks Table:** Pending tasks count

### Recent Activity Comes From:
- **Interactions Table:** All logged interactions
- **Filtered by:** Last 10, most recent first
- **Includes:** User info and seeker details

---

## 🎨 Visual Design

### Gradient Cards
Each statistic card has unique color scheme:
- **Green Gradient:** Total Seekers, New This Week
- **Blue Gradient:** Unique metrics
- **Orange Gradient:** Time-based metrics

### Status Indicators
- **↗ Green Arrow:** Positive trend
- **↘ Red Arrow:** Negative trend
- **→ Gray Line:** No change

### Loading States
- **Skeleton Screens:** Appear while data loads
- **Smooth Transitions:** Fade-in effects
- **Pulsing Animation:** Shows loading progress

---

## 💡 How to Use Effectively

### Daily Check-In (2 minutes)
1. **View statistics cards** for overview
2. **Check Recent Activity** for team updates
3. **Note Pending Tasks** for priorities

### Weekly Review (10 minutes)
1. **Compare "New This Week"** to last week
2. **Review Contact Rate** trend
3. **Check Pending Tasks** backlog
4. **Adjust team assignments** if needed

### Monthly Analysis (30 minutes)
1. **Track Total Seekers** growth
2. **Analyze Contact Rate** patterns
3. **Review Team Activity** distribution
4. **Export data** for reports

---

## 🔧 Troubleshooting

### Cards Show "0" or No Data
**Cause:** Database might be empty or not connected

**Solutions:**
1. Check if seekers exist in system
2. Verify database connection
3. Refresh the page
4. Contact system administrator

### Recent Activity is Empty
**Cause:** No interactions logged yet

**Solutions:**
1. Log some interactions in Seekers section
2. Wait for team to log activities
3. Check if activity logging is enabled
4. Verify user permissions

### Statistics Not Updating
**Cause:** Browser cache or data not refreshing

**Solutions:**
1. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Close and reopen browser
4. Check network connection

### Settings Not Saving
**Cause:** Browser storage issue

**Solutions:**
1. Enable browser cookies
2. Allow local storage
3. Check browser permissions
4. Try incognito mode to test

---

## 📱 Responsive Design

### Desktop (1200px+)
- 4 cards in a row
- Side-by-side layout for activity and settings
- Full details visible

### Tablet (768px - 1199px)
- 2 cards per row
- Stacked layout
- Scrollable content

### Mobile (< 768px)
- 1 card per column
- Vertical stacking
- Touch-optimized buttons

---

## 🔒 Security & Permissions

### Who Can Access
- ✅ All logged-in users
- ✅ All roles (ADMIN, COORDINATOR, VIEWER, etc.)

### What They See
- **Admins:** Full access to all statistics
- **Coordinators:** Their assigned seekers' data
- **Viewers:** Read-only dashboard access

### Data Privacy
- Only shows aggregated statistics
- No sensitive personal data exposed
- Activity shows names but not details

---

## ⚡ Performance

### Load Times
- **Initial Load:** < 2 seconds
- **Data Fetch:** < 1 second
- **Card Rendering:** < 0.5 seconds

### Optimization
- Efficient database queries
- Parallel data fetching
- Client-side caching
- Lazy loading for settings

---

## 🎓 Tips & Best Practices

### Tip 1: Set as Homepage
The dashboard loads automatically on login for quick overview.

### Tip 2: Check Daily
Start your day by reviewing statistics and recent activity.

### Tip 3: Use Compact Mode
Enable compact mode for more space on smaller screens.

### Tip 4: Monitor Contact Rate
Keep contact rate above 60% for effective follow-up.

### Tip 5: Track Pending Tasks
Address pending tasks to keep numbers low.

---

## 🆘 Support

### Need Help?
1. Check this README
2. Review troubleshooting section
3. Contact system administrator
4. Check server logs for errors

### Common Questions

**Q: Why is my contact rate low?**
A: Log more interactions with seekers to improve this metric.

**Q: Can I customize the dashboard?**
A: Currently fixed layout, but you can adjust appearance settings.

**Q: How often does data update?**
A: Real-time on page refresh, updates after each database change.

**Q: Can I export dashboard data?**
A: Not directly, but you can export from individual sections.

---

## 📊 Related Features

- **Seekers:** View and manage all seekers
- **Tasks:** Complete pending tasks
- **Activity Logs:** Detailed activity history
- **Reports:** Generate comprehensive reports

---

## ✅ Quick Reference

### Dashboard Components
| Component | Purpose | Updates |
|-----------|---------|---------|
| Statistics Cards | Key metrics overview | On refresh |
| Recent Activity | Last 10 interactions | Real-time |
| Quick Settings | User preferences | On save |

### Action Items
| Metric | Ideal Range | Action When Low |
|--------|-------------|-----------------|
| Contact Rate | > 60% | Log more interactions |
| Pending Tasks | < 20 | Complete tasks |
| New This Week | Growing | Celebrate! 🎉 |

---

**Dashboard Status:** ✅ Fully Operational  
**Last Updated:** October 9, 2025  
**Version:** 2.0

**Your CRM command center - use it every day!** 🚀

