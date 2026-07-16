# CRM Communications, Telephony, & Workload Dashboard Setup Guide

This guide walks through configuring the Twilio Telephony Integration, Google/Microsoft OAuth settings, Project Role enforcement, and Staff Workload Dashboards.

---

## 1. Environment Variables Configuration

Copy the following parameters into your `.env` configuration file:

```env
# ─── GOOGLE GMAIL INTEGRATION ──────────────────────────────────────────
GMAIL_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="your-google-oauth-client-secret"
# Must match Google Console Authorized Redirect URIs
GOOGLE_REDIRECT_URI="http://localhost:3000/api/email/oauth/callback?provider=google"

# ─── MICROSOFT OUTLOOK/365 INTEGRATION ───────────────────────────────
MICROSOFT_CLIENT_ID="your-azure-app-client-id"
MICROSOFT_CLIENT_SECRET="your-azure-app-client-secret"
MICROSOFT_TENANT_ID="common" # or specific tenant ID
MICROSOFT_REDIRECT_URI="http://localhost:3000/api/email/oauth/callback?provider=microsoft"

# ─── TWILIO TELEPHONY INTEGRATION ────────────────────────────────────
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1xxxxxxxxxx" # Your Twilio phone number
NEXT_PUBLIC_APP_URL="http://localhost:3000" # Base URL of CRM deployment for webhooks
```

---

## 2. Google OAuth Integration Setup
1. Go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Create a new project or select an existing one.
3. Under **APIs & Services** > **Credentials**, configure the **OAuth consent screen**.
   - Select User Type: **External** (or Internal if under Google Workspace).
   - Add scope: `https://www.googleapis.com/auth/gmail.modify` (needed to pull & send email replies).
   - Add scope: `https://www.googleapis.com/auth/userinfo.email` (needed to resolve email connection address).
4. Click **Create Credentials** > **OAuth client ID**.
   - Application Type: **Web application**.
   - Authorized JavaScript origins: `http://localhost:3000` (and production domains).
   - Authorized redirect URIs: `http://localhost:3000/api/email/oauth/callback?provider=google`.
5. Save the generated Client ID and Client Secret into your `.env` file.

---

## 3. Microsoft 365/Azure OAuth Setup
1. Go to the **[Microsoft Entra Admin Center (Azure Portal)](https://entra.microsoft.com/)**.
2. Select **Identity** > **Applications** > **App registrations** > **New registration**.
   - Name: `Education CRM Mail Integration`.
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts** (Multitenant).
   - Redirect URI: Web -> `http://localhost:3000/api/email/oauth/callback?provider=microsoft`.
3. Go to **Certificates & secrets** > **Client secrets** > **New client secret** to generate a secret key. Copy the **Value** immediately.
4. Go to **API permissions** > **Add a permission** > **Microsoft Graph**:
   - Delegated permissions: `Mail.ReadWrite`, `Mail.Send`, `User.Read`, `offline_access` (essential for refresh tokens).
5. Update your `.env` variables with the Client ID, Client Secret, and Redirect URI.

---

## 4. Twilio Telephony Setup
1. Create or log into your **[Twilio Console](https://www.twilio.com/console)**.
2. Retrieve your **Account SID**, **Auth Token**, and purchase/assign a voice-capable **Twilio Phone Number**.
3. Place these inside the `.env` variables.
4. Set the `NEXT_PUBLIC_APP_URL` variable to your CRM URL (e.g. `http://localhost:3000` locally, or `https://crm.yourdomain.com` in production). This is automatically appended to Twilio's webhook callback targets (`/api/telephony/webhook/completed` and `/api/telephony/webhook/recording`) so Twilio can report call outcomes and recordings to the CRM database.

---

## 5. Feature Highlights & Usage

### Two-way Email Inbox
- Access via **Shared Inbox** in the sidebar.
- Click **Connect Gmail** or **Connect Outlook** to link your mailbox.
- Click **Sync Inbox** to pull recent student emails. The CRM automatically matches sender/recipient addresses to student (Seeker) database profiles.
- Outbound emails contain an invisible 1x1 image tracking pixel. When the student opens the email, the sent/open status counter updates in real time.

### Twilio Click-to-Call
- Open any inquiry (seeker profile card).
- Click the **Call** button next to the student's phone number.
- Enter your own active phone number. Twilio will dial you first, and once you pick up, it dials the student's number and bridges the call while recording both channels.
- When the call completes, the CRM:
  1. Updates the `CallLog` with Twilio status and duration.
  2. Auto-logs a phone `Interaction` on the student profile.
  3. Schedules a `FollowUpTask` for the agent.
  4. Appends the audio recording MP3 URL to the task notes.

### Staff Workload Dashboard
- Access via **Reports** > **Staff Workload** in the sidebar.
- Managers can filter analytics by date ranges, specific projects, and team members.
- Shows total hours worked (time entry logging), task completion rates, overdue work, and response times (email and WhatsApp average response times).
- Click **Export Report (CSV)** to download the data table.
