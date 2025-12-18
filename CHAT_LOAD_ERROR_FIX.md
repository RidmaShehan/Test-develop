# 🔧 Fixing "Load failed" TypeError

If you're seeing a "Load failed" TypeError, here are steps to resolve it:

## Quick Fixes

### 1. Restart Your Development Server

The most common cause is that the server needs to be restarted after changes:

```bash
# Stop the server (Ctrl+C or Cmd+C)
npm run dev
```

### 2. Clear Next.js Cache

Sometimes Next.js cache can cause issues:

```bash
# Delete .next folder
rm -rf .next

# Restart server
npm run dev
```

### 3. Reinstall Dependencies

If the package isn't loading properly:

```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Restart server
npm run dev
```

### 4. Check Browser Console

Open your browser's developer console (F12) and check for:
- Specific error messages
- Network errors
- JavaScript errors

## Common Causes

1. **Module Not Found**: The `@google/generative-ai` package might not be installed
   - Fix: `npm install @google/generative-ai`

2. **Import Error**: There might be a bundling issue
   - Fix: Clear `.next` folder and restart

3. **Server Not Restarted**: Changes to API routes require server restart
   - Fix: Stop and restart `npm run dev`

4. **Environment Variable Missing**: API key might not be loaded
   - Fix: Check `.env` file and restart server

## Verify Installation

Check if the package is installed:

```bash
npm list @google/generative-ai
```

You should see:
```
└── @google/generative-ai@0.24.1
```

## Test the API Route

Try accessing the test endpoint directly:

```bash
# Make sure you're logged in, then visit:
http://localhost:3000/api/chat/test
```

Or use curl (replace with your auth token):

```bash
curl http://localhost:3000/api/chat/test \
  -H "Cookie: auth-token=your-token-here"
```

## Still Having Issues?

1. Check the terminal where `npm run dev` is running for detailed error messages
2. Check browser console for client-side errors
3. Verify Node.js version: `node --version` (should be 18+)
4. Try creating a simple test endpoint to verify the setup

## Next Steps

Once the "Load failed" error is resolved:
1. Make sure the Generative Language API is enabled (see `ENABLE_GEMINI_API.md`)
2. Verify your API key is set in `.env`
3. Test the chat functionality

