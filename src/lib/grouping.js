import { STATUS, PRIORITY, todayStr, plusDays } from '@/lib/nexo';
import { tr } from '@/lib/i18n';

export const DEFAULT_FILTERS = { status: 'all', priority: 'all', project: 'all', hideDone: false };
export const GROUP_OPTIONS = {
  get date() { return tr('Data'); }, get status() { return tr('Status'); },
  get priority() { return tr('Prioridade'); }, get project() { return tr('Projeto'); },
};
export const SORT_OPTIONS = {
  get order() { return tr('Manual'); }, get due_date() { return tr('Data de conclusão'); },
  get title() { return tr('Nome'); }, get '-created_date'() { return tr('Mais recentes'); },
};

export function filterQuery(f, q) {
  const x = {};
  if (f.status !== 'all') x.status = f.status;
  else if (f.hideDone) x.status = { $ne: 'done' };
  if (f.priority !== 'all') x.priority = f.priority;
  if (f.project === 'none') x.project_id = { $in: [null, ''] };
  else if (f.project && f.project !== 'all') x.project_id = f.project;
  if (q) x.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  return x;
}

const dateKey = (t) => {
  if (!t.due_date) return 'recent';
  if (t.due_date <= todayStr()) return 'today';
  if (t.due_date <= plusDays(7)) return 'week';
  return 'later';
};

export function buildGroups(tasks, by, projects = []) {
  let defs;
  if (by === 'status') defs = Object.entries(STATUS).map(([k, v]) => ({ id: k, label: v.label, match: (t) => t.status === k, apply: { status: k } }));
  else if (by === 'priority') defs = Object.entries(PRIORITY).reverse().map(([k, v]) => ({ id: k, label: v.label, match: (t) => t.priority === k, apply: { priority: k } }));
  else if (by === 'project') defs = [
    ...projects.map((p) => ({ id: p.id, label: p.name, color: p.color, match: (t) => t.project_id === p.id, apply: { project_id: p.id, section_id: null } })),
    { id: 'noproject', label: tr('Sem projeto'), match: (t) => !t.project_id, apply: { project_id: null, section_id: null } },
  ];
  else defs = [
    { id: 'recent', label: tr('Atribuídas recentemente'), match: (t) => dateKey(t) === 'recent', apply: { due_date: null } },
    { id: 'today', label: tr('Hoje'), match: (t) => dateKey(t) === 'today', apply: { due_date: todayStr() } },
    { id: 'week', label: tr('Próxima semana'), match: (t) => dateKey(t) === 'week', apply: { due_date: plusDays(7) } },
    { id: 'later', label: tr('Mais tarde'), match: (t) => dateKey(t) === 'later', apply: { due_date: plusDays(14) } },
  ];
  return defs.map((d) => ({ ...d, tasks: tasks.filter(d.match) }));
}

function computeOrder(list, index) {
  const prev = list[index - 1], next = list[index];
  if (!prev && !next) return Date.now();
  if (!prev) return (next.order || 0) - 1000;
  if (!next) return (prev.order || 0) + 1000;
  return ((prev.order || 0) + (next.order || 0)) / 2;
}

export function handleDrop(result, groups, update) {
  const { source, destination, draggableId } = result;
  if (!destination) return;
  if (source.droppableId === destination.droppableId && source.index === destination.index) return;
  const task = groups.flatMap((g) => g.tasks).find((t) => t.id === draggableId);
  const dest = groups.find((g) => g.id === destination.droppableId);
  const list = dest.tasks.filter((t) => t.id !== draggableId);
  const changes = { order: computeOrder(list, destination.index) };
  if (source.droppableId !== destination.droppableId) Object.assign(changes, dest.apply);
  update(task, changes);
}