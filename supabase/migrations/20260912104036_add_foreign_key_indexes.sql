drop index if exists public.doctors_profile_id_idx;
drop index if exists public.queues_doctor_id_idx;
drop index if exists public.tokens_queue_id_idx;

create index if not exists ai_conversations_patient_id_idx
on public.ai_conversations (patient_id);

create index if not exists ai_messages_conversation_id_idx
on public.ai_messages (conversation_id);

create index if not exists appointments_department_id_idx
on public.appointments (department_id);

create index if not exists departments_hospital_id_idx
on public.departments (hospital_id);

create index if not exists doctor_schedules_doctor_id_idx
on public.doctor_schedules (doctor_id);

create index if not exists doctors_department_id_idx
on public.doctors (department_id);

create index if not exists doctors_hospital_id_idx
on public.doctors (hospital_id);

create index if not exists notifications_patient_id_idx
on public.notifications (patient_id);

create index if not exists notifications_token_id_idx
on public.notifications (token_id);

create index if not exists profiles_hospital_id_idx
on public.profiles (hospital_id);

create index if not exists queues_department_id_idx
on public.queues (department_id);

create index if not exists queues_hospital_id_idx
on public.queues (hospital_id);

create index if not exists tokens_appointment_id_idx
on public.tokens (appointment_id);
