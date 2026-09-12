create policy "Patient view own symptom assessments"
on public.symptom_assessments
for select
to authenticated
using ((select auth.uid()) = patient_id);

create policy "Patient insert own symptom assessments"
on public.symptom_assessments
for insert
to authenticated
with check ((select auth.uid()) = patient_id);

create index if not exists symptom_assessments_patient_id_idx
on public.symptom_assessments(patient_id);

create index if not exists symptom_assessments_conversation_id_idx
on public.symptom_assessments(conversation_id);
