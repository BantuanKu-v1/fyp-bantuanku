insert into public.applications (
    profile_id,
    program_id,
    status,
    current_step
)
select
    '60262d34-ae5a-43aa-965e-dcad5ded46b0'::uuid,
    ap.id,
    'ready_for_review',
    'review'
from public.aid_programs ap
where lower(ap.code) = 'str'
  and not exists (
        select 1
        from public.applications a
        where a.profile_id =
        '60262d34-ae5a-43aa-965e-dcad5ded46b0'::uuid
        and a.program_id = ap.id
  )
returning id, profile_id, program_id, status;
