begin;
alter table public.external_application_submissions
enable row level security;

grant select
on table public.external_application_submissions
to authenticated;

revoke truncate, trigger, references
on table public.external_application_submissions
from anon, authenticated;

commit;
