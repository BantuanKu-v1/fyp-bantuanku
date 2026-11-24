create or replace function public.protect_application_preliminary_eligibility()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $function$
begin
    if current_user in ('postgres', 'service_role') then
        if tg_op = 'DELETE' then
            return old;
end if;

return new;
end if;

    if tg_op = 'INSERT' then
        if new.data ? 'preliminaryEligibility' then
            raise exception
                'Preliminary eligibility must be saved through the designated RPC';
end if;

return new;
end if;

    if tg_op = 'UPDATE' then
        if (old.data -> 'preliminaryEligibility')
            is distinct from
            (new.data -> 'preliminaryEligibility')
        then
            raise exception
                'Preliminary eligibility must be modified through the designated RPC';
end if;

        if old.application_id is distinct from new.application_id
            and old.data ? 'preliminaryEligibility'
        then
            raise exception
                'Preliminary eligibility cannot be transferred to another application';
end if;

return new;
end if;

    if tg_op = 'DELETE' then
        if old.data ? 'preliminaryEligibility' then
            raise exception
                'Application data containing preliminary eligibility cannot be directly deleted';
end if;

return old;
end if;

return null;
end;
$function$;

drop trigger if exists protect_application_preliminary_eligibility
on public.application_data;

create trigger protect_application_preliminary_eligibility
    before insert or update or delete
on public.application_data
    for each row
    execute function public.protect_application_preliminary_eligibility();

revoke all
    on function public.protect_application_preliminary_eligibility()
    from public, anon, authenticated;
