begin;

-- 1. Add education fields to profiles
-- Reason: The registered user's employment information is already stored in profiles but education information is missing.
-- These columns allow the registered user to provide the same education details as other household members.
-- All columns are nullable because education information is optional and NULL means "Not Provided".
-- Existing profile records will not be affected.
alter table public.profiles
add column if not exists is_student boolean,
add column if not exists study_mode text,
add column if not exists institution_type text;

-- 2. Standardize employment status in profiles
-- Reason: profiles currently supports "not_working" while the Add Household Member form supports "homemaker".
-- Wanted both the registered user and household members to support the same employment status options.
-- Keep "not_working" to preserve existing records. Add "homemaker" to support household responsibilities.
-- No existing employment status values will be changed.
alter table public.profiles
drop constraint if exists profile_employment_status_check;

alter table public.profiles
add constraint profile_employment_status_check
check (
    employment_status is null
    or employment_status in (
        'employed',
        'self_employed',
        'unemployed',
        'retired',
        'homemaker',
        'not_working'
    )
);

-- 3. Standardize employment status in household_members
-- Reason: household_members currently has no CHECK constraint restricting employment_status values.
-- This constraint ensures both tables accept the same employment status values and prevents invalid values from
-- being stored. NULL remains allowed because employment is optional.
alter table public.household_members
add constraint household_members_employment_status_check
check (
    employment_status is null
    or employment_status in (
        'employed',
        'self_employed',
        'unemployed',
        'retired',
        'homemaker',
        'not_working'
    )
);

commit;
