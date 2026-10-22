import { base44 } from '@/api/base44Client';
import { recordTaskCreated, recordTaskUpdate } from '@/lib/recordEvent';

const E = base44.entities;

export async function updateTask(task, changes, me) {
  const data = { ...changes };
  const who = me?.full_name || me?.email;
  if (changes.status === 'done' && task.status !== 'done') {
    data.completed_at = new Date().toISOString();
    if (who) data.completed_by = who;
  } else if (changes.status && changes.status !== 'done') {
    data.completed_at = null;
    data.completed_by = null;
  }
  await E.Task.update(task.id, data);
  try { await recordTaskUpdate(task, changes, me); } catch {}
}

async function resolveAdminEmails(projectId) {
  if (!projectId) return [];
  const res = await E.ProjectMember.filter({ project_id: projectId, role: { $in: ['owner', 'admin'] } }, { limit: 200 });
  return [...new Set(res.items.map((m) => m.email).filter(Boolean))];
}

export async function createTask(data, me) {
  const admin_emails = Array.isArray(data.admin_emails) && data.admin_emails.length
    ? data.admin_emails
    : await resolveAdminEmails(data.project_id);
  const t = await E.Task.create({
    status: 'todo', priority: 'medium', order: Date.now(), archived: false, parent_task_id: null,
    tags: [], collaborators: [], checklist: [], recurrence: 'none', admin_emails, ...data, creator_email: me.email,
  });
  try { await recordTaskCreated(t, me); } catch {}
  return t;
}