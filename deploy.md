# 🚀 SmartQueue — Deployment Guide

**Version:** 1.2
**Author:** Golu Jaat  
**Last Updated:** September 12, 2026

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
# Check Node.js version (Node.js 22 recommended)
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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
# Legacy alternative: NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only: secure doctor invitations and distributed AI limits
SUPABASE_SECRET_KEY=your-supabase-secret-key

# ─── AI Assistant ──────────────────────────────────────────
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.1-flash-lite
AI_RATE_LIMIT_SALT=replace-with-a-long-random-secret
```

**Where to find these values:**
1. Go to https://supabase.com → Your Project
2. Click **Settings** → **API**
3. Copy **Project URL**, the publishable/anon key, and a server-only secret key

For Gemini, create or copy the key from Google AI Studio and save it as `GEMINI_API_KEY`.
Do **not** use `NEXT_PUBLIC_GEMINI_API_KEY`; `NEXT_PUBLIC_` variables are bundled into the browser.
Never prefix `SUPABASE_SECRET_KEY` with `NEXT_PUBLIC_`; it bypasses normal RLS and must stay on the server.

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
npm run typecheck

# Run unit tests
npm test

# Build production bundle (test before deploy)
npm run build

# Run production build locally
npm start

# Lint code
npm run lint

# Run responsive browser and monitoring checks after npm run build
npm run test:e2e
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
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `your-publishable-key` |
| `SUPABASE_SECRET_KEY` | `your-server-only-supabase-secret` |
| `GEMINI_API_KEY` | `your-gemini-api-key` |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` |
| `AI_RATE_LIMIT_SALT` | `a-long-random-server-secret` |

Keep `GEMINI_API_KEY`, `SUPABASE_SECRET_KEY`, and `AI_RATE_LIMIT_SALT` server-only. Never add `NEXT_PUBLIC_` to these variables.

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = your-publishable-key
SUPABASE_SECRET_KEY = your-server-only-supabase-secret
GEMINI_API_KEY = your-gemini-api-key
GEMINI_MODEL = gemini-3.1-flash-lite
AI_RATE_LIMIT_SALT = your-long-random-secret
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
# Add all variables from Section 2, save with Ctrl+X

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

### Row Level Security (RLS)
RLS is enabled on every exposed application table. Do not recreate broad policies such as `USING (true)` for write operations. Authorization is derived from `public.profiles.role`; patients can read their own records, doctors can manage only their linked queues and patients, and admins can manage hospital data.

### Required Database Migrations
For a new Supabase project, run `supabase/baseline.sql` once to create the base tables and enable RLS. Then apply the SQL files in `supabase/migrations/` in filename order. For the current production project, apply only migrations not already listed in Supabase migration history.

The production migration chain includes:
- `20260912045000_create_profile_signup_trigger.sql` keeps `public.profiles` synced with new Supabase Auth users.
- `20260912045500_add_symptom_assessment_rls_policies.sql` adds patient-owned RLS policies for symptom assessment rows.
- `20260912094432_production_rls_lockdown.sql` replaces permissive policies and grants with role/ownership policies.
- `20260912095913_enable_queue_realtime.sql` publishes `queues`, `tokens`, and `notifications` to Realtime.
- `20260912100343_harden_doctor_creation.sql` adds the server-only doctor creation transaction.
- `20260912101053_add_atomic_queue_booking.sql` adds concurrency-safe appointment and token booking.
- `20260912101511_add_ai_rate_limiting.sql` adds the distributed AI request limiter.
- `20260912102002_add_safe_doctor_display_names.sql` exposes synchronized doctor names without exposing patient profiles.
- `20260912103852_encapsulate_atomic_booking.sql` keeps the privileged booking core outside the exposed API schema.
- `20260912104036_add_foreign_key_indexes.sql` adds indexes used by RLS ownership checks and relational joins.
- `20260914103635_add_patient_health_profiles.sql` adds patient-owned medical profiles and the private `profile-avatars` bucket.
- `20260914103648_enforce_schedule_capacity.sql` validates OPD dates, exact slots, schedules, and daily capacity inside atomic booking.
- `20260914103702_add_atomic_queue_actions.sql` adds authorized queue initialization and token status transition RPCs.
- `20260914103716_add_admin_analytics.sql` adds bounded, admin-only operational analytics computed in PostgreSQL.
- `20260914105926_refine_analytics_wait_time.sql` excludes invalid waits over 24 hours from the average.
- `20260914114954_remove_legacy_rls_policies.sql` removes superseded permissive policies and explicitly denies client access to private AI rate-limit rows.

### Enable Realtime for Tables
In Supabase Dashboard → **Database** → **Replication**:
- Realtime is enabled by migration for: `tokens`, `queues`, and `notifications`

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

Keep both the production wildcard and exact reset route in the allow list. The app captures recovery intent before hydration and also catches a valid `PASSWORD_RECOVERY` callback that lands on the Site URL, then forwards it to `/reset-password`.

After changing these values, request a new recovery email. Supabase recovery links are single-use and an opened or expired link cannot be tested again.

### Demo Data
The current Supabase project contains a synthetic Bikaner dataset. Review or replace all demo doctors, patients, appointments, and queues before handling real hospital data. Do not store demo or production passwords in this repository.

### Health Monitoring

Monitor `GET https://your-app-url.vercel.app/api/health` from an uptime service. A healthy app returns HTTP `200` with `status: "ok"`; missing configuration or an unreachable database returns HTTP `503` with `status: "degraded"`. The endpoint is uncached and does not expose keys or raw database errors.

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

## 9. CI/CD with GitHub Actions

The active workflow is committed as `.github/workflows/ci.yml`. It runs for pushes to `main` and pull requests:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

CI uses non-secret placeholder public Supabase values because its browser suite verifies public rendering and the safe degraded health response. Real Supabase, Gemini, `SUPABASE_SECRET_KEY`, and `AI_RATE_LIMIT_SALT` values belong only in the deployment environment. Configure GitHub branch protection or Vercel deployment checks if production deploys must wait for CI.

---

## 10. Rollback / Troubleshooting

### Build Fails on Vercel/Railway
```bash
# Test build locally first
npm run build

# Check TypeScript errors
npm run typecheck

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

### Logged-In User Is Redirected Back to Login
1. Confirm the URL contains the expected production domain and inspect the optional `error` query parameter.
2. Clear any older service-worker/browser cache once after deploying an auth-routing change, then sign in again.
3. Verify the Supabase URL and publishable key belong to the same project in both browser and Vercel environments.
4. Portal navigation deliberately disables protected-route prefetching, and login performs a full navigation so the first protected request includes the new session cookies.

### Dark Mode Flashes After Refresh
1. Confirm `next-themes` remains installed and the root provider uses `attribute="class"`.
2. Test a production build; development mode can show rendering behavior that is not present in the optimized build.
3. Verify browser storage allows the `theme` key and no CDN feature defers inline scripts.

---

## ✅ Deployment Checklist

Before going live, verify:

- [ ] `.env.local` values are correct and set in hosting platform
- [ ] `GEMINI_API_KEY` is set server-side only; no `NEXT_PUBLIC_GEMINI_API_KEY`
- [ ] `SUPABASE_SECRET_KEY` and `AI_RATE_LIMIT_SALT` are set server-side only
- [ ] `npm run build` passes with **0 errors**
- [ ] `npm run typecheck` passes with **0 TypeScript errors**
- [ ] `npm test` passes all unit/schema checks
- [ ] `npm run test:e2e` passes after the production build
- [ ] `/api/health` returns `200` against the production database
- [x] Supabase Realtime enabled for `tokens`, `queues`, and `notifications` tables
- [ ] Supabase Auth Redirect URL updated to production domain
- [ ] Fresh password-reset email opens `/reset-password` and the new password can log in
- [x] Row Level Security policies and table grants locked down on all exposed tables
- [ ] Admin can invite a doctor and the invite opens `/reset-password`
- [ ] Two simultaneous bookings produce unique sequential token numbers
- [ ] Booking outside the doctor schedule or above capacity is rejected
- [ ] Doctor/admin token actions update token, queue, appointment, and notification atomically
- [ ] Demo Bikaner data reviewed/replaced before real hospital launch
- [ ] Custom domain DNS configured and HTTPS certificate active
- [ ] Test login, token booking, doctor cabin, and TV display on live URL
- [ ] Check core pages at 320px and 390px mobile widths with no clipped controls or page-level horizontal scrolling
- [ ] Check tablet navigation and dashboards at 768px width
- [ ] Check laptop/desktop layouts at 1024px and 1440px widths
- [ ] Verify light and dark themes do not flash, overlap, or lose text contrast after refresh

---

*For issues or questions, contact: [GitHub — Golu Jaat](https://github.com/Golu-Jaat)*
