-- 009_payment_methods_transactions_recurring.sql
-- Requer executar antes: 002_transactions_rls.sql e 005_recurring_transactions_rls.sql
--
-- Adiciona forma de pagamento opcional para:
-- - transacoes
-- - transacoes recorrentes
--
-- Regras:
-- - payment_method: null | 'pix' | 'cartao'
-- - card_provider: obrigatorio somente quando payment_method = 'cartao'

alter table public.transactions
  add column if not exists payment_method text,
  add column if not exists card_provider text;

alter table public.recurring_transactions
  add column if not exists payment_method text,
  add column if not exists card_provider text;

alter table public.transactions
  drop constraint if exists transactions_payment_method_valid;

alter table public.transactions
  add constraint transactions_payment_method_valid
  check (
    payment_method is null
    or payment_method in ('pix', 'cartao')
  );

alter table public.transactions
  drop constraint if exists transactions_card_provider_valid;

alter table public.transactions
  add constraint transactions_card_provider_valid
  check (
    card_provider is null
    or card_provider in (
      'itau',
      'banco_do_brasil',
      'pan',
      'nubank',
      'mercado_pago',
      'c6',
      'santander',
      'bradesco',
      'picpay'
    )
  );

alter table public.transactions
  drop constraint if exists transactions_payment_card_consistency;

alter table public.transactions
  add constraint transactions_payment_card_consistency
  check (
    (payment_method is null and card_provider is null)
    or (payment_method = 'pix' and card_provider is null)
    or (payment_method = 'cartao' and card_provider is not null)
  );

alter table public.recurring_transactions
  drop constraint if exists recurring_transactions_payment_method_valid;

alter table public.recurring_transactions
  add constraint recurring_transactions_payment_method_valid
  check (
    payment_method is null
    or payment_method in ('pix', 'cartao')
  );

alter table public.recurring_transactions
  drop constraint if exists recurring_transactions_card_provider_valid;

alter table public.recurring_transactions
  add constraint recurring_transactions_card_provider_valid
  check (
    card_provider is null
    or card_provider in (
      'itau',
      'banco_do_brasil',
      'pan',
      'nubank',
      'mercado_pago',
      'c6',
      'santander',
      'bradesco',
      'picpay'
    )
  );

alter table public.recurring_transactions
  drop constraint if exists recurring_transactions_payment_card_consistency;

alter table public.recurring_transactions
  add constraint recurring_transactions_payment_card_consistency
  check (
    (payment_method is null and card_provider is null)
    or (payment_method = 'pix' and card_provider is null)
    or (payment_method = 'cartao' and card_provider is not null)
  );
