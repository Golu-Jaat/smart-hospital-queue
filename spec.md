# 📋 SmartQueue — Technical Specification Document

**Version:** 1.0  
**Author:** Golu Jaat  
**Project:** Smart Hospital OPD Queue Management System  
**Last Updated:** August 2026  
**Status:** ✅ Active Development

---

## 1. 🎯 Project Goal

Eliminate chaotic hospital OPD waiting rooms by replacing physical token slips and manual calling with a **fully automated, real-time cloud-synchronized queue system** that:

- Reduces average patient wait time by **40%+**
- Removes manual token distribution entirely
- Broadcasts live patient turns on waiting room TV screens
- Routes patients intelligently using **AI symptom analysis**
- Provides doctors with a **digital cabin management console**

---

## 2. 👥 Target Users

| User Type | Description |
| :--- | :--- |
| **Patient** | Books appointments, tracks live token status, receives QR digital pass |
| **Doctor** | Manages daily OPD cabin, calls/skips patients, broadcasts delays |
| **Admin** | Controls entire hospital infrastructure, doctors, queues, analytics |
| **Visitor / Attendant** | Views live queue on public TV display screen |

---

## 3. 🔐 Role-Based Access Control (RBAC)

| Role | Admin Portal | Doctor Portal | Patient Portal | Display & AI |
| :--- | :---: | :---: | :---: | :---: |
| **Admin** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Doctor** | ❌ Blocked | ✅ Full Access | ✅ View | ✅ Full Access |
| **Patient** | ❌ Blocked | ❌ Blocked | ✅ Full Access | ✅ Full Access |
| **Guest (Not Logged In)** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ View Only |

> **Super Admin Rule:** Admin role has **superuser privileges** — can access and manage all portals simultaneously.

---

## 4. ✨ Feature Specifications

### 4.1 🔐 Authentication System (`/login`, `/signup`, `/forgot-password`, `/reset-password`)
- **Email + Password** signup and login via Supabase Auth
- Automatic `profiles` table row creation on new user registration via the `on_auth_user_created_create_profile` database trigger
- Default role assigned: `patient` on signup
- Admin accounts must be manually promoted via Supabase Dashboard
- Password reset via email magic link (Supabase built-in)
- Recovery intent is captured before hydration and detected globally, so a valid recovery link that falls back to the configured Site URL is reliably forwarded to `/reset-password`
- The reset page accepts Supabase implicit recovery sessions and `token_hash` recovery links, then clears the temporary local session after the password changes
- JWT session persisted in browser; 0ms session cache via `localStorage` + in-memory

---

### 4.2 📺 Public TV Waiting Room Display (`/display`)
- **Real-time** token updates via Supabase PostgreSQL WebSocket subscriptions
- Currently serving token shown in **large bold "Now Calling" banner**
- Next 5 upcoming tokens shown in animated waiting list
- **Dual-tone Web Audio API chime** fires on each new token call (no external audio file needed)
- **Bilingual TTS announcements:** Hindi (`hi-IN`) and English (`en-IN`) via Web Speech API
- 3D animated token flip card with gold glow aura effect
- Live audio equalizer animation bars for visual engagement
- Auto-reconnects on network drop; displays "Connecting..." gracefully

---

### 4.3 🤖 AI Symptom Assistant (`/ai-assistant`)
- Microphone voice input via **Web Speech API** (real-time dictation)
- Text input also supported (manual typing)
- Accepts symptom description in **Hindi or English**
- Gemini AI runs through a server-side API route (`/api/ai-assistant`) so the API key is never exposed in the browser
- Fast local medical rule fallback returns safe department triage if Gemini is slow, unavailable, or incomplete
- Gemini AI analyzes symptoms → recommends appropriate medical department
  - e.g. chest pain → Cardiology; joint pain → Orthopedics; child fever → Pediatrics
- **1-click navigation** to book appointment with suggested specialist
- Shows urgency level: Normal / Semi-Urgent / Emergency

---

### 4.4 🎫 Patient Digital QR Token Pass (`/patient/queue/[tokenId]`)
- **Live estimated wait time** counter (recalculates every 30s)
- Animated progress circle showing position in queue
- Pure **SVG QR code matrix** generated client-side (no external library)
- QR encodes: `tokenId`, `doctorId`, `tokenNumber`, `queueId`, `date`
- **Print-Ready OPD Slip** via `@media print` CSS — clean layout for physical printing
- Supports status: `waiting` → `called` → `completed` / `skipped`
- Real-time status update via Supabase subscription

---

### 4.5 👨‍⚕️ Doctor OPD Cabin Console (`/doctor/dashboard`)
- **Multi-cabin Selector:** Dropdown to switch between registered doctors/rooms
- **1-Click Queue Initialization:** Creates today's active queue in Supabase with one click
- **Priority Triage System:**
  - 🚨 Emergency — shown in red, fast-tracked
  - 👵 Senior Citizen — shown in purple, priority queue
  - Regular — standard FIFO order
- **Patient Call Actions:** Call → Complete (with prescription notes) / Skip
- **OPD Delay Broadcast:** +15m / +30m / +45m / +60m delay announcement to all patients
- **Consultation Notes:** Attach medical advice to completed token record
- **Real-time token sync:** Supabase subscription updates without page refresh
- **"Add 3 Test Patients"** button for admin/doctor testing
- **Web Audio chime** fires on each patient call

---

### 4.6 🛡️ Super Admin Control Center (`/admin/*`)

#### Dashboard (`/admin/dashboard`)
- Live KPI cards: Total Tokens Today, Completed, Avg Wait Time, Queue Clearance Rate %
- Recent activity feed

#### Analytics (`/admin/analytics`)
- Queue Clearance Rate trend chart (Recharts line graph)
- Token status distribution (pie chart: waiting / called / completed / skipped)
- Wait time saved per day (bar chart)
- Department-wise patient load comparison

#### Hospital Management (`/admin/hospitals`)
- Add, edit, toggle active/inactive hospital facilities
- Fields: Name, Type (Govt/Private/Clinic), City, Address, Contact Phone

#### Department Management (`/admin/departments`)
- Add departments per hospital
- Fields: Name, Description, Hospital assignment, Active toggle

#### Doctor Directory (`/admin/doctors`)
- Register doctors and link to hospital + department
- Fields: Full Name (profile link), Specialization, Room Number, Avg Consultation Time (minutes)
- Active/Inactive toggle per doctor

#### Schedule Management (`/admin/schedules`)
- Per-doctor OPD timing setup
- Fields: Doctor, Day of Week, Start Time, End Time, Max Patients

#### Queue Manager (`/admin/queues`)
- View all active/inactive queues across departments
- Manually close or reset queues

---

### 4.7 👤 Patient Profile & Digital Health ID (`/patient/profile`)
- **Profile Photo Upload:** Client-side auto-compression to base64
- **8 Preset Medical Avatars:** Emoji-based quick selection
- **Personal Info:** Full Name, Phone, Age, Gender, City
- **Medical Health Card:** Blood Group, Known Allergies, Emergency Contact Name + Phone
- **3D Interactive Digital Health ID Card** (holographic shimmer effect)
- Synced to Supabase `profiles` table + `localStorage` for fast load
- Profile photo syncs to Navbar avatar in real-time via `profileUpdated` event

---

### 4.8 📅 Patient Appointments (`/patient/appointments`)
- List of all patient's booked OPD tokens with status
- Filter by: All / Waiting / Completed / Skipped

---

### 4.9 🏥 Patient Hospital & Doctor Discovery (`/patient/hospitals`, `/patient/doctors`)
- Browse registered hospitals and departments
- Browse active doctors by specialty
- 1-click "Book Appointment" navigation

---

## 4.10 🧪 Demo / Seed Dataset

The Supabase project currently includes a Bikaner demo dataset for development and product demos:

- **11 active Bikaner hospitals**
- **66 active departments/sections** across those hospitals
  - General Medicine
  - Emergency
  - Pediatrics
  - Orthopedics
  - Gynecology
  - Cardiology
- **11 active demo doctors** linked to hospital + department + room number
- **66 doctor schedules** for Monday-Saturday, `09:00-14:00`
- **6 demo patients**
- **6 sample appointments** dated `2026-08-25` to `2026-08-27`

Demo credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| Patient | `patient.rohit.soni@smartqueue.demo` | `Patient@123` |
| Doctor accounts | `dr.*@smartqueue.demo` | `Doctor@123` |

> Demo doctors and patients are synthetic records for testing. Do not treat them as real hospital staff or real patient data.

---

## 5. 🗄️ Database Schema (Supabase / PostgreSQL)

### `profiles`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK, FK → auth.users) | User ID |
| `full_name` | `text` | Display name |
| `phone` | `text` | Contact number |
| `role` | `text` | `admin` / `doctor` / `patient` |
| `avatar_url` | `text` | Base64 image or emoji avatar |
| `created_at` | `timestamptz` | Registration timestamp |

New Auth users are mirrored into `profiles` by `public.handle_new_user_profile()`. The trigger copies `full_name`, `email`, and `phone` from Supabase Auth metadata and defaults `role` to `patient`.

### `hospitals`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Hospital ID |
| `name` | `text` | Hospital name |
| `type` | `text` | `govt` / `private` / `clinic` |
| `city` | `text` | City |
| `address` | `text` | Full address |
| `contact_phone` | `text` | Contact number |
| `is_active` | `boolean` | Active/inactive toggle |

### `departments`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Department ID |
| `hospital_id` | `uuid` (FK → hospitals) | Parent hospital |
| `name` | `text` | e.g. Cardiology, Orthopedics |
| `description` | `text` | Brief description |
| `is_active` | `boolean` | Active/inactive toggle |

### `doctors`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Doctor ID |
| `profile_id` | `uuid` (FK → profiles) | Linked user account |
| `hospital_id` | `uuid` (FK → hospitals) | Hospital |
| `department_id` | `uuid` (FK → departments) | Department |
| `specialization` | `text` | Medical specialty |
| `room_number` | `text` | OPD room/cabin number |
| `average_consultation_minutes` | `int` | Avg time per patient |
| `is_active` | `boolean` | Active/inactive toggle |

### `schedules`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Schedule ID |
| `doctor_id` | `uuid` (FK → doctors) | Doctor |
| `day_of_week` | `int` | 0=Sunday … 6=Saturday |
| `start_time` | `time` | OPD start time |
| `end_time` | `time` | OPD end time |
| `max_patients` | `int` | Max tokens per session |

### `queues`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Queue ID |
| `doctor_id` | `uuid` (FK → doctors) | Assigned doctor |
| `hospital_id` | `uuid` (FK → hospitals) | Hospital |
| `department_id` | `uuid` (FK → departments) | Department |
| `queue_date` | `date` | Date (e.g. 2026-08-24) |
| `status` | `text` | `active` / `closed` |
| `current_token_number` | `int` | Last called token number |

### `tokens`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Token ID |
| `queue_id` | `uuid` (FK → queues) | Parent queue |
| `patient_id` | `uuid` (FK → profiles) | Patient |
| `token_number` | `int` | Assigned token number |
| `status` | `text` | `waiting` / `called` / `completed` / `skipped` |
| `priority` | `text` | `regular` / `senior` / `emergency` |
| `estimated_wait_minutes` | `int` | Predicted wait time |
| `joined_at` | `timestamptz` | Booking timestamp |
| `called_at` | `timestamptz` | When doctor called this token |
| `completed_at` | `timestamptz` | Consultation end time |
| `skipped_at` | `timestamptz` | Skip timestamp |

---

## 6. 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16.3.1 (App Router, Turbopack) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS 4 (Dark Mode, 3D Glassmorphism) |
| **Database** | Supabase (PostgreSQL 15 + Realtime WebSockets) |
| **Auth** | Supabase Auth (JWT, Email/Password) |
| **Audio** | Web Audio API (Oscillator chime synthesis) |
| **Voice** | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| **Charts** | Recharts |
| **AI** | Gemini via server-only `GEMINI_API_KEY` with local triage fallback |
| **Deployment** | Vercel / Railway |

---

## 7. ⚡ Performance Optimizations

- **0ms session cache:** `getCachedUserRoleSync()` reads from in-memory → `localStorage` → Supabase (waterfall)
- **Stale-While-Revalidate:** Pages render instantly with cached data; background re-validation updates silently
- **Realtime Subscriptions:** Scoped per `queue_id` to minimize WebSocket payload
- **Next.js Static Generation:** 21/22 routes are statically pre-rendered at build time
- **`devIndicators: false`** in `next.config.js` — no dev watermarks in production

---

## 8. 🚧 Out of Scope (v1.0)

- Mobile app (Android/iOS)
- SMS / WhatsApp token notifications
- Insurance & billing integration
- Video teleconsultation
- Multi-language UI (only bilingual audio announcements for now)
- Offline PWA mode

---

## 9. 🗺️ Future Roadmap (v2.0)

- [ ] WhatsApp OTP & token notification
- [ ] Progressive Web App (PWA) with offline queue caching
- [ ] Doctor video call integration
- [ ] Insurance API integration
- [ ] Multi-hospital chain superadmin dashboard
- [ ] Patient feedback & doctor rating system
- [ ] Government ABHA Health ID integration
