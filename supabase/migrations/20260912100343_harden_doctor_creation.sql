create unique index if not exists doctors_profile_id_unique_idx
on public.doctors (profile_id);

create or replace function public.create_doctor_record(
  target_user_id uuid,
  doctor_full_name text,
  doctor_email text,
  target_hospital_id uuid,
  target_department_id uuid,
  doctor_specialization text,
  doctor_room_number text,
  consultation_minutes integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_doctor_id uuid;
begin
  if not exists (
    select 1 from auth.users as u where u.id = target_user_id
  ) then
    raise exception 'Auth user does not exist' using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.departments as dep
    join public.hospitals as hosp on hosp.id = dep.hospital_id
    where dep.id = target_department_id
      and dep.hospital_id = target_hospital_id
      and dep.is_active
      and hosp.is_active
  ) then
    raise exception 'Hospital and department selection is invalid'
      using errcode = '22023';
  end if;

  if consultation_minutes < 5 or consultation_minutes > 120 then
    raise exception 'Consultation time must be between 5 and 120 minutes'
      using errcode = '22023';
  end if;

  insert into public.profiles (
    id,
    full_name,
    email,
    role,
    hospital_id
  )
  values (
    target_user_id,
    btrim(doctor_full_name),
    lower(btrim(doctor_email)),
    'doctor',
    target_hospital_id
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    role = 'doctor',
    hospital_id = excluded.hospital_id;

  insert into public.doctors (
    hospital_id,
    department_id,
    profile_id,
    specialization,
    room_number,
    average_consultation_minutes,
    is_active
  )
  values (
    target_hospital_id,
    target_department_id,
    target_user_id,
    btrim(doctor_specialization),
    nullif(btrim(doctor_room_number), ''),
    consultation_minutes,
    true
  )
  returning id into new_doctor_id;

  return new_doctor_id;
end;
$$;

revoke all on function public.create_doctor_record(
  uuid, text, text, uuid, uuid, text, text, integer
) from public, anon, authenticated;

grant execute on function public.create_doctor_record(
  uuid, text, text, uuid, uuid, text, text, integer
) to service_role;
