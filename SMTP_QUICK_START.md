# SMTP Quick Start Guide

## Fastest Setup: Mailjet (Recommended)

1. Sign up at https://www.mailjet.com/ (free)
2. Get API Key and Secret from Account Settings → API Keys
3. Add to `.env`:

```env
SMTP_PROVIDER=mailjet
SMTP_USER=your_mailjet_api_key_here
SMTP_PASS=your_mailjet_secret_key_here
SMTP_FROM=your-email@example.com
SMTP_FROM_NAME=CRM System
SMTP_PORT=587
SMTP_SECURE=false
```

**Note:** If port 587 doesn't work, try:
- Port 465 with SSL: `SMTP_PORT=465` and `SMTP_SECURE=true`
- Port 25: `SMTP_PORT=25` and `SMTP_SECURE=false` (may be blocked by ISP)

4. Verify your sender email in Mailjet dashboard (Settings → Senders & Domains)
5. Restart your server: `npm run dev`
6. Done! ✅

---

## Alternative: SendPulse (More Free Emails)

1. Sign up at https://sendpulse.com/ (free)
2. Get SMTP credentials from Settings → SMTP
3. Add to `.env`:

```env
SMTP_PROVIDER=sendpulse
SMTP_USER=your_sendpulse_user_id
SMTP_PASS=your_sendpulse_secret
SMTP_FROM=your-email@example.com
SMTP_FROM_NAME=CRM System
```

---

## Alternative: Gmail SMTP

1. Enable 2-Step Verification on your Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:

```env
SMTP_PROVIDER=gmail
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=CRM System
```

---

## Test Your Setup

After configuration, test by:
1. Going to Email Campaign page
2. Selecting a seeker with email
3. Sending a test email

If it works, you're all set! 🎉

For detailed setup instructions, see `SMTP_SETUP_GUIDE.md`

