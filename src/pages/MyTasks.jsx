import React, { useMemo, useState } from 'react';
import { List, SquareKanban, CalendarDays, LayoutDashboard, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ViewTabs from '@/components/tasks/ViewTabs';
import TaskToolbar from '@/components/tasks/TaskToolbar';
import TaskViews from '@/components/tasks/TaskViews';
import FilterPopover from '@/components/tasks/FilterPopover';
import EmptyState from '@/components/common/EmptyState';
import MemberAvatar from '@/components/common/MemberAvatar';
import { useUI } from '@/components/layout/UIContext';
import { useDebounce, useMe, usePersistentState, useProjects, useTaskActions, useTasks } from '@/hooks/useNexo';
import { DEFAULT_FILTERS, buildGroups, filterQuery } from '@/lib/grouping';
import { baseColumns } from '@/lib/columns';
import { tr } from '@/lib/i18n';

export const VIEWS = [
  { id: 'list', label: 'Lista', icon: List },
  { id: 'board', label: 'Quadro', icon: SquareKanban },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays },
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
];

export default function MyTasks() {
  const { data: me } = useMe();
  const { data: projects = [] } = useProjects();
  const { create } = useTaskActions();
  const { setCreateTask, setImportCalendar } = useUI();
  const [view, setView] = usePersistentState('mytasks:view', 'list');
  const [groupBy, setGroupBy] = usePersistentState('mytasks:group', 'date');
  const [sort, setSort] = usePersistentState('mytasks:sort', 'order');
  const [filters, setFilters] = usePersistentState('mytasks:filters', DEFAULT_FILTERS);
  const [hidden, setHidden] = usePersistentState('mytasks:hidden', []);
  const [search, setSearch] = useState('');
  const q = useDebounce(search);

  const query = useMemo(() => ({ assignee_email: me?.email, ...filterQuery(filters, q) }), [me?.email, filters, q]);
  const { data: tasks = [], isLoading } = useTasks(query, sort, !!me);
  const groups = useMemo(() => buildGroups(tasks, groupBy, projects), [tasks, groupBy, projects]);
  const all = baseColumns();
  const columns = all.filter((c) => !hidden.includes(c.key));

  const quickAdd = (g, title) => create({ title, assignee_email: me.email, assignee_name: me.full_name, ...g.apply });
  const filtered = q || filters.status !== 'all' || filters.priority !== 'all' || (filters.project && filters.project !== 'all') || filters.hideDone;

  return (
    <div className="px-4 md:px-8">
      <div className="pt-6 border-b">
        <div className="flex items-center gap-3 mb-3">
          <MemberAvatar name={me?.full_name || ''} size={36} />
          <h1 className="text-2xl font-semibold tracking-tight">{tr('Minhas tarefas')}</h1>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => setImportCalendar(true)}>
            <CalendarDays className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">{tr('Importar do Google Agenda')}</span>
          </Button>
        </div>
        <ViewTabs views={VIEWS} value={view} onChange={setView} />
      </div>
      {view === 'dashboard' ? (
        <div className="py-3"><FilterPopover filters={filters} setFilters={setFilters} projects={projects} /></div>
      ) : (
        <TaskToolbar projects={projects}
          onAdd={() => setCreateTask({})} search={search} setSearch={setSearch}
          filters={filters} setFilters={setFilters} sort={sort} setSort={setSort}
          groupBy={groupBy} setGroupBy={setGroupBy} columns={all} hidden={hidden} setHidden={setHidden}
        />
      )}
      <TaskViews
        view={view} groups={groups} tasks={tasks} columns={columns} loading={isLoading}
        dashQuery={query} onQuickAdd={quickAdd}
        empty={
          <EmptyState
            icon={CircleCheck}
            title={filtered ? tr('Nenhuma tarefa encontrada') : tr('Tudo em dia por aqui')}
            description={filtered ? tr('Ajuste os filtros ou a busca para ver mais tarefas.') : tr('As tarefas atribuídas a você aparecerão aqui.')}
            action={filtered ? <Button variant="outline" onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(''); }}>{tr('Limpar filtros')}</Button> : <Button onClick={() => setCreateTask({})}>{tr('Adicionar tarefa')}</Button>}
          />
        }
      />
    </div>
  );
}