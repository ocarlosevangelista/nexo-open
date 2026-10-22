import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle2, CircleAlert, FolderKanban, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/common/StatCard';
import TaskMiniList from '@/components/home/TaskMiniList';
import CompletedChart from '@/components/home/CompletedChart';
import ProjectCard from '@/components/project/ProjectCard';
import { useUI } from '@/components/layout/UIContext';
import { useMe, useProjects } from '@/hooks/useNexo';
import { todayStr } from '@/lib/nexo';
import { fmt, tr } from '@/lib/i18n';

const T = base44.entities.Task;

export default function Home() {
  const { data: me } = useMe();
  const { data: projects = [] } = useProjects();
  const { setCreateTask, setCreateProject } = useUI();
  const email = me?.email;
  const t = todayStr();
  const base = { assignee_email: email, archived: false, parent_task_id: null };
  const open = { ...base, status: { $ne: 'done' } };
  const { data: s, isLoading } = useQuery({
    queryKey: ['home', 'stats', email], enabled: !!email,
    queryFn: async () => {
      const [pending, done, overdue, active] = await Promise.all([
        T.count(open), T.count({ ...base, status: 'done' }), T.count({ ...open, due_date: { $lt: t } }),
        base44.entities.Project.count({ archived: false, status: { $ne: 'completed' } }),
      ]);
      return { pending, done, overdue, active };
    },
  });
  const h = new Date().getHours();
  const greet = tr(h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite');

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground first-letter:uppercase">{fmt(new Date(), "EEEE, d 'de' MMMM", 'EEEE, MMMM d')}</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">{greet}, {me?.full_name?.split(' ')[0] || tr('bem-vindo')}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateProject(true)} className="gap-1.5"><FolderKanban className="h-4 w-4" />{tr('Novo projeto')}</Button>
          <Button onClick={() => setCreateTask({})} className="gap-1.5"><Plus className="h-4 w-4" />{tr('Nova tarefa')}</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={tr('Tarefas pendentes')} value={s?.pending} icon={Clock} tone="text-sky-500" loading={isLoading} />
        <StatCard label={tr('Concluídas')} value={s?.done} icon={CheckCircle2} tone="text-emerald-500" loading={isLoading} />
        <StatCard label={tr('Atrasadas')} value={s?.overdue} icon={CircleAlert} tone="text-rose-500" loading={isLoading} />
        <StatCard label={tr('Projetos ativos')} value={s?.active} icon={FolderKanban} loading={isLoading} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <TaskMiniList title={tr('Para hoje')} query={{ ...open, due_date: t }} empty={tr('Nada para hoje. Aproveite o respiro.')} />
          <TaskMiniList title={tr('Atrasadas')} tone="danger" query={{ ...open, due_date: { $lt: t } }} empty={tr('Nenhuma tarefa atrasada. Excelente!')} />
          <TaskMiniList title={tr('Próximas')} tone="soon" query={{ ...open, due_date: { $gt: t } }} empty={tr('Nenhuma tarefa futura agendada.')} />
        </div>
        <div className="space-y-4"><CompletedChart email={email} /></div>
      </div>
      <div>
        <h2 className="text-sm font-semibold mb-3">{tr('Projetos recentes')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {projects.slice(0, 4).map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </div>
    </div>
  );
}