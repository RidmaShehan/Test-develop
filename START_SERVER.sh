#!/bin/bash
# Start the development server with Gmail API configured

echo "🚀 Starting CRM Development Server..."
echo ""
echo "✅ Make sure you have configured:"
echo "   - GMAIL_CLIENT_ID in .env.development"
echo "   - GMAIL_CLIENT_SECRET in .env.development"
echo "   - GMAIL_REFRESH_TOKEN in .env.development"
echo ""
echo "📧 Email Campaign will be functional after proper configuration!"
echo ""

cd /Users/ridmashehan/CRM-System
npm run dev

