-- Add optional locale to user_profiles for UI language preference
alter table public.user_profiles
  add column if not exists locale text check (locale in ('ar','en')) default 'ar';

