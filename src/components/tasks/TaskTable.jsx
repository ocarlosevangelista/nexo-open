import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import TaskGroup from '@/components/tasks/TaskGroup';
import { tr } from '@/lib/i18n';

export default function TaskTable({ groups, columns, onDrop, onQuickAdd, selected, onSelect, header }) {
  const tpl = `minmax(280px,1fr) ${columns.map((c) => c.width || '140px').join(' ')}`;
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 300 + columns.length * 145 }}>
        <div className="grid h-9 items-center border-b text-xs font-medium text-muted-foreground px-2 sticky top-0 bg-background z-10" style={{ gridTemplateColumns: tpl }}>
          <div className="pl-12">{tr('Nome da tarefa')}</div>
          {columns.map((c) => <div key={c.key} className="px-2 border-l border-border/50 truncate">{c.label}</div>)}
        </div>
        <DragDropContext onDragEnd={onDrop}>
          {groups.map((g) => (
            <TaskGroup key={g.id} group={g} tpl={tpl} columns={columns} onQuickAdd={onQuickAdd} selected={selected} onSelect={onSelect} header={header} />
          ))}
        </DragDropContext>
      </div>
    </div>
  );
}