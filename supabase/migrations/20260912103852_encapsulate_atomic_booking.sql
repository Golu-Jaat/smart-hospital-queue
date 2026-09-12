alter function public.book_appointment_atomic(uuid, date, time)
set schema private;

revoke all on function private.book_appointment_atomic(uuid, date, time)
from public, anon, authenticated;

grant execute on function private.book_appointment_atomic(uuid, date, time)
to authenticated;

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
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.book_appointment_atomic(
    requested_doctor_id,
    requested_date,
    requested_slot_start
  )
$$;

revoke all on function public.book_appointment_atomic(uuid, date, time)
from public, anon, authenticated;

grant execute on function public.book_appointment_atomic(uuid, date, time)
to authenticated;
