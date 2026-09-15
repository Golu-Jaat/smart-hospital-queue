create or replace function private.ensure_doctor_queue(
  target_doctor_id uuid,
  requested_date date
)
returns table (
  queue_id uuid,
  queue_status text,
  current_token_number integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_hospital_id uuid;
  selected_department_id uuid;
  selected_queue_id uuid;
  selected_queue_status text;
  selected_current_token integer;
  india_today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not (select private.is_admin())
    and not (select private.owns_doctor(target_doctor_id)) then
    raise exception 'Doctor queue access denied' using errcode = '42501';
  end if;

  if requested_date is null or requested_date < india_today then
    raise exception 'Queue date cannot be in the past' using errcode = '22023';
  end if;

  select d.hospital_id, d.department_id
  into selected_hospital_id, selected_department_id
  from public.doctors as d
  join public.hospitals as h on h.id = d.hospital_id
  join public.departments as dep on dep.id = d.department_id
  where d.id = target_doctor_id
    and d.is_active
    and h.is_active
    and dep.is_active
  for update of d;

  if selected_hospital_id is null then
    raise exception 'Selected doctor is not available' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.doctor_schedules as s
    where s.doctor_id = target_doctor_id
      and s.day_of_week = extract(dow from requested_date)::integer
      and s.is_active
  ) then
    raise exception 'No active doctor schedule exists for this date'
      using errcode = '22023';
  end if;

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
    target_doctor_id,
    requested_date,
    0,
    'active'
  )
  on conflict (doctor_id, queue_date) do nothing;

  select q.id, q.status, q.current_token_number
  into selected_queue_id, selected_queue_status, selected_current_token
  from public.queues as q
  where q.doctor_id = target_doctor_id
    and q.queue_date = requested_date
  for update;

  if selected_queue_status = 'closed' then
    raise exception 'The doctor queue is closed for this date'
      using errcode = '22023';
  end if;

  return query
  select selected_queue_id, selected_queue_status, selected_current_token;
end;
$$;

revoke all on function private.ensure_doctor_queue(uuid, date)
from public, anon, authenticated;
grant execute on function private.ensure_doctor_queue(uuid, date)
to authenticated;

create or replace function public.ensure_doctor_queue(
  target_doctor_id uuid,
  requested_date date
)
returns table (
  queue_id uuid,
  queue_status text,
  current_token_number integer
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.ensure_doctor_queue(target_doctor_id, requested_date)
$$;

revoke all on function public.ensure_doctor_queue(uuid, date)
from public, anon, authenticated;
grant execute on function public.ensure_doctor_queue(uuid, date)
to authenticated;

create or replace function private.transition_token_status(
  target_token_id uuid,
  requested_status text
)
returns table (
  token_id uuid,
  queue_id uuid,
  token_number integer,
  token_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_queue_id uuid;
  selected_patient_id uuid;
  selected_appointment_id uuid;
  selected_token_number integer;
  current_status text;
  status_message text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if requested_status not in ('called', 'completed', 'skipped') then
    raise exception 'Unsupported token status' using errcode = '22023';
  end if;

  select
    t.queue_id,
    t.patient_id,
    t.appointment_id,
    t.token_number,
    t.status
  into
    selected_queue_id,
    selected_patient_id,
    selected_appointment_id,
    selected_token_number,
    current_status
  from public.tokens as t
  join public.queues as q on q.id = t.queue_id
  where t.id = target_token_id
  for update of t, q;

  if selected_queue_id is null then
    raise exception 'Token not found' using errcode = 'P0002';
  end if;

  if not (select private.can_manage_queue(selected_queue_id)) then
    raise exception 'Token update access denied' using errcode = '42501';
  end if;

  if current_status = requested_status then
    return query
    select target_token_id, selected_queue_id, selected_token_number, current_status;
    return;
  end if;

  if not (
    (current_status = 'waiting' and requested_status in ('called', 'skipped'))
    or (current_status = 'called' and requested_status in ('completed', 'skipped'))
  ) then
    raise exception 'Invalid token status transition from % to %',
      current_status,
      requested_status
      using errcode = '22023';
  end if;

  update public.tokens
  set
    status = requested_status,
    called_at = case when requested_status = 'called' then now() else called_at end,
    completed_at = case when requested_status = 'completed' then now() else completed_at end,
    skipped_at = case when requested_status = 'skipped' then now() else skipped_at end
  where id = target_token_id;

  if requested_status = 'called' then
    update public.queues
    set current_token_number = selected_token_number
    where id = selected_queue_id;
  end if;

  if selected_appointment_id is not null then
    update public.appointments
    set status = case requested_status
      when 'called' then 'confirmed'
      when 'completed' then 'completed'
      else status
    end
    where id = selected_appointment_id;
  end if;

  status_message := case requested_status
    when 'called' then format('Token #%s is now being called.', selected_token_number)
    when 'completed' then format('Consultation for token #%s is complete.', selected_token_number)
    else format('Token #%s was skipped. Please contact the OPD desk.', selected_token_number)
  end;

  insert into public.notifications (
    patient_id,
    token_id,
    message,
    type,
    is_read
  )
  values (
    selected_patient_id,
    target_token_id,
    status_message,
    case requested_status
      when 'called' then 'your_turn'
      when 'completed' then 'completed'
      else 'token_skipped'
    end,
    false
  );

  return query
  select
    target_token_id,
    selected_queue_id,
    selected_token_number,
    requested_status;
end;
$$;

revoke all on function private.transition_token_status(uuid, text)
from public, anon, authenticated;
grant execute on function private.transition_token_status(uuid, text)
to authenticated;

create or replace function public.transition_token_status(
  target_token_id uuid,
  requested_status text
)
returns table (
  token_id uuid,
  queue_id uuid,
  token_number integer,
  token_status text
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.transition_token_status(target_token_id, requested_status)
$$;

revoke all on function public.transition_token_status(uuid, text)
from public, anon, authenticated;
grant execute on function public.transition_token_status(uuid, text)
to authenticated;
