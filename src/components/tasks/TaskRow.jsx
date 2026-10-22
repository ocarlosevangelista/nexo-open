import React from 'react';
import { GripVertical, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import InlineText from '@/components/common/InlineText';
import CompleteToggle from '@/components/tasks/CompleteToggle';
import { useOpenTask, useTaskActions } from '@/hooks/useNexo';
import { isOverdue } from '@/lib/nexo';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

export default function TaskRow({ task, tpl, columns, dragHandle, selected, onSelect }) {
  const { update } = useTaskActions();
  const open = useOpenTask();
  return (
    <div
      style={{ gridTemplateColumns: tpl }}
      className={cn('grid items-center h-10 border-b border-border/70 px-2 text-sm bg-background hover:bg-muted/40 group/row transition-colors', selected && 'bg-primary/5', isOverdue(task) && 'shadow-[inset_2px_0_0_0_rgb(244_63_94)]')}
    >
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <span {...dragHandle} aria-label={tr('Arrastar')} className="opacity-0 group-hover/row:opacity-100 text-muted-foreground cursor-grab">
          <GripVertical className="h-4 w-4" />
        </span>
        <Checkbox
          checked={!!selected}
          onCheckedChange={() => onSelect?.(task.id)}
          aria-label={tr('Selecionar tarefa')}
          className="opacity-30 group-hover/row:opacity-100 data-[state=checked]:opacity-100"
        />
        <CompleteToggle task={task} />
        <InlineText value={task.title} onSave={(v) => update(task, { title: v })} className={cn(task.status === 'done' && 'line-through text-muted-foreground')} />
        <button onClick={() => open(task.id)} className="ml-auto shrink-0 opacity-0 group-hover/row:opacity-100 focus:opacity-100 text-xs text-muted-foreground flex items-center hover:text-foreground">
          {tr('Detalhes')} <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {columns.map((c) => (
        <div key={c.key} className="px-1 min-w-0 border-l border-border/50 h-full flex items-center">{c.render(task, update)}</div>
      ))}
    </div>
  );
}