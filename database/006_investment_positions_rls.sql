-- 006_investment_positions_rls.sql
-- Requer executar antes: 001_users_dashboard_rls.sql
--
-- Tabela para armazenar posicoes de investimentos por usuario com RLS.

create table if not exists public.investment_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  type text not null
    check (type in ('acoes', 'criptomoedas', 'fiis', 'renda_fixa', 'fundos', 'outros')),
  invested_amount numeric(14, 2) not null check (invested_amount > 0),
  current_value numeric(14, 2) not null check (current_value >= 0),
  start_date date not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_investment_positions_user_active
  on public.investment_positions (user_id, is_active, start_date desc);

create index if not exists idx_investment_positions_user_type
  on public.investment_positions (user_id, type);

drop trigger if exists trg_investment_positions_updated_at on public.investment_positions;
create trigger trg_investment_positions_updated_at
before update on public.investment_positions
for each row
execute function public.set_updated_at();

alter table public.investment_positions enable row level security;

revoke all on table public.investment_positions from anon;
revoke all on table public.investment_positions from authenticated;
grant select, insert, update, delete on table public.investment_positions to authenticated;

drop policy if exists investment_positions_select_own on public.investment_positions;
create policy investment_positions_select_own
on public.investment_positions
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = investment_positions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists investment_positions_insert_own on public.investment_positions;
create policy investment_positions_insert_own
on public.investment_positions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = investment_positions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists investment_positions_update_own on public.investment_positions;
create policy investment_positions_update_own
on public.investment_positions
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = investment_positions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
)
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = investment_positions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists investment_positions_delete_own on public.investment_positions;
create policy investment_positions_delete_own
on public.investment_positions
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = investment_positions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);
