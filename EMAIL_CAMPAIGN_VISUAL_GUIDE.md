# Email Campaign - Visual Guide

## 📧 Email Campaign Interface

### Main Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  📧 Email Campaign                          [📜 Email History]     │
│  Send bulk emails to inquiries via Gmail                           │
├─────────────────────────┬──────────────────────────────────────────┤
│                         │                                          │
│  EMAIL COMPOSITION      │       RECIPIENT SELECTION                │
│                         │                                          │
│  ┌───────────────────┐  │  🔍 Search...  [🎯 Programs (2)] [🔄]   │
│  │ Subject *         │  │                                          │
│  │ Welcome Email     │  │  With Email: 45  Filtered: 12  Selected: 5│
│  └───────────────────┘  │                                          │
│                         │  ☑️ Select All (12 inquiries)            │
│  ┌───────────────────┐  │                                          │
│  │ Message Content * │  │  ┌──────────────────────────────────┐   │
│  │                   │  │  │ ☑️ John Doe       📧 Has Email   │   │
│  │ Hi {name},        │  │  │    john@email.com                │   │
│  │                   │  │  │    📞 0771234567  📍 Colombo     │   │
│  │ Welcome to our    │  │  │    💼 Computer Science           │   │
│  │ program...        │  │  └──────────────────────────────────┘   │
│  │                   │  │                                          │
│  │                   │  │  ┌──────────────────────────────────┐   │
│  └───────────────────┘  │  │ ☑️ Jane Smith     📧 Has Email   │   │
│                         │  │    jane@email.com                │   │
│  📎 Attachments         │  │    📞 0777654321  📍 Kandy       │   │
│  ┌───────────────────┐  │  │    💼 Business Management       │   │
│  │ 📎 Attach Files   │  │  └──────────────────────────────────┘   │
│  │ 2.5 / 25 MB       │  │                                          │
│  └───────────────────┘  │  (More inquiries...)                    │
│                         │                                          │
│  📄 brochure.pdf (2.1MB)│                                          │
│     [🗑️]                │                                          │
│                         │                                          │
│  📄 info.docx (0.4MB)   │                                          │
│     [🗑️]                │                                          │
│                         │                                          │
│  ┌───────────────────┐  │                                          │
│  │ ✉️ Send to 5      │  │                                          │
│  │    Selected       │  │                                          │
│  └───────────────────┘  │                                          │
│                         │                                          │
└─────────────────────────┴──────────────────────────────────────────┘
```

---

## 📊 Program Filter

Click the **[🎯 Programs (2)]** button to show program filter:

```
┌──────────────────────────────────────────┐
│  Filter by Programs       [Clear All] [×]│
├──────────────────────────────────────────┤
│  ☑️ Computer Science                     │
│  ☑️ Business Management                  │
│  ☐ Engineering                           │
│  ☐ Medicine                              │
│  ☐ Law                                   │
└──────────────────────────────────────────┘
```

---

## 📜 Email History View

Click **[📜 Email History]** to show sent emails:

```
┌─────────────────────────────────────────────────────────────────┐
│  Email History                                     [🔄 Refresh]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📧 Welcome to Our Programs                               │  │
│  │  Hi there, we're excited to tell you about...            │  │
│  │                                                           │  │
│  │  🕐 Nov 28, 2024 10:30 AM                                │  │
│  │  👤 Sent by: John Admin                                  │  │
│  │  ✅ 8 sent    ❌ 2 failed    📎 2 attachments             │  │
│  │                                                           │  │
│  │  Recipients (10):                                         │  │
│  │  🟢 Jane Smith (jane@email.com)                          │  │
│  │  🟢 John Doe (john@email.com)                            │  │
│  │  🔴 Bob Wilson (bob@email.com) - Invalid address         │  │
│  │  🟢 Alice Brown (alice@email.com)                        │  │
│  │  ...                                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📧 Program Updates for Spring 2024                       │  │
│  │  Dear students, we have exciting updates...               │  │
│  │                                                           │  │
│  │  🕐 Nov 27, 2024 2:15 PM                                  │  │
│  │  👤 Sent by: Sarah Manager                                │  │
│  │  ✅ 15 sent   ❌ 0 failed    📎 1 attachment              │  │
│  │                                                           │  │
│  │  Recipients (15): (collapsed)                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  (More emails...)                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile View

### Email Composition (Mobile)

```
┌──────────────────────────┐
│  📧 Email Campaign       │
│  Send bulk emails        │
├──────────────────────────┤
│                          │
│  Email Subject *         │
│  ┌────────────────────┐  │
│  │ Welcome Email      │  │
│  └────────────────────┘  │
│                          │
│  Message Content *       │
│  ┌────────────────────┐  │
│  │ Hi {name},         │  │
│  │                    │  │
│  │ Welcome to...      │  │
│  │                    │  │
│  └────────────────────┘  │
│                          │
│  Attachments (Optional)  │
│  ┌────────────────────┐  │
│  │ 📎 Attach Files    │  │
│  │ 2.5 / 25 MB        │  │
│  └────────────────────┘  │
│                          │
│  📄 brochure.pdf (2.1MB) │
│     [🗑️]                 │
│                          │
│  ┌────────────────────┐  │
│  │  ✉️ Send to 5      │  │
│  │     Selected       │  │
│  └────────────────────┘  │
│                          │
├──────────────────────────┤
│  RECIPIENT SELECTION     │
│                          │
│  🔍 Search...            │
│  [🎯 Programs] [🔄]      │
│                          │
│  Selected: 5 / 12        │
│  ☑️ Select All           │
│                          │
│  ┌────────────────────┐  │
│  │ ☑️ John Doe        │  │
│  │ 📧 john@email.com  │  │
│  │ 📞 0771234567      │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ ☑️ Jane Smith      │  │
│  │ 📧 jane@email.com  │  │
│  │ 📞 0777654321      │  │
│  └────────────────────┘  │
│                          │
│  (More...)               │
│                          │
└──────────────────────────┘
```

---

## 🎨 Status Colors

### Recipient Status Indicators

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| **SENT** | 🟢 Green | ✅ | Email sent successfully |
| **FAILED** | 🔴 Red | ❌ | Email failed to send |
| **DELIVERED** | 🔵 Blue | 📬 | Email delivered to inbox |
| **READ** | 🟣 Purple | 👁️ | Email opened by recipient |
| **PENDING** | ⚪ Gray | ⏳ | Email queued, not sent yet |

---

## 🔄 User Flow

### Sending Email Campaign

```
1. User clicks "Email Campaign" in navigation
   ↓
2. Page loads with two panels:
   - Left: Email composition
   - Right: Recipient selection
   ↓
3. User composes email:
   - Enters subject
   - Writes message (can use {name})
   - Optionally attaches files
   ↓
4. User selects recipients:
   - Uses search to filter
   - Applies program filters
   - Selects individuals or all
   ↓
5. User clicks "Send to X Selected"
   ↓
6. System processes:
   - Validates input
   - Gets Gmail access token
   - Creates email record
   - Saves attachments
   - Sends to each recipient
   - Updates status
   ↓
7. User sees results:
   - Success message with counts
   - "Successfully sent 8 emails. 2 failed."
   - Recipients deselected
   - Form cleared
   ↓
8. User can view history:
   - Click "Email History"
   - See all sent emails
   - Check delivery status
```

---

## 🎯 Message Personalization

### Using Name Placeholder

**Your Message:**
```
Hi {name},

We're excited to invite you to our upcoming Open Day!

Best regards,
Admissions Team
```

**Recipient Sees:**
```
Hi John Doe,

We're excited to invite you to our upcoming Open Day!

Best regards,
Admissions Team
```

**Case Insensitive:** `{name}`, `{Name}`, or `{NAME}` all work!

---

## 📎 Attachment Handling

### Size Limits
- **Single File**: No limit (practical limit ~24MB)
- **Total**: 25MB for all attachments combined
- **Indicator**: Shows "2.5 / 25 MB" as you add files

### Supported File Types
✅ PDFs, Word documents, Excel sheets  
✅ Images (JPG, PNG, GIF)  
✅ Text files  
✅ Presentations (PPT, PPTX)  
✅ Archives (ZIP, RAR)  
✅ Any file type supported by Gmail  

### Upload Process
1. Click **📎 Attach Files**
2. Select one or more files
3. Files appear in list with name and size
4. Click **🗑️** to remove a file
5. Total size updates automatically

---

## 🔍 Search & Filter

### Search Box
Type to filter by:
- Name (e.g., "John")
- Email (e.g., "john@")
- Phone (e.g., "077")
- City (e.g., "Colombo")

### Program Filter
- Click **[🎯 Programs]** button
- Select one or more programs
- Only seekers interested in those programs show
- Badge shows count: **[🎯 Programs (2)]**
- Click **Clear All** to reset

---

## 🎉 Success Indicators

### After Sending

**Success:**
```
┌────────────────────────────────────┐
│ ✅ Success                         │
│                                    │
│ Successfully sent 8 emails.        │
│ 2 failed.                          │
└────────────────────────────────────┘
```

**Error:**
```
┌────────────────────────────────────┐
│ ❌ Error                           │
│                                    │
│ Gmail authentication failed.       │
│ Please configure Gmail API.        │
└────────────────────────────────────┘
```

---

## 🔧 Gmail API Setup (Required)

### Quick Setup Checklist

- [ ] Create Google Cloud Project
- [ ] Enable Gmail API
- [ ] Create OAuth 2.0 Credentials
- [ ] Get Refresh Token from OAuth Playground
- [ ] Add credentials to `.env.development`:
  ```env
  GMAIL_CLIENT_ID=your-id
  GMAIL_CLIENT_SECRET=your-secret
  GMAIL_REFRESH_TOKEN=your-token
  ```
- [ ] Restart dev server
- [ ] Send test email to yourself
- [ ] Verify email received

**📖 Detailed Instructions:** See `EMAIL_CAMPAIGN_SETUP.md`

---

## 📊 Email History Details

### Email Card

```
┌─────────────────────────────────────────────────────┐
│  📧 Welcome to Our Programs                         │
│  Hi there, we're excited to tell you about...       │
│                                                     │
│  🕐 Nov 28, 2024 10:30:25 AM                        │
│  👤 Sent by: John Admin                             │
│  ✅ 8 sent    ❌ 2 failed    📎 2 attachments        │
│                                                     │
│  Recipients (10):                                    │
│  ┌───────────────────┬───────────────────┬─────────┐│
│  │ 🟢 Jane Smith     │ 🟢 John Doe       │ 🔴 Bob  ││
│  │ jane@email.com    │ john@email.com    │ (Failed)││
│  ├───────────────────┼───────────────────┼─────────┤│
│  │ 🟢 Alice Brown    │ 🟢 Charlie Davis  │ 🟢 Eve  ││
│  │ alice@email.com   │ charlie@email.com │ (Sent)  ││
│  └───────────────────┴───────────────────┴─────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 💡 Pro Tips

### 1. Test First
Always send a test email to yourself before bulk sending:
- Select only yourself
- Verify formatting
- Check attachments

### 2. Personalize Messages
Use `{name}` placeholder to make emails feel personal:
```
Hi {name},  ← Automatically becomes recipient's name
```

### 3. Monitor Status
Check email history after sending to see:
- Which emails were delivered
- Which failed and why
- Overall success rate

### 4. Filter Smartly
Use program filters to send targeted messages:
- Engineering students → Technical programs info
- Business students → MBA/Business programs info

### 5. Keep it Professional
- ✅ Clear subject lines
- ✅ Proper grammar and formatting
- ✅ Professional signature
- ✅ Contact information

---

## 🚨 Important Notes

### Gmail Sending Limits

**Free Gmail Account:**
- 500 emails per day
- 100 recipients per email

**Google Workspace Account:**
- 2,000 emails per day
- 2,000 recipients per day

**Recommendation:** For large campaigns, split into batches over multiple days.

### Attachment Considerations

- Keep files small for faster sending
- Use cloud storage links for large files
- PDF format recommended for documents
- Compress images before attaching

### Privacy & Compliance

- ✅ Only send to those who opted in
- ✅ Include unsubscribe option
- ✅ Respect privacy regulations
- ✅ Don't spam recipients

---

## 📈 Success Metrics

After sending, monitor these metrics:

| Metric | Good | Needs Improvement |
|--------|------|-------------------|
| **Sent Rate** | > 95% | < 90% |
| **Failed Rate** | < 5% | > 10% |
| **Delivery Rate** | > 90% | < 80% |
| **Read Rate** | > 20% | < 10% |

---

## 🎯 Use Cases

### 1. **Welcome Emails**
Send to new inquiries introducing your institution

### 2. **Program Updates**
Notify interested students about new programs

### 3. **Event Invitations**
Invite to open days, webinars, info sessions

### 4. **Application Reminders**
Remind students about upcoming deadlines

### 5. **Follow-up Communications**
Send additional information after initial contact

---

## 🔄 Before & After

### ❌ Before Fix

```
Error Console:
POST /api/email/bulk-send 404 ← Endpoint missing!
POST /api/email/history 404   ← Endpoint missing!

User Experience:
- Clicking send does nothing ❌
- No error message shown ❌
- Email history empty ❌
- Feature unusable ❌
```

### ✅ After Fix

```
Success Console:
POST /api/email/bulk-send 200 ✅ Works!
GET /api/email/history 200    ✅ Works!

User Experience:
- Emails send successfully ✅
- Status messages appear ✅
- History shows sent emails ✅
- Feature fully functional ✅
```

---

## 📖 Related Documentation

- **`EMAIL_CAMPAIGN_SETUP.md`** - Complete setup guide with Gmail API instructions
- **`EMAIL_CAMPAIGN_FIX_SUMMARY.md`** - Technical fix details
- **`EMAIL_CAMPAIGN_VISUAL_GUIDE.md`** - This visual guide

---

## ✅ Ready to Use!

Your Email Campaign feature is now **fully functional**!

**To start using:**
1. Configure Gmail API (see `EMAIL_CAMPAIGN_SETUP.md`)
2. Navigate to `/email-campaign`
3. Compose your first email
4. Select recipients
5. Click Send!

**Happy Emailing! 📧🚀**

