do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'doctor_schedules_valid_time_check'
      and conrelid = 'public.doctor_schedules'::regclass
  ) then
    alter table public.doctor_schedules
    add constraint doctor_schedules_valid_time_check
    check (start_time < end_time);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'doctor_schedules_capacity_check'
      and conrelid = 'public.doctor_schedules'::regclass
  ) then
    alter table public.doctor_schedules
    add constraint doctor_schedules_capacity_check
    check (max_patients > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'doctors_consultation_minutes_check'
      and conrelid = 'public.doctors'::regclass
  ) then
    alter table public.doctors
    add constraint doctors_consultation_minutes_check
    check (average_consultation_minutes between 5 and 240);
  end if;
end
$$;

create index if not exists doctor_schedules_booking_lookup_idx
on public.doctor_schedules (doctor_id, day_of_week, start_time, end_time)
where is_active;

create index if not exists appointments_doctor_date_status_idx
on public.appointments (doctor_id, appointment_date, status);

create or replace function private.book_appointment_atomic(
  requested_doctor_id uuid,
  requested_date date,
  requested_slot_start time
)
returns table (
  appointment_id uuid,
  queue_id uuid,
  token_id uuid,
  token_number integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  patient_user_id uuid := auth.uid();
  selected_hospital_id uuid;
  selected_department_id uuid;
  consultation_minutes integer;
  selected_schedule_start time;
  selected_schedule_end time;
  daily_capacity integer;
  booked_count integer;
  created_appointment_id uuid;
  selected_queue_id uuid;
  selected_queue_status text;
  created_token_id uuid;
  next_token_number integer;
  india_today date := (now() at time zone 'Asia/Kolkata')::date;
  india_time time := (now() at time zone 'Asia/Kolkata')::time;
begin
  if patient_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if requested_date is null or requested_date < india_today then
    raise exception 'Appointment date cannot be in the past'
      using errcode = '22023';
  end if;

  if requested_slot_start is null then
    raise exception 'Appointment time is required' using errcode = '22023';
  end if;

  if requested_date = india_today and requested_slot_start <= india_time then
    raise exception 'Appointment time must be in the future'
      using errcode = '22023';
  end if;

  -- Serializing on the doctor row keeps capacity and token assignment safe.
  select
    d.hospital_id,
    d.department_id,
    greatest(coalesce(d.average_consultation_minutes, 10), 5)
  into
    selected_hospital_id,
    selected_department_id,
    consultation_minutes
  from public.doctors as d
  join public.hospitals as h on h.id = d.hospital_id
  join public.departments as dep on dep.id = d.department_id
  where d.id = requested_doctor_id
    and d.is_active
    and h.is_active
    and dep.is_active
  for update of d;

  if selected_hospital_id is null or selected_department_id is null then
    raise exception 'Selected doctor is not available' using errcode = '22023';
  end if;

  select s.start_time, s.end_time
  into selected_schedule_start, selected_schedule_end
  from public.doctor_schedules as s
  where s.doctor_id = requested_doctor_id
    and s.day_of_week = extract(dow from requested_date)::integer
    and s.is_active
    and requested_slot_start >= s.start_time
    and requested_slot_start + make_interval(mins => consultation_minutes) <= s.end_time
  order by s.start_time
  limit 1;

  if selected_schedule_start is null then
    raise exception 'Selected time is outside the doctor schedule'
      using errcode = '22023';
  end if;

  if mod(
    extract(epoch from (requested_slot_start - selected_schedule_start))::integer,
    consultation_minutes * 60
  ) <> 0 then
    raise exception 'Select a valid appointment slot'
      using errcode = '22023';
  end if;

  select coalesce(sum(s.max_patients), 0)::integer
  into daily_capacity
  from public.doctor_schedules as s
  where s.doctor_id = requested_doctor_id
    and s.day_of_week = extract(dow from requested_date)::integer
    and s.is_active;

  select count(*)::integer
  into booked_count
  from public.appointments as a
  where a.doctor_id = requested_doctor_id
    and a.appointment_date = requested_date
    and a.status <> 'cancelled';

  if daily_capacity <= 0 or booked_count >= daily_capacity then
    raise exception 'The doctor has reached capacity for this date'
      using errcode = 'P0001';
  end if;

  begin
    insert into public.appointments (
      patient_id,
      doctor_id,
      department_id,
      appointment_date,
      slot_start,
      slot_end,
      status
    )
    values (
      patient_user_id,
      requested_doctor_id,
      selected_department_id,
      requested_date,
      requested_slot_start,
      requested_slot_start + make_interval(mins => consultation_minutes),
      'pending'
    )
    returning id into created_appointment_id;
  exception
    when unique_violation then
      raise exception 'This doctor already has an appointment at that time'
        using errcode = '23505';
  end;

  insert into public.queues (
    hospital_id,
    department_id,
    doctor_id,
    queue_date,
    current_token_number,
    status
  )
  values (
    selected_hospital_id,
    selected_department_id,
    requested_doctor_id,
    requested_date,
    0,
    'active'
  )
  on conflict (doctor_id, queue_date) do nothing;

  select q.id, q.status
  into selected_queue_id, selected_queue_status
  from public.queues as q
  where q.doctor_id = requested_doctor_id
    and q.queue_date = requested_date
  for update;

  if selected_queue_id is null or selected_queue_status = 'closed' then
    raise exception 'The doctor queue is closed for this date'
      using errcode = '22023';
  end if;

  select coalesce(max(t.token_number), 0) + 1
  into next_token_number
  from public.tokens as t
  where t.queue_id = selected_queue_id;

  insert into public.tokens (
    queue_id,
    patient_id,
    appointment_id,
    token_number,
    priority,
    status
  )
  values (
    selected_queue_id,
    patient_user_id,
    created_appointment_id,
    next_token_number,
    'normal',
    'waiting'
  )
  returning id into created_token_id;

  insert into public.notifications (
    patient_id,
    token_id,
    message,
    type,
    is_read
  )
  values (
    patient_user_id,
    created_token_id,
    format(
      'Your token #%s has been generated successfully. You can track the live queue status.',
      next_token_number
    ),
    'token_booked',
    false
  );

  return query
  select
    created_appointment_id,
    selected_queue_id,
    created_token_id,
    next_token_number;
end;
$$;
