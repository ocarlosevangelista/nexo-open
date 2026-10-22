# Nexo

Gestão de projetos e tarefas para equipes, no estilo Asana. Código aberto (MIT), feito pela
[Evans IT](https://evansit.com.br).

- Projetos com seções e visões em lista, quadro (kanban), calendário e painel
- Tarefas com subtarefas, checklist, dependências, comentários, anexos, tags e campos personalizados
- Minhas tarefas, caixa de entrada com notificações, relatórios e busca global
- Equipe com convites e papéis (admin/usuário)
- Login por e-mail e senha ou com Google; importação do Google Agenda (opcional)
- Interface em português e inglês

**Stack:** React + Vite + Tailwind (shadcn/ui) no frontend; Supabase (Postgres com RLS, Auth,
Storage e Edge Functions) no backend. Roda local ou na Vercel, nos planos grátis.

## Instalação com IA (recomendado)

1. Pegue o código: clique em **Use this template** (ou faça um fork) e clone o seu repositório,
   ou baixe o ZIP em **Code → Download ZIP**.
2. Abra a pasta no terminal com o [Claude Code](https://claude.com/claude-code) ou o
   [Codex CLI](https://github.com/openai/codex).
3. Cole este prompt:

```text
Quero instalar o Nexo, que está nesta pasta. Leia o arquivo docs/SETUP.md e siga o roteiro
dele: antes de qualquer comando, me pergunte se quero rodar só no meu computador ou publicar
na Vercel, se quero login com Google (e importação do Google Agenda) e quem pode criar conta.
Depois faça tudo o que der para fazer por você e me guie, um passo por vez, no que eu precisar
fazer no navegador. Não grave senhas ou chaves secretas em arquivos do repositório.
```

O agente cria o projeto no Supabase, roda as migrations e configura o `.env.local`. Conforme as
suas respostas, ele também configura o login com Google e publica na Vercel.

## Instalação manual

Pré-requisitos: Node.js 20+ e uma conta no [Supabase](https://supabase.com).

```bash
npm install
npx supabase login
npx supabase link --project-ref <REF-DO-SEU-PROJETO>   # crie o projeto antes no painel
npx supabase db push                                    # tabelas, RLS e bucket de anexos
cp .env.example .env.local                              # preencha a URL e a chave publishable
npm run dev
```

Abra http://localhost:5173 e crie a primeira conta: **ela vira admin** e cria o workspace.

Os detalhes (confirmação de e-mail, URLs de login, Google, Google Agenda e Vercel) estão em
[docs/SETUP.md](docs/SETUP.md). É o mesmo roteiro que o agente segue, e dá para fazer à mão.

### Quem pode criar conta

Por padrão, qualquer pessoa cria conta e entra no workspace. Para aceitar só convidados
(recomendado se o app ficar público na internet), rode no SQL Editor do Supabase:

```sql
update public.app_settings set open_signup = false;
```

A primeira conta sempre consegue entrar e vira admin. As outras pessoas são convidadas pela página **Equipe**.

## Desenvolvimento

- `npm run dev`: servidor local
- `npm run lint` e `npm run build`: checagens antes de commitar

### Como está organizado

- `src/pages/`: telas (início, minhas tarefas, caixa de entrada, projetos, projeto, tarefa, equipe, relatórios, login)
- `src/components/`: componentes; `src/components/ui/` é o shadcn/ui
- `src/api/base44Client.js`: camada de dados usada pelas telas (`base44.entities.*`, `base44.auth.*`).
  O app nasceu no Base44, e esta camada mantém a mesma API, mas fala com o Supabase
  (`src/api/supabaseClient.js`). Filtros no estilo Mongo (`$ne`, `$in`, `$regex`...) viram consultas PostgREST.
- `src/lib/i18n.jsx` e `src/lib/i18n-en.js`: traduções (o texto em português é a chave)
- `supabase/migrations/`: schema, RLS, gatilho de cadastro e bucket de anexos
- `supabase/functions/google-calendar/`: OAuth e leitura do Google Agenda
- `vercel.json`: build do Vite e rewrite de SPA

## English

Nexo is an open-source (MIT), Asana-style project and task manager built with React, Vite and
Supabase. To install it with an AI coding agent, open this folder in Claude Code or Codex and
ask it to follow `docs/SETUP.md`. The guide is written in Portuguese, but the agent can walk you
through it in English. The app itself is available in Portuguese and English.

## Licença

[MIT](LICENSE) © 2026 Evans IT
