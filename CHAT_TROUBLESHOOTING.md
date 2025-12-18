# 🔧 Chat Feature Troubleshooting Guide

## Common Error: 403 Forbidden / Unregistered Callers

If you see this error:
```
[403 Forbidden] Method doesn't allow unregistered callers
```

This means the Gemini API key is either missing, incorrect, or not properly configured.

## Quick Fix Checklist

### Step 1: Verify API Key is Set

1. **Check your `.env` file** in the root directory:
   ```bash
   cat .env | grep GEMINI_API_KEY
   ```
   
   You should see:
   ```
   GEMINI_API_KEY=your-actual-api-key-here
   ```

2. **If the key is missing**, add it:
   ```env
   GEMINI_API_KEY=your-api-key-here
   ```

### Step 2: Get a Valid API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the entire key (it should start with `AIza...`)

### Step 3: Verify API Key Format

✅ **Correct format:**
```
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

❌ **Wrong formats:**
```
GEMINI_API_KEY="AIzaSy..."  # Don't use quotes
GEMINI_API_KEY = AIzaSy...  # Don't use spaces around =
GEMINI_API_KEY=AIzaSy... # Extra spaces
```

### Step 4: Restart Your Server

**Important:** After adding or changing the API key, you MUST restart your development server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

Environment variables are only loaded when the server starts!

### Step 5: Verify API Key is Loaded

Add a temporary log to check (in `src/app/api/chat/route.ts` around line 21):

```typescript
const apiKey = process.env.GEMINI_API_KEY
console.log('API Key loaded:', apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO')
```

Then check your server console. You should see:
```
API Key loaded: YES (length: 39)
```

If you see "NO", the environment variable isn't being loaded.

## Testing Your API Key

### Method 1: Test in Browser Console

1. Go to your chat page
2. Open browser console (F12)
3. Try sending a message
4. Check the error in the console

### Method 2: Test with cURL

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=your-token" \
  -d '{"message":"Hello"}'
```

### Method 3: Check Server Logs

Look at your terminal where `npm run dev` is running. You should see:
- Any error messages
- Console.log outputs
- API call information

## Common Issues and Solutions

### Issue 1: "API key is not configured"

**Solution:**
- Ensure `.env` file exists in root directory
- Verify `GEMINI_API_KEY` is set
- Restart server

### Issue 2: "403 Forbidden" / "Unregistered callers"

**Possible causes:**
1. API key is incorrect
2. API key doesn't have permissions
3. API key is from wrong project
4. Generative Language API not enabled

**Solution:**
1. Generate a new API key
2. Ensure "Generative Language API" is enabled in Google Cloud Console
3. Copy the key exactly (no extra characters)
4. Restart server

### Issue 3: API Key Works in Browser but Not in Code

**Solution:**
- Check if `.env` file is in the correct location (root directory)
- Verify `.env` is not in `.gitignore` issues (should be ignored, but file should exist)
- Restart the server

### Issue 4: Environment Variable Not Loading

**Solution:**
1. Ensure `.env` file is in project root (same level as `package.json`)
2. Check file name is exactly `.env` (not `.env.local`, `.env.development`, etc.)
3. In Next.js, use `.env.local` for local development:
   ```bash
   # Create .env.local file
   cp .env .env.local
   ```
4. Restart server

## Verification Steps

1. ✅ `.env` file exists in root directory
2. ✅ `GEMINI_API_KEY` is in `.env` file
3. ✅ API key has no quotes or spaces
4. ✅ API key is valid (starts with `AIza`)
5. ✅ Server has been restarted after adding key
6. ✅ You're logged into the application
7. ✅ Generative Language API is enabled

## Still Not Working?

### Check Next.js Environment Variable Loading

Next.js has specific rules for environment variables:

- **Server-side only**: Variables must start with no prefix (default)
- **Client-side**: Must start with `NEXT_PUBLIC_`
- **Local development**: Use `.env.local` (gitignored automatically)

For API routes, you can use regular environment variables.

### Enable API in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create one)
3. Go to "APIs & Services" > "Library"
4. Search for "Generative Language API"
5. Click "Enable"

### Get Help

1. Check server logs for detailed error messages
2. Verify API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Test API key with a simple curl command (if you have your auth token)
4. See `CHAT_SETUP.md` for complete setup instructions

## Quick Test Script

Create a test file `test-gemini-key.js`:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in environment');
  process.exit(1);
}

console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

model.generateContent('Say hello')
  .then(result => {
    const response = result.response;
    const text = response.text();
    console.log('✅ API Key is valid!');
    console.log('Response:', text);
  })
  .catch(error => {
    console.error('❌ API Key test failed:', error.message);
    process.exit(1);
  });
```

Run it:
```bash
node test-gemini-key.js
```

If this works, your API key is valid and the issue is with the Next.js setup.




