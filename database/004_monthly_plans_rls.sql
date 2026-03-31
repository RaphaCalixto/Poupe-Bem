-- 004_monthly_plans_rls.sql
-- Requer executar antes: 001_users_dashboard_rls.sql
--
-- Tabela para armazenar planejamentos mensais por usuario com RLS.

create table if not exists public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  month_key text not null
    check (month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  category_key text not null default 'all_expenses',
  planned_amount numeric(12, 2) not null check (planned_amount > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_monthly_plans_user_month
  on public.monthly_plans (user_id, month_key desc);

drop trigger if exists trg_monthly_plans_updated_at on public.monthly_plans;
create trigger trg_monthly_plans_updated_at
before update on public.monthly_plans
for each row
execute function public.set_updated_at();

alter table public.monthly_plans enable row level security;

revoke all on table public.monthly_plans from anon;
revoke all on table public.monthly_plans from authenticated;
grant select, insert, update, delete on table public.monthly_plans to authenticated;

drop policy if exists monthly_plans_select_own on public.monthly_plans;
create policy monthly_plans_select_own
on public.monthly_plans
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = monthly_plans.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists monthly_plans_insert_own on public.monthly_plans;
create policy monthly_plans_insert_own
on public.monthly_plans
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = monthly_plans.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists monthly_plans_update_own on public.monthly_plans;
create policy monthly_plans_update_own
on public.monthly_plans
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = monthly_plans.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
)
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = monthly_plans.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists monthly_plans_delete_own on public.monthly_plans;
create policy monthly_plans_delete_own
on public.monthly_plans
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = monthly_plans.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);
