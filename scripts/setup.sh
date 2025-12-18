#!/bin/bash

echo "🚀 Setting up Education CRM..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/education_crm"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
EOF
    echo "✅ Created .env.local file. Please update it with your actual values."
else
    echo "✅ .env.local already exists."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your database URL and Clerk credentials"
echo "2. Set up your PostgreSQL database"
echo "3. Run: npm run db:migrate:deploy"
echo "4. Run: npm run db:seed"
echo "5. Run: npm run dev"
echo ""
echo "For detailed instructions, see README.md"
