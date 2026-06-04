#!/bin/bash
# ============================================================
# EduCRM Database Setup Script
# Pushes the full SQLite schema (Sprints A–G) to dev.db
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🗄  EduCRM Database Setup"
echo "=========================="
echo "Project: $PROJECT_ROOT"
echo ""

# The dev database lives at prisma/prisma/dev.db
# (relative to the prisma schema file location: prisma/)
SQLITE_DB="$PROJECT_ROOT/prisma/prisma/dev.db"
SQLITE_URL="file:./prisma/dev.db"

echo "📍 Database: $SQLITE_DB"
echo ""

# Step 1: Push schema
echo "▶ Pushing schema to SQLite database..."
cd "$PROJECT_ROOT"
SQLITE_DATABASE_URL="$SQLITE_URL" npx prisma@6.16.2 db push \
  --schema=prisma/schema.sqlite.prisma \
  --accept-data-loss

echo ""

# Step 2: Generate SQLite Prisma client
echo "▶ Generating SQLite Prisma client..."
SQLITE_DATABASE_URL="$SQLITE_URL" npx prisma@6.16.2 generate \
  --schema=prisma/schema.sqlite.prisma

echo ""

# Step 3: Seed document types
echo "▶ Seeding document types..."
SQLITE_DATABASE_URL="$SQLITE_URL" npx tsx prisma/seeds/documentTypes.ts 2>/dev/null || echo "  (seed skipped — run manually if needed)"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Tables in $SQLITE_DB:"
sqlite3 "$SQLITE_DB" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>/dev/null || echo "(sqlite3 not installed — install with: brew install sqlite)"
echo ""
echo "Next steps:"
echo "  npm run dev          # Start the development server"
echo "  npx prisma studio    # Open Prisma Studio to browse data"
