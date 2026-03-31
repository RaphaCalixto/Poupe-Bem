-- 003_goals_rls.sql
-- Requer executar antes: 001_users_dashboard_rls.sql
--
-- Tabela para armazenar metas financeiras por usuario com RLS.

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0 check (current_amount >= 0),
  target_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_financial_goals_user_target_date
  on public.financial_goals (user_id, target_date desc);

drop trigger if exists trg_financial_goals_updated_at on public.financial_goals;
create trigger trg_financial_goals_updated_at
before update on public.financial_goals
for each row
execute function public.set_updated_at();

alter table public.financial_goals enable row level security;

revoke all on table public.financial_goals from anon;
revoke all on table public.financial_goals from authenticated;
grant select, insert, update, delete on table public.financial_goals to authenticated;

drop policy if exists financial_goals_select_own on public.financial_goals;
create policy financial_goals_select_own
on public.financial_goals
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = financial_goals.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists financial_goals_insert_own on public.financial_goals;
create policy financial_goals_insert_own
on public.financial_goals
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = financial_goals.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists financial_goals_update_own on public.financial_goals;
create policy financial_goals_update_own
on public.financial_goals
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = financial_goals.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
)
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = financial_goals.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists financial_goals_delete_own on public.financial_goals;
create policy financial_goals_delete_own
on public.financial_goals
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = financial_goals.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);
