begin;

create table public.eligibility_questionnaire_answers (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade ,
    program_code text not null,
    answers jsonb not null default '{}'::jsonb,
    schema_version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint eligibility_questionnaire_program_check
        check (program_code in ('BAT', 'BPT')),

    constraint eligibility_questionnaire_answers_check
        check (jsonb_typeof(answers) = 'object'),

    constraint eligibility_questionnaire_version_check
        check (schema_version > 0),

    constraint eligibility_questionnaire_profile_program_key
        unique (profile_id, program_code)
);

create trigger set_eligibility_questionnaire_updated_at
before update on public.eligibility_questionnaire_answers
for each row execute function public.set_updated_at();

alter table public.eligibility_questionnaire_answers
enable row level security;

-- Select
create policy "Users can view own eligibility questionnaires"
on public.eligibility_questionnaire_answers
for select to authenticated
using (
    exists (
        select 1 from public.profiles p
        where p.id = eligibility_questionnaire_answers.profile_id
        and p.user_id = (select auth.uid())
    )
);

-- Insert
create policy "Users can insert own eligibility questionnaires"
on public.eligibility_questionnaire_answers
for insert to authenticated
with check (
       exists (
           select 1
           from public.profiles p
           where p.id = eligibility_questionnaire_answers.profile_id
            and p.user_id = (select auth.uid())
       )
);

-- Update
create policy "Users can update own eligibility questionnaires"
on public.eligibility_questionnaire_answers
for update to authenticated
using (
    exists (
        select 1
        from public.profiles p
        where p.id = eligibility_questionnaire_answers.profile_id
        and p.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1
        from public.profiles p
        where p.id = eligibility_questionnaire_answers.profile_id
        and p.user_id = (select auth.uid())
    )
);

revoke all
on public.eligibility_questionnaire_answers
from public, anon;

grant select, insert, update
on public.eligibility_questionnaire_answers
to authenticated;

comment on table public.eligibility_questionnaire_answers is
'Stores applicant-provided BAT and BPT eligibility questionnaire answers.';

comment on column public.eligibility_questionnaire_answers.profile_id is
'References the applicant profile.';

comment on column public.eligibility_questionnaire_answers.program_code is
'External JKM program code, currently BAT or BPT.';

comment on column public.eligibility_questionnaire_answers.answers is
'Applicant-provided questionnaire answers stored as JSONB.';

comment on column public.eligibility_questionnaire_answers.schema_version is
'Questionnaire answer structure version.';

commit;
