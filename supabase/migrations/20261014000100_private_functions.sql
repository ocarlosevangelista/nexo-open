-- Tira as funções SECURITY DEFINER do schema exposto pela API (advisor 0028/0029).
-- As policies referenciam as funções por OID, então continuam funcionando.
create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.is_admin() set schema private;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

alter function public.handle_new_auth_user() set schema private;
revoke execute on function private.handle_new_auth_user() from public, anon, authenticated;

-- O Auth (supabase_auth_admin) dispara o trigger de cadastro.
grant usage on schema private to supabase_auth_admin;
grant execute on function private.handle_new_auth_user() to supabase_auth_admin;
