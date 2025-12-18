# SMTP Troubleshooting Guide

## Quick Diagnostic

If you're getting "SMTP connection failed" error, follow these steps:

### Step 1: Test Your SMTP Configuration

Visit this URL in your browser (while logged in):
```
http://localhost:3000/api/email/test-smtp
```

This will show you:
- Which environment variables are set/missing
- Detailed connection error messages
- Provider-specific setup instructions
- Troubleshooting tips

### Step 2: Check Your Environment Variables

Make sure you have a `.env` or `.env.local` file in your project root with the required variables.

**For Mailjet (Recommended):**
```env
SMTP_PROVIDER=mailjet
SMTP_USER=your_mailjet_api_key
SMTP_PASS=your_mailjet_secret_key
SMTP_FROM=your-email@example.com
SMTP_FROM_NAME=CRM System
```

**For SendPulse:**
```env
SMTP_PROVIDER=sendpulse
SMTP_USER=your_sendpulse_user_id
SMTP_PASS=your_sendpulse_secret
SMTP_FROM=your-email@example.com
```

**For Gmail:**
```env
SMTP_PROVIDER=gmail
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM=your-email@gmail.com
```

### Step 3: Common Issues & Solutions

#### Issue: "Missing required SMTP configuration"

**Solution:**
- Check that all required variables are in your `.env` file
- Make sure there are no typos in variable names
- Restart your development server after adding variables

#### Issue: "Authentication failed"

**Possible causes:**
1. **Wrong credentials** - Double-check your API key/secret
2. **Gmail App Password** - Make sure you're using an App Password, not your regular password
3. **SendGrid username** - Must be exactly `apikey` (lowercase)
4. **Expired credentials** - Some providers expire API keys

**Solution:**
- Verify credentials in your SMTP provider dashboard
- For Gmail: Generate a new App Password
- For SendGrid: Make sure username is `apikey` and password is your API key

#### Issue: "Connection timeout" or "ECONNREFUSED"

**Possible causes:**
1. **Wrong port** - Try port 587 (TLS) or 465 (SSL)
2. **Firewall blocking** - Your network might block SMTP ports
3. **Wrong host** - Verify the SMTP hostname

**Solution:**
- Try port 587 first (most common)
- If that fails, try port 465 with `SMTP_SECURE=true`
- Check your provider's documentation for correct host/port

#### Issue: "Sender email not verified"

**Solution:**
- Most providers require you to verify your sender email
- Go to your provider's dashboard and verify your email address
- For Mailjet: Settings → Senders & Domains → Verify Email
- For SendGrid: Settings → Sender Authentication → Verify

#### Issue: "Rate limit exceeded"

**Solution:**
- Check your provider's free tier limits
- Mailjet: 200 emails/day (6,000/month)
- SendPulse: 400 emails/day (12,000/month)
- Gmail: 500 emails/day
- Wait or upgrade to a paid plan

### Step 4: Verify Environment Variables Are Loaded

Add this temporary code to check if variables are loaded:

```typescript
// In your API route or server component
console.log('SMTP_PROVIDER:', process.env.SMTP_PROVIDER)
console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET')
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET')
console.log('SMTP_FROM:', process.env.SMTP_FROM)
```

**Important:** Never log actual passwords in production!

### Step 5: Test with a Simple Email

Once configuration is correct, test by:
1. Going to Email Campaign page
2. Selecting one seeker with email
3. Sending a test email
4. Check recipient's inbox (and spam folder)

---

## Provider-Specific Issues

### Mailjet
- **Issue**: "Invalid API key"
  - **Solution**: Make sure you're using API Key (not Secret Key) for SMTP_USER
  - Secret Key goes in SMTP_PASS

### SendGrid
- **Issue**: "Authentication failed"
  - **Solution**: Username must be exactly `apikey` (lowercase)
  - Password is your API key

### Gmail
- **Issue**: "Less secure app access"
  - **Solution**: Use App Password, not regular password
  - Enable 2-Step Verification first
  - Generate App Password: https://myaccount.google.com/apppasswords

### SendPulse
- **Issue**: "Invalid credentials"
  - **Solution**: Use User ID (not email) for SMTP_USER
  - Get credentials from Settings → SMTP

---

## Still Having Issues?

1. **Check server logs** - Look for detailed error messages
2. **Test endpoint** - Visit `/api/email/test-smtp` for diagnostics
3. **Provider status** - Check if your SMTP provider is having issues
4. **Network** - Try from a different network (some networks block SMTP)
5. **Contact support** - Reach out to your SMTP provider's support

---

## Quick Checklist

- [ ] All required environment variables are set
- [ ] Server restarted after adding variables
- [ ] Credentials are correct (no typos)
- [ ] Sender email is verified with provider
- [ ] Using correct port (587 or 465)
- [ ] Not exceeding rate limits
- [ ] Network allows SMTP connections
- [ ] Provider service is operational

---

## Need More Help?

- See `SMTP_SETUP_GUIDE.md` for detailed setup instructions
- See `SMTP_QUICK_START.md` for quick setup
- Check your SMTP provider's documentation
- Review server console logs for detailed errors

