import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MemberAvatar from '@/components/common/MemberAvatar';
import { useMembers } from '@/hooks/useNexo';
import { useProjectMembers, useSaveProject } from '@/hooks/useProject';
import { tr } from '@/lib/i18n';

export default function ProjectOverview({ project }) {
  const save = useSaveProject(project);
  const { data: all = [] } = useMembers();
  const { data: pm = [] } = useProjectMembers(project.id);
  const [desc, setDesc] = useState(project.description || '');
  useEffect(() => setDesc(project.description || ''), [project.id]);
  const { data: c } = useQuery({
    queryKey: ['home', 'progress', project.id],
    queryFn: async () => {
      const q = { project_id: project.id, archived: false, parent_task_id: null };
      const [total, done] = await Promise.all([base44.entities.Task.count(q), base44.entities.Task.count({ ...q, status: 'done' })]);
      return { total, done };
    },
  });
  const pct = c?.total ? Math.round((c.done / c.total) * 100) : 0;

  return (
    <div className="grid lg:grid-cols-3 gap-6 py-6">
      <div className="lg:col-span-2 space-y-6">
        <section>
          <h3 className="text-sm font-semibold mb-2">{tr('Descrição do projeto')}</h3>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={() => desc !== (project.description || '') && save({ description: desc })} placeholder={tr('Qual é o objetivo deste projeto?')} className="min-h-[140px] resize-none" />
        </section>
        <section className="rounded-xl border p-4">
          <div className="flex justify-between text-sm mb-2"><span className="font-semibold">{tr('Progresso')}</span><span className="text-muted-foreground tabular-nums">{tr('{done} de {total} tarefas', { done: c?.done || 0, total: c?.total || 0 })} · {pct}%</span></div>
          <Progress value={pct} className="h-2" />
        </section>
      </div>
      <aside className="space-y-4">
        <div className="rounded-xl border p-4 space-y-3">
          <label className="text-xs text-muted-foreground">{tr('Responsável pelo projeto')}</label>
          <Select value={project.owner_email || ''} onValueChange={(v) => save({ owner_email: v, owner_name: all.find((m) => m.email === v)?.name })}>
            <SelectTrigger className="h-9"><SelectValue placeholder={tr('Selecionar')} /></SelectTrigger>
            <SelectContent>{all.map((m) => <SelectItem key={m.id} value={m.email}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">{tr('Data inicial')}</label><Input type="date" value={project.start_date || ''} onChange={(e) => save({ start_date: e.target.value || null })} className="h-9" /></div>
            <div><label className="text-xs text-muted-foreground">{tr('Data final')}</label><Input type="date" value={project.end_date || ''} onChange={(e) => save({ end_date: e.target.value || null })} className="h-9" /></div>
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <h4 className="text-xs text-muted-foreground mb-3">{tr('Membros')} ({pm.length})</h4>
          <div className="space-y-2">
            {pm.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-sm">
                <MemberAvatar name={m.name || m.email} url={all.find((x) => x.email === m.email)?.avatar_url} size={26} />{m.name || m.email}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}