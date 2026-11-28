create or replace function public.save_jkm_application_data(
    p_application_id uuid,
    p_jkm_application jsonb
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
v_application_status text;
    v_program_code text;
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;

    select
        a.status::text,
        upper(trim(ap.code))
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

    if v_program_code not in (
        'BA',
        'BAT',
        'BPT',
        'BWE'
    ) then
         raise exception 'Unsupported JKM program';
    end if;

    if v_application_status not in (
        'draft',
        'in_progress',
        'ready_for_review'
    ) then
        raise exception 'JKM application data cannot be modified';
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
        raise exception 'JKM application data is locked by an external submission';
    end if;

    if p_jkm_application is null
        or jsonb_typeof(p_jkm_application)
            is distinct from 'object'
    then
        raise exception 'Invalid JKM application data';
    end if;

    if (p_jkm_application -> 'schemaVersion')
        is distinct from '1'::jsonb
        then
            raise exception 'Unsupported JKM application schema version';
    end if;

    if jsonb_typeof(
         p_jkm_application -> 'programCode'
    ) is distinct from 'string'
        or coalesce(
             p_jkm_application ->> 'programCode',
            ''
        ) not in (
            'BA',
            'BAT',
            'BPT',
            'BWE'
        )
        then
            raise exception 'Invalid JKM application program';
    end if;

    if (p_jkm_application ->> 'programCode')
        is distinct from v_program_code
    then
        raise exception 'JKM application program mismatch';
    end if;

    if jsonb_typeof(
        p_jkm_application -> 'programSpecificData'
    ) is distinct from 'object'
        then
            raise exception 'Invalid JKM program-specific data';
    end if;

    if octet_length(p_jkm_application::text) > 65536 then
         raise exception 'JKM application data exceeds the permitted size';
    end if;

    if exists (
        select 1
        from public.application_data
        where application_id = p_application_id
            and jsonb_typeof(data)
            is distinct from 'object'
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
                'jkmApplication',
                jsonb_build_object(
                        'schemaVersion',
                        1,
                        'programCode',
                        v_program_code,
                        'programSpecificData',
                        p_jkm_application -> 'programSpecificData'
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

revoke all on function
public.save_jkm_application_data(uuid, jsonb)
from public, anon, authenticated;

grant execute on function
public.save_jkm_application_data(uuid, jsonb)
to authenticated;
