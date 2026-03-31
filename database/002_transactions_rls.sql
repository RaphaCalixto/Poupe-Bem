-- 002_transactions_rls.sql
-- Requer executar antes: 001_users_dashboard_rls.sql
--
-- Tabela para armazenar receitas/despesas reais (incluindo parcelamentos)
-- com isolamento de dados por usuario via RLS.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  group_id uuid not null default gen_random_uuid(),
  type text not null check (type in ('receita', 'despesa')),
  category_key text not null,
  category_label text not null,
  description text,
  amount numeric(12, 2) not null check (amount > 0),
  entry_date date not null,
  first_installment_date date not null,
  installment_number integer not null default 1 check (installment_number >= 1),
  installment_count integer not null default 1 check (installment_count >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint transactions_installment_consistency
    check (installment_number <= installment_count)
);

create index if not exists idx_transactions_user_date
  on public.transactions (user_id, entry_date desc);

create index if not exists idx_transactions_group
  on public.transactions (group_id, installment_number);

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

alter table public.transactions enable row level security;

revoke all on table public.transactions from anon;
revoke all on table public.transactions from authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;

drop policy if exists transactions_select_own on public.transactions;
create policy transactions_select_own
on public.transactions
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = transactions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists transactions_insert_own on public.transactions;
create policy transactions_insert_own
on public.transactions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = transactions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists transactions_update_own on public.transactions;
create policy transactions_update_own
on public.transactions
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = transactions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
)
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = transactions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists transactions_delete_own on public.transactions;
create policy transactions_delete_own
on public.transactions
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = transactions.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);
