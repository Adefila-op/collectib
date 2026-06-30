alter table public.profiles
  add column if not exists gender text,
  add column if not exists dashboard_type text not null default 'collector';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_gender_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_gender_check
      check (gender is null or gender in ('female', 'male', 'non_binary', 'prefer_not_to_say'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_dashboard_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_dashboard_type_check
      check (dashboard_type in ('collector', 'artist'));
  end if;
end $$;

alter table public.artworks
  drop constraint if exists artworks_artist_id_fkey;

alter table public.artworks
  add constraint artworks_artist_id_fkey
  foreign key (artist_id)
  references public.artists(id);

notify pgrst, 'reload schema';
