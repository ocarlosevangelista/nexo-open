# Nexo

## Visão geral

App de gestão de projetos e tarefas para equipes, no estilo Asana. Frontend React/Vite e backend
Supabase (Postgres + RLS, Auth, Storage, Edge Functions). Pode rodar local ou na Vercel.

**Instalação assistida:** se a pessoa pedir para instalar ou configurar o Nexo, siga
[docs/SETUP.md](docs/SETUP.md) do início, começando pelas perguntas da seção 0.

## Convenções

- `src/api/base44Client.js` é a camada de dados: mantém a API `base44.entities.X.filter/create/update...`,
  `base44.auth.*`, `functions.invoke`, `connectors` e `integrations.Core.UploadPrivateFile` usada pelas telas,
  implementada sobre `src/api/supabaseClient.js`. Não reescreva as telas para falar direto com o Supabase.
- Tabelas = entidades em snake_case (`Task` → `task`, `WorkspaceMember` → `workspace_member`);
  `User` → `app_users`. IDs são texto de 24 hex.
- Cadastro: o gatilho `handle_new_auth_user` cria a linha em `app_users`; a primeira conta vira admin
  e cria o workspace. `app_settings.open_signup` controla se outras pessoas podem se cadastrar sem convite.
- RLS por e-mail (`public.auth_email()`); funções `SECURITY DEFINER` ficam no schema `private`.
- Mudanças de banco entram como **nova** migration em `supabase/migrations/`; não edite migrations já aplicadas.
- Textos da interface são escritos em português e passam por `tr()` (`src/lib/i18n.jsx`); a tradução em
  inglês fica em `src/lib/i18n-en.js`, com o texto em português como chave.
- Antes de commitar: `npm run lint` e `npm run build`.
- Nunca commite `.env.local` nem chaves secretas (service role, Client Secret do Google).

## Estado atual

(atualize aqui o que foi feito na sua instalação)

## Próximos passos

(liste o que falta)

## Decisões técnicas

- Camada de compatibilidade com a API do Base44 em vez de reescrever as telas: o app nasceu no Base44.
- Google Agenda via edge function própria (`google-calendar`), que guarda o refresh token em
  `public.google_connection` (sem policies; só a service role acessa).
