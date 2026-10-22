import React from 'react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MemberAvatar from '@/components/common/MemberAvatar';
import { useProjects, usePeople } from '@/hooks/useNexo';
import { PRIORITY, STATUS, isOverdue } from '@/lib/nexo';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

const trig = 'h-8 w-full border-0 shadow-none bg-transparent px-1.5 text-xs hover:bg-muted focus:ring-0 focus:ring-offset-0';

export function AssigneeCell({ task, update }) {
  const members = usePeople(task.project_id);
  return (
    <Select
      value={task.assignee_email || 'none'}
      onValueChange={(v) => update(task, { assignee_email: v === 'none' ? null : v, assignee_name: members.find((m) => m.email === v)?.name || null })}
    >
      <SelectTrigger className={trig} aria-label={tr('Responsável')}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none"><span className="text-muted-foreground">{tr('Sem responsável')}</span></SelectItem>
        {members.map((m) => (
          <SelectItem key={m.id} value={m.email}>
            <span className="flex items-center gap-2"><MemberAvatar name={m.name} url={m.avatar_url} size={18} />{m.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DateCell({ task, update, field = 'due_date' }) {
  const overdue = field === 'due_date' && isOverdue(task);
  return (
    <input
      type="date"
      aria-label={tr('Data')}
      value={task[field] || ''}
      onChange={(e) => update(task, { [field]: e.target.value || null })}
      className={cn('w-full bg-transparent text-xs rounded px-1.5 h-8 hover:bg-muted outline-none', overdue ? 'text-rose-600 font-semibold' : 'text-foreground/80', !task[field] && 'text-muted-foreground')}
    />
  );
}

export function PriorityCell({ task, update }) {
  return (
    <Select value={task.priority || 'medium'} onValueChange={(v) => update(task, { priority: v })}>
      <SelectTrigger className={trig} aria-label={tr('Prioridade')}><SelectValue /></SelectTrigger>
      <SelectContent>
        {Object.entries(PRIORITY).map(([k, p]) => (
          <SelectItem key={k} value={k}><span className="flex items-center gap-2"><span className={cn('h-2 w-2 rounded-full', p.dot)} />{p.label}</span></SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StatusCell({ task, update }) {
  return (
    <Select value={task.status || 'todo'} onValueChange={(v) => update(task, { status: v })}>
      <SelectTrigger className={trig} aria-label={tr('Status')}><SelectValue /></SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS).map(([k, s]) => (
          <SelectItem key={k} value={k}><span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', s.cls)}>{s.label}</span></SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProjectCell({ task }) {
  const { data: projects = [] } = useProjects();
  const p = projects.find((x) => x.id === task.project_id);
  if (!p) return <span className="text-xs text-muted-foreground px-1.5">—</span>;
  return (
    <Link to={`/projetos/${p.id}`} className="flex items-center gap-1.5 text-xs truncate px-1.5 hover:underline">
      <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: p.color }} />
      <span className="truncate">{p.name}</span>
    </Link>
  );
}