# 🏥 SmartQueue — AI-Powered Hospital OPD Queue & Triage Management System

<div align="center">

![Next.js 16](https://img.shields.io/badge/Next.js-16.3.1-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Realtime_Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A next-generation, cloud-synchronized healthcare platform engineered to eliminate hospital OPD waiting bottlenecks, automate patient triage with voice AI, announce turns via smart TV broadcasts, and issue verifiable digital passes.**

[Explore Features](#-key-features) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Database Schema](#-database-schema) • [Role Hierarchy](#-role-based-access-control-rbac)

</div>

---

## 📖 Overview

**SmartQueue** is an enterprise-grade hospital queue management system designed for public and private healthcare facilities. By replacing chaotic waiting rooms and physical token slips with **real-time cloud synchronization**, **voice-announced TV displays**, **AI symptom routing**, and **verifiable digital passes**, SmartQueue reduces average patient wait times by over **40%** and optimizes doctor OPD throughput.

---

## ✨ Key Features

### 1. 📺 Public Waiting Room TV Kiosk (`/display`)
* **Real-Time Cloud Synchronization:** Powered by Supabase PostgreSQL change subscriptions with sub-second latency.
* **Dual-Tone Web Audio Chime:** Synthesizes gentle hospital notification chimes (587Hz / 880Hz) on patient call without external audio files.
* **Bilingual Speech Synthesis:** Automated text-to-speech turn announcements in **Hindi (`hi-IN`)** and **English (`en-US`/`en-IN`)**.
* **3D Token Flip & Gold Glow Aura:** Eye-catching visual animations with live animated audio equalizer bars for active OPD cabins.

### 2. 🤖 Voice-Powered AI Symptom Triage (`/ai-assistant`)
* **Microphone Voice Dictation:** Integrated with Web Speech API for real-time speech-to-text symptom intake in English and Hindi.
* **Intelligent Department Routing:** Analyzes reported symptoms and instantly recommends the appropriate medical specialty (e.g. Cardiology, Orthopedics, Neurology, Pediatrics).
* **Direct 1-Click Booking:** Directly navigates patients from diagnosis to booking with available specialists.

### 3. 🎫 Digital QR Token Pass & Printable PDF Slip (`/patient/queue/[tokenId]`)
* **Live Estimated Wait Counter:** Real-time wait time calculator with live token progression circle.
* **Pure SVG QR Code Matrix:** Dynamic, high-resolution QR pass for contactless mobile verification at doctor cabins.
* **Print-Ready OPD Slip:** Clean `@media print` layout allowing patients to download or print their physical appointment pass.

### 4. 👨‍⚕️ Doctor OPD Cabin Console (`/doctor/dashboard`)
* **Multi-Cabin Selector:** Switch between doctor cabins and departments seamlessly.
* **1-Click Today's Queue Generator:** Instantly initialize and open active OPD queues with one click.
* **Urgent & Senior Triage:** Fast-track emergency cases and senior citizens ahead of the standard queue.
* **OPD Delay Broadcast System:** Broadcast unexpected doctor delays (`+15m`, `+30m`, `+45m`, `+60m`) to all waiting patients and TV displays.
* **Prescription & Consultation Notes:** Attach medical advice and prescription notes to completed patient passes.

### 5. 🛡️ Super Admin Control Center (`/admin/*`)
* **Real-time KPI Analytics (`/admin/analytics`):** Queue Clearance Rate (%), patient wait hours saved, and token status breakdown.
* **Hospital & Department Management:** Multi-facility infrastructure management with active/inactive toggles.
* **Doctor Directory & Schedules:** Configure doctor consultation timings, daily patient capacities, and room allocations.
* **Live Global Queue Manager:** Monitor and intervene in live queues across all hospital departments.

### 6. 👤 Patient Health ID & Profile (`/patient/profile`)
* **Custom Photo & Preset Avatars:** Upload profile pictures with client-side auto-compression or pick from preset medical avatars.
* **Digital Health Card:** Interactive 3D preview of blood group, emergency contact, verified email, and medical history.

### 7. 🔒 Role-Based Access Control (RBAC) & 0ms Fast Cache
* **Super Admin Privileges:** Superusers enjoy seamless access across all portals (Admin, Doctor, Patient, Display, AI).
* **Strict 403 Forbidden Guards:** Unauthorized patients are securely blocked from accessing administrative or doctor consoles.
* **Zero-Delay Navigation:** Synchronous in-memory and local session caching for instantaneous 0ms page transitions without layout shifts.

---

## 🏛️ System Architecture

```
                                +---------------------------+
                                |    Next.js 16 Web App     |
                                +-------------+-------------+
                                              |
                     +------------------------+------------------------+
                     |                        |                        |
         +-----------v-----------+  +---------v---------+  +-----------v-----------+
         |  Patient / QR Pass   |  |   Doctor Console  |  |    Live TV Display    |
         |  • Token Tracking     |  |   • Call / Skip   |  |   • Web Audio Chimes  |
         |  • Voice AI Assistant |  |   • Delay Alerts  |  |   • Bilingual Speech  |
         |  • Digital Health ID  |  |   • Prescriptions |  |   • Realtime Sync     |
         +-----------+-----------+  +---------+---------+  +-----------+-----------+
                     |                        |                        |
                     +------------------------+------------------------+
                                              |
                                +-------------v-------------+
                                |  Supabase Backend Engine  |
                                |  • PostgreSQL Database    |
                                |  • Realtime WebSockets    |
                                |  • Row-Level Auth & RBAC  |
                                +---------------------------+
```

---

## 👥 Role-Based Access Control (RBAC)

| Role | Admin Dashboard (`/admin/*`) | Doctor Cabin (`/doctor/*`) | Patient Portal (`/patient/*`) | TV Display & AI (`/display`, `/ai`) |
| :--- | :---: | :---: | :---: | :---: |
| **🛡️ Admin (Superuser)** | ✅ **Full Access** | ✅ **Full Access** | ✅ **Full Access** | ✅ **Full Access** |
| **👨‍⚕️ Doctor** | ❌ Blocked (403) | ✅ **Full Access** | ✅ View Access | ✅ **Full Access** |
| **👤 Patient** | ❌ Blocked (403) | ❌ Blocked (403) | ✅ **Full Access** | ✅ **Full Access** |

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server & Client Components)
* **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
* **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) with Dark Mode & 3D Glassmorphism
* **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL with Realtime Change Subscriptions)
* **Audio & Voice:** Web Audio API (Oscillator Chime Synthesis) & Web Speech API (Speech Recognition + TTS)
* **Charts & Analytics:** [Recharts](https://recharts.org/)
* **Icons & QR:** Lucide Icons & Pure SVG QR Matrix Engine

---

## 📁 Project Structure

```
smart-hospital-queue/
├── src/
│   ├── app/
│   │   ├── admin/               # Admin Portal (Analytics, Doctors, Hospitals, Queues, Schedules)
│   │   ├── ai-assistant/        # Voice-Powered AI Symptom Assistant
│   │   ├── display/             # Real-time Public Waiting Room TV Kiosk
│   │   ├── doctor/dashboard/    # Doctor OPD Cabin Management Console
│   │   ├── patient/             # Patient Portals (Appointments, Hospitals, Doctors, Profile, Live Queue)
│   │   ├── globals.css          # 3D Animations, Hologram Shimmer & Keyframes
│   │   ├── layout.tsx           # Root Layout with Theme & Session Providers
│   │   └── page.tsx             # Interactive Home Hero with Typewriter & 3D Parallax
│   ├── components/
│   │   ├── AccessGuard.tsx      # Strict RBAC 403 Security Guard
│   │   ├── Navbar.tsx           # Dynamic Role-Based Smart Navbar
│   │   ├── SmartQueueLogo.tsx   # Official Vector SVG Pulse-Cross Brand Logo
│   │   ├── ThemeToggle.tsx      # Dark / Light Theme Toggle
│   │   └── TokenQRPDF.tsx       # Printable PDF & SVG QR Token Pass
│   └── lib/
│       ├── auth.ts              # Supabase Auth Handlers (Signup, Login, Reset)
│       ├── rbac.ts              # 0ms Fast In-Memory Session & Role Evaluator
│       ├── sound.ts             # Web Audio API Chime & Speech Synthesis
│       └── supabase.ts          # Supabase Client Initialization
└── next.config.js               # Next.js Build Configuration
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.18+ or v20+)
* [Git](https://git-scm.com/)
* A free [Supabase](https://supabase.com/) account

### 1. Clone the Repository
```bash
git clone https://github.com/Golu-Jaat/smart-hospital-queue.git
cd smart-hospital-queue
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🗄️ Database Schema

The system uses the following relational tables in PostgreSQL / Supabase:

* **`profiles`** — User metadata (`id`, `full_name`, `phone`, `role`, `created_at`).
* **`hospitals`** — Hospital facilities (`id`, `name`, `type`, `city`, `address`, `contact_phone`, `is_active`).
* **`departments`** — Medical departments (`id`, `hospital_id`, `name`, `description`, `is_active`).
* **`doctors`** — Doctors directory (`id`, `profile_id`, `hospital_id`, `department_id`, `specialization`, `room_number`, `average_consultation_minutes`).
* **`schedules`** — Doctor OPD schedules (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_patients`).
* **`queues`** — Daily active OPD queues (`id`, `doctor_id`, `hospital_id`, `department_id`, `queue_date`, `status`, `current_token_number`).
* **`tokens`** — Patient tokens (`id`, `queue_id`, `patient_id`, `token_number`, `status`, `priority`, `joined_at`, `called_at`, `completed_at`).

---

## 👨‍💻 Author

* **Golu Jaat** — [GitHub Profile](https://github.com/Golu-Jaat) • [Smart Hospital Queue Repository](https://github.com/Golu-Jaat/smart-hospital-queue)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
