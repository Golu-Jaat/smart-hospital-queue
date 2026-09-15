alter function private.get_admin_analytics(date, date)
rename to get_admin_analytics_base;

revoke all on function private.get_admin_analytics_base(date, date)
from public, anon, authenticated;
grant execute on function private.get_admin_analytics_base(date, date)
to authenticated;

create or replace function private.get_admin_analytics(
  requested_start date,
  requested_end date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
set statement_timeout = '5s'
as $$
declare
  analytics jsonb;
  valid_average_wait numeric;
  safe_start date;
  safe_end date;
begin
  analytics := private.get_admin_analytics_base(
    requested_start,
    requested_end
  );
  safe_start := (analytics ->> 'rangeStart')::date;
  safe_end := (analytics ->> 'rangeEnd')::date;

  select coalesce(
    round(avg(extract(epoch from (t.called_at - t.joined_at)) / 60.0), 1),
    0
  )
  into valid_average_wait
  from public.tokens as t
  join public.queues as q on q.id = t.queue_id
  where q.queue_date between safe_start and safe_end
    and t.called_at is not null
    and t.called_at >= t.joined_at
    and t.called_at - t.joined_at <= interval '24 hours';

  return jsonb_set(
    analytics,
    '{avgWaitMinutes}',
    to_jsonb(valid_average_wait),
    true
  );
end;
$$;

revoke all on function private.get_admin_analytics(date, date)
from public, anon, authenticated;
grant execute on function private.get_admin_analytics(date, date)
to authenticated;

create or replace function public.get_admin_analytics(
  requested_start date,
  requested_end date
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.get_admin_analytics(requested_start, requested_end)
$$;

revoke all on function public.get_admin_analytics(date, date)
from public, anon, authenticated;
grant execute on function public.get_admin_analytics(date, date)
to authenticated;
