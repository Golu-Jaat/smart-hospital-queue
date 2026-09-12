create table if not exists private.ai_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1
    check (request_count > 0)
);

revoke all on table private.ai_rate_limits from public, anon, authenticated;

create index if not exists ai_rate_limits_window_started_at_idx
on private.ai_rate_limits (window_started_at);

create or replace function public.consume_ai_rate_limit(rate_limit_key text)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
  current_window timestamptz;
  window_length constant interval := interval '1 minute';
  max_requests constant integer := 12;
begin
  if rate_limit_key is null or rate_limit_key !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid rate-limit key' using errcode = '22023';
  end if;

  insert into private.ai_rate_limits as limits (
    key_hash,
    window_started_at,
    request_count
  )
  values (rate_limit_key, now(), 1)
  on conflict (key_hash) do update
  set
    window_started_at = case
      when limits.window_started_at + window_length <= now() then now()
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at + window_length <= now() then 1
      else limits.request_count + 1
    end
  returning request_count, window_started_at
  into current_count, current_window;

  if random() < 0.01 then
    delete from private.ai_rate_limits
    where window_started_at < now() - interval '1 day';
  end if;

  return query
  select
    current_count <= max_requests,
    case
      when current_count <= max_requests then 0
      else greatest(
        ceil(extract(epoch from current_window + window_length - now()))::integer,
        1
      )
    end;
end;
$$;

revoke all on function public.consume_ai_rate_limit(text)
from public, anon, authenticated;

grant execute on function public.consume_ai_rate_limit(text)
to service_role;
