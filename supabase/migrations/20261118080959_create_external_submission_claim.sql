create or replace function public.claim_external_submission(
  p_application_id uuid,
  p_provider text
)
returns setof public.external_application_submissions
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_provider not in ('str', 'jkm') then
    raise exception 'invalid external provider';
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
    set submission_state = 'pending',
    updated_at = now()
    where public.external_application_submissions.submission_state = 'failed'
    and public.external_application_submissions.external_application_id =
    excluded.external_application_id
    returning *;
end;
$$;

revoke all on function public.claim_external_submission(uuid, text)
from public, anon, authenticated;

grant execute on function public.claim_external_submission(uuid, text)
to service_role;
