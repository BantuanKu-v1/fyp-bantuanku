-- Remove the redundant employment status constraint
-- The remaining profile_employment_status_check allows: employed, self_employed, unemployed, retired, homemaker, not_working
alter table public.profiles
drop constraint if exists profile_employment_status_check;
