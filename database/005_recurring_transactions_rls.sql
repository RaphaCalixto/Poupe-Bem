-- 005_recurring_transactions_rls.sql
-- Requer executar antes: 001_users_dashboard_rls.sql
--
-- Tabela para armazenar transacoes recorrentes por usuario com RLS.

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('receita', 'despesa')),
  category_key text not null,
  amount numeric(12, 2) not null check (amount > 0),
  frequency text not null check (frequency in ('semanal', 'quinzenal', 'mensal', 'anual')),
  next_due_date date not null,
  is_active boolean not null default true,
  description text,
  last_executed_at date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_recurring_transactions_user_due
  on public.recurring_transactions (user_id, is_active, next_due_date);

create index if not exists idx_recurring_transactions_user_type
  on public.recurring_transactions (user_id, type);

drop trigger if exists trg_recurring_transactions_updated_at on public.recurring_transactions;
create trigger trg_recurring_transactions_updated_at
before update on public.recurring_transactions
for each row
execute function public.set_updated_at();

alter table public.recurring_transactions enable row level security;

revoke all on table public.recurring_transactions from anon;
revoke all on table public.recurring_transactions from authenticated;
grant select, insert, update, delete on table public.recurring_transactions to authenticated;

drop policy if exists recurring_transactions_select_own on public.recurring_transactions;
create policy recurring_transactions_select_own
on public.recurring_transactions
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = recurring_transactions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists recurring_transactions_insert_own on public.recurring_transactions;
create policy recurring_transactions_insert_own
on public.recurring_transactions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = recurring_transactions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists recurring_transactions_update_own on public.recurring_transactions;
create policy recurring_transactions_update_own
on public.recurring_transactions
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = recurring_transactions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
)
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = recurring_transactions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists recurring_transactions_delete_own on public.recurring_transactions;
create policy recurring_transactions_delete_own
on public.recurring_transactions
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = recurring_transactions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);
