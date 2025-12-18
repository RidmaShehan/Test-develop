# 💬 AI Chat Setup Guide

This guide will help you set up the AI Chat feature powered by Google's Gemini API.

## Prerequisites

- A Google Cloud account (free tier available)
- Access to Google AI Studio or Google Cloud Console

## ⚠️ Important: Enable the API First!

Before getting your API key, make sure the **Generative Language API** is enabled in your Google Cloud project. See `ENABLE_GEMINI_API.md` for detailed instructions.

## Step 1: Get Your Gemini API Key

### Option A: Using Google AI Studio (Recommended - Easier)

1. **Visit Google AI Studio**
   - Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) or [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

2. **Sign In**
   - Sign in with your Google account

3. **Create API Key**
   - Click "Create API Key"
   - Select "Create API key in new project" or choose an existing project
   - Copy your API key

4. **Free Tier Limits**
   - Free tier includes 60 requests per minute
   - Sufficient for most development and small-scale usage

### Option B: Using Google Cloud Console (Advanced)

1. **Create a Project**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project or select an existing one

2. **Enable Gemini API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Generative Language API"
   - Click "Enable"

3. **Create Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

## Step 2: Add API Key to Environment Variables

### Development Environment

Add the API key to your `.env` file in the root directory:

```env
# Gemini AI API Key (for Chat feature)
GEMINI_API_KEY=your-api-key-here
```

### Production Environment

Add the API key to your deployment platform's environment variables:

- **Vercel**: Project Settings > Environment Variables
- **Netlify**: Site Settings > Environment Variables
- **Railway**: Project Settings > Variables
- **Heroku**: Settings > Config Vars

## Step 3: Verify Setup

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Chat**
   - Go to the "AI Chat" section in the sidebar
   - The chat interface should load

3. **Test the Chat**
   - Type a message like "Hello, how can you help me?"
   - You should receive a response from the AI

## Troubleshooting

### Error: "Gemini API key is not configured"

**Solution:**
- Make sure `GEMINI_API_KEY` is set in your `.env` file
- Restart your development server after adding the key
- Verify the key is correct (no extra spaces or quotes)

### Error: "API_KEY_INVALID"

**Solution:**
- Verify your API key is correct
- Make sure you haven't exceeded the rate limits
- Check if the API is enabled in your Google Cloud project

### Chat Not Loading

**Solution:**
- Check browser console for errors
- Verify authentication (you must be logged in)
- Ensure the API route is accessible at `/api/chat`

## Features

- ✅ Real-time chat interface
- ✅ Conversation history
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design
- ✅ Secure API key handling (server-side only)

## Security Notes

- **Never commit your API key to Git**
- The API key should only be in `.env` (which is in `.gitignore`)
- API calls are made server-side, so the key never exposes to the client
- Consider using environment-specific keys for development and production

## API Usage and Costs

### Free Tier Limits (Google AI Studio)

- **60 requests per minute**
- **1,500 requests per day**
- Sufficient for development and small teams

### Pricing (Beyond Free Tier)

- Check current pricing at [ai.google.dev/pricing](https://ai.google.dev/pricing)
- Generally very affordable for most use cases

## Support

If you encounter any issues:

1. Check the browser console for errors
2. Check the server logs for API errors
3. Verify your API key is valid
4. Ensure you haven't exceeded rate limits

For more information, visit:
- [Google AI Studio Documentation](https://makersuite.google.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)




