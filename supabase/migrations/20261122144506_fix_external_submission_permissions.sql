grant usage on schema public to service_role;

grant select, insert, update
on table public.external_application_submissions
to service_role;

grant execute
on function public.claim_external_submission(uuid, text)
to service_role;
