# 🔧 Enable Gemini API - Step by Step Guide

If you're getting "404 Model not found" errors, you need to enable the Generative Language API in your Google Cloud project.

## Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with the same Google account you used to create the API key

## Step 2: Select or Create a Project

1. At the top of the page, click the project dropdown
2. Either:
   - Select the project where you created your API key, OR
   - Create a new project if needed

## Step 3: Enable the Generative Language API

1. In the left sidebar, go to **"APIs & Services"** > **"Library"**
   - Or use this direct link: https://console.cloud.google.com/apis/library
2. In the search bar, type: **"Generative Language API"**
3. Click on **"Generative Language API"** from the results
4. Click the **"Enable"** button
5. Wait for the API to be enabled (usually takes 1-2 minutes)

## Step 4: Verify API is Enabled

1. Go to **"APIs & Services"** > **"Enabled APIs"**
2. You should see **"Generative Language API"** in the list
3. If it's there, you're all set!

## Step 5: Check API Key Permissions

1. Go to **"APIs & Services"** > **"Credentials"**
2. Find your API key in the list
3. Click on the key name to edit it
4. Under **"API restrictions"**, make sure:
   - Either **"Don't restrict key"** is selected, OR
   - **"Restrict key"** is selected and **"Generative Language API"** is checked

## Step 6: Restart Your Server

After enabling the API:

```bash
# Stop your server (Ctrl+C)
npm run dev
```

## Step 7: Test Again

Try sending a message in the chat. It should work now!

## Alternative: Use API Key from AI Studio

If you're having trouble with Google Cloud Console, you can also:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key (or use existing one)
3. These keys should already have the API enabled
4. Update your `.env` file with the new key

## Troubleshooting

### "API not enabled" error
- Make sure you enabled "Generative Language API" (not just "AI Platform API")
- Wait a few minutes after enabling for it to propagate

### "Permission denied" error
- Check that your API key has access to Generative Language API
- Verify the key is not restricted or restricted correctly

### Still getting 404 errors
- Try creating a fresh API key from Google AI Studio
- Make sure you're using the same Google account
- Check that billing is enabled (free tier is available)

## Quick Check

To verify your API key works, test it directly:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
```

Replace `YOUR_API_KEY` with your actual key. You should see a list of available models.

## Need Help?

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com)
- [Google Cloud Console](https://console.cloud.google.com)


