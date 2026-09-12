-- Production RLS lockdown. All authorization is derived from public.profiles,
-- never from user-controlled JWT metadata.

revoke create on schema public from public;
revoke create on schema public from anon;
revoke create on schema public from authenticated;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to authenticated;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = (select auth.uid())
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.current_user_role()) = 'admin', false)
$$;

create or replace function private.owns_doctor(target_doctor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.doctors as d
    where d.id = target_doctor_id
      and d.profile_id = (select auth.uid())
  )
$$;

create or replace function private.can_manage_queue(target_queue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_admin()) or exists (
    select 1
    from public.queues as q
    join public.doctors as d on d.id = q.doctor_id
    where q.id = target_queue_id
      and d.profile_id = (select auth.uid())
  )
$$;

create or replace function private.can_view_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_profile_id = (select auth.uid())
    or (select private.is_admin())
    or exists (
      select 1
      from public.tokens as t
      join public.queues as q on q.id = t.queue_id
      join public.doctors as d on d.id = q.doctor_id
      where t.patient_id = target_profile_id
        and d.profile_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.appointments as a
      join public.doctors as d on d.id = a.doctor_id
      where a.patient_id = target_profile_id
        and d.profile_id = (select auth.uid())
    )
$$;

revoke all on function private.current_user_role() from public, anon, authenticated;
revoke all on function private.is_admin() from public, anon, authenticated;
revoke all on function private.owns_doctor(uuid) from public, anon, authenticated;
revoke all on function private.can_manage_queue(uuid) from public, anon, authenticated;
revoke all on function private.can_view_profile(uuid) from public, anon, authenticated;

grant execute on function private.current_user_role() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.owns_doctor(uuid) to authenticated;
grant execute on function private.can_manage_queue(uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'patient'
  )
  on conflict (id) do update
  set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    email = coalesce(public.profiles.email, excluded.email),
    phone = coalesce(public.profiles.phone, excluded.phone);

  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'hospitals', 'departments', 'profiles', 'doctors',
        'doctor_schedules', 'appointments', 'queues', 'tokens',
        'notifications', 'ai_conversations', 'ai_messages',
        'symptom_assessments'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end
$$;

alter table public.hospitals enable row level security;
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_schedules enable row level security;
alter table public.appointments enable row level security;
alter table public.queues enable row level security;
alter table public.tokens enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.symptom_assessments enable row level security;

create policy hospitals_read_active
on public.hospitals for select
to anon, authenticated
using (is_active);

create policy hospitals_admin_manage
on public.hospitals for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy departments_read_active
on public.departments for select
to anon, authenticated
using (is_active);

create policy departments_admin_manage
on public.departments for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy profiles_read_authorized
on public.profiles for select
to authenticated
using ((select private.can_view_profile(id)));

create policy profiles_update_own
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy doctors_read_active
on public.doctors for select
to anon, authenticated
using (is_active);

create policy doctors_owner_read
on public.doctors for select
to authenticated
using ((select private.owns_doctor(id)));

create policy doctors_admin_manage
on public.doctors for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy doctor_schedules_read_active
on public.doctor_schedules for select
to anon, authenticated
using (is_active);

create policy doctor_schedules_owner_read
on public.doctor_schedules for select
to authenticated
using ((select private.owns_doctor(doctor_id)));

create policy doctor_schedules_admin_manage
on public.doctor_schedules for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy appointments_patient_read
on public.appointments for select
to authenticated
using ((select auth.uid()) = patient_id);

create policy appointments_patient_insert
on public.appointments for insert
to authenticated
with check (
  (select auth.uid()) = patient_id
  and exists (
    select 1
    from public.doctors as d
    where d.id = doctor_id and d.is_active
  )
);

create policy appointments_doctor_read
on public.appointments for select
to authenticated
using ((select private.owns_doctor(doctor_id)));

create policy appointments_admin_manage
on public.appointments for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy queues_public_read_today
on public.queues for select
to anon, authenticated
using (queue_date = current_date and status in ('active', 'paused'));

create policy queues_authenticated_read_open
on public.queues for select
to authenticated
using (status in ('active', 'paused'));

create policy queues_doctor_manage
on public.queues for all
to authenticated
using ((select private.owns_doctor(doctor_id)))
with check ((select private.owns_doctor(doctor_id)));

create policy queues_admin_manage
on public.queues for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy tokens_public_read_today
on public.tokens for select
to anon, authenticated
using (
  status in ('waiting', 'called')
  and exists (
    select 1
    from public.queues as q
    where q.id = queue_id
      and q.queue_date = current_date
      and q.status in ('active', 'paused')
  )
);

create policy tokens_patient_read_own
on public.tokens for select
to authenticated
using ((select auth.uid()) = patient_id);

create policy tokens_doctor_manage
on public.tokens for all
to authenticated
using ((select private.can_manage_queue(queue_id)))
with check ((select private.can_manage_queue(queue_id)));

create policy notifications_patient_read
on public.notifications for select
to authenticated
using ((select auth.uid()) = patient_id);

create policy notifications_patient_update
on public.notifications for update
to authenticated
using ((select auth.uid()) = patient_id)
with check ((select auth.uid()) = patient_id);

create policy notifications_admin_manage
on public.notifications for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy ai_conversations_patient_read
on public.ai_conversations for select
to authenticated
using ((select auth.uid()) = patient_id);

create policy ai_conversations_patient_insert
on public.ai_conversations for insert
to authenticated
with check ((select auth.uid()) = patient_id);

create policy ai_messages_patient_read
on public.ai_messages for select
to authenticated
using (
  exists (
    select 1
    from public.ai_conversations as c
    where c.id = conversation_id
      and c.patient_id = (select auth.uid())
  )
);

create policy ai_messages_patient_insert
on public.ai_messages for insert
to authenticated
with check (
  exists (
    select 1
    from public.ai_conversations as c
    where c.id = conversation_id
      and c.patient_id = (select auth.uid())
  )
);

create policy symptom_assessments_patient_read
on public.symptom_assessments for select
to authenticated
using ((select auth.uid()) = patient_id);

create policy symptom_assessments_patient_insert
on public.symptom_assessments for insert
to authenticated
with check ((select auth.uid()) = patient_id);

revoke all on all tables in schema public from public, anon, authenticated;

grant select on public.hospitals to anon, authenticated;
grant select on public.departments to anon, authenticated;
grant select on public.doctors to anon, authenticated;
grant select on public.doctor_schedules to anon, authenticated;
grant select on public.queues to anon, authenticated;
grant select on public.tokens to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

grant insert, update, delete on public.hospitals to authenticated;
grant insert, update, delete on public.departments to authenticated;
grant insert, update, delete on public.doctors to authenticated;
grant insert, update, delete on public.doctor_schedules to authenticated;
grant insert, update, delete on public.queues to authenticated;
grant insert, update, delete on public.tokens to authenticated;

grant select, insert, update, delete on public.appointments to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert on public.ai_conversations to authenticated;
grant select, insert on public.ai_messages to authenticated;
grant select, insert on public.symptom_assessments to authenticated;

alter default privileges in schema public revoke all on tables from public;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;

create index if not exists doctors_profile_id_idx
on public.doctors (profile_id);

create index if not exists queues_doctor_id_idx
on public.queues (doctor_id);

create index if not exists tokens_queue_id_idx
on public.tokens (queue_id);

create index if not exists tokens_patient_id_idx
on public.tokens (patient_id);

create index if not exists appointments_patient_id_idx
on public.appointments (patient_id);

create index if not exists appointments_doctor_id_idx
on public.appointments (doctor_id);
