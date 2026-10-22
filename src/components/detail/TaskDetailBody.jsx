import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, X, Maximize2, Archive, CircleAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import TaskFields from '@/components/detail/TaskFields';
import DescriptionEditor from '@/components/detail/DescriptionEditor';
import TaskSubtasks from '@/components/detail/TaskSubtasks';
import TaskChecklist from '@/components/detail/TaskChecklist';
import TaskDependencies from '@/components/detail/TaskDependencies';
import TaskActivity from '@/components/detail/TaskActivity';
import CommentComposer from '@/components/detail/CommentComposer';
import AttachmentList from '@/components/common/AttachmentList';
import { useTaskActions } from '@/hooks/useNexo';
import { fmtDateTime, isOverdue } from '@/lib/nexo';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

export default function TaskDetailBody({ taskId, onClose, onExpand }) {
  const { update } = useTaskActions();
  const { data: task, isLoading } = useQuery({ queryKey: ['task', taskId], queryFn: () => base44.entities.Task.get(taskId) });
  const [title, setTitle] = useState('');
  useEffect(() => setTitle(task?.title || ''), [task?.id, task?.title]);

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (!task) return <div className="p-10 text-center text-sm text-muted-foreground">{tr('Tarefa não encontrada.')}</div>;
  const done = task.status === 'done';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 h-14 border-b shrink-0">
        <Button variant={done ? 'default' : 'outline'} size="sm" onClick={() => update(task, { status: done ? 'todo' : 'done' })} className={cn('gap-1.5', done && 'bg-emerald-600 hover:bg-emerald-700')}>
          <Check className="h-4 w-4" />{done ? tr('Concluída') : tr('Marcar como concluída')}
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <ConfirmDialog
            title={tr('Arquivar esta tarefa?')}
            description={tr('A tarefa sairá das listas, mas continuará guardada no histórico.')}
            confirmLabel={tr('Arquivar')}
            onConfirm={() => { update(task, { archived: true }); onClose?.(); }}
            trigger={<Button variant="ghost" size="icon" aria-label={tr('Arquivar')}><Archive className="h-4 w-4" /></Button>}
          />
          {onExpand && <Button variant="ghost" size="icon" onClick={onExpand} aria-label={tr('Abrir em página completa')}><Maximize2 className="h-4 w-4" /></Button>}
          {onClose && <Button variant="ghost" size="icon" onClick={onClose} aria-label={tr('Fechar')}><X className="h-4 w-4" /></Button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
        <div>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== task.title && update(task, { title: title.trim() })}
            rows={1}
            aria-label={tr('Título da tarefa')}
            className="w-full resize-none bg-transparent text-2xl font-semibold tracking-tight outline-none rounded focus:ring-1 focus:ring-primary/30 px-1 -mx-1"
          />
          {task.completed_at && <p className="text-xs text-emerald-700 mt-1">{tr('Concluída por {name} em {date}', { name: task.completed_by, date: fmtDateTime(task.completed_at) })}</p>}
          {isOverdue(task) && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><CircleAlert className="h-3.5 w-3.5" />{tr('Esta tarefa está atrasada')}</p>}
        </div>
        <TaskFields task={task} update={update} />
        <DescriptionEditor task={task} update={update} />
        <TaskSubtasks task={task} />
        <TaskChecklist task={task} update={update} />
        <AttachmentList query={{ task_id: task.id }} defaults={{ task_id: task.id, project_id: task.project_id }} />
        <TaskDependencies task={task} />
        <TaskActivity task={task} />
      </div>
      <CommentComposer task={task} />
    </div>
  );
}