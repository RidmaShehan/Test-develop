# SMTP Email Setup Guide

This guide will help you set up a free and trustworthy SMTP service for the email campaign feature.

## Recommended Free SMTP Providers

### 1. **Mailjet** (Recommended) ⭐
- **Free Tier**: 6,000 emails/month (200 emails/day)
- **Reliability**: High
- **Setup Time**: 5 minutes
- **Best For**: Most users - best balance of free emails and reliability

### 2. **SendPulse**
- **Free Tier**: 12,000 emails/month (400 emails/day)
- **Reliability**: High
- **Setup Time**: 5 minutes
- **Best For**: Users who need more emails per month

### 3. **SendGrid**
- **Free Tier**: 100 emails/day for 60 days (then paid)
- **Reliability**: Very High
- **Setup Time**: 5 minutes
- **Best For**: Short-term testing (60-day trial)

### 4. **Gmail SMTP**
- **Free Tier**: 500 emails/day (with Gmail account)
- **Reliability**: High
- **Setup Time**: 10 minutes (requires App Password)
- **Best For**: Users who want to use their Gmail account

### 5. **Elastic Email**
- **Free Tier**: 100 emails/day
- **Reliability**: Good
- **Setup Time**: 5 minutes
- **Best For**: Basic email needs

---

## Quick Setup Instructions

### Option 1: Mailjet (Recommended)

1. **Sign up for Mailjet**:
   - Go to https://www.mailjet.com/
   - Click "Sign Up Free"
   - Complete the registration

2. **Get your API credentials**:
   - After logging in, go to **Account Settings** → **API Keys**
   - Copy your **API Key** and **Secret Key**

3. **Add to your `.env` file**:
   ```env
   SMTP_PROVIDER=mailjet
   SMTP_USER=your_mailjet_api_key
   SMTP_PASS=your_mailjet_secret_key
   SMTP_FROM=your-email@example.com
   SMTP_FROM_NAME=Your Company Name
   SMTP_PORT=587
   SMTP_SECURE=false
   ```

   **Port Options:**
   - **Port 587 with TLS** (Recommended): `SMTP_PORT=587` and `SMTP_SECURE=false`
   - **Port 465 with SSL** (If 587 doesn't work): `SMTP_PORT=465` and `SMTP_SECURE=true`
   - **Port 25** (May be blocked by ISPs): `SMTP_PORT=25` and `SMTP_SECURE=false`

4. **Verify your sender email**:
   - In Mailjet dashboard, go to **Senders & Domains**
   - Add and verify your sender email address
   - This is required before you can send emails

---

### Option 2: SendPulse

1. **Sign up for SendPulse**:
   - Go to https://sendpulse.com/
   - Click "Sign Up Free"
   - Complete the registration

2. **Get your SMTP credentials**:
   - After logging in, go to **Settings** → **SMTP**
   - Copy your **SMTP User ID** and **SMTP Secret**

3. **Add to your `.env` file**:
   ```env
   SMTP_PROVIDER=sendpulse
   SMTP_USER=your_sendpulse_user_id
   SMTP_PASS=your_sendpulse_secret
   SMTP_FROM=your-email@example.com
   SMTP_FROM_NAME=Your Company Name
   ```

---

### Option 3: SendGrid

1. **Sign up for SendGrid**:
   - Go to https://sendgrid.com/
   - Click "Start for Free"
   - Complete the registration

2. **Create an API Key**:
   - Go to **Settings** → **API Keys**
   - Click "Create API Key"
   - Give it a name and select "Full Access" or "Mail Send" permissions
   - Copy the API key (you'll only see it once!)

3. **Add to your `.env` file**:
   ```env
   SMTP_PROVIDER=sendgrid
   SMTP_USER=apikey
   SMTP_PASS=your_sendgrid_api_key
   SMTP_FROM=your-email@example.com
   SMTP_FROM_NAME=Your Company Name
   ```

4. **Verify your sender**:
   - Go to **Settings** → **Sender Authentication**
   - Verify your sender email or domain

---

### Option 4: Gmail SMTP

1. **Enable 2-Step Verification**:
   - Go to your Google Account settings
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "CRM System" as the name
   - Copy the generated 16-character password

3. **Add to your `.env` file**:
   ```env
   SMTP_PROVIDER=gmail
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your_16_character_app_password
   SMTP_FROM=your-email@gmail.com
   SMTP_FROM_NAME=Your Company Name
   ```

**Note**: Gmail has a daily limit of 500 emails per day.

---

### Option 5: Elastic Email

1. **Sign up for Elastic Email**:
   - Go to https://elasticemail.com/
   - Click "Sign Up Free"
   - Complete the registration

2. **Get your SMTP credentials**:
   - After logging in, go to **Settings** → **SMTP**
   - Copy your **Username** and **API Key**

3. **Add to your `.env` file**:
   ```env
   SMTP_PROVIDER=elastic
   SMTP_USER=your_elastic_username
   SMTP_PASS=your_elastic_api_key
   SMTP_FROM=your-email@example.com
   SMTP_FROM_NAME=Your Company Name
   ```

---

## Custom SMTP Configuration

If you have your own SMTP server or want to use a different provider:

```env
SMTP_PROVIDER=custom
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_username
SMTP_PASS=your_password
SMTP_FROM=your-email@example.com
SMTP_FROM_NAME=Your Company Name
```

**Port Configuration**:
- Port `587`: Use TLS (set `SMTP_SECURE=false`)
- Port `465`: Use SSL (set `SMTP_SECURE=true`)
- Port `25`: Usually blocked by ISPs, not recommended

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SMTP_PROVIDER` | No | Provider name (mailjet, sendpulse, sendgrid, gmail, elastic, custom) | `mailjet` |
| `SMTP_HOST` | Yes* | SMTP server hostname | `in-v3.mailjet.com` |
| `SMTP_PORT` | Yes* | SMTP server port | `587` |
| `SMTP_SECURE` | No | Use SSL/TLS (true for 465, false for 587) | `false` |
| `SMTP_USER` | Yes | SMTP username/API key | `your_api_key` |
| `SMTP_PASS` | Yes | SMTP password/API secret | `your_secret` |
| `SMTP_FROM` | Yes | Sender email address | `noreply@example.com` |
| `SMTP_FROM_NAME` | No | Sender display name | `CRM System` |

*Required only for custom SMTP configuration

---

## Testing Your SMTP Configuration

After setting up your SMTP credentials:

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test sending an email**:
   - Go to the Email Campaign page
   - Select a seeker with an email address
   - Compose and send a test email

3. **Check for errors**:
   - If emails fail to send, check the server console for error messages
   - Verify all environment variables are set correctly
   - Ensure your sender email is verified with the SMTP provider

---

## Troubleshooting

### Error: "SMTP configuration is incomplete"
- **Solution**: Make sure all required environment variables are set in your `.env` file

### Error: "SMTP connection failed"
- **Solution**: 
  - Verify your credentials are correct (API Key and Secret Key for Mailjet)
  - Check if your IP is blocked (some providers block certain IPs)
  - **For Mailjet, try these port configurations in order:**
    1. Port 587 with TLS (default): `SMTP_PORT=587` and `SMTP_SECURE=false`
    2. Port 465 with SSL: `SMTP_PORT=465` and `SMTP_SECURE=true`
    3. Port 25 (may be blocked by ISP): `SMTP_PORT=25` and `SMTP_SECURE=false`
  - Verify your sender email is verified in Mailjet dashboard

### Error: "Authentication failed"
- **Solution**:
  - Double-check your username/password
  - For Gmail, make sure you're using an App Password, not your regular password
  - For SendGrid, make sure you're using `apikey` as the username

### Emails going to spam
- **Solution**:
  - Verify your sender email/domain with the SMTP provider
  - Add SPF and DKIM records to your domain (if using custom domain)
  - Avoid spam trigger words in subject lines
  - Don't send too many emails at once

### Rate limiting errors
- **Solution**:
  - Check your provider's free tier limits
  - Add delays between email sends if needed
  - Consider upgrading to a paid plan if you need more emails

---

## Security Best Practices

1. **Never commit `.env` file to git** - It contains sensitive credentials
2. **Use environment-specific credentials** - Different credentials for dev/prod
3. **Rotate API keys regularly** - Change passwords/keys periodically
4. **Use App Passwords for Gmail** - Never use your main Gmail password
5. **Monitor email sending** - Check your SMTP provider dashboard for suspicious activity

---

## Migration from Gmail API

If you were previously using Gmail API and want to switch to SMTP:

1. Remove Gmail API environment variables:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`

2. Add SMTP environment variables (see above)

3. The system will automatically use SMTP instead of Gmail API

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review your SMTP provider's documentation
3. Check server logs for detailed error messages
4. Verify your environment variables are loaded correctly

---

## Recommended Provider Comparison

| Provider | Free Emails/Month | Daily Limit | Best For |
|----------|------------------|-------------|----------|
| **Mailjet** | 6,000 | 200/day | Most users ⭐ |
| **SendPulse** | 12,000 | 400/day | High volume needs |
| **SendGrid** | 3,000 (60 days) | 100/day | Short-term testing |
| **Gmail** | 15,000 | 500/day | Gmail users |
| **Elastic** | 3,000 | 100/day | Basic needs |

**Our Recommendation**: Start with **Mailjet** for the best balance of free emails and reliability.

