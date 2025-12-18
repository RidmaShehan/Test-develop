#!/bin/bash

# =====================================
# Education CRM System - Setup Script
# =====================================
# This script automates the setup process
# =====================================

set -e  # Exit on error

echo "🚀 Education CRM System - Automated Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed.${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} found${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm ${NPM_VERSION} found${NC}"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1/4: Installing dependencies..."
echo "This may take a few minutes..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Set up environment variables
echo "🔧 Step 2/4: Setting up environment variables..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env and update JWT_SECRET before running in production${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found, creating minimal .env${NC}"
        cat > .env << 'EOF'
JWT_SECRET=default-secret-change-in-production
DATABASE_URL="file:./dev.db"
NODE_ENV=development
EOF
        echo -e "${GREEN}✅ Created .env file${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  .env file already exists, skipping${NC}"
fi
echo ""

# Step 3: Set up database
echo "🗄️  Step 3/4: Setting up database..."
npx prisma db push
echo -e "${GREEN}✅ Database schema created${NC}"
echo ""

# Step 4: Seed initial data
echo "🌱 Step 4/4: Seeding initial data..."
npx tsx scripts/seed-roles-and-permissions.ts
echo -e "${GREEN}✅ Initial data seeded${NC}"
echo ""

# Success message
echo "=========================================="
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo "=========================================="
echo ""
echo "📝 Default Login Credentials:"
echo "   Email:    admin@example.com"
echo "   Password: admin123"
echo ""
echo "🚀 To start the development server, run:"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "🌐 Then open your browser to:"
echo "   http://localhost:3000"
echo ""
echo "📚 For more information, see:"
echo "   - README.md"
echo "   - SETUP_GUIDE.md"
echo "   - QUICK_SETUP.md"
echo ""

