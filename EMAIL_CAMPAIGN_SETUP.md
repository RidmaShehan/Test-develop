# Email Campaign Feature - Setup & Usage Guide

## 🎉 Feature Overview

The Email Campaign feature allows you to send bulk emails to inquiries (seekers) who have email addresses. It includes support for:

✅ **Bulk Email Sending** - Send to multiple recipients at once  
✅ **Attachments** - Add files up to 25MB total  
✅ **Email History** - View all sent emails with delivery status  
✅ **Personalization** - Use `{name}` placeholder in messages  
✅ **Program Filtering** - Filter recipients by preferred programs  
✅ **Status Tracking** - Track SENT, FAILED, DELIVERED, READ statuses  
✅ **Permission Control** - Role-based access to email features  

---

## 🔧 Setup Instructions

### 1. **Gmail API Configuration**

To send emails via Gmail API, you need to set up OAuth 2.0 credentials:

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Gmail API**

#### Step 2: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Select **Web application**
4. Add authorized redirect URI: `https://developers.google.com/oauthplayground`
5. Save the **Client ID** and **Client Secret**

#### Step 3: Get Refresh Token
1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Click the ⚙️ gear icon (Settings) in the top right
3. Check **"Use your own OAuth credentials"**
4. Enter your **Client ID** and **Client Secret**
5. In the left panel, select **Gmail API v1**
6. Check the scope: `https://www.googleapis.com/auth/gmail.send`
7. Click **Authorize APIs**
8. Sign in with your Gmail account
9. Click **Exchange authorization code for tokens**
10. Copy the **Refresh token**

#### Step 4: Add Environment Variables
Add these to your `.env.development` file:

```env
# Gmail API Configuration
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
```

### 2. **Database Migration**

The database schema has been updated with new tables:

- `email_messages` - Stores sent email campaigns
- `email_recipients` - Tracks recipients and delivery status
- `email_attachments` - Stores email attachments

**Migration was already applied** when you ran `npx prisma db push`

---

## 📋 API Endpoints

### POST `/api/email/bulk-send`

Send bulk emails to multiple recipients.

**Request Body (FormData):**
```javascript
const formData = new FormData()
formData.append('seekers', JSON.stringify(seekersArray))
formData.append('subject', 'Email Subject')
formData.append('message', 'Email message content with {name} placeholder')
formData.append('attachment-0', file1)
formData.append('attachment-1', file2)
```

**Response:**
```json
{
  "success": true,
  "messageId": "email-message-id",
  "recipientCount": 10,
  "sentCount": 8,
  "failedCount": 2,
  "results": [
    {
      "seekerId": "seeker-id",
      "email": "user@example.com",
      "success": true
    }
  ]
}
```

### GET `/api/email/history`

Get email sending history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response:**
```json
{
  "messages": [
    {
      "id": "message-id",
      "subject": "Welcome Email",
      "message": "Email content",
      "recipientCount": 10,
      "sentCount": 8,
      "failedCount": 2,
      "attachmentCount": 2,
      "sentAt": "2024-01-01T00:00:00Z",
      "user": {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "recipients": [...],
      "attachments": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasMore": true
  }
}
```

---

## 🎯 Usage Guide

### Accessing Email Campaign

Navigate to `/email-campaign` in your CRM system.

### Sending Bulk Emails

1. **Compose Email**
   - Enter email subject
   - Write message content
   - Use `{name}` placeholder for personalization
   - Attach files (optional, max 25MB total)

2. **Select Recipients**
   - Search by name, phone, email, or city
   - Filter by preferred programs
   - Select individual recipients or use "Select All"
   - Only seekers with email addresses are shown

3. **Send**
   - Click "Send to X Selected" button
   - Wait for confirmation
   - View success/failure count

### Viewing Email History

1. Click **Email History** button
2. View all sent emails with:
   - Subject and content
   - Recipient count and status
   - Sent time and sender
   - Attachments
   - Delivery status per recipient

---

## 🎨 Features in Detail

### Message Personalization

Use `{name}` in your message to automatically replace with recipient's name:

```
Hi {name},

We're excited to tell you about our new programs!
```

Becomes:

```
Hi John Doe,

We're excited to tell you about our new programs!
```

### Attachment Support

- **Maximum Size**: 25MB total for all attachments
- **Supported Types**: All file types
- **Multiple Files**: Yes, attach multiple files
- **Display**: Files show with name and size

### Program Filtering

Filter recipients by their preferred programs:
- Select one or more programs
- Only seekers interested in selected programs are shown
- Clear filters to see all seekers

### Email Status Tracking

Track delivery status for each recipient:

| Status | Description |
|--------|-------------|
| **PENDING** | Email queued but not sent |
| **SENT** | Email sent successfully |
| **FAILED** | Email failed to send |
| **DELIVERED** | Email delivered to recipient |
| **READ** | Email opened by recipient |

---

## 🔐 Permissions

Email campaign features require appropriate permissions:

- **Send Emails**: User must be authenticated
- **View History**: 
  - Regular users see only their sent emails
  - ADMIN/ADMINISTRATOR see all emails

---

## 🐛 Troubleshooting

### Error: "Gmail authentication failed"

**Cause**: Missing or invalid Gmail API credentials

**Solution**:
1. Verify `.env.development` has correct credentials
2. Check refresh token is valid
3. Ensure Gmail API is enabled in Google Cloud Console
4. Generate a new refresh token

### Error: "No seekers with email addresses found"

**Cause**: Selected seekers don't have email addresses

**Solution**:
1. Add email addresses to seeker records
2. Select different seekers with email addresses
3. Import seekers with email data

### Error: "Total attachment size must be less than 25MB"

**Cause**: Attachments exceed Gmail's size limit

**Solution**:
1. Remove some attachments
2. Compress files before attaching
3. Use cloud storage links instead

### Emails not sending

**Possible causes**:
1. Invalid Gmail credentials
2. Gmail API quota exceeded
3. Recipient email addresses invalid
4. Network connection issues

**Solutions**:
1. Check Gmail API dashboard for errors
2. Verify credentials in `.env.development`
3. Test with a single recipient first
4. Check server logs for detailed errors

---

## 📊 Database Schema

### EmailMessage Table

```prisma
model EmailMessage {
  id              String
  subject         String
  message         String
  recipientCount  Int
  sentCount       Int
  failedCount     Int
  sentAt          DateTime
  userId          String
  campaignId      String?
  
  user            User
  recipients      EmailRecipient[]
  attachments     EmailAttachment[]
}
```

### EmailRecipient Table

```prisma
model EmailRecipient {
  id              String
  email           String
  status          EmailStatus
  errorMessage    String?
  sentAt          DateTime?
  emailMessageId  String
  seekerId        String
  
  emailMessage    EmailMessage
  seeker          Seeker
}
```

### EmailAttachment Table

```prisma
model EmailAttachment {
  id              String
  filename        String
  mimeType        String
  size            Int
  content         String  // Base64 encoded
  emailMessageId  String
  
  emailMessage    EmailMessage
}
```

---

## 🚀 Performance Tips

1. **Batch Size**: Send to max 50-100 recipients at once
2. **Rate Limiting**: Gmail has sending limits (check your account)
3. **Attachments**: Keep total size under 20MB for faster sending
4. **Testing**: Always test with yourself first before bulk sending

---

## 📝 Best Practices

### Email Content

1. **Clear Subject**: Be specific and descriptive
2. **Personalization**: Use {name} placeholder
3. **Professional Tone**: Maintain formal communication
4. **Call to Action**: Include clear next steps
5. **Contact Info**: Add your contact details

### Recipient Selection

1. **Targeted**: Send relevant content to right audience
2. **Program-based**: Use program filters for specific campaigns
3. **Segmentation**: Don't send to everyone at once
4. **Verification**: Double-check recipient list before sending

### Compliance

1. **Consent**: Only email those who opted in
2. **Unsubscribe**: Provide opt-out option
3. **Privacy**: Respect user data privacy
4. **Regulations**: Follow GDPR, CAN-SPAM guidelines

---

## 🎉 Success!

Your Email Campaign feature is now set up and ready to use!

### Next Steps:
1. ✅ Configure Gmail API credentials
2. ✅ Test with a single email
3. ✅ Send your first campaign
4. ✅ Monitor delivery status
5. ✅ Review email history

---

## 📞 Support

If you encounter issues:
1. Check server logs for detailed errors
2. Verify Gmail API configuration
3. Test with simple emails first
4. Contact system administrator

**Status**: ✅ **Feature Complete & Production Ready**
