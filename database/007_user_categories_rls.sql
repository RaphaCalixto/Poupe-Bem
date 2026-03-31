-- 007_user_categories_rls.sql
-- Objetivo:
-- Armazenar categorias personalizadas por usuario com RLS completa.

create table if not exists public.user_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  type text not null check (type in ('receita', 'despesa')),
  label text not null,
  emoji text not null,
  icon_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_categories_label_not_empty check (char_length(trim(label)) > 0),
  constraint user_categories_emoji_not_empty check (char_length(trim(emoji)) > 0)
);

create unique index if not exists user_categories_unique_label_per_type
  on public.user_categories (user_id, type, lower(label));

create index if not exists user_categories_user_id_idx
  on public.user_categories (user_id);

drop trigger if exists trg_user_categories_updated_at on public.user_categories;
create trigger trg_user_categories_updated_at
before update on public.user_categories
for each row
execute function public.set_updated_at();

alter table public.user_categories enable row level security;

revoke all on table public.user_categories from anon;
revoke all on table public.user_categories from authenticated;

grant select, insert, update, delete on table public.user_categories to authenticated;

drop policy if exists user_categories_select_own on public.user_categories;
create policy user_categories_select_own
on public.user_categories
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = user_categories.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists user_categories_insert_own on public.user_categories;
create policy user_categories_insert_own
on public.user_categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = user_categories.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists user_categories_update_own on public.user_categories;
create policy user_categories_update_own
on public.user_categories
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = user_categories.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
)
with check (
  exists (
    select 1
    from public.app_users u
    where u.id = user_categories.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);

drop policy if exists user_categories_delete_own on public.user_categories;
create policy user_categories_delete_own
on public.user_categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_users u
    where u.id = user_categories.user_id
      and u.clerk_user_id = public.current_clerk_user_id()
  )
);
