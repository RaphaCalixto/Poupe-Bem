# Banco de dados (Supabase)

Arquivos SQL para copiar e colar no **SQL Editor** do Supabase.

## Ordem de execucao

1. Rode [`001_users_dashboard_rls.sql`](./001_users_dashboard_rls.sql).
2. Rode [`002_transactions_rls.sql`](./002_transactions_rls.sql).
3. Rode [`003_goals_rls.sql`](./003_goals_rls.sql).
4. Rode [`004_monthly_plans_rls.sql`](./004_monthly_plans_rls.sql).
5. Rode [`005_recurring_transactions_rls.sql`](./005_recurring_transactions_rls.sql).
6. Rode [`006_investment_positions_rls.sql`](./006_investment_positions_rls.sql).
7. Rode [`007_user_categories_rls.sql`](./007_user_categories_rls.sql).
8. Rode [`008_user_themes_rls.sql`](./008_user_themes_rls.sql).
9. Rode [`009_payment_methods_transactions_recurring.sql`](./009_payment_methods_transactions_recurring.sql).

## O que esse SQL cria

- `public.app_users`: usuario da aplicacao vinculado ao Clerk por `clerk_user_id`.
- `public.dashboard_snapshots`: dados do dashboard por usuario e por mes.
- `public.transactions`: receitas/despesas reais, incluindo parcelamento por competencia.
- `public.transactions.payment_method/card_provider`: forma de pagamento opcional (Pix/Cartão + banco).
- `public.financial_goals`: metas financeiras por usuario.
- `public.monthly_plans`: planejamentos mensais por usuario.
- `public.recurring_transactions`: entradas/saidas recorrentes por usuario.
- `public.recurring_transactions.payment_method/card_provider`: forma de pagamento opcional (Pix/Cartão + banco).
- `public.investment_positions`: carteira de investimentos por usuario.
- `public.user_categories`: categorias personalizadas por usuario.
- `public.user_themes`: temas personalizados por usuario.
- Trigger de `updated_at` automatico.
- RLS completa para garantir isolamento por usuario autenticado.

## Requisito de seguranca

As policies usam `auth.jwt() ->> 'sub'` como id do usuario.
No token que chega ao Supabase, esse `sub` precisa ser o `user.id` do Clerk.
