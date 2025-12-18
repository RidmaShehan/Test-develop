# 📧 Gmail API Setup - Step by Step Guide

## 🔐 **SECURITY NOTE:**

**⚠️ IMPORTANT:** This guide assumes you have your own Google OAuth credentials. Never use credentials from documentation or commit real credentials to version control. If you don't have credentials yet, start with Step 0.

---

## 📋 **Prerequisites Checklist**

Before starting, make sure you have:
- [ ] A Google Cloud account
- [ ] Access to Google Cloud Console
- [ ] A Gmail account to send emails from

---

## 🎯 **Step 0: Get Your Google OAuth Credentials** (First Time Only)

If you already have Client ID and Client Secret, skip to Step 1.

### Create OAuth Credentials in Google Cloud Console

1. **Go to Google Cloud Console:**
   ```
   https://console.cloud.google.com/
   ```

2. **Create or Select a Project:**
   - Click the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name (e.g., "CRM System")

3. **Enable Gmail API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click on "Gmail API"
   - Click "Enable"

4. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" (for development) or "Internal" (for G Suite)
   - Fill in required fields:
     - App name: Your CRM App Name
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Skip scopes (we'll add them later)
   - Add test users if needed (for development)
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Web application**
   - Name: "CRM Gmail Client" (or any name)
   - Authorized redirect URIs: 
     ```
     https://developers.google.com/oauthplayground
     ```
   - Click "Create"
   - **IMPORTANT:** Copy your Client ID and Client Secret immediately!
     - They look like:
       ```
       Client ID: xxxxxxxx-xxxxxxxxxxxx.apps.googleusercontent.com
       Client Secret: GOCSPX-xxxxxxxxxxxxx
       ```

**✅ You now have:**
- Client ID
- Client Secret

**⚠️ Store these securely and never commit them to version control!**

---

## 🎯 **Step 1: Get Refresh Token**

### Step 1: Go to OAuth 2.0 Playground

Open this link in your browser:
```
https://developers.google.com/oauthplayground
```

---

### Step 2: Configure OAuth Playground

1. Click the **⚙️ Settings gear icon** in the top-right corner

2. Check the box: **✅ "Use your own OAuth credentials"**

3. Enter your credentials (from Step 0):
   ```
   OAuth Client ID: YOUR_CLIENT_ID.apps.googleusercontent.com
   OAuth Client secret: YOUR_CLIENT_SECRET
   ```
   **⚠️ Replace with your actual credentials from Google Cloud Console!**

4. Click **Close**

---

### Step 3: Select Gmail API Scope

1. In the left panel, find **"Gmail API v1"**

2. Expand it and check this scope:
   ```
   ✅ https://www.googleapis.com/auth/gmail.send
   ```

3. Click the blue **"Authorize APIs"** button

---

### Step 4: Sign In & Authorize

1. **Sign in** with the Gmail account you want to send emails from
   - This should be YOUR email account that will send the CRM emails

2. Google will show a warning: **"Google hasn't verified this app"**
   - Click **"Advanced"**
   - Click **"Go to [Your App Name] (unsafe)"**
   
3. Review permissions and click **"Allow"**

4. Click **"Allow"** again to confirm

---

### Step 5: Exchange Code for Token

1. You'll be redirected back to OAuth Playground

2. Click the blue **"Exchange authorization code for tokens"** button

3. You'll see a response like:
   ```json
   {
     "access_token": "ya29.a0...",
     "expires_in": 3599,
     "refresh_token": "1//0gXXXXXXXXXX...",  ← THIS IS WHAT YOU NEED!
     "scope": "https://www.googleapis.com/auth/gmail.send",
     "token_type": "Bearer"
   }
   ```

4. **COPY the `refresh_token` value** (starts with `1//0g...`)

---

### Step 6: Add to .env.development File

1. Open (or create) the file: `.env.development` in your project root

2. Add these lines (replace ALL placeholders with your actual values):

```env
# Gmail API Configuration
# ⚠️ Replace these with your actual credentials from Google Cloud Console and OAuth Playground
GMAIL_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=YOUR_CLIENT_SECRET
GMAIL_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE
```

**⚠️ Important:** 
- Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your Client ID from Step 0
- Replace `YOUR_CLIENT_SECRET` with your Client Secret from Step 0
- Replace `YOUR_REFRESH_TOKEN_HERE` with your refresh token from Step 5

**🔐 Security:** Never commit this file or real credentials to version control!

---

### Step 7: Restart Dev Server

```bash
# Stop the current server (Ctrl + C)
# Then restart:
npm run dev
```

---

## 🧪 **Step 8: Test Email Sending**

1. Go to: `http://localhost:3000/email-campaign`

2. Compose a test email:
   - **To:** Select yourself (your own email)
   - **Subject:** Test Email
   - **Message:** This is a test

3. Click **"Send to 1 Selected"**

4. You should see: ✅ **"Successfully sent 1 email"**

5. Check your inbox!

---

## ✅ **Quick Copy-Paste Template**

Copy this template and fill in ALL placeholders with your actual values:

```env
# Gmail API Configuration
# Get these from Google Cloud Console (Step 0) and OAuth Playground (Step 5)
GMAIL_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=YOUR_CLIENT_SECRET
GMAIL_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE
```

**⚠️ Remember:** All three values must be replaced with your actual credentials!

---

## 🔧 **If You Get Stuck:**

### Problem: "Can't find OAuth Playground settings"
**Solution:** The gear icon ⚙️ is in the TOP RIGHT corner of the page

### Problem: "Google hasn't verified this app"
**Solution:** Click "Advanced" → "Go to [app name] (unsafe)" - this is normal for development

### Problem: "No refresh token in response"
**Solution:** 
1. Go back to OAuth Playground settings
2. Check "Use your own OAuth credentials" is enabled
3. Make sure you're using the Gmail scope
4. Try again

### Problem: "Invalid credentials"
**Solution:** 
1. Verify Client ID and Secret are correct (from Google Cloud Console)
2. Make sure there are no extra spaces or quotes
3. Check they're in `.env.development` not `.env.example`
4. Ensure you're using YOUR OWN credentials, not example values

---

## 📋 **Complete File Example**

Your `.env.development` file should look like this (with YOUR actual values):

```env
# Database
DATABASE_URL="file:./dev.db"

# Gmail API Configuration
# ⚠️ Replace all placeholders with your actual credentials
GMAIL_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=YOUR_CLIENT_SECRET
GMAIL_REFRESH_TOKEN=YOUR_ACTUAL_REFRESH_TOKEN_HERE

# Session Secret
SESSION_SECRET=some-random-secret-string

# Other environment variables...
```

**🔐 Security Reminder:** 
- This file contains sensitive credentials
- It's already in `.gitignore` (should never be committed)
- Never share these values publicly

---

## 🎉 **Success Checklist**

Before testing, make sure:

- [ ] Created OAuth credentials in Google Cloud Console (Step 0)
- [ ] Enabled Gmail API in Google Cloud Console
- [ ] OAuth Playground settings configured with YOUR credentials
- [ ] Gmail API v1 scope selected (`gmail.send`)
- [ ] Signed in with your Gmail account
- [ ] Authorized the app
- [ ] Exchanged code for tokens
- [ ] Copied refresh token
- [ ] Added all three values to `.env.development` (Client ID, Secret, Refresh Token)
- [ ] Replaced ALL placeholders with actual values
- [ ] Restarted dev server (`npm run dev`)
- [ ] No typos or extra spaces in credentials

---

## 🚀 **Ready to Test!**

Once you've completed all steps:

1. ✅ Navigate to `/email-campaign`
2. ✅ Select a recipient (yourself)
3. ✅ Write a test message
4. ✅ Click Send
5. ✅ Check your email inbox

**Expected Result:** Email appears in your inbox! 📧

---

## 📞 **Still Having Issues?**

Check the terminal logs for:
- "Error getting access token" → Refresh token is wrong/missing
- "Gmail authentication failed" → Credentials not in .env file
- "Failed to send email" → Check Gmail account permissions

**Server must be restarted after changing .env.development!**

---

## ⚡ **Quick Summary**

**What you need:**
1. ✅ Client ID (from Google Cloud Console - Step 0)
2. ✅ Client Secret (from Google Cloud Console - Step 0)
3. ⚠️ Refresh Token (from OAuth Playground - Step 5)

**Where to put them:**
- 📄 `.env.development` file in project root (replace all placeholders!)

**After that:**
- 🔄 Restart server
- 📧 Send test email

**🔐 Security:**
- Never commit credentials to version control
- Use your own credentials, not examples
- Keep `.env.development` in `.gitignore`

---

**Time Required:** ~5 minutes  
**Difficulty:** Easy  
**One-time Setup:** Yes, never expires!

🎉 **Let's get your emails working!**

