begin;

-- Applicant student information
do $$
begin
    if not exists (
       select 1 from pg_constraint
       where conrelid = 'public.profiles'::regclass
       and conname = 'profiles_study_mode_check'
    ) then
       alter table public.profiles
       add constraint profiles_study_mode_check
       check (study_mode is null or study_mode in ('full_time', 'part_time'));
    end if;

    if not exists (
       select 1 from pg_constraint
       where conrelid = 'public.profiles'::regclass
       and conname = 'profiles_institution_type_check'
    ) then
       alter table public.profiles
       add constraint profiles_institution_type_check
       check (institution_type is null or institution_type in ('ipta', 'ipts', 'school', 'other'));
    end if;

    if not exists (
       select 1 from pg_constraint
       where conrelid = 'public.profiles'::regclass
       and conname = 'profiles_student_consistency_check'
    ) then
       alter table public.profiles
       add constraint profiles_student_consistency_check
       check (is_student is distinct from false or (study_mode is null and institution_type is null));
    end if;
end $$;

-- Household member student information
do $$
begin
    if not exists (
       select 1 from pg_constraint
       where conrelid = 'public.household_members'::regclass
       and conname = 'household_members_study_mode_check'
    ) then
       alter table public.household_members
       add constraint household_members_study_mode_check
       check (study_mode is null or study_mode in ('full_time', 'part_time'));
    end if;

    if not exists (
       select 1 from pg_constraint
       where conrelid = 'public.household_members'::regclass
       and conname = 'household_members_institution_type_check'
    ) then
       alter table public.household_members
       add constraint household_members_institution_type_check
       check (institution_type is null or institution_type in ('ipta', 'ipts', 'school', 'other'));
    end if;

    if not exists (
       select 1 from pg_constraint
       where conrelid = 'public.household_members'::regclass
       and conname = 'household_members_student_consistency_check'
    ) then
       alter table public.household_members
       add constraint household_members_student_consistency_check
       check (is_student is distinct from false or (study_mode is null and institution_type is null));
    end if;
end $$;

commit;
