alter table public.doctors
add column if not exists display_name text;

update public.doctors as d
set display_name = coalesce(nullif(btrim(p.full_name), ''), d.specialization, 'Doctor')
from public.profiles as p
where p.id = d.profile_id
  and d.display_name is null;

create or replace function private.set_doctor_display_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(nullif(btrim(p.full_name), ''), new.specialization, 'Doctor')
  into new.display_name
  from public.profiles as p
  where p.id = new.profile_id;

  new.display_name := coalesce(new.display_name, new.specialization, 'Doctor');
  return new;
end;
$$;

create or replace function private.sync_doctor_display_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.doctors
  set display_name = coalesce(nullif(btrim(new.full_name), ''), specialization, 'Doctor')
  where profile_id = new.id;

  return new;
end;
$$;

drop trigger if exists set_doctor_display_name_on_write on public.doctors;
create trigger set_doctor_display_name_on_write
before insert or update of profile_id, specialization
on public.doctors
for each row
execute function private.set_doctor_display_name();

drop trigger if exists sync_doctor_display_name_on_profile_update on public.profiles;
create trigger sync_doctor_display_name_on_profile_update
after update of full_name
on public.profiles
for each row
when (old.full_name is distinct from new.full_name)
execute function private.sync_doctor_display_name();

revoke all on function private.set_doctor_display_name()
from public, anon, authenticated;

revoke all on function private.sync_doctor_display_name()
from public, anon, authenticated;
