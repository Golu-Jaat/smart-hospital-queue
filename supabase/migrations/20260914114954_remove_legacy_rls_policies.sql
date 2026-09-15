drop policy if exists "Patient insert conversations"
on public.ai_conversations;
drop policy if exists "Patient view own conversations"
on public.ai_conversations;

drop policy if exists "Patient insert messages"
on public.ai_messages;
drop policy if exists "Patient view own messages"
on public.ai_messages;

drop policy if exists "Patient insert appointments"
on public.appointments;
drop policy if exists "Patient view own appointments"
on public.appointments;

drop policy if exists "Admin manage departments"
on public.departments;
drop policy if exists "Public read departments"
on public.departments;

drop policy if exists "Admin manage schedules"
on public.doctor_schedules;
drop policy if exists "Public read schedules"
on public.doctor_schedules;

drop policy if exists "Admin manage doctors"
on public.doctors;
drop policy if exists "Public read doctors"
on public.doctors;

drop policy if exists "Admin manage hospitals"
on public.hospitals;
drop policy if exists "Public read hospitals"
on public.hospitals;

drop policy if exists "Insert notifications"
on public.notifications;
drop policy if exists "Patient view own notifications"
on public.notifications;
drop policy if exists "Update notifications"
on public.notifications;

drop policy if exists "Users insert own profile"
on public.profiles;
drop policy if exists "Users update own profile"
on public.profiles;
drop policy if exists "Users view own profile"
on public.profiles;

drop policy if exists "Admin manage queues"
on public.queues;
drop policy if exists "Public read queues"
on public.queues;

drop policy if exists "Patient insert tokens"
on public.tokens;
drop policy if exists "Patient view own tokens"
on public.tokens;
drop policy if exists "Public read tokens"
on public.tokens;
drop policy if exists "Update tokens"
on public.tokens;

create policy ai_rate_limits_no_client_access
on private.ai_rate_limits
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
