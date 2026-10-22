import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskActions } from '@/hooks/useNexo';
import { tr } from '@/lib/i18n';

export default function CompleteToggle({ task }) {
  const { update } = useTaskActions();
  const done = task.status === 'done';
  return (
    <button
      type="button"
      aria-label={done ? tr('Reabrir tarefa') : tr('Concluir tarefa')}
      onClick={(e) => { e.stopPropagation(); update(task, { status: done ? 'todo' : 'done' }); }}
      className={cn(
        'shrink-0 rounded-full border flex items-center justify-center transition-all h-[18px] w-[18px]',
        done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40 text-transparent hover:border-emerald-500 hover:text-emerald-500'
      )}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </button>
  );
}