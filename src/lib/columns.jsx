import React from 'react';
import { tr } from '@/lib/i18n';
import { AssigneeCell, DateCell, PriorityCell, ProjectCell, StatusCell } from '@/components/tasks/TaskCells';

export const baseColumns = () => [
  { key: 'assignee', label: tr('Responsável'), width: '170px', render: (t, u) => <AssigneeCell task={t} update={u} /> },
  { key: 'due_date', label: tr('Data de conclusão'), width: '140px', render: (t, u) => <DateCell task={t} update={u} /> },
  { key: 'priority', label: tr('Prioridade'), width: '120px', render: (t, u) => <PriorityCell task={t} update={u} /> },
  { key: 'project', label: tr('Projeto'), width: '160px', render: (t) => <ProjectCell task={t} /> },
  { key: 'status', label: tr('Status'), width: '140px', render: (t, u) => <StatusCell task={t} update={u} /> },
];