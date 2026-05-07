-- 010_user_theme_gradient_direction.sql
-- Objetivo:
-- Permitir que temas personalizados salvem a direção do degradê.

alter table public.user_themes
  add column if not exists gradient_direction text not null default 'to-bottom';

alter table public.user_themes
  drop constraint if exists user_themes_gradient_direction_valid;

alter table public.user_themes
  add constraint user_themes_gradient_direction_valid
  check (
    gradient_direction in (
      'to-bottom',
      'to-right',
      'to-br',
      'to-bl',
      'to-tr',
      'to-tl'
    )
  );
