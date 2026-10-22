import React, { useState } from 'react';
import TaskTable from '@/components/tasks/TaskTable';
import TaskBoard from '@/components/tasks/TaskBoard';
import CalendarView from '@/components/tasks/CalendarView';
import DashboardView from '@/components/tasks/DashboardView';
import BulkBar from '@/components/tasks/BulkBar';
import TableSkeleton from '@/components/common/TableSkeleton';
import { useTaskActions } from '@/hooks/useNexo';
import { handleDrop } from '@/lib/grouping';

export default function TaskViews({ view, groups, tasks, columns, dashQuery, onQuickAdd, loading, empty, header, afterList }) {
  const { update } = useTaskActions();
  const [selected, setSelected] = useState(new Set());
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const onDrop = (r) => handleDrop(r, groups, update);
  const chosen = () => tasks.filter((t) => selected.has(t.id));

  if (view === 'dashboard') return <DashboardView query={dashQuery} />;
  if (loading) return <TableSkeleton />;
  if (view === 'calendar') return <CalendarView tasks={tasks} onDateChange={(t, d) => update(t, { due_date: d })} />;
  if (!tasks.length && empty) return empty;
  if (view === 'board') return <TaskBoard groups={groups} onDrop={onDrop} onQuickAdd={onQuickAdd} />;
  return (
    <>
      <TaskTable groups={groups} columns={columns} onDrop={onDrop} onQuickAdd={onQuickAdd} selected={selected} onSelect={toggle} header={header} />
      {afterList}
      <BulkBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onComplete={() => { chosen().forEach((t) => t.status !== 'done' && update(t, { status: 'done' })); setSelected(new Set()); }}
        onArchive={() => { chosen().forEach((t) => update(t, { archived: true })); setSelected(new Set()); }}
      />
    </>
  );
}