# 🚀 Deployment Guide

This guide covers deploying the Education CRM System to various platforms.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Deployment Platforms](#deployment-platforms)
   - [Vercel](#vercel-recommended)
   - [Netlify](#netlify)
   - [Digital Ocean](#digital-ocean)
   - [AWS](#aws)
   - [Self-Hosted VPS](#self-hosted-vps)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ All code committed to a Git repository (GitHub, GitLab, Bitbucket)
- ✅ A production database ready (PostgreSQL recommended)
- ✅ AWS S3 bucket (optional, for file storage)
- ✅ Domain name (optional)

---

## Environment Variables

Set these environment variables in your deployment platform:

### Required Variables

```env
# JWT Secret (MUST be different from development)
JWT_SECRET=<generate-a-secure-random-string-here>

# Database URL (Use PostgreSQL for production)
DATABASE_URL=postgresql://user:password@host:port/database

# Node Environment
NODE_ENV=production
```

### Optional Variables (S3 Storage)

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-bucket-name
```

### Optional Variables (AI Chat - Gemini)

```env
# Google Gemini API Key for AI Chat feature
# Get your free API key at: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here
```

### Generate Secure JWT_SECRET

```bash
# Using OpenSSL (macOS/Linux)
openssl rand -base64 64

# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## Database Setup

### Option 1: PostgreSQL (Recommended)

#### Using Supabase (Free tier available)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your connection string from Settings > Database
4. Update DATABASE_URL in your env variables

#### Using Railway (Free tier available)

1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the DATABASE_URL
4. Update your env variables

#### Using Heroku Postgres

1. Create a Heroku app
2. Add Heroku Postgres addon
3. Copy DATABASE_URL from Config Vars
4. Update your env variables

### Option 2: SQLite (Not recommended for production)

If you must use SQLite in production:

```env
DATABASE_URL="file:./prod.db"
```

**⚠️ Warning:** SQLite has limitations in production:
- No concurrent writes
- Limited scalability
- File-based (harder to backup)

---

## Deployment Platforms

### Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

#### Steps:

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Configure project:
     - Framework Preset: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Add Environment Variables**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add all required variables from [Environment Variables](#environment-variables)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

5. **Run Database Migrations**
   - In Vercel dashboard, go to Settings > Functions
   - Add build command: `npx prisma generate && npx prisma db push && npm run build`

#### Vercel Configuration File

Create `vercel.json` in root directory:

```json
{
  "buildCommand": "npx prisma generate && npx prisma db push && npm run build",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

---

### Netlify

#### Steps:

1. **Push code to GitHub**

2. **Import to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Select your repository

3. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

4. **Add Environment Variables**
   - Go to Site settings > Environment variables
   - Add all required variables

5. **Deploy**

---

### Digital Ocean

#### Using App Platform:

1. **Create App**
   - Go to [digitalocean.com](https://digitalocean.com)
   - Click "Create" > "Apps"
   - Connect your GitHub repository

2. **Configure Build**
   - Build Command: `npm run build`
   - Run Command: `npm start`

3. **Add Environment Variables**
   - In app settings, add all required variables

4. **Deploy**

---

### AWS

#### Using Elastic Beanstalk:

1. **Install AWS CLI and EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**
   ```bash
   eb init -p node.js-18 education-crm
   ```

3. **Create Environment**
   ```bash
   eb create production
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv JWT_SECRET=your-secret DATABASE_URL=your-db-url
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

---

### Self-Hosted VPS

For Ubuntu 22.04 LTS server:

#### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 3. Create Database

```bash
sudo -u postgres psql
CREATE DATABASE crm_production;
CREATE USER crm_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE crm_production TO crm_user;
\q
```

#### 4. Clone and Setup Application

```bash
git clone <your-repo-url>
cd CRM-System
npm install
```

#### 5. Create .env file

```bash
nano .env
```

Add your production environment variables, then save (Ctrl+X, Y, Enter).

#### 6. Run Database Migrations

```bash
npx prisma generate
npx prisma db push
npx tsx scripts/seed-roles-and-permissions.ts
```

#### 7. Build Application

```bash
npm run build
```

#### 8. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

#### 9. Start Application

```bash
pm2 start npm --name "crm" -- start
pm2 save
pm2 startup
```

#### 10. Setup Nginx Reverse Proxy

```bash
sudo apt install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/crm
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 11. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Post-Deployment

### 1. Verify Deployment

- ✅ Visit your deployed URL
- ✅ Test login functionality
- ✅ Create a test inquiry
- ✅ Test file upload (if using S3)
- ✅ Check all major features

### 2. Create Admin User

If needed, create an admin user:

```bash
# SSH into your server or use Vercel CLI
npx tsx scripts/create-test-user.ts
```

### 3. Setup Monitoring

Consider adding:
- **Uptime monitoring:** [UptimeRobot](https://uptimerobot.com)
- **Error tracking:** [Sentry](https://sentry.io)
- **Analytics:** [Vercel Analytics](https://vercel.com/analytics) or [Google Analytics](https://analytics.google.com)

### 4. Backup Strategy

#### Automated Database Backups

For PostgreSQL:

```bash
# Create backup script
nano ~/backup-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h your-host -U your-user your-database > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Make executable and schedule:

```bash
chmod +x ~/backup-db.sh
crontab -e
```

Add cron job (daily at 2 AM):

```
0 2 * * * /home/your-user/backup-db.sh
```

### 5. Security Checklist

- [ ] Strong JWT_SECRET set
- [ ] Database password is strong and unique
- [ ] HTTPS enabled
- [ ] Firewall configured
- [ ] Regular security updates applied
- [ ] Default admin password changed
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Environment variables not exposed
- [ ] Regular backups running

---

## Troubleshooting

### Build Fails

**Problem:** Build fails with "Cannot find module"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Error

**Problem:** "Cannot connect to database"

**Solution:**
1. Verify DATABASE_URL is correct
2. Check if database server is running
3. Verify firewall allows database connections
4. Test connection:
   ```bash
   npx prisma db push
   ```

### 500 Error After Deployment

**Problem:** Application returns 500 error

**Solution:**
1. Check deployment logs
2. Verify all environment variables are set
3. Ensure database migrations ran
4. Check if Prisma client was generated:
   ```bash
   npx prisma generate
   ```

### File Upload Not Working

**Problem:** File uploads fail

**Solution:**

If using S3:
1. Verify AWS credentials in env variables
2. Check S3 bucket permissions
3. Verify bucket CORS configuration

If using local storage:
1. Ensure `public/uploads` directory exists
2. Check write permissions on the directory

### Application is Slow

**Solutions:**
1. Upgrade database plan (more CPU/RAM)
2. Enable caching
3. Optimize database queries
4. Use CDN for static files
5. Enable gzip compression

---

## Scaling Considerations

### For Small Teams (< 50 users)

- **Hosting:** Vercel free tier or basic plan
- **Database:** Supabase free tier or Railway
- **Storage:** Local storage or S3 (if budget allows)

### For Medium Teams (50-200 users)

- **Hosting:** Vercel Pro or Digital Ocean App Platform
- **Database:** Managed PostgreSQL (Railway, Heroku, or DO)
- **Storage:** AWS S3
- **Monitoring:** Basic monitoring and error tracking

### For Large Organizations (200+ users)

- **Hosting:** AWS, GCP, or dedicated VPS
- **Database:** Managed PostgreSQL with read replicas
- **Storage:** AWS S3 with CDN
- **Monitoring:** Full observability stack
- **Backups:** Automated with point-in-time recovery
- **High Availability:** Load balancing, multiple regions

---

## Cost Estimates

### Free Tier (Good for testing)
- **Vercel:** Free
- **Supabase:** Free (500MB database)
- **Total:** $0/month

### Starter Plan (Small team)
- **Vercel Pro:** $20/month
- **Railway PostgreSQL:** $5/month
- **AWS S3:** ~$1-5/month
- **Total:** ~$26-30/month

### Production Plan (Medium team)
- **Digital Ocean App Platform:** $12-25/month
- **Managed PostgreSQL:** $15-50/month
- **AWS S3:** ~$5-10/month
- **Domain + SSL:** ~$15/year
- **Total:** ~$32-85/month

---

**Made with ❤️ for Education**

**Version:** 2.0  
**Last Updated:** November 2025  

For questions or issues, refer to the main [README.md](./README.md) or [SETUP_GUIDE.md](./SETUP_GUIDE.md).

