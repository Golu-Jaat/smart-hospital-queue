-- SmartQueue base schema for a brand-new Supabase project.
-- Run this file once before the ordered files in supabase/migrations/.

begin;

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('government', 'private')),
  address text,
  city text,
  contact_phone text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  email text,
  phone text,
  role text default 'patient' check (role in ('patient', 'doctor', 'admin')),
  hospital_id uuid references public.hospitals(id),
  created_at timestamptz default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean default true
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id),
  department_id uuid references public.departments(id),
  profile_id uuid references public.profiles(id),
  specialization text,
  room_number text,
  average_consultation_minutes integer default 10,
  is_active boolean default true
);

create table if not exists public.doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctors(id) on delete cascade,
  day_of_week integer check (day_of_week between 0 and 6),
  start_time time,
  end_time time,
  max_patients integer default 20,
  is_active boolean default true
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id),
  doctor_id uuid references public.doctors(id),
  department_id uuid references public.departments(id),
  appointment_date date,
  slot_start time,
  slot_end time,
  status text default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

create table if not exists public.queues (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id),
  department_id uuid references public.departments(id),
  doctor_id uuid references public.doctors(id),
  queue_date date default current_date,
  current_token_number integer default 0,
  status text default 'active' check (status in ('active', 'paused', 'closed')),
  created_at timestamptz default now()
);

create table if not exists public.tokens (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid references public.queues(id),
  patient_id uuid references public.profiles(id),
  appointment_id uuid references public.appointments(id),
  token_number integer,
  priority text default 'normal' check (priority in ('normal', 'urgent', 'emergency')),
  status text default 'waiting'
    check (status in ('waiting', 'called', 'completed', 'skipped', 'cancelled')),
  joined_at timestamptz default now(),
  called_at timestamptz,
  completed_at timestamptz,
  skipped_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id),
  token_id uuid references public.tokens(id),
  message text,
  type text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations(id) on delete cascade,
  sender text check (sender in ('user', 'assistant')),
  message text,
  created_at timestamptz default now()
);

create table if not exists public.symptom_assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id),
  conversation_id uuid references public.ai_conversations(id),
  symptoms text,
  duration text,
  severity text,
  urgency_level text,
  recommended_department text,
  created_at timestamptz default now()
);

alter table public.hospitals enable row level security;
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_schedules enable row level security;
alter table public.appointments enable row level security;
alter table public.queues enable row level security;
alter table public.tokens enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.symptom_assessments enable row level security;

revoke all on all tables in schema public from public, anon, authenticated;

commit;
