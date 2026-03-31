-- 001_users_dashboard_rls.sql
-- Objetivo:
-- 1) Criar tabela de usuarios da aplicacao vinculada ao Clerk (clerk_user_id)
-- 2) Criar tabela de dados de dashboard isolada por usuario
-- 3) Aplicar RLS para cada usuario acessar somente os proprios dados
--
-- IMPORTANTE:
-- Esta RLS assume que o JWT enviado ao Supabase contem o claim "sub"
-- com o user id do Clerk.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '');
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint app_users_clerk_user_id_not_empty check (char_length(clerk_user_id) > 0)
);

create table if not exists public.dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  ref_month date not null,
  total_balance numeric(12, 2) not null default 0,
  total_income numeric(12, 2) not null default 0,
  total_expense numeric(12, 2) not null default 0,
  savings_goal_percent numeric(5, 2) not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint dashboard_snapshots_goal_percent check (
    savings_goal_percent >= 0 and savings_goal_percent <= 100
  ),
  constraint dashboard_snapshots_unique_month unique (user_id, ref_month)
);

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_dashboard_snapshots_updated_at on public.dashboard_snapshots;
create trigger trg_dashboard_snapshots_updated_at
before update on public.dashboard_snapshots
for each row
execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.dashboard_snapshots enable row level security;

-- Remove acesso publico
revoke all on table public.app_users from anon;
revoke all on table public.dashboard_snapshots from anon;
revoke all on table public.app_users from authenticated;
revoke all on table public.dashboard_snapshots from authenticated;

grant select, insert, update, delete on table public.app_users to authenticated;
grant select, insert, update, delete on table public.dashboard_snapshots to authenticated;

drop policy if exists app_users_select_own on public.app_users;
create policy app_users_select_own
on public.app_users
for select
to authenticated
using (clerk_user_id = public.current_clerk_user_id());

drop policy if exists app_users_insert_own on public.app_users;
create policy app_users_insert_own
on public.app_users
for insert
to authenticated
with check (clerk_user_id = public.current_clerk_user_id());

drop policy if exists app_users_update_own on public.app_users;
create policy app_users_update_own
on public.app_users
for update
to authenticated
using (clerk_user_id = public.current_clerk_user_id())
with check (clerk_user_id = public.current_clerk_user_id());

drop policy if exists app_users_delete_own on public.app_users;
create policy app_users_delete_own
on public.app_users
for delete
to authenticated
using (clerk_user_id = public.current_clerk_user_id());

drop policy if exists dashboard_select_own on public.dashboard_snapshots;
create policy dashboard_select_own
on public.dashboard_snapshots
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = dashboard_snapshots.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists dashboard_insert_own on public.dashboard_snapshots;
create policy dashboard_insert_own
on public.dashboard_snapshots
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = dashboard_snapshots.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists dashboard_update_own on public.dashboard_snapshots;
create policy dashboard_update_own
on public.dashboard_snapshots
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = dashboard_snapshots.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
)
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = dashboard_snapshots.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists dashboard_delete_own on public.dashboard_snapshots;
create policy dashboard_delete_own
on public.dashboard_snapshots
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = dashboard_snapshots.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);
