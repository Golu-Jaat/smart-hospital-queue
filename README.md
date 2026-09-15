# SmartQueue

SmartQueue is a responsive hospital OPD queue management application for patients, doctors, administrators, and public waiting-room displays. It combines Supabase Auth and PostgreSQL with realtime queue updates, atomic appointment booking, and a server-side Gemini symptom assistant with a fast local fallback.

## Live Deployment

- **Frontend:** [smart-hospital-queue-mu.vercel.app](https://smart-hospital-queue-mu.vercel.app/)
- **Backend health API:** [smart-hospital-queue-mu.vercel.app/api/health](https://smart-hospital-queue-mu.vercel.app/api/health)
- **Supabase backend:** [hjzmaqpwumgywshqqrzc.supabase.co](https://hjzmaqpwumgywshqqrzc.supabase.co)

## Current Features

### Patients

- Sign up, sign in, password recovery, and profile management
- Store medical profile fields in patient-owned Supabase rows and photos in a private Storage bucket
- Browse hospitals, departments, and available doctors
- Choose only schedule-aligned appointment slots with server-enforced daily capacity
- Book an appointment through a concurrency-safe PostgreSQL function
- View appointment history and track a live token
- Open or print a QR-based OPD token pass
- Use the Hindi/English symptom assistant for department guidance

### Doctors

- Open and manage today's OPD queue
- Call, complete, or skip waiting tokens through atomic, authorized database actions
- Record consultation notes and broadcast queue delays
- Receive realtime token changes without refreshing the page

### Administrators

- Manage hospitals, departments, doctors, schedules, and queues
- Invite new doctors through an admin-only server route
- Review database-computed operational analytics and queue activity

### Public Display

- Show the current and upcoming token numbers without exposing patient names
- Receive realtime queue updates
- Play browser-generated chimes and bilingual voice announcements

## Production Safety

- Protected routes validate Supabase sessions and database-owned roles.
- PostgreSQL Row Level Security restricts data by role and ownership.
- New public signups always receive the `patient` role from a database trigger.
- Doctor creation uses a server-only Supabase secret and an atomic database function.
- Appointment, queue, token, and notification creation happen in one transaction.
- Doctor queue creation and token status transitions are atomic and authorization checked.
- OPD hours, slot alignment, future dates, and per-schedule capacity are enforced in PostgreSQL.
- Medical profile rows use own-patient RLS and photos use signed URLs from private Storage.
- Gemini credentials stay on the server; browser code never receives the API key.
- AI requests use a timeout, local medical-rule fallback, and rate limiting.
- Realtime publication is limited to `queues`, `tokens`, and `notifications`.

The symptom assistant offers routing guidance only. It is not a diagnosis service and must not replace emergency or professional medical care.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Web app | Next.js 16.3.4, React 19.2.8, TypeScript 5 |
| UI | Tailwind CSS 4, `next-themes`, Recharts |
| Backend | Supabase Auth, PostgreSQL, Realtime, Row Level Security |
| AI | Gemini API through a Next.js route with local fallback |
| Testing | Vitest, Playwright, GitHub Actions |
| Hosting | Vercel |

## Local Setup

### Requirements

- Node.js 20 or newer
- npm
- A Supabase project with the repository migrations applied
- A Gemini API key for upstream AI responses

### Install and run

```bash
git clone https://github.com/Golu-Jaat/smart-hospital-queue.git
cd smart-hospital-queue
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On Windows PowerShell, use this instead of `cp`:

```powershell
Copy-Item .env.example .env.local
```

## Environment Variables

Add these values to `.env.local` and to the matching Vercel environments:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

SUPABASE_SECRET_KEY=your-server-only-secret-key

GEMINI_API_KEY=your-server-only-gemini-key
GEMINI_MODEL=gemini-3.1-flash-lite
AI_RATE_LIMIT_SALT=replace-with-a-long-random-secret
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` remains supported as a legacy alternative to the publishable key. Never use `NEXT_PUBLIC_GEMINI_API_KEY` or expose `SUPABASE_SECRET_KEY`; variables prefixed with `NEXT_PUBLIC_` are bundled for the browser.

After changing Vercel environment variables, redeploy the application so the new deployment receives them.

## Database Setup

For a brand-new Supabase project, run [`supabase/baseline.sql`](supabase/baseline.sql) once, then apply every SQL file in [`supabase/migrations`](supabase/migrations) in filename order. For an existing project, apply only migrations that are not already present in its migration history.

The baseline and migrations install:

- Auth-to-profile synchronization with a patient-only signup role
- RLS policies and grants for application tables
- Realtime publication for queue-related tables
- Secure doctor invitations and public doctor display names
- Atomic appointment and token booking
- Doctor schedule, exact-slot, and daily-capacity validation
- Patient-owned medical profiles and a private avatar bucket
- Atomic doctor queue and token transition functions
- Admin-only database analytics with bounded date ranges
- Distributed AI request limiting
- Foreign-key indexes used by joins and RLS checks

In Supabase Auth URL Configuration, set:

```text
Site URL:      https://smart-hospital-queue-mu.vercel.app
Redirect URL:  https://smart-hospital-queue-mu.vercel.app/**
```

Keep the exact reset route allowed as well:

```text
https://smart-hospital-queue-mu.vercel.app/reset-password
```

Request a fresh password reset email after changing redirect settings because recovery links expire and are single-use.

## Useful Commands

```bash
npm run dev          # development server
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm test             # Vitest unit/schema checks
npm run build        # production build
npm run test:e2e     # Playwright responsive and health checks (run after build)
npm start            # serve the production build
```

`GET /api/health` is a no-store monitoring endpoint. It returns `200` with `status: "ok"` when the app can reach Supabase, or `503` with `status: "degraded"` when configuration/database access is unavailable. It never returns credentials or raw database errors.

## Responsive Support

Core patient, doctor, admin, AI, and display workflows are designed for:

- Mobile screens from 320px wide
- Tablets around 768px wide
- Laptop and desktop screens from 1024px upward

Navigation collapses below the large breakpoint, forms stack on narrow screens, and data tables retain horizontal scrolling when their columns cannot safely collapse.

## Project Structure

```text
src/
  app/
    admin/                 admin management and analytics
    api/admin/doctors/     secure doctor invitation route
    api/ai-assistant/      server-side AI route
    api/health/            dependency health endpoint
    doctor/dashboard/      doctor queue console
    patient/               patient dashboard and booking flows
    display/               public realtime queue display
    login/                 authentication pages
  components/              shared navigation, guards, cards, and token UI
  lib/                     Supabase, auth, RBAC, queue, and AI helpers
e2e/                       responsive browser and monitoring checks
scripts/                   production E2E server/runner
supabase/
  baseline.sql             fresh-project base schema
  migrations/              ordered production database migrations
```

## Deployment

The production site deploys from the `main` branch through Vercel. Before deploying, run lint, typecheck, unit tests, the production build, and Playwright checks; apply all database migrations; verify server-only variables; and test login, password recovery, appointment booking, doctor queue actions, and the public display.

See [`deploy.md`](deploy.md) for the complete deployment and troubleshooting guide and [`spec.md`](spec.md) for the technical specification.

## Demo Data

The connected Supabase project includes synthetic Bikaner hospital, doctor, schedule, patient, and appointment records for testing. Review or replace demo records before using the application with real patients. Do not commit credentials or sensitive health data to this repository.

## Author

[Golu Jaat](https://github.com/Golu-Jaat)

## License

This project is licensed under the [MIT License](LICENSE).
