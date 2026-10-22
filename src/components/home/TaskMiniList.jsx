import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';
import CompleteToggle from '@/components/tasks/CompleteToggle';
import { useOpenTask, useProjects } from '@/hooks/useNexo';
import { items, fmtDate, isOverdue } from '@/lib/nexo';
import { cn } from '@/lib/utils';

export default function TaskMiniList({ title, query, sort = 'due_date', empty, tone }) {
  const open = useOpenTask();
  const { data: projects = [] } = useProjects();
  const { data: list = [], isLoading } = useQuery({
    queryKey: ['home', 'list', query, sort], enabled: !!query.assignee_email,
    queryFn: async () => items(await base44.entities.Task.filter(query, { sort, limit: 6 })),
  });
  return (
    <div className="rounded-xl border bg-background">
      <div className="flex items-center gap-2 px-4 h-11 border-b">
        <span className={cn('h-2 w-2 rounded-full', tone === 'danger' ? 'bg-rose-500' : tone === 'soon' ? 'bg-sky-400' : 'bg-primary')} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">{list.length}</span>
      </div>
      <div className="divide-y">
        {isLoading && [0, 1, 2].map((i) => <div key={i} className="px-4 py-3"><Skeleton className="h-4 w-full" /></div>)}
        {!isLoading && !list.length && <p className="px-4 py-6 text-sm text-muted-foreground text-center">{empty}</p>}
        {list.map((t) => {
          const p = projects.find((x) => x.id === t.project_id);
          return (
            <button key={t.id} onClick={() => open(t.id)} className="w-full flex items-center gap-3 px-4 h-11 text-sm text-left hover:bg-muted/40 transition-colors">
              <CompleteToggle task={t} />
              <span className="truncate flex-1">{t.title}</span>
              {p && <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />{p.name}</span>}
              <span className={cn('text-xs w-16 text-right', isOverdue(t) ? 'text-rose-600 font-medium' : 'text-muted-foreground')}>{fmtDate(t.due_date)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}