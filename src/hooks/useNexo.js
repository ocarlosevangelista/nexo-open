import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { items } from '@/lib/nexo';
import { updateTask, createTask } from '@/lib/taskApi';
import { toast } from '@/components/ui/use-toast';
import { tr } from '@/lib/i18n';

const E = base44.entities;

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), staleTime: 300000 });
export const useWorkspace = () => useQuery({ queryKey: ['workspace'], queryFn: async () => items(await E.Workspace.filter({}, { limit: 1 }))[0] || null });
export const useMembers = () => useQuery({ queryKey: ['members'], queryFn: async () => items(await E.WorkspaceMember.filter({}, { sort: 'name', limit: 200 })) });
export const useProjects = () => useQuery({ queryKey: ['projects'], queryFn: async () => items(await E.Project.filter({ archived: false }, { sort: '-updated_date', limit: 100 })) });
export const useProjectMembers = (projectId) => useQuery({
  queryKey: ['projectMembers', projectId], enabled: !!projectId,
  queryFn: async () => items(await E.ProjectMember.filter({ project_id: projectId }, { limit: 200 })),
});
export const usePeople = (projectId) => {
  const { data: ws = [] } = useMembers();
  const { data: pm = [] } = useProjectMembers(projectId);
  if (!projectId) return ws;
  const byEmail = new Map();
  ws.forEach((m) => byEmail.set(m.email, m));
  pm.forEach((m) => { if (m.email && !byEmail.has(m.email)) byEmail.set(m.email, { id: `pm:${m.email}`, email: m.email, name: m.name || m.email, role: m.role }); });
  return [...byEmail.values()];
};
export const useSections = (projectId) => useQuery({
  queryKey: ['sections', projectId], enabled: !!projectId,
  queryFn: async () => items(await E.Section.filter({ project_id: projectId, archived: false }, { sort: 'order', limit: 100 })),
});
export const useTasks = (query, sort = 'order', enabled = true) => useQuery({
  queryKey: ['tasks', query, sort], enabled,
  queryFn: async () => items(await E.Task.filter({ archived: false, parent_task_id: null, ...query }, { sort, limit: 300 })),
});

export function useDebounce(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function usePersistentState(key, init) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem('nexo:' + key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  useEffect(() => { localStorage.setItem('nexo:' + key, JSON.stringify(v)); }, [key, v]);
  return [v, setV];
}

export function useOpenTask() {
  const [sp, setSp] = useSearchParams();
  return (id) => { const n = new URLSearchParams(sp); n.set('task', id); setSp(n); };
}

export function useTaskActions() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const refresh = (id) => {
    ['tasks', 'agg', 'home', 'subtasks', 'search'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    if (id) { qc.invalidateQueries({ queryKey: ['task', id] }); qc.invalidateQueries({ queryKey: ['activity', id] }); }
  };
  const update = async (task, changes) => {
    qc.setQueriesData({ queryKey: ['tasks'] }, (old) => (Array.isArray(old) ? old.map((t) => (t.id === task.id ? { ...t, ...changes } : t)) : old));
    qc.setQueryData(['task', task.id], (old) => (old ? { ...old, ...changes } : old));
    try {
      await updateTask(task, changes, me);
      if (changes.status === 'done' && task.status !== 'done') toast({ title: tr('Tarefa concluída') });
      if (changes.archived) toast({ title: 'Tarefa arquivada' });
    } catch {
      toast({ title: tr('Não foi possível salvar a alteração'), variant: 'destructive' });
    }
    refresh(task.id);
  };
  const create = async (data) => {
    try {
      const t = await createTask(data, me);
      toast({ title: 'Tarefa criada' });
      refresh();
      return t;
    } catch {
      toast({ title: tr('Erro ao criar tarefa'), variant: 'destructive' });
    }
  };
  return { update, create, me, refresh };
}