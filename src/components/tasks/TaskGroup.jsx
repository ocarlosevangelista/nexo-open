import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronRight } from 'lucide-react';
import TaskRow from '@/components/tasks/TaskRow';
import QuickAddRow from '@/components/tasks/QuickAddRow';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

export default function TaskGroup({ group, tpl, columns, onQuickAdd, selected, onSelect, header }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1 h-10 px-1">
        <button onClick={() => setOpen(!open)} aria-label={open ? tr('Recolher grupo') : tr('Expandir grupo')} className="p-1 rounded hover:bg-muted">
          <ChevronRight className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-90')} />
        </button>
        {group.color && <span className="h-2.5 w-2.5 rounded-sm" style={{ background: group.color }} />}
        {header ? header(group) : <span className="font-semibold text-sm">{group.label}</span>}
        <span className="text-xs text-muted-foreground ml-1 tabular-nums">{group.tasks.length}</span>
      </div>
      {open && (
        <Droppable droppableId={group.id}>
          {(p) => (
            <div ref={p.innerRef} {...p.droppableProps} className="min-h-[4px] border-t border-border/70">
              {group.tasks.map((t, i) => (
                <Draggable key={t.id} draggableId={t.id} index={i}>
                  {(d) => (
                    <div ref={d.innerRef} {...d.draggableProps}>
                      <TaskRow task={t} tpl={tpl} columns={columns} dragHandle={d.dragHandleProps} selected={selected?.has(t.id)} onSelect={onSelect} />
                    </div>
                  )}
                </Draggable>
              ))}
              {p.placeholder}
              <QuickAddRow onAdd={(title) => onQuickAdd(group, title)} className="pl-14" />
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
}