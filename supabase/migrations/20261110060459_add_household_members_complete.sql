-- Track whether an applicant has confirmed their household member list
alter table public.profiles
add column household_members_complete boolean default null;

comment on column public.profiles.household_members_complete is
'Whether the applicant has confirmed that all household members are listed. NULL means unconfirmed.';

-- Invalidate household confirmation when household members change
create or replace function public.invalidate_household_members_complete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if tg_op = 'INSERT' then
       update public.profiles
       set household_members_complete = null
       where id = new.profile_id;

    elsif tg_op = 'DELETE' then
          update public.profiles
          set household_members_complete = null
          where id = old.profile_id;

    elsif tg_op = 'UPDATE' then
          update public.profiles
          set household_members_complete = null
          where id = old.profile_id;

          if new.profile_id is distinct from old.profile_id then
             update public.profiles
             set household_members_complete = null
             where id = new.profile_id;
          end if;
    end if;

    return null;
end;
$$;

create trigger trg_invalidate_household_members_complete
after insert or update or delete
on public.household_members
for each row
execute function public.invalidate_household_members_complete();
