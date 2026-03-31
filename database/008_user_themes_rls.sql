-- 008_user_themes_rls.sql
-- Objetivo:
-- Armazenar temas personalizados por usuario com RLS completa.

create table if not exists public.user_themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  primary_color text not null,
  accent_color text not null,
  nav_from text not null,
  nav_via text not null,
  nav_to text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_themes_name_not_empty check (char_length(trim(name)) > 0),
  constraint user_themes_primary_color_hex check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint user_themes_accent_color_hex check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint user_themes_nav_from_hex check (nav_from ~ '^#[0-9A-Fa-f]{6}$'),
  constraint user_themes_nav_via_hex check (nav_via ~ '^#[0-9A-Fa-f]{6}$'),
  constraint user_themes_nav_to_hex check (nav_to ~ '^#[0-9A-Fa-f]{6}$')
);

create unique index if not exists user_themes_unique_name
  on public.user_themes (user_id, lower(name));

create unique index if not exists user_themes_only_one_active
  on public.user_themes (user_id)
  where is_active = true;

create index if not exists user_themes_user_id_idx
  on public.user_themes (user_id);

drop trigger if exists trg_user_themes_updated_at on public.user_themes;
create trigger trg_user_themes_updated_at
before update on public.user_themes
for each row
execute function public.set_updated_at();

alter table public.user_themes enable row level security;

revoke all on table public.user_themes from anon;
revoke all on table public.user_themes from authenticated;

grant select, insert, update, delete on table public.user_themes to authenticated;

drop policy if exists user_themes_select_own on public.user_themes;
create policy user_themes_select_own
on public.user_themes
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = user_themes.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists user_themes_insert_own on public.user_themes;
create policy user_themes_insert_own
on public.user_themes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = user_themes.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists user_themes_update_own on public.user_themes;
create policy user_themes_update_own
on public.user_themes
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = user_themes.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
)
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = user_themes.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists user_themes_delete_own on public.user_themes;
create policy user_themes_delete_own
on public.user_themes
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = user_themes.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);
