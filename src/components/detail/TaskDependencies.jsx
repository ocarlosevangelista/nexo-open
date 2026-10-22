import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Link2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOpenTask, useTasks } from '@/hooks/useNexo';
import { items } from '@/lib/nexo';
import { tr } from '@/lib/i18n';

export default function TaskDependencies({ task }) {
  const qc = useQueryClient();
  const open = useOpenTask();
  const key = ['deps', task.id];
  const { data: deps = [] } = useQuery({ queryKey: key, queryFn: async () => items(await base44.entities.TaskDependency.filter({ task_id: task.id })) });
  const { data: candidates = [] } = useTasks({ project_id: task.project_id }, 'title', !!task.project_id);
  const options = candidates.filter((t) => t.id !== task.id && !deps.some((d) => d.depends_on_task_id === t.id));

  const add = async (id) => {
    const t = candidates.find((x) => x.id === id);
    await base44.entities.TaskDependency.create({ task_id: task.id, depends_on_task_id: id, depends_on_title: t?.title, type: 'blocked_by' });
    qc.invalidateQueries({ queryKey: key });
  };
  const remove = async (d) => { await base44.entities.TaskDependency.delete(d.id); qc.invalidateQueries({ queryKey: key }); };

  return (
    <section>
      <h4 className="text-sm font-semibold mb-2">{tr('Dependências')}</h4>
      <div className="space-y-1 mb-2">
        {deps.map((d) => (
          <div key={d.id} className="flex items-center gap-2 text-sm h-8 px-2 rounded-md bg-amber-50/60 border border-amber-100">
            <Link2 className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs text-amber-700">{tr('Bloqueada por')}</span>
            <button onClick={() => open(d.depends_on_task_id)} className="truncate hover:underline">{d.depends_on_title}</button>
            <button onClick={() => remove(d)} className="ml-auto text-muted-foreground" aria-label={tr('Remover dependência')}><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      {task.project_id ? (
        <Select value="" onValueChange={add}>
          <SelectTrigger className="h-8 text-xs w-64"><SelectValue placeholder={tr('+ Adicionar tarefa bloqueadora')} /></SelectTrigger>
          <SelectContent>{options.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
        </Select>
      ) : <p className="text-xs text-muted-foreground">{tr('Associe a tarefa a um projeto para definir dependências.')}</p>}
    </section>
  );
}