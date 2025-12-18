# ⚡ Quick Setup (2 Minutes)

Run these commands to get started:

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Set up database
npx prisma db push

# 4. Seed initial data
npx tsx scripts/seed-roles-and-permissions.ts

# 5. Start the server
npm run dev
```

**Default Login:**
- Email: `admin@example.com`
- Password: `admin123`

**Access:** Open `http://localhost:3000` in your browser

---

## That's It! 🎉

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

For troubleshooting, see [SETUP_GUIDE.md - Troubleshooting](./SETUP_GUIDE.md#troubleshooting)

