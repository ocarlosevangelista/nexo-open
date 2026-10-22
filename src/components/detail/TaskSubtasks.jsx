import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CompleteToggle from '@/components/tasks/CompleteToggle';
import QuickAddRow from '@/components/tasks/QuickAddRow';
import { useOpenTask, useTaskActions } from '@/hooks/useNexo';
import { items } from '@/lib/nexo';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

export default function TaskSubtasks({ task }) {
  const { create } = useTaskActions();
  const open = useOpenTask();
  const { data: subs = [] } = useQuery({
    queryKey: ['subtasks', task.id],
    queryFn: async () => items(await base44.entities.Task.filter({ parent_task_id: task.id, archived: false }, { sort: 'order', limit: 100 })),
  });
  return (
    <section>
      <h4 className="text-sm font-semibold mb-2">{tr('Subtarefas')} <span className="text-muted-foreground font-normal">{subs.length || ''}</span></h4>
      <div className="rounded-lg border divide-y">
        {subs.map((s) => (
          <div key={s.id} className="flex items-center gap-2 h-9 px-3 text-sm">
            <CompleteToggle task={s} />
            <button onClick={() => open(s.id)} className={cn('truncate text-left hover:underline', s.status === 'done' && 'line-through text-muted-foreground')}>{s.title}</button>
          </div>
        ))}
        <QuickAddRow onAdd={(title) => create({ title, parent_task_id: task.id, project_id: task.project_id, section_id: task.section_id })} />
      </div>
    </section>
  );
}