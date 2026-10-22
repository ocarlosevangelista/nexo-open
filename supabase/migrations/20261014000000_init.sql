-- Nexo no Supabase: schema, RLS e bucket de anexos.
-- O app nasceu no Base44, por isso as tabelas mantêm o formato de lá (id texto de
-- 24 hex, created_date, updated_date, created_by_id, created_by).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- helpers
create or replace function public.gen_id() returns text
language sql volatile set search_path = '' as $$
  select encode(extensions.gen_random_bytes(12), 'hex')
$$;

create or replace function public.auth_email() returns text
language sql stable set search_path = '' as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.touch_updated_date() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_date = now();
  return new;
end $$;

-- ---------------------------------------------------------------- usuários do app
-- Equivale à entidade User do Base44. Funciona também como lista de convidados:
-- só quem está aqui consegue criar conta (ver trigger handle_new_auth_user).
create table public.app_users (
  id text primary key default public.gen_id(),
  auth_id uuid unique references auth.users (id) on delete set null,
  email text not null unique,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.app_users
    where email = public.auth_email() and role = 'admin'
  )
$$;

-- Configuração da instância (uma linha só). open_signup = true: qualquer pessoa
-- cria conta. false: só quem foi convidado na página Equipe (e o primeiro usuário).
create table public.app_settings (
  id boolean primary key default true check (id),
  open_signup boolean not null default true
);
insert into public.app_settings default values;

-- O primeiro cadastro vira admin e cria o workspace; os seguintes entram como
-- usuários (se open_signup ou se foram convidados) e viram membros do workspace.
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  em text := lower(new.email);
  nm text := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(lower(new.email), '@', 1));
  first_user boolean := not exists (select 1 from public.app_users);
  ws_id text;
begin
  if not exists (select 1 from public.app_users where email = em) then
    if not first_user and not coalesce((select open_signup from public.app_settings), true) then
      raise exception 'user_not_registered: % não foi convidado para o Nexo', em;
    end if;
    insert into public.app_users (email, full_name, role)
    values (em, nm, case when first_user then 'admin' else 'user' end);
  end if;
  update public.app_users
     set auth_id = new.id,
         full_name = coalesce(full_name, nm),
         updated_date = now()
   where email = em;

  select id into ws_id from public.workspace limit 1;
  if ws_id is null then
    insert into public.workspace (name, owner_email) values ('Nexo', em) returning id into ws_id;
  end if;
  if exists (select 1 from public.workspace_member where email = em) then
    update public.workspace_member set status = 'active' where email = em;
  else
    insert into public.workspace_member (workspace_id, email, name, role, status)
    values (ws_id, em, nm, case when first_user then 'owner' else 'member' end, 'active');
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------- tabelas
create table public.workspace (
  id text primary key default public.gen_id(),
  name text not null,
  description text,
  owner_email text
);

create table public.workspace_member (
  id text primary key default public.gen_id(),
  workspace_id text,
  email text not null,
  name text not null,
  avatar_url text,
  title text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'guest')),
  status text not null default 'active' check (status in ('active', 'invited'))
);

create table public.project (
  id text primary key default public.gen_id(),
  workspace_id text,
  name text not null,
  description text,
  color text default '#6366f1',
  icon text default 'folder',
  owner_email text,
  owner_name text,
  start_date date,
  end_date date,
  status text default 'on_track' check (status in ('on_track', 'at_risk', 'off_track', 'on_hold', 'completed')),
  favorite boolean default false,
  privacy text default 'shared' check (privacy in ('private', 'shared')),
  archived boolean default false,
  member_emails text[] default '{}'
);

create table public.project_member (
  id text primary key default public.gen_id(),
  project_id text not null,
  email text not null,
  name text,
  role text default 'editor' check (role in ('owner', 'admin', 'editor', 'commenter', 'viewer'))
);

create table public.section (
  id text primary key default public.gen_id(),
  project_id text not null,
  name text not null,
  "order" double precision default 0,
  archived boolean default false
);

create table public.task (
  id text primary key default public.gen_id(),
  title text not null,
  description text,
  project_id text,
  section_id text,
  parent_task_id text,
  assignee_email text,
  assignee_name text,
  creator_email text,
  collaborators text[] default '{}',
  admin_emails text[] default '{}',
  status text default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  start_date date,
  due_date date,
  completed_at timestamptz,
  completed_by text,
  "order" double precision default 0,
  tags text[] default '{}',
  checklist jsonb default '[]',
  recurrence text default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly')),
  is_recurring boolean default false,
  archived boolean default false,
  source text default 'manual' check (source in ('manual', 'google_calendar')),
  google_event_id text,
  google_calendar_id text
);

create table public.task_dependency (
  id text primary key default public.gen_id(),
  task_id text not null,
  depends_on_task_id text not null,
  depends_on_title text,
  type text default 'blocked_by' check (type in ('blocked_by'))
);

create table public.comment (
  id text primary key default public.gen_id(),
  task_id text not null,
  project_id text,
  body text not null,
  author_email text,
  author_name text,
  mentions text[] default '{}'
);

create table public.activity (
  id text primary key default public.gen_id(),
  task_id text,
  project_id text,
  actor_email text,
  actor_name text,
  action text not null,
  detail text
);

create table public.attachment (
  id text primary key default public.gen_id(),
  task_id text,
  project_id text,
  name text not null,
  file_uri text not null,
  size double precision,
  uploaded_by text
);

create table public.notification (
  id text primary key default public.gen_id(),
  recipient_email text not null,
  type text not null check (type in ('mention', 'comment', 'assigned', 'due_change', 'project_update')),
  title text not null,
  body text,
  actor_name text,
  task_id text,
  project_id text,
  read boolean default false
);

create table public.tag (
  id text primary key default public.gen_id(),
  workspace_id text,
  name text not null,
  color text
);

create table public.custom_field (
  id text primary key default public.gen_id(),
  project_id text not null,
  name text not null,
  type text default 'text' check (type in ('text', 'number', 'date'))
);

create table public.custom_field_value (
  id text primary key default public.gen_id(),
  field_id text not null,
  task_id text not null,
  project_id text,
  value text
);

-- Colunas de sistema (iguais às do Base44), trigger de updated_date e RLS ligado.
do $$
declare t text;
begin
  foreach t in array array['workspace', 'workspace_member', 'project', 'project_member', 'section', 'task',
    'task_dependency', 'comment', 'activity', 'attachment', 'notification', 'tag', 'custom_field', 'custom_field_value']
  loop
    execute format('alter table public.%I
      add column created_date timestamptz not null default now(),
      add column updated_date timestamptz not null default now(),
      add column created_by_id text default (auth.uid())::text,
      add column created_by text default public.auth_email()', t);
    execute format('create trigger touch_%1$s before update on public.%1$I
      for each row execute function public.touch_updated_date()', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create trigger touch_app_users before update on public.app_users
  for each row execute function public.touch_updated_date();
alter table public.app_users enable row level security;

-- ---------------------------------------------------------------- índices
create index on public.task (project_id);
create index on public.task (section_id);
create index on public.task (parent_task_id);
create index on public.task (assignee_email);
create index on public.task using gin (admin_emails);
create index on public.task using gin (collaborators);
create index on public.section (project_id);
create index on public.project_member (project_id);
create index on public.activity (task_id);
create index on public.comment (task_id);
create index on public.attachment (task_id);
create index on public.notification (recipient_email);
create index on public.custom_field (project_id);
create index on public.custom_field_value (project_id);
create index on public.task_dependency (task_id);

-- ---------------------------------------------------------------- RLS
-- No Base44, "null" = qualquer usuário logado. user_condition role admin = is_admin().
-- app_users
create policy app_users_read on public.app_users for select to authenticated using (true);
create policy app_users_admin_insert on public.app_users for insert to authenticated with check ((select public.is_admin()));
create policy app_users_admin_update on public.app_users for update to authenticated using ((select public.is_admin()));
create policy app_users_admin_delete on public.app_users for delete to authenticated using ((select public.is_admin()));

-- app_settings: r livre, u admin
alter table public.app_settings enable row level security;
create policy app_settings_read on public.app_settings for select to authenticated using (true);
create policy app_settings_admin_update on public.app_settings for update to authenticated using ((select public.is_admin()));

-- custom_field_value: c/r/u livre, d admin
create policy cfv_select on public.custom_field_value for select to authenticated using (true);
create policy cfv_insert on public.custom_field_value for insert to authenticated with check (true);
create policy cfv_update on public.custom_field_value for update to authenticated using (true);
create policy cfv_delete on public.custom_field_value for delete to authenticated using ((select public.is_admin()));

-- section: c/r/u livre, d admin
create policy section_select on public.section for select to authenticated using (true);
create policy section_insert on public.section for insert to authenticated with check (true);
create policy section_update on public.section for update to authenticated using (true);
create policy section_delete on public.section for delete to authenticated using ((select public.is_admin()));

-- attachment: c/r livre, u/d admin
create policy attachment_select on public.attachment for select to authenticated using (true);
create policy attachment_insert on public.attachment for insert to authenticated with check (true);
create policy attachment_update on public.attachment for update to authenticated using ((select public.is_admin()));
create policy attachment_delete on public.attachment for delete to authenticated using ((select public.is_admin()));

-- workspace_member: r livre, c/u/d admin
create policy wm_select on public.workspace_member for select to authenticated using (true);
create policy wm_insert on public.workspace_member for insert to authenticated with check ((select public.is_admin()));
create policy wm_update on public.workspace_member for update to authenticated using ((select public.is_admin()));
create policy wm_delete on public.workspace_member for delete to authenticated using ((select public.is_admin()));

-- custom_field: c/r livre, u/d admin
create policy cf_select on public.custom_field for select to authenticated using (true);
create policy cf_insert on public.custom_field for insert to authenticated with check (true);
create policy cf_update on public.custom_field for update to authenticated using ((select public.is_admin()));
create policy cf_delete on public.custom_field for delete to authenticated using ((select public.is_admin()));

-- notification: c admin, r/u/d destinatário
create policy notif_select on public.notification for select to authenticated using (lower(recipient_email) = (select public.auth_email()));
create policy notif_insert on public.notification for insert to authenticated with check ((select public.is_admin()));
create policy notif_update on public.notification for update to authenticated using (lower(recipient_email) = (select public.auth_email()));
create policy notif_delete on public.notification for delete to authenticated using (lower(recipient_email) = (select public.auth_email()));

-- comment: c/r livre, u/d autor ou admin
create policy comment_select on public.comment for select to authenticated using (true);
create policy comment_insert on public.comment for insert to authenticated with check (true);
create policy comment_update on public.comment for update to authenticated
  using (lower(author_email) = (select public.auth_email()) or (select public.is_admin()));
create policy comment_delete on public.comment for delete to authenticated
  using (lower(author_email) = (select public.auth_email()) or (select public.is_admin()));

-- activity: c/r livre, u/d admin
create policy activity_select on public.activity for select to authenticated using (true);
create policy activity_insert on public.activity for insert to authenticated with check (true);
create policy activity_update on public.activity for update to authenticated using ((select public.is_admin()));
create policy activity_delete on public.activity for delete to authenticated using ((select public.is_admin()));

-- task: c livre; r/u responsável, criador, colaborador ou admin do projeto; d criador, admin do projeto ou admin
create policy task_select on public.task for select to authenticated using (
  lower(assignee_email) = (select public.auth_email())
  or lower(creator_email) = (select public.auth_email())
  or (select public.auth_email()) = any (collaborators)
  or (select public.auth_email()) = any (admin_emails));
create policy task_insert on public.task for insert to authenticated with check (true);
create policy task_update on public.task for update to authenticated using (
  lower(assignee_email) = (select public.auth_email())
  or lower(creator_email) = (select public.auth_email())
  or (select public.auth_email()) = any (collaborators)
  or (select public.auth_email()) = any (admin_emails));
create policy task_delete on public.task for delete to authenticated using (
  lower(creator_email) = (select public.auth_email())
  or (select public.auth_email()) = any (admin_emails)
  or (select public.is_admin()));

-- workspace: r livre, c admin, u/d dono ou admin
create policy ws_select on public.workspace for select to authenticated using (true);
create policy ws_insert on public.workspace for insert to authenticated with check ((select public.is_admin()));
create policy ws_update on public.workspace for update to authenticated
  using (lower(owner_email) = (select public.auth_email()) or (select public.is_admin()));
create policy ws_delete on public.workspace for delete to authenticated
  using (lower(owner_email) = (select public.auth_email()) or (select public.is_admin()));

-- project_member: c/r livre, u/d o próprio membro ou admin
create policy pm_select on public.project_member for select to authenticated using (true);
create policy pm_insert on public.project_member for insert to authenticated with check (true);
create policy pm_update on public.project_member for update to authenticated
  using (lower(email) = (select public.auth_email()) or (select public.is_admin()));
create policy pm_delete on public.project_member for delete to authenticated
  using (lower(email) = (select public.auth_email()) or (select public.is_admin()));

-- project: c livre; r/u criador, dono ou membro; d criador ou dono
create policy project_select on public.project for select to authenticated using (
  created_by_id = (select auth.uid())::text
  or lower(created_by) = (select public.auth_email())
  or lower(owner_email) = (select public.auth_email())
  or (select public.auth_email()) = any (member_emails));
create policy project_insert on public.project for insert to authenticated with check (true);
create policy project_update on public.project for update to authenticated using (
  created_by_id = (select auth.uid())::text
  or lower(created_by) = (select public.auth_email())
  or lower(owner_email) = (select public.auth_email())
  or (select public.auth_email()) = any (member_emails));
create policy project_delete on public.project for delete to authenticated using (
  created_by_id = (select auth.uid())::text
  or lower(created_by) = (select public.auth_email())
  or lower(owner_email) = (select public.auth_email()));

-- tag e task_dependency: sem regras no Base44
create policy tag_all on public.tag for all to authenticated using (true) with check (true);
create policy dep_all on public.task_dependency for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------- Google Agenda
-- Tokens OAuth de cada usuário. Sem policies: só a edge function (service role) acessa.
create table public.google_connection (
  user_email text primary key,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  updated_date timestamptz not null default now()
);
alter table public.google_connection enable row level security;

-- ---------------------------------------------------------------- Storage (anexos)
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy attachments_read on storage.objects for select to authenticated using (bucket_id = 'attachments');
create policy attachments_insert on storage.objects for insert to authenticated with check (bucket_id = 'attachments');
