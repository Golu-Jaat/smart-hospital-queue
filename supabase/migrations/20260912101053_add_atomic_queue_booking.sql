create unique index if not exists queues_doctor_date_unique_idx
on public.queues (doctor_id, queue_date);

create unique index if not exists tokens_queue_number_unique_idx
on public.tokens (queue_id, token_number);

create unique index if not exists appointments_doctor_slot_unique_idx
on public.appointments (doctor_id, appointment_date, slot_start)
where status <> 'cancelled';

create or replace function public.book_appointment_atomic(
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
  created_appointment_id uuid;
  selected_queue_id uuid;
  selected_queue_status text;
  created_token_id uuid;
  next_token_number integer;
begin
  if patient_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if requested_date is null or requested_date < current_date then
    raise exception 'Appointment date cannot be in the past'
      using errcode = '22023';
  end if;

  if requested_slot_start is null then
    raise exception 'Appointment time is required' using errcode = '22023';
  end if;

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
    and dep.is_active;

  if selected_hospital_id is null or selected_department_id is null then
    raise exception 'Selected doctor is not available' using errcode = '22023';
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

revoke all on function public.book_appointment_atomic(uuid, date, time)
from public, anon, authenticated;

grant execute on function public.book_appointment_atomic(uuid, date, time)
to authenticated;

drop policy if exists appointments_patient_insert on public.appointments;
revoke insert on public.appointments from authenticated;
