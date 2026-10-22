// Substitui a backend function "recordEvent": grava atividades e notificações
// diretamente pelas entidades no client-side (sem backend function).
import { base44 } from '@/api/base44Client';
import { items } from '@/lib/nexo';

const E = base44.entities;

const STATUS = { todo: 'A fazer', in_progress: 'Em andamento', review: 'Em revisão', done: 'Concluída' };
const PRIORITY = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' };
const PROJECT_STATUS = { on_track: 'No prazo', at_risk: 'Em risco', off_track: 'Atrasado', on_hold: 'Pausado', completed: 'Concluído' };
const LABELS = {
  title: 'renomeou a tarefa', status: 'alterou o status', priority: 'alterou a prioridade',
  due_date: 'alterou a data de conclusão', start_date: 'alterou a data inicial', assignee_email: 'alterou o responsável',
  section_id: 'moveu de seção', project_id: 'moveu de projeto', archived: 'arquivou a tarefa',
  tags: 'alterou as etiquetas', collaborators: 'alterou os colaboradores', description: 'editou a descrição',
};
const describe = (k, c) => {
  if (k === 'status') return STATUS[c.status];
  if (k === 'priority') return PRIORITY[c.priority];
  if (k === 'assignee_email') return c.assignee_name || 'Sem responsável';
  if (['title', 'due_date', 'start_date'].includes(k)) return c[k] || '—';
  return '';
};
const actor = (me) => me.full_name || me.email;

async function memberList() {
  return items(await E.WorkspaceMember.filter({}, { limit: 500, fields: ['email', 'name'] }));
}

async function notify(notes, extra, me, members) {
  const valid = new Set(members.map((m) => m.email).filter(Boolean));
  const list = notes.filter((n) => n.recipient_email && n.recipient_email !== me.email && valid.has(n.recipient_email));
  if (list.length) {
    await E.Notification.bulkCreate(list.map((n) => ({ ...n, ...extra, actor_name: actor(me), read: false })));
  }
}

export async function recordTaskCreated(task, me) {
  if (!me) return;
  try {
    await E.Activity.create({
      task_id: task.id, project_id: task.project_id, actor_email: me.email, actor_name: actor(me),
      action: 'criou a tarefa', detail: '',
    });
  } catch { /* atividades são opcionais */ }
}

export async function recordTaskUpdate(task, changes, me) {
  if (!me) return;
  try {
    const logs = Object.keys(changes)
      .filter((k) => LABELS[k] && JSON.stringify(task[k] ?? null) !== JSON.stringify(changes[k] ?? null))
      .map((k) => ({
        task_id: task.id, project_id: task.project_id, actor_email: me.email, actor_name: actor(me),
        action: k === 'status' && changes.status === 'done' ? 'concluiu a tarefa' : LABELS[k],
        detail: describe(k, changes) || '',
      }));
    if (logs.length) await E.Activity.bulkCreate(logs);
    const notes = [];
    if (changes.assignee_email && changes.assignee_email !== task.assignee_email) {
      notes.push({ recipient_email: changes.assignee_email, type: 'assigned', title: `${actor(me)} atribuiu uma tarefa a você`, body: task.title });
    }
    if ('due_date' in changes && changes.due_date !== task.due_date) {
      notes.push({ recipient_email: task.assignee_email, type: 'due_change', title: `${actor(me)} alterou o prazo`, body: task.title });
    }
    if (notes.length) await notify(notes, { task_id: task.id, project_id: task.project_id }, me, await memberList());
  } catch { /* atividades/notificações são opcionais */ }
}

export async function recordProjectStatus(project, me) {
  if (!me) return;
  try {
    const members = await memberList();
    const pm = items(await E.ProjectMember.filter({ project_id: project.id }, { limit: 100 }));
    const notes = pm.map((m) => ({
      recipient_email: m.email, type: 'project_update',
      title: `${actor(me)} atualizou o status de ${project.name}`,
      body: PROJECT_STATUS[project.status] || '',
    }));
    await notify(notes, { project_id: project.id }, me, members);
  } catch { /* notificações são opcionais */ }
}

export async function recordComment(task, text, me) {
  const clean = String(text || '').trim().slice(0, 5000);
  if (!clean || !me) throw new Error('Comentário vazio');
  const members = await memberList();
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isMentioned = (x) => x.name && x.email !== me.email && new RegExp('@' + esc(x.name.split(' ')[0]) + '\\b', 'i').test(clean);
  const mentioned = members.filter(isMentioned);
  const comment = await E.Comment.create({
    task_id: task.id, project_id: task.project_id, body: clean,
    author_email: me.email, author_name: actor(me), mentions: mentioned.map((x) => x.email),
  });
  const notes = mentioned.map((x) => ({
    recipient_email: x.email, type: 'mention',
    title: `${actor(me)} mencionou você em ${task.title}`, body: clean.slice(0, 140),
  }));
  const assigneeAlreadyMentioned = mentioned.some((x) => x.email === task.assignee_email);
  if (task.assignee_email && !assigneeAlreadyMentioned) {
    notes.push({
      recipient_email: task.assignee_email, type: 'comment',
      title: `${actor(me)} comentou em ${task.title}`, body: clean.slice(0, 140),
    });
  }
  if (notes.length) await notify(notes, { task_id: task.id, project_id: task.project_id }, me, members);
  try {
    await E.Activity.create({
      task_id: task.id, project_id: task.project_id, actor_email: me.email, actor_name: actor(me),
      action: 'comentou', detail: '',
    });
  } catch { /* atividade opcional */ }
  return comment;
}