create index if not exists queues_date_department_idx
on public.queues (queue_date, department_id);

create index if not exists tokens_status_joined_at_idx
on public.tokens (status, joined_at);

create index if not exists appointments_date_status_idx
on public.appointments (appointment_date, status);

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
  safe_start date := coalesce(requested_start, current_date - 29);
  safe_end date := coalesce(requested_end, current_date);
  total_patients integer;
  total_hospitals integer;
  total_doctors integer;
  total_departments integer;
  total_appointments integer;
  total_tokens integer;
  waiting_tokens integer;
  called_tokens integer;
  completed_tokens integer;
  skipped_tokens integer;
  cancelled_tokens integer;
  average_wait numeric;
  by_day jsonb;
  by_hour jsonb;
  by_department jsonb;
  recent_tokens jsonb;
begin
  if not (select private.is_admin()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if safe_start > safe_end then
    raise exception 'Analytics start date must not be after end date'
      using errcode = '22023';
  end if;

  if safe_end - safe_start > 366 then
    raise exception 'Analytics range cannot exceed 366 days'
      using errcode = '22023';
  end if;

  select count(*)::integer
  into total_patients
  from public.profiles
  where role = 'patient';

  select count(*) filter (where is_active)::integer
  into total_hospitals
  from public.hospitals;

  select count(*) filter (where is_active)::integer
  into total_doctors
  from public.doctors;

  select count(*) filter (where is_active)::integer
  into total_departments
  from public.departments;

  select count(*)::integer
  into total_appointments
  from public.appointments
  where appointment_date between safe_start and safe_end;

  select
    count(*)::integer,
    count(*) filter (where t.status = 'waiting')::integer,
    count(*) filter (where t.status = 'called')::integer,
    count(*) filter (where t.status = 'completed')::integer,
    count(*) filter (where t.status = 'skipped')::integer,
    count(*) filter (where t.status = 'cancelled')::integer,
    coalesce(
      round(
        avg(
          extract(epoch from (t.called_at - t.joined_at)) / 60.0
        ) filter (
          where t.called_at is not null
            and t.called_at >= t.joined_at
            and t.called_at - t.joined_at <= interval '24 hours'
        ),
        1
      ),
      0
    )
  into
    total_tokens,
    waiting_tokens,
    called_tokens,
    completed_tokens,
    skipped_tokens,
    cancelled_tokens,
    average_wait
  from public.tokens as t
  join public.queues as q on q.id = t.queue_id
  where q.queue_date between safe_start and safe_end;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', series.day::date,
        'tokens', series.tokens,
        'completed', series.completed
      )
      order by series.day
    ),
    '[]'::jsonb
  )
  into by_day
  from (
    select
      days.day,
      count(t.id)::integer as tokens,
      count(t.id) filter (where t.status = 'completed')::integer as completed
    from generate_series(
      safe_start::timestamp,
      safe_end::timestamp,
      interval '1 day'
    ) as days(day)
    left join public.queues as q on q.queue_date = days.day::date
    left join public.tokens as t on t.queue_id = q.id
    group by days.day
  ) as series;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'time', lpad(series.hour::text, 2, '0') || ':00',
        'tokens', series.tokens,
        'completed', series.completed
      )
      order by series.hour
    ),
    '[]'::jsonb
  )
  into by_hour
  from (
    select
      hours.hour,
      count(t.id)::integer as tokens,
      count(t.id) filter (where t.status = 'completed')::integer as completed
    from generate_series(8, 20) as hours(hour)
    left join public.queues as q on q.queue_date = safe_end
    left join public.tokens as t
      on t.queue_id = q.id
      and extract(
        hour from t.joined_at at time zone 'Asia/Kolkata'
      )::integer = hours.hour
    group by hours.hour
  ) as series;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('name', grouped.name, 'value', grouped.value)
      order by grouped.value desc, grouped.name
    ),
    '[]'::jsonb
  )
  into by_department
  from (
    select dep.name, count(t.id)::integer as value
    from public.departments as dep
    join public.queues as q on q.department_id = dep.id
    join public.tokens as t on t.queue_id = q.id
    where q.queue_date between safe_start and safe_end
    group by dep.id, dep.name
  ) as grouped;

  select coalesce(jsonb_agg(to_jsonb(recent)), '[]'::jsonb)
  into recent_tokens
  from (
    select
      t.id,
      t.token_number,
      t.status,
      p.full_name as patient_name,
      dep.name as department_name,
      d.specialization,
      t.joined_at
    from public.tokens as t
    join public.profiles as p on p.id = t.patient_id
    join public.queues as q on q.id = t.queue_id
    join public.departments as dep on dep.id = q.department_id
    join public.doctors as d on d.id = q.doctor_id
    order by t.joined_at desc
    limit 5
  ) as recent;

  return jsonb_build_object(
    'rangeStart', safe_start,
    'rangeEnd', safe_end,
    'generatedAt', now(),
    'totalPatients', total_patients,
    'totalHospitals', total_hospitals,
    'totalDoctors', total_doctors,
    'totalDepartments', total_departments,
    'totalAppointments', total_appointments,
    'totalTokens', total_tokens,
    'waiting', waiting_tokens,
    'called', called_tokens,
    'completed', completed_tokens,
    'skipped', skipped_tokens,
    'cancelled', cancelled_tokens,
    'avgWaitMinutes', average_wait,
    'clearanceRate', case
      when total_tokens = 0 then 0
      else round((completed_tokens::numeric / total_tokens::numeric) * 100, 1)
    end,
    'byDay', by_day,
    'byHour', by_hour,
    'byDepartment', by_department,
    'recentTokens', recent_tokens
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
