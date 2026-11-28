create or replace function public.save_application_preliminary_eligibility(
    p_application_id uuid,
    p_snapshot jsonb
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
v_application_status text;
    v_program_code text;
    v_assessed_at timestamptz;
begin
    if auth.uid() is null then
     raise exception 'Authentication required';
end if;

select
    a.status::text,
    upper(ap.code)
into
    v_application_status,
    v_program_code
from public.applications a
         join public.profiles p
         on p.id = a.profile_id
         join public.aid_programs ap
         on ap.id = a.program_id
where a.id = p_application_id
  and p.user_id = auth.uid()
  for update of a;

if not found then
raise exception 'Application not found or access denied';
end if;

if v_application_status not in (
    'draft',
    'in_progress',
    'ready_for_review'
) then
raise exception 'Preliminary eligibility cannot be modified for this application';
end if;

if exists (
    select 1
    from public.external_application_submissions
    where application_id = p_application_id
    and submission_state in (
        'pending',
        'unknown',
        'submitted'
    )
) then
    raise exception 'Preliminary eligibility is locked by an external submission';
end if;

if p_snapshot is null
    or jsonb_typeof(p_snapshot) is distinct from 'object'
then
    raise exception 'Invalid preliminary eligibility snapshot';
end if;

if jsonb_typeof(p_snapshot -> 'programCode')
    is distinct from 'string'
    or coalesce(p_snapshot ->> 'programCode', '') not in (
        'BA',
        'BAT',
        'BPT',
        'BWE',
        'STR'
    )
then
raise exception 'Unsupported eligibility program';
end if;

if (p_snapshot ->> 'programCode')
    is distinct from v_program_code
then
    raise exception 'Eligibility assessment program mismatch';
end if;

if jsonb_typeof(p_snapshot -> 'status')
    is distinct from 'string'
    or coalesce(p_snapshot ->> 'status', '') not in (
        'potentially_eligible',
        'potentially_ineligible',
        'insufficient_information',
        'manual_verification'
    )
then
    raise exception 'Invalid preliminary eligibility status';
end if;

if jsonb_typeof(p_snapshot -> 'criteriaVersion')
    is distinct from 'number'
    or coalesce(p_snapshot ->> 'criteriaVersion', '')
        !~ '^[1-9][0-9]*$'
    then
    raise exception 'Invalid eligibility criteria version';
end if;

if (p_snapshot ->> 'criteriaVersion')::numeric
    > 9007199254740991
then
raise exception 'Invalid eligibility criteria version';
end if;

if jsonb_typeof(p_snapshot -> 'assessedAt')
    is distinct from 'string'
    or coalesce(p_snapshot ->> 'assessedAt', '')
    !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$'
then
    raise exception 'Invalid eligibility assessment timestamp';
end if;

begin
v_assessed_at :=
(p_snapshot ->> 'assessedAt')::timestamptz;
exception
        when others then
        raise exception 'Invalid eligibility assessment timestamp';
end;

if exists (
    select 1
    from public.application_data
    where application_id = p_application_id
    and jsonb_typeof(data) is distinct from 'object'
) then
    raise exception 'Invalid existing application data';
end if;

insert into public.application_data (
    application_id,
    data
)
values (
    p_application_id,
    jsonb_build_object(
            'preliminaryEligibility',
            jsonb_build_object(
                    'programCode',
                    p_snapshot ->> 'programCode',
                    'status',
                    p_snapshot ->> 'status',
                    'criteriaVersion',
                    p_snapshot -> 'criteriaVersion',
                    'assessedAt',
                    p_snapshot ->> 'assessedAt'
            )
    )
)
    on conflict (application_id)
    do update
    set
        data = public.application_data.data
    || excluded.data,
    updated_at = now();

end;
$function$;

revoke all
    on function public.save_application_preliminary_eligibility(
    uuid,
    jsonb
    )
    from public, anon;

grant execute
on function public.save_application_preliminary_eligibility(
    uuid,
    jsonb
)
to authenticated;

create or replace function public.claim_external_submission(
    p_application_id uuid,
    p_provider text
)
returns setof public.external_application_submissions
language plpgsql
set search_path to ''
as $function$
begin
    if p_provider is null
        or p_provider not in ('str', 'jkm')
    then
        raise exception 'invalid external provider';
end if;

    perform 1
    from public.applications
    where id = p_application_id
    for update;

if not found then
        raise exception 'application not found';
end if;

return query
    insert into public.external_application_submissions (
            application_id,
            provider,
            external_application_id,
            submission_state
        )
        values (
            p_application_id,
            p_provider,
            p_application_id::text,
            'pending'
        )
        on conflict on constraint unique_application_provider
        do update
    set
        submission_state = 'pending',
    updated_at = now()
where public.external_application_submissions.submission_state = 'failed'
    and public.external_application_submissions.external_application_id =
    excluded.external_application_id
    returning *;
end;
$function$;

revoke all
    on function public.claim_external_submission(
    uuid,
    text
    )
    from public, anon, authenticated;

grant execute
on function public.claim_external_submission(
    uuid,
    text
)
to service_role;
