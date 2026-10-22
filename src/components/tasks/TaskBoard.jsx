import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from '@/components/tasks/TaskCard';
import QuickAddRow from '@/components/tasks/QuickAddRow';

export default function TaskBoard({ groups, onDrop, onQuickAdd }) {
  return (
    <DragDropContext onDragEnd={onDrop}>
      <div className="flex gap-3 overflow-x-auto pb-6 pt-2 items-start">
        {groups.map((g) => (
          <div key={g.id} className="w-72 shrink-0 rounded-xl bg-muted/50 flex flex-col max-h-[calc(100vh-230px)]">
            <div className="flex items-center gap-2 px-3 h-11">
              {g.color && <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.color }} />}
              <span className="font-semibold text-sm truncate">{g.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{g.tasks.length}</span>
            </div>
            <Droppable droppableId={g.id}>
              {(p) => (
                <div ref={p.innerRef} {...p.droppableProps} className="px-2 space-y-2 overflow-y-auto min-h-[40px] flex-1">
                  {g.tasks.map((t, i) => (
                    <Draggable key={t.id} draggableId={t.id} index={i}>
                      {(d, s) => (
                        <div ref={d.innerRef} {...d.draggableProps} {...d.dragHandleProps}>
                          <TaskCard task={t} dragging={s.isDragging} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {p.placeholder}
                </div>
              )}
            </Droppable>
            <div className="p-2"><QuickAddRow onAdd={(title) => onQuickAdd(g, title)} className="hover:bg-background" /></div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}