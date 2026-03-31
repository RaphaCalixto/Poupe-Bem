# Poupe Bem

Aplicação web de gestão financeira pessoal com autenticação Clerk, interface em React + Tailwind e estrutura pronta para evolução com Supabase.

## Como o projeto funciona

1. Usuário entra com Clerk (login/cadastro).
2. Após login, acessa o dashboard com:
   - resumo mensal (saldo, receitas, despesas),
   - gráfico de evolução,
   - transações com filtros,
   - metas,
   - planejamento,
   - recorrentes,
   - investimentos,
   - relatórios com exportação em PDF.
3. Em **Personalização**, o usuário:
   - cria categorias próprias (emoji ou ícone),
   - cria/aplica temas de cor.
4. Dados locais são persistidos em `localStorage` (versão atual) e já existem scripts SQL com RLS para levar ao Supabase.

## Linguagens, libs e frameworks

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Clerk (`@clerk/react`)
- Supabase client (`@supabase/supabase-js`)
- Recharts (gráficos)
- jsPDF + html2canvas (PDF com gráfico como imagem)
- Lucide React + React Icons
- shadcn/ui base (`Button`, `Card`) e utilitários

## Requisitos para rodar localmente

- Node.js 20+ (recomendado)
- npm 10+

## Configuração de ambiente (`.env`)

Crie/edite o arquivo `.env` na raiz:

```env
VITE_CLERK_PUBLISHABLE_KEY=SEU_CLERK_PUBLISHABLE_KEY
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SEU_SUPABASE_PUBLISHABLE_KEY
```

## Rodando localmente

```bash
npm install
npm run dev
```

Aplicação: `http://localhost:5173`

## Scripts

- `npm run dev` inicia ambiente de desenvolvimento.
- `npm run build` gera build de produção em `dist`.
- `npm run preview` sobe preview da build.
- `npm run lint` roda lint.

## Banco de dados (Supabase)

Os SQLs estão em [`database/`](./database) e devem ser executados na ordem do [`database/README.md`](./database/README.md).

Eles criam tabelas com RLS para:
- usuários app (`app_users`),
- transações,
- metas,
- planejamento mensal,
- recorrentes,
- investimentos,
- categorias personalizadas,
- temas personalizados.

## Deploy na Vercel

Projeto já está preparado para deploy (SPA fallback via `vercel.json`).

Passos:
1. Importar o repositório na Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Configurar variáveis de ambiente na Vercel:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

Depois disso, fazer deploy.

## Observações

- Para o Clerk funcionar corretamente em produção, configure os domínios permitidos no painel Clerk.
- Se usar Supabase com autenticação integrada via JWT do Clerk, mantenha os claims compatíveis com as policies (uso de `sub`).
