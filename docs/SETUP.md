# Roteiro de instalação assistida (para Claude Code, Codex ou outro agente)

> Este arquivo é para o **agente** seguir. Quem está instalando só precisa colar no agente
> o prompt que está no README e responder às perguntas.

Você (agente) vai instalar o Nexo para a pessoa. Fale em português simples, um passo por vez,
e explique o que cada comando faz antes de rodar. Nunca peça para a pessoa colar segredos
(senha do banco, Client Secret do Google, service role key) no chat se der para ela digitar
direto no terminal ou no painel; quando precisar de um segredo num comando, prefira que ela
mesma rode com `! <comando>`. Nunca grave segredos em arquivos versionados (`.env.local`
está no `.gitignore`; `.env.example` não pode receber valores reais).

## 0. Perguntas iniciais

Faça estas perguntas **antes** de qualquer comando (se a ferramenta tiver um recurso de
perguntas com opções, use; senão, pergunte em texto):

1. **Onde o Nexo vai rodar?**
   - **Só no meu computador** (localhost, para testar ou uso pessoal)
   - **Na internet, pela Vercel** (grátis no plano Hobby; gera uma URL `.vercel.app`)
2. **Quer login com Google?** (botão "Entrar com Google")
   - **Sim**: precisa criar um cliente OAuth no Google Cloud (uns 10 minutos, eu guio).
   - **Não**: só e-mail e senha.
   - Se sim, pergunte também: **quer importar eventos do Google Agenda para as tarefas?**
     (usa o mesmo cliente OAuth e publica a edge function `google-calendar`.)
3. **Quem pode criar conta?**
   - **Qualquer pessoa** (padrão; bom para uso local ou equipe que vai compartilhar o link)
   - **Só convidados**: a primeira conta vira admin e convida os outros na página Equipe.
     Recomendado se for publicar na Vercel, para estranhos não entrarem no seu workspace.

Guarde as respostas e siga só as seções que se aplicam. Resuma o plano em 3-5 linhas
e peça um "ok" antes de começar.

## 1. Pré-requisitos

- Node.js 20+ (`node -v`). Se faltar, oriente a instalar (macOS: `brew install node`;
  Windows/Linux: https://nodejs.org).
- `npm install` na raiz do projeto.
- Conta grátis no Supabase (https://supabase.com). Se for usar Vercel, conta grátis em
  https://vercel.com. Peça para a pessoa criar as contas no navegador, se não tiver.
- O CLI do Supabase roda via `npx supabase ...` (não precisa instalar globalmente).

## 2. Projeto no Supabase

1. Login no CLI: peça para a pessoa rodar `! npx supabase login` (abre o navegador).
2. Criar o projeto. Duas opções, pergunte qual ela prefere:
   - **Pelo painel** (mais simples): supabase.com/dashboard → New project. Nome `nexo`,
     região mais próxima (Brasil: `South America (São Paulo)`), gere uma senha de banco forte
     e peça para ela **guardar a senha** num gerenciador de senhas.
   - **Pelo CLI**: `npx supabase orgs list` para achar o org id e então
     `npx supabase projects create nexo --org-id <ORG> --region sa-east-1 --db-password <SENHA>`
     (peça para a pessoa rodar com `!` para a senha não passar pelo chat).
3. Pegue o **Project ref** (o trecho `xxxx` de `https://xxxx.supabase.co`, aparece em
   `npx supabase projects list`).
4. Vincule a pasta: `npx supabase link --project-ref <REF>` (pede a senha do banco).
   Se o CLI reclamar que falta `supabase/config.toml`, rode `npx supabase init` antes
   (responda "não" às perguntas de editor) e tente de novo.
5. Rode as migrations: `npx supabase db push`. Isso cria todas as tabelas, as regras de
   segurança (RLS) e o bucket privado `attachments` para anexos.
6. Confira: `npx supabase migration list` deve mostrar as duas migrations como aplicadas.

Se o CLI der problema e o agente tiver o MCP do Supabase conectado, dá para aplicar o
conteúdo de cada arquivo de `supabase/migrations/` (em ordem) com a ferramenta de migration
do MCP. Último recurso: colar cada arquivo, em ordem, no **SQL Editor** do painel.

### Cadastro: aberto ou só convidados

- **Qualquer pessoa** (padrão): nada a fazer.
- **Só convidados**: depois que a pessoa criar a **primeira conta** (ela vira admin), rode
  no SQL Editor ou via MCP:
  ```sql
  update public.app_settings set open_signup = false;
  ```
  Explique que novos membros são convidados em **Equipe → Convidar** e depois entram
  com Google ou criam conta com o mesmo e-mail.

## 3. Variáveis do frontend

1. `npx supabase projects api-keys --project-ref <REF>` e use a chave **publishable**
   (`sb_publishable_...`) ou, em projetos antigos, a **anon**. Nunca use a `service_role`/secret no frontend.
2. Crie `.env.local` (copiando `.env.example`) com:
   ```
   VITE_SUPABASE_URL=https://<REF>.supabase.co
   VITE_SUPABASE_ANON_KEY=<chave publishable>
   ```

## 4. Login por e-mail

O cadastro por e-mail pede um código de 6 dígitos enviado por e-mail. O servidor de e-mail
padrão do Supabase só entrega para membros da organização no Supabase e tem limite baixo.
Pergunte qual opção ela prefere:

- **Mais simples (recomendado para uso local ou se todos usam Google):** painel →
  **Authentication → Sign In / Providers → Email** → desligue **Confirm email**. O cadastro
  passa a entrar direto, sem código.
- **Com confirmação para todos:** configure um SMTP próprio em
  **Authentication → Emails → SMTP Settings** (Resend, Brevo etc.) e, em
  **Authentication → Emails → Templates → Confirm signup**, inclua `{{ .Token }}` no texto
  para o e-mail levar o código.

## 5. URLs de login

Painel → **Authentication → URL Configuration**:

- **Só local**: Site URL `http://localhost:5173`; Redirect URLs `http://localhost:5173/**`.
- **Vercel**: depois do passo 8 (quando já tiver a URL), Site URL `https://<app>.vercel.app`
  e Redirect URLs `https://<app>.vercel.app/**` e `http://localhost:5173/**`.

## 6. Login com Google (só se a pessoa quis)

Guie no navegador, um passo por vez:

1. https://console.cloud.google.com → crie um projeto (ex.: "Nexo").
2. **APIs e serviços → Tela de consentimento OAuth** (ou "Google Auth Platform"):
   tipo **Externo**, nome do app, e-mail de suporte. Em **Público**, adicione o próprio
   e-mail (e o da equipe) como **usuários de teste**. Em modo Teste, só esses e-mails
   conseguem entrar; para abrir para qualquer pessoa é preciso publicar o app (o login
   básico com e-mail/perfil não exige verificação do Google).
3. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
   Em **URIs de redirecionamento autorizados**, adicione:
   `https://<REF>.supabase.co/auth/v1/callback`
4. Supabase → **Authentication → Sign In / Providers → Google**: ative, cole o
   **Client ID** e o **Client Secret** (a pessoa cola direto no painel) e salve.

### Importar do Google Agenda (só se a pessoa quis)

1. No Google Cloud: **APIs e serviços → Biblioteca → Google Calendar API → Ativar**.
2. Na tela de consentimento, em **Acesso a dados / Escopos**, adicione
   `.../auth/calendar.events.readonly` e `.../auth/calendar.calendarlist.readonly`.
3. No mesmo cliente OAuth, adicione o redirect
   `https://<REF>.supabase.co/functions/v1/google-calendar`.
4. Publique a função (ela valida o usuário no próprio código, por isso `--no-verify-jwt`):
   `npx supabase functions deploy google-calendar --no-verify-jwt`
5. Secrets da função (peça para a pessoa rodar com `!`, por causa do Client Secret):
   ```
   npx supabase secrets set GOOGLE_CLIENT_ID=<id> GOOGLE_CLIENT_SECRET=<secret> APP_URL=<url do app>
   ```
   `APP_URL` = `http://localhost:5173` (local) ou a URL da Vercel. Atualize se a URL mudar.
6. Lembre que, com escopos de Agenda e o app em modo Teste, só usuários de teste entram na
   importação. Publicar com esses escopos exige verificação do Google (vídeo de demonstração,
   política de privacidade etc.).

Sem esta seção, o botão "Importar do Google Agenda" só mostra que a importação não está configurada.

## 7. Rodar localmente

```bash
npm run dev
```

Abra http://localhost:5173, crie a primeira conta (ou entre com Google). **A primeira conta
vira admin** e cria o workspace. Confira: página inicial carrega, dá para criar um projeto e
uma tarefa.

Se a pessoa escolheu "só no meu computador", termine aqui com um resumo do que foi feito.

## 8. Publicar na Vercel (só se a pessoa quis)

Pergunte se o código dela está num repositório no GitHub (fork ou "Use this template").

- **Com GitHub (recomendado, deploy automático a cada push):** vercel.com → **Add New →
  Project** → importe o repositório. Framework **Vite** (o `vercel.json` já configura).
  Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
  com os mesmos valores do `.env.local`. Deploy.
- **Sem GitHub, pelo CLI:**
  ```bash
  npx vercel login
  npx vercel link
  printf '%s' 'https://<REF>.supabase.co' | npx vercel env add VITE_SUPABASE_URL production
  printf '%s' '<chave publishable>'        | npx vercel env add VITE_SUPABASE_ANON_KEY production
  npx vercel --prod
  ```

Depois do deploy:

1. Volte ao passo 5 e coloque a URL da Vercel no Supabase (Site URL e Redirect URLs).
2. Se ativou o Google Agenda, atualize o secret `APP_URL` para a URL da Vercel.
3. Teste o login na URL publicada.
4. Se a pessoa escolheu "qualquer pessoa pode criar conta", lembre que qualquer um com o link
   entra no workspace; ofereça mudar para "só convidados" (seção 2).

## 9. Fim

Resuma para a pessoa: URL do app, onde ficam as configurações (Supabase e Vercel), quem é o
admin e o que ficou pendente, se algo ficou.
