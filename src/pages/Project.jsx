import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Paperclip, FolderX } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';
import ViewTabs from '@/components/tasks/ViewTabs';
import TaskToolbar from '@/components/tasks/TaskToolbar';
import TaskViews from '@/components/tasks/TaskViews';
import EmptyState from '@/components/common/EmptyState';
import AttachmentList from '@/components/common/AttachmentList';
import ProjectHeader from '@/components/project/ProjectHeader';
import ProjectOverview from '@/components/project/ProjectOverview';
import SectionHeader from '@/components/project/SectionHeader';
import AddSectionButton from '@/components/project/AddSectionButton';
import { AddFieldForm, customColumn } from '@/components/project/CustomFields';
import { useUI } from '@/components/layout/UIContext';
import { useDebounce, usePersistentState, useSections, useTaskActions, useTasks } from '@/hooks/useNexo';
import { DEFAULT_FILTERS, filterQuery } from '@/lib/grouping';
import { baseColumns } from '@/lib/columns';
import { items } from '@/lib/nexo';
import { VIEWS } from '@/pages/MyTasks';
import { tr } from '@/lib/i18n';

const E = base44.entities;
const TABS = [{ id: 'overview', label: 'Visão geral', icon: LayoutGrid }, ...VIEWS, { id: 'files', label: 'Arquivos', icon: Paperclip }];

export default function Project() {
  const { id } = useParams();
  const { create } = useTaskActions();
  const { setCreateTask } = useUI();
  const { data: project, isLoading } = useQuery({ queryKey: ['project', id], queryFn: () => E.Project.get(id) });
  const { data: sections = [] } = useSections(id);
  const [tab, setTab] = usePersistentState(`project:${id}:tab`, 'list');
  const [filters, setFilters] = usePersistentState(`project:${id}:filters`, DEFAULT_FILTERS);
  const [sort, setSort] = usePersistentState(`project:${id}:sort`, 'order');
  const [hidden, setHidden] = usePersistentState(`project:${id}:hidden`, []);
  const [search, setSearch] = useState('');
  const q = useDebounce(search);
  const query = useMemo(() => ({ project_id: id, ...filterQuery(filters, q) }), [id, filters, q]);
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(query, sort);
  const { data: fields = [] } = useQuery({ queryKey: ['fields', id], queryFn: async () => items(await E.CustomField.filter({ project_id: id }, { sort: 'created_date', limit: 50 })) });
  const { data: values = [] } = useQuery({ queryKey: ['fieldValues', id], queryFn: async () => items(await E.CustomFieldValue.filter({ project_id: id }, { limit: 1000 })) });

  const groups = useMemo(() => {
    const g = sections.map((s) => ({ id: s.id, label: s.name, section: s, apply: { section_id: s.id }, tasks: tasks.filter((t) => t.section_id === s.id) }));
    const orphan = tasks.filter((t) => !sections.some((s) => s.id === t.section_id));
    return orphan.length ? [{ id: 'nosection', label: tr('Sem seção'), apply: { section_id: null }, tasks: orphan }, ...g] : g;
  }, [sections, tasks]);

  const all = [...baseColumns().filter((c) => c.key !== 'project'), ...fields.map((f) => customColumn(f, values))];
  const columns = all.filter((c) => !hidden.includes(c.key));

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-9 w-72" /><Skeleton className="h-6 w-96" /><Skeleton className="h-64 w-full" /></div>;
  if (!project || project.archived) return <EmptyState icon={FolderX} title={tr('Projeto não encontrado')} description={tr('Ele pode ter sido arquivado ou você não tem acesso.')} />;

  return (
    <div>
      <ProjectHeader project={project}><ViewTabs views={TABS} value={tab} onChange={setTab} /></ProjectHeader>
      <div className="px-4 md:px-8">
        {tab === 'overview' && <ProjectOverview project={project} />}
        {tab === 'files' && <div className="py-6"><AttachmentList title={tr('Arquivos do projeto')} query={{ project_id: id }} defaults={{ project_id: id }} /></div>}
        {!['overview', 'files'].includes(tab) && (
          <>
            {tab !== 'dashboard' && (
              <TaskToolbar
                onAdd={() => setCreateTask({ project_id: id })} search={search} setSearch={setSearch}
                filters={filters} setFilters={setFilters} sort={sort} setSort={setSort}
                columns={all} hidden={hidden} setHidden={setHidden} customizeExtra={<AddFieldForm projectId={id} />}
              />
            )}
            <TaskViews
              view={tab} groups={groups} tasks={tasks} columns={columns} loading={loadingTasks}
              dashQuery={{ project_id: id }} onQuickAdd={(g, title) => create({ title, project_id: id, ...g.apply })}
              header={(g) => <SectionHeader group={g} sections={sections} projectId={id} />}
              afterList={<AddSectionButton projectId={id} sections={sections} />}
            />
          </>
        )}
      </div>
    </div>
  );
}