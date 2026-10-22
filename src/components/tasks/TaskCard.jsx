import React from 'react';
import { Calendar } from 'lucide-react';
import CompleteToggle from '@/components/tasks/CompleteToggle';
import MemberAvatar from '@/components/common/MemberAvatar';
import { useMembers, useOpenTask } from '@/hooks/useNexo';
import { PRIORITY, fmtDate, isOverdue } from '@/lib/nexo';
import { cn } from '@/lib/utils';

export default function TaskCard({ task, dragging }) {
  const open = useOpenTask();
  const { data: members = [] } = useMembers();
  const m = members.find((x) => x.email === task.assignee_email);
  const p = PRIORITY[task.priority];
  return (
    <div
      onClick={() => open(task.id)}
      className={cn('rounded-lg border bg-background p-3 text-sm cursor-pointer hover:border-primary/40 transition-all', dragging && 'shadow-lg rotate-1 border-primary/50', isOverdue(task) && 'border-l-2 border-l-rose-500')}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5"><CompleteToggle task={task} /></span>
        <span className={cn('font-medium leading-snug', task.status === 'done' && 'line-through text-muted-foreground')}>{task.title}</span>
      </div>
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {task.tags.slice(0, 3).map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{t}</span>)}
        </div>
      )}
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        {m ? <MemberAvatar name={m.name} url={m.avatar_url} size={20} /> : <span className="h-5 w-5 rounded-full border border-dashed" />}
        {task.due_date && (
          <span className={cn('flex items-center gap-1', isOverdue(task) && 'text-rose-600 font-medium')}>
            <Calendar className="h-3 w-3" />{fmtDate(task.due_date)}
          </span>
        )}
        {p && <span className="ml-auto flex items-center gap-1"><span className={cn('h-2 w-2 rounded-full', p.dot)} />{p.label}</span>}
      </div>
    </div>
  );
}