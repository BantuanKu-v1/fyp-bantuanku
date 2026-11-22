begin;

create table if not exists public.external_application_submissions (
    id uuid primary key default gen_random_uuid(),
    application_id uuid not null references public.applications(id) on delete cascade,
    provider text not null check (provider in ('str', 'jkm')),
    external_application_id text not null,
    provider_application_id text,
    reference_no text,
    provider_status text,
    submission_state text not null default 'pending'
    check (
        submission_state in (
            'pending',
            'submitted',
            'failed',
            'unknown'
        )
    ),
    submitted_at timestamptz,
    last_synced_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint unique_application_provider unique (application_id, provider),
    constraint unique_provider_external_id unique (provider, external_application_id),
    constraint unique_provider_application_id unique (provider, provider_application_id),
    constraint valid_external_application_id check (length(trim(external_application_id)) > 0),
    constraint valid_provider_application_id
    check (
        provider_application_id is null
        or length(trim(provider_application_id)) > 0
    ),

    constraint valid_reference_no
    check (
        reference_no is null
        or length(trim(reference_no)) > 0
    )
);

create index if not exists idx_external_submissions_state
on public.external_application_submissions(submission_state);

create index if not exists idx_external_submissions_provider_status
on public.external_application_submissions(provider,provider_status);

alter table public.external_application_submissions
enable row level security;

create policy "Users can view own external submissions"
on public.external_application_submissions
for select
    to authenticated
    using (
    exists (
    select 1
    from public.applications as a
    inner join public.profiles as p
    on p.id = a.profile_id
    where a.id =
    external_application_submissions.application_id
    and p.user_id = (select auth.uid())
    )
);

create or replace function
public.update_external_submission_timestamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
return new;
end;
$$;

create trigger trg_external_submission_updated_at
    before update
    on public.external_application_submissions
    for each row
    execute function
        public.update_external_submission_timestamp();

comment on table public.external_application_submissions
is 'Tracks bantuanku submissions to external str and jkm mock APIs.';

comment on column
public.external_application_submissions.external_application_id
is 'Stable idempotency identifier sent to the external api.';

comment on column
public.external_application_submissions.provider_application_id
is 'Application id returned by the external provider.';

comment on column
public.external_application_submissions.provider_status
is 'Latest processing status returned by the external provider.';

comment on column
public.external_application_submissions.submission_state
is 'Local submission state: pending, submitted, failed, or unknown.';

commit;
