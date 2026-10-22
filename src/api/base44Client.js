// Camada de compatibilidade: mantém a API do SDK do Base44 (`base44.entities`,
// `base44.auth`, `base44.functions`...) usada pelo app, mas implementada sobre o
// Supabase. Assim as telas continuam iguais às do Base44.
import { supabase } from '@/api/supabaseClient';
import { tr } from '@/lib/i18n';

// Entidade do Base44 → tabela no Supabase, com as colunas aceitas na escrita.
const SYS = ['id', 'created_date', 'updated_date', 'created_by_id', 'created_by'];
const TABLES = {
  Workspace: { table: 'workspace', cols: ['name', 'description', 'owner_email'] },
  WorkspaceMember: { table: 'workspace_member', cols: ['workspace_id', 'email', 'name', 'avatar_url', 'title', 'role', 'status'] },
  Project: {
    table: 'project',
    cols: ['workspace_id', 'name', 'description', 'color', 'icon', 'owner_email', 'owner_name', 'start_date', 'end_date', 'status', 'favorite', 'privacy', 'archived', 'member_emails'],
    arrays: ['member_emails'], nullable: ['start_date', 'end_date'],
  },
  ProjectMember: { table: 'project_member', cols: ['project_id', 'email', 'name', 'role'] },
  Section: { table: 'section', cols: ['project_id', 'name', 'order', 'archived'] },
  Task: {
    table: 'task',
    cols: ['title', 'description', 'project_id', 'section_id', 'parent_task_id', 'assignee_email', 'assignee_name', 'creator_email', 'collaborators', 'admin_emails', 'status', 'priority', 'start_date', 'due_date', 'completed_at', 'completed_by', 'order', 'tags', 'checklist', 'recurrence', 'is_recurring', 'archived', 'source', 'google_event_id', 'google_calendar_id'],
    arrays: ['collaborators', 'admin_emails', 'tags'], nullable: ['start_date', 'due_date', 'completed_at'],
  },
  TaskDependency: { table: 'task_dependency', cols: ['task_id', 'depends_on_task_id', 'depends_on_title', 'type'] },
  Comment: { table: 'comment', cols: ['task_id', 'project_id', 'body', 'author_email', 'author_name', 'mentions'], arrays: ['mentions'] },
  Activity: { table: 'activity', cols: ['task_id', 'project_id', 'actor_email', 'actor_name', 'action', 'detail'] },
  Attachment: { table: 'attachment', cols: ['task_id', 'project_id', 'name', 'file_uri', 'size', 'uploaded_by'] },
  Notification: { table: 'notification', cols: ['recipient_email', 'type', 'title', 'body', 'actor_name', 'task_id', 'project_id', 'read'] },
  Tag: { table: 'tag', cols: ['workspace_id', 'name', 'color'] },
  CustomField: { table: 'custom_field', cols: ['project_id', 'name', 'type'] },
  CustomFieldValue: { table: 'custom_field_value', cols: ['field_id', 'task_id', 'project_id', 'value'] },
};

const fail = (error, status) => {
  const e = new Error(error?.message || String(error));
  e.status = status || error?.status;
  e.data = error;
  return e;
};

// Lista que também responde a `.items`, porque o app usa os dois formatos.
const asList = (rows) => {
  const list = rows || [];
  Object.defineProperty(list, 'items', { value: list, enumerable: false });
  return list;
};

// ---------------------------------------------------------------- filtros estilo Mongo → PostgREST
const quote = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const unescapeRegex = (s) => s.replace(/\\(.)/g, '$1');
const likeEscape = (s) => s.replace(/[\\%_]/g, (c) => '\\' + c);

function applyQuery(q, query = {}, spec) {
  const complex = [];
  for (const [col, v] of Object.entries(query || {})) {
    if (v === undefined) continue;
    if (v === null) { q = q.is(col, null); continue; }
    if (typeof v !== 'object' || Array.isArray(v)) {
      if (spec.arrays?.includes(col)) q = q.contains(col, Array.isArray(v) ? v : [v]);
      else q = q.eq(col, v);
      continue;
    }
    for (const [op, val] of Object.entries(v)) {
      if (op === '$options') continue;
      if (op === '$ne') {
        if (val === null) q = q.not(col, 'is', null);
        else complex.push(`or(${col}.is.null,${col}.neq.${quote(val)})`);
      } else if (op === '$in' || op === '$nin') {
        const vals = val.filter((x) => x !== null);
        const hasNull = vals.length !== val.length;
        const list = `(${vals.map(quote).join(',')})`;
        if (op === '$in') {
          if (hasNull) complex.push(vals.length ? `or(${col}.is.null,${col}.in.${list})` : `${col}.is.null`);
          else q = q.in(col, vals);
        } else {
          if (vals.length) complex.push(hasNull ? `${col}.not.in.${list}` : `or(${col}.is.null,${col}.not.in.${list})`);
          if (hasNull) q = q.not(col, 'is', null);
        }
      } else if (op === '$lt') q = q.lt(col, val);
      else if (op === '$lte') q = q.lte(col, val);
      else if (op === '$gt') q = q.gt(col, val);
      else if (op === '$gte') q = q.gte(col, val);
      else if (op === '$exists') q = val ? q.not(col, 'is', null) : q.is(col, null);
      else if (op === '$regex') q = q.ilike(col, `%${likeEscape(unescapeRegex(String(val)))}%`);
      else throw new Error(`Operador não suportado: ${op}`);
    }
  }
  if (complex.length) q = q.or(`and(${complex.join(',')})`);
  return q;
}

const applySort = (q, sort) => {
  if (!sort) return q;
  const desc = sort.startsWith('-');
  return q.order(desc ? sort.slice(1) : sort, { ascending: !desc });
};

// Aceita filter(query, {sort, limit, skip, fields}) e filter(query, sort, limit, skip, fields).
const opts = (a, limit, skip, fields) => (a && typeof a === 'object' ? a : { sort: a, limit, skip, fields });

// Remove campos que não existem na tabela e normaliza vazios.
function clean(spec, data) {
  const out = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (!spec.cols.includes(k) || v === undefined) continue;
    out[k] = v === '' && spec.nullable?.includes(k) ? null : v;
  }
  return out;
}

function entity(spec) {
  const { table } = spec;
  const select = (fields) => supabase.from(table).select(fields?.length ? [...new Set(['id', ...fields])].join(',') : '*');

  const filter = async (query, a, limit, skip, fields) => {
    const o = opts(a, limit, skip, fields);
    let q = applySort(applyQuery(select(o.fields), query, spec), o.sort);
    const from = o.skip || 0;
    q = q.range(from, from + (o.limit || 1000) - 1);
    const { data, error } = await q;
    if (error) throw fail(error);
    return asList(data);
  };

  return {
    filter,
    list: (sort, limit, skip, fields) => filter({}, sort, limit, skip, fields),
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      if (error) throw fail(error);
      if (!data) throw fail({ message: 'Registro não encontrado' }, 404);
      return data;
    },
    async count(query) {
      const { count, error } = await applyQuery(supabase.from(table).select('id', { count: 'exact', head: true }), query, spec);
      if (error) throw fail(error);
      return count || 0;
    },
    async aggregate({ query, groupBy }) {
      const { data, error } = await applyQuery(supabase.from(table).select(groupBy), query, spec).limit(10000);
      if (error) throw fail(error);
      const counts = new Map();
      data.forEach((r) => counts.set(r[groupBy], (counts.get(r[groupBy]) || 0) + 1));
      return { rows: [...counts].map(([k, c]) => ({ [groupBy]: k, count: c })) };
    },
    async create(row) {
      const { data, error } = await supabase.from(table).insert(clean(spec, row)).select().single();
      if (error) throw fail(error);
      return data;
    },
    async bulkCreate(rows) {
      if (!rows?.length) return [];
      const { data, error } = await supabase.from(table).insert(rows.map((r) => clean(spec, r))).select();
      if (error) throw fail(error);
      return data;
    },
    async update(id, changes) {
      const { data, error } = await supabase.from(table).update(clean(spec, changes)).eq('id', id).select().maybeSingle();
      if (error) throw fail(error);
      return data;
    },
    async bulkUpdate(rows) {
      return Promise.all(rows.map(({ id, ...rest }) => this.update(id, rest)));
    },
    async updateMany(query, update) {
      const changes = update?.$set || update;
      const { error } = await applyQuery(supabase.from(table).update(clean(spec, changes)), query, spec);
      if (error) throw fail(error);
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw fail(error);
    },
  };
}

// ---------------------------------------------------------------- usuários (entidade User)
const toUser = (u) => u && ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role, created_date: u.created_date });

const User = {
  async list() {
    const { data, error } = await supabase.from('app_users').select('*').not('auth_id', 'is', null).order('created_date');
    if (error) throw fail(error);
    return asList(data.map(toUser));
  },
};

// ---------------------------------------------------------------- auth
const origin = () => window.location.origin;
// Mensagens do Supabase Auth mostradas na tela, no idioma escolhido.
const AUTH_MESSAGES = [
  [/user_not_registered|Database error saving new user/i, 'Este e-mail não foi convidado para o Nexo. Peça acesso ao administrador.'],
  [/Invalid login credentials/i, 'E-mail ou senha inválidos'],
  [/Email not confirmed/i, 'Confirme seu e-mail antes de entrar'],
  [/already registered|already been registered/i, 'Este e-mail já tem uma conta'],
  [/Password should be at least/i, 'A senha precisa ter pelo menos 6 caracteres'],
  [/expired or is invalid|otp.*(expired|invalid)/i, 'Código inválido ou expirado'],
  [/rate limit|too many requests|security purposes/i, 'Muitas tentativas. Aguarde um pouco e tente de novo.'],
];
const authError = (error) => {
  const msg = error?.message || '';
  const known = AUTH_MESSAGES.find(([rx]) => rx.test(msg));
  if (known) return fail({ message: tr(known[1]) }, known[1].startsWith('Este e-mail não foi') ? 403 : error?.status);
  return fail(error, error?.status);
};

const auth = {
  async isAuthenticated() {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },
  async me() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw fail({ message: 'Authentication required' }, 401);
    const email = session.user.email?.toLowerCase();
    const { data, error } = await supabase.from('app_users').select('*').eq('email', email).maybeSingle();
    if (error) throw fail(error);
    if (!data) throw Object.assign(fail({ message: 'User not registered for this app' }, 403), { data: { extra_data: { reason: 'user_not_registered' } } });
    return toUser(data);
  },
  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw authError(error);
    return data;
  },
  async loginWithProvider(provider, returnTo = '/') {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: origin() + returnTo } });
    if (error) throw authError(error);
  },
  async register({ email, password }) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: origin() + '/' } });
    if (error) throw authError(error);
    return data;
  },
  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'signup' });
    if (error) throw authError(error);
    return { access_token: data.session?.access_token };
  },
  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw authError(error);
  },
  setToken() { /* o Supabase guarda a sessão sozinho */ },
  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: origin() + '/reset-password?token=supabase' });
    if (error) throw authError(error);
  },
  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw authError(error);
    await supabase.auth.signOut();
  },
  async logout(redirectUrl) {
    await supabase.auth.signOut();
    window.location.href = redirectUrl || '/login';
  },
  redirectToLogin(returnUrl) {
    window.location.href = '/login' + (returnUrl ? '?returnTo=' + encodeURIComponent(returnUrl) : '');
  },
};

// ---------------------------------------------------------------- functions, conectores e arquivos
const FUNCTIONS = { googleCalendar: 'google-calendar' };

async function invoke(name, body) {
  const { data, error } = await supabase.functions.invoke(FUNCTIONS[name] || name, { body });
  if (error) {
    let detail = null;
    try { detail = await error.context?.json(); } catch { /* sem corpo */ }
    throw fail({ message: detail?.error || error.message }, error.context?.status);
  }
  return { data };
}

export const base44 = {
  entities: { ...Object.fromEntries(Object.entries(TABLES).map(([name, spec]) => [name, entity(spec)])), User },
  auth,
  app: { getPublicSettings: async () => ({ id: 'nexo', public_settings: {} }) },
  users: {
    // No Base44 isso mandava o convite por e-mail. Aqui libera o e-mail para criar conta
    // (login com Google ou cadastro); o administrador avisa a pessoa.
    async inviteUser(email, role) {
      const { error } = await supabase.from('app_users')
        .upsert({ email: email.toLowerCase(), role: role === 'admin' ? 'admin' : 'user' }, { onConflict: 'email', ignoreDuplicates: true });
      if (error) throw fail(error);
    },
  },
  functions: { invoke },
  connectors: {
    // Os dois conectores de usuário do Base44 viram ações da edge function google-calendar.
    async connectAppUser() {
      const { data } = await invoke('googleCalendar', { action: 'connect', returnUrl: window.location.href });
      return data.url;
    },
    async disconnectAppUser() {
      await invoke('googleCalendar', { action: 'disconnect' });
    },
  },
  integrations: {
    Core: {
      async UploadPrivateFile({ file }) {
        const path = `${crypto.randomUUID()}/${file.name}`;
        const { error } = await supabase.storage.from('attachments').upload(path, file);
        if (error) throw fail(error);
        return { file_uri: path };
      },
      async CreateFileSignedUrl({ file_uri, expires_in = 300 }) {
        const { data, error } = await supabase.storage.from('attachments').createSignedUrl(file_uri, expires_in);
        if (error) throw fail(error);
        return { signed_url: data.signedUrl };
      },
    },
  },
};
