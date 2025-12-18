# 🚀 Gmail API - Quick Start (You're Almost Done!)

## 🔐 **SECURITY NOTE:**

**⚠️ IMPORTANT:** You need to obtain your own Google OAuth credentials. Never commit real credentials to version control. See Step 0 below for getting your credentials.

---

## 🎯 **What You Need to Do NOW (4 Steps):**

### **STEP 0: Get Your Google OAuth Credentials (First Time Only)**

1. **Go to Google Cloud Console:** https://console.cloud.google.com/

2. **Create or Select a Project:**
   - Create a new project or select an existing one

3. **Enable Gmail API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API" and click "Enable"

4. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `https://developers.google.com/oauthplayground`
   - Click "Create"
   - **COPY your Client ID and Client Secret** - you'll need these!

---

### **STEP 1: Get Refresh Token (5 minutes)**

1. **Open this link:** https://developers.google.com/oauthplayground

2. **Configure (click ⚙️ gear icon):**
   - ✅ Check "Use your own OAuth credentials"
   - Paste your Client ID: `YOUR_CLIENT_ID.apps.googleusercontent.com`
   - Paste your Client Secret: `YOUR_CLIENT_SECRET`
   - Click Close

3. **Select Scope:**
   - Find "Gmail API v1" (left side)
   - Check: `https://www.googleapis.com/auth/gmail.send`
   - Click "Authorize APIs"

4. **Sign In:**
   - Login with YOUR Gmail account
   - Click "Advanced" → "Go to [app] (unsafe)" → "Allow"

5. **Get Token:**
   - Click "Exchange authorization code for tokens"
   - **COPY the `refresh_token`** (looks like: `1//0gXXXXXXXXX`)

---

### **STEP 2: Add to .env.development File**

Open or create `.env.development` in your project root:

```bash
nano .env.development
```

Add these lines (replace with your actual values):

```env
# Gmail API Configuration
GMAIL_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=YOUR_CLIENT_SECRET
GMAIL_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE
```

**⚠️ Replace all placeholders with your actual credentials from Steps 0 and 1!**

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

---

### **STEP 3: Start Server**

```bash
npm run dev
```

Or use the helper script:

```bash
./START_SERVER.sh
```

---

## ✅ **Test Email Sending:**

1. Open: http://localhost:3000/email-campaign
2. Select yourself as recipient
3. Write test message
4. Click "Send"
5. Check your inbox! 📧

---

## 🐛 **Common Issues:**

### "Still getting 500 error"
- ✅ Make sure refresh token is in `.env.development`
- ✅ Restart the server after adding it
- ✅ Check for typos/extra spaces

### "Can't find refresh token in OAuth Playground"
- ✅ Make sure "Use your own OAuth credentials" is checked
- ✅ Use Gmail API v1 scope (not v2)
- ✅ Complete authorization flow fully

### "Server not starting"
- ✅ Kill old processes: `pkill -f "npm run dev"`
- ✅ Try again: `npm run dev`

---

## 📋 **Complete .env.development Template:**

```env
# Database
DATABASE_URL="file:./dev.db"

# Gmail API Configuration
# ⚠️ Replace these with your actual credentials from Google Cloud Console
GMAIL_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=YOUR_CLIENT_SECRET
GMAIL_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE

# Session
SESSION_SECRET=random-secret-string-here
```

**🔐 Security Reminder:** Never commit your `.env.development` file or real credentials to version control!

---

## 🎉 **You're Almost There!**

**Current Status:** ✅ API endpoints working, ✅ Database ready, ⚠️ Need refresh token

**After Setup:** 🟢 **FULLY FUNCTIONAL EMAIL CAMPAIGN!**

---

**Questions?** See `GMAIL_SETUP_INSTRUCTIONS.md` for detailed guide.

🚀 **Let's send some emails!**

