# 🚀 SmartQueue — Deployment Guide

**Version:** 1.0  
**Author:** Golu Jaat  
**Last Updated:** August 2026

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Variables Setup](#2-environment-variables-setup)
3. [Local Development](#3-local-development)
4. [Deploy on Vercel (Recommended)](#4-deploy-on-vercel-recommended--free)
5. [Deploy on Railway](#5-deploy-on-railway-alternative)
6. [Deploy on VPS / Ubuntu Server](#6-deploy-on-vps--ubuntu-server-advanced)
7. [Supabase Production Config](#7-supabase-production-config)
8. [Custom Domain Setup](#8-custom-domain-setup)
9. [CI/CD with GitHub Actions](#9-cicd-with-github-actions-auto-deploy)
10. [Rollback / Troubleshooting](#10-rollback--troubleshooting)

---

## 1. Prerequisites

Make sure these are installed on your system:

```bash
# Check Node.js version (must be 18.18+ or 20+)
node --version

# Check npm version
npm --version

# Check Git
git --version
```

If Node.js is not installed, download from: https://nodejs.org/en/download

---

## 2. Environment Variables Setup

Create a `.env.local` file in the project root:

```bash
# Copy from example
cp .env.example .env.local
```

Add these values (get from your Supabase project dashboard):

```env
# ─── Supabase ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key

# ─── AI Assistant ──────────────────────────────────────────
GEMINI_API_KEY=your-gemini-api-key
```

**Where to find these values:**
1. Go to https://supabase.com → Your Project
2. Click **Settings** → **API**
3. Copy **Project URL** and **anon public** key

For Gemini, create or copy the key from Google AI Studio and save it as `GEMINI_API_KEY`.
Do **not** use `NEXT_PUBLIC_GEMINI_API_KEY`; `NEXT_PUBLIC_` variables are bundled into the browser.

> ⚠️ **IMPORTANT:** Never commit `.env.local` to Git. It is already listed in `.gitignore`.

---

## 3. Local Development

```bash
# Step 1: Clone the repository
git clone https://github.com/Golu-Jaat/smart-hospital-queue.git
cd smart-hospital-queue

# Step 2: Install all dependencies
npm install

# Step 3: Setup environment variables (see Section 2)

# Step 4: Run the development server
npm run dev
```

Open **http://localhost:3000** in your browser.

### Useful Dev Commands

```bash
# Start development server (with hot reload)
npm run dev

# Check TypeScript errors
npx tsc --noEmit

# Build production bundle (test before deploy)
npm run build

# Run production build locally
npm start

# Lint code
npm run lint
```

---

## 4. Deploy on Vercel (Recommended — Free)

Vercel is made by the Next.js team — **zero configuration needed**.

### Step 1: Push code to GitHub
```bash
git add .
git commit -m "ready for deployment"
git push origin main
```

### Step 2: Connect Vercel
1. Go to https://vercel.com → **Sign in with GitHub**
2. Click **"Add New Project"**
3. Select your `smart-hospital-queue` repository
4. Click **"Import"**

### Step 3: Add Environment Variables in Vercel
In the Vercel project setup screen:
1. Click **"Environment Variables"**
2. Add these variables:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |
| `GEMINI_API_KEY` | `your-gemini-api-key` |

Keep `GEMINI_API_KEY` server-only. Never add `NEXT_PUBLIC_GEMINI_API_KEY` in production.

### Step 4: Deploy
Click **"Deploy"** — Vercel will automatically:
- Run `npm run build`
- Deploy to a live URL like `https://smart-hospital-queue.vercel.app`

### Auto-Deploy (Future Pushes)
Every time you `git push origin main`, Vercel will **automatically rebuild and redeploy** within 1-2 minutes. No manual steps needed!

---

## 5. Deploy on Railway (Alternative)

Railway is great for full-stack apps with databases.

### Step 1: Create Railway Account
Go to https://railway.app → Sign up with GitHub

### Step 2: New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub Repo"**
3. Select `smart-hospital-queue`

### Step 3: Add Environment Variables
In Railway project → **Variables** tab:
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
GEMINI_API_KEY = your-gemini-api-key
```

### Step 4: Set Build Command
In **Settings** → **Build**:
```
Build Command:  npm run build
Start Command:  npm start
```

Railway will deploy your app and give a live URL like `https://smart-hospital-queue.up.railway.app`

---

## 6. Deploy on VPS / Ubuntu Server (Advanced)

For full control on your own server (DigitalOcean, AWS EC2, Hostinger VPS, etc.)

### Step 1: Connect to your server
```bash
ssh root@your-server-ip
```

### Step 2: Install Node.js & PM2
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager — keeps app running 24/7)
npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install nginx -y
```

### Step 3: Clone & Build
```bash
# Clone repository
git clone https://github.com/Golu-Jaat/smart-hospital-queue.git
cd smart-hospital-queue

# Install dependencies
npm install

# Create environment file
nano .env.local
# Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and GEMINI_API_KEY, save with Ctrl+X

# Build production
npm run build
```

### Step 4: Start with PM2
```bash
# Start the app
pm2 start npm --name "smartqueue" -- start

# Save PM2 config (auto-restart on server reboot)
pm2 save
pm2 startup
```

### Step 5: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/smartqueue
```

Paste this config:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/smartqueue /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: SSL Certificate (HTTPS — Free)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Your app is now live on `https://yourdomain.com` with free SSL!

### Update Deployment (Future Updates)
```bash
cd smart-hospital-queue
git pull origin main
npm install
npm run build
pm2 restart smartqueue
```

---

## 7. Supabase Production Config

### Enable Row Level Security (RLS)
In Supabase Dashboard → **Authentication** → **Policies**, make sure RLS is enabled for all tables:

```sql
-- Example: Only authenticated users can read their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Required Database Migrations
Apply the SQL files in `supabase/migrations/` before production testing:
- `20260912045000_create_profile_signup_trigger.sql` keeps `public.profiles` synced with new Supabase Auth users.
- `20260912045500_add_symptom_assessment_rls_policies.sql` adds patient-owned RLS policies for symptom assessment rows.

### Enable Realtime for Tables
In Supabase Dashboard → **Database** → **Replication**:
- Enable Realtime for: `tokens`, `queues` tables

### Set Auth Redirect URLs
In Supabase Dashboard → **Authentication** → **URL Configuration**:

```
Site URL:            https://your-app-url.vercel.app
Redirect URLs:       https://your-app-url.vercel.app/**
```

> ⚠️ Without this, password reset email links will fail in production.

For the current Vercel deployment, use:

```
Site URL:            https://smart-hospital-queue-mu.vercel.app
Redirect URLs:       https://smart-hospital-queue-mu.vercel.app/**
Reset redirect:      https://smart-hospital-queue-mu.vercel.app/reset-password
```

Keep both the production wildcard and exact reset route in the allow list. The app also catches a valid `PASSWORD_RECOVERY` callback that lands on the Site URL and forwards it to `/reset-password`.

After changing these values, request a new recovery email. Supabase recovery links are single-use and an opened or expired link cannot be tested again.

### Demo Data
The current Supabase project has a development/demo dataset for Bikaner:
- 11 active hospitals
- 66 departments/sections
- 11 demo doctors
- 66 doctor schedules
- 6 demo patients
- 6 sample appointments

Demo patient login:
```
Email:    patient.rohit.soni@smartqueue.demo
Password: Patient@123
```

Demo doctor password:
```
Doctor@123
```

These records are synthetic and should be replaced or reviewed before a real production launch.

---

## 8. Custom Domain Setup

### On Vercel:
1. Go to Vercel project → **Settings** → **Domains**
2. Click **"Add Domain"** → Enter `smartqueue.yourdomain.com`
3. Copy the DNS record Vercel shows (CNAME or A record)
4. Go to your domain registrar (GoDaddy / Namecheap / Hostinger) → Add the DNS record
5. Wait 5-10 minutes → Domain goes live with HTTPS automatically!

### On Railway:
1. Railway project → **Settings** → **Domains**
2. Click **"Custom Domain"** → Enter your domain
3. Follow the same DNS step as above

---

## 9. CI/CD with GitHub Actions (Auto Deploy)

Create `.github/workflows/deploy.yml` in your project:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

**Add Secrets to GitHub:**
1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`

---

## 10. Rollback / Troubleshooting

### Build Fails on Vercel/Railway
```bash
# Test build locally first
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Check for missing env variables
echo $NEXT_PUBLIC_SUPABASE_URL
```

### Rollback to Previous Version on Vercel
1. Vercel Dashboard → Your Project → **Deployments** tab
2. Find the last working deployment
3. Click **⋯ (3 dots)** → **"Promote to Production"**
Done! Previous version is live again in seconds.

### Rollback on VPS with PM2
```bash
# Go back to previous git commit
git log --oneline -10    # Find the good commit hash
git checkout <commit-hash>
npm run build
pm2 restart smartqueue
```

### App Crashes on VPS
```bash
# View live logs
pm2 logs smartqueue

# Restart app
pm2 restart smartqueue

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Supabase Connection Issues
- Double-check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL`
- In Supabase Dashboard → **Settings** → **API** → verify the anon key matches
- Check Supabase project is not paused (free tier pauses after 1 week of inactivity)

### Password Reset Link Opens the Wrong Page or Fails
1. In Supabase Dashboard → **Authentication** → **URL Configuration**, set the production Site URL and redirect allow list shown above.
2. Request a fresh link from `/forgot-password`; do not reuse an earlier email link.
3. Open the link in a normal browser tab and keep the tab open until `/reset-password` finishes checking the session.
4. If the app reports a network error, verify that the browser can reach the Supabase project URL and that the Vercel Supabase environment variables match the same project.

---

## ✅ Deployment Checklist

Before going live, verify:

- [ ] `.env.local` values are correct and set in hosting platform
- [ ] `GEMINI_API_KEY` is set server-side only; no `NEXT_PUBLIC_GEMINI_API_KEY`
- [ ] `npm run build` passes with **0 errors**
- [ ] `npx tsc --noEmit` passes with **0 TypeScript errors**
- [ ] Supabase Realtime enabled for `tokens` and `queues` tables
- [ ] Supabase Auth Redirect URL updated to production domain
- [ ] Fresh password-reset email opens `/reset-password` and the new password can log in
- [ ] Row Level Security (RLS) policies enabled on all tables
- [ ] Demo Bikaner data reviewed/replaced before real hospital launch
- [ ] Custom domain DNS configured and HTTPS certificate active
- [ ] Test login, token booking, doctor cabin, and TV display on live URL

---

*For issues or questions, contact: [GitHub — Golu Jaat](https://github.com/Golu-Jaat)*
