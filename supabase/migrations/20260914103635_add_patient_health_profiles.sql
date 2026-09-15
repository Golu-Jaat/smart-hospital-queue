create table if not exists public.patient_health_profiles (
  patient_id uuid primary key
    references public.profiles(id) on delete cascade,
  avatar_path text,
  avatar_emoji text,
  blood_group text check (
    blood_group is null
    or blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
  ),
  age smallint check (age is null or age between 0 and 130),
  gender text check (gender is null or gender in ('Male', 'Female', 'Other')),
  allergies text,
  emergency_name text,
  emergency_phone text,
  address text,
  updated_at timestamptz not null default now(),
  check (
    avatar_path is null
    or split_part(avatar_path, '/', 1) = patient_id::text
  )
);

alter table public.patient_health_profiles enable row level security;

drop policy if exists patient_health_profiles_read_own
on public.patient_health_profiles;
create policy patient_health_profiles_read_own
on public.patient_health_profiles for select
to authenticated
using ((select auth.uid()) = patient_id);

drop policy if exists patient_health_profiles_insert_own
on public.patient_health_profiles;
create policy patient_health_profiles_insert_own
on public.patient_health_profiles for insert
to authenticated
with check ((select auth.uid()) = patient_id);

drop policy if exists patient_health_profiles_update_own
on public.patient_health_profiles;
create policy patient_health_profiles_update_own
on public.patient_health_profiles for update
to authenticated
using ((select auth.uid()) = patient_id)
with check ((select auth.uid()) = patient_id);

revoke all on public.patient_health_profiles from public, anon, authenticated;
grant select, insert, update on public.patient_health_profiles to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_avatars_read_own on storage.objects;
create policy profile_avatars_read_own
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists profile_avatars_insert_own on storage.objects;
create policy profile_avatars_insert_own
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists profile_avatars_update_own on storage.objects;
create policy profile_avatars_update_own
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists profile_avatars_delete_own on storage.objects;
create policy profile_avatars_delete_own
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- The service role bypasses RLS, so the rate limiter needs no client policy.
alter table if exists private.ai_rate_limits enable row level security;
