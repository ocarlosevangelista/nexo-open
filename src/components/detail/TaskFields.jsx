import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssigneeCell, DateCell, PriorityCell, StatusCell } from '@/components/tasks/TaskCells';
import CollaboratorsPicker from '@/components/detail/CollaboratorsPicker';
import TagsInput from '@/components/detail/TagsInput';
import { useProjects, useSections } from '@/hooks/useNexo';
import { tr } from '@/lib/i18n';

const trig = 'h-8 border-0 shadow-none bg-transparent px-1.5 text-xs hover:bg-muted focus:ring-0';
const RECUR = {
  get none() { return tr('Não se repete'); }, get daily() { return tr('Diariamente'); },
  get weekly() { return tr('Semanalmente'); }, get monthly() { return tr('Mensalmente'); },
};

function Row({ label, children }) {
  return (
    <>
      <div className="text-xs text-muted-foreground h-8 flex items-center">{label}</div>
      <div className="min-w-0 flex items-center">{children}</div>
    </>
  );
}

export default function TaskFields({ task, update }) {
  const { data: projects = [] } = useProjects();
  const { data: sections = [] } = useSections(task.project_id);
  return (
    <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-0.5">
      <Row label={tr('Projeto')}>
        <Select value={task.project_id || 'none'} onValueChange={(v) => update(task, { project_id: v === 'none' ? null : v, section_id: null })}>
          <SelectTrigger className={trig}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{tr('Sem projeto')}</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />{p.name}</span></SelectItem>)}
          </SelectContent>
        </Select>
      </Row>
      {task.project_id && (
        <Row label={tr('Seção')}>
          <Select value={task.section_id || 'none'} onValueChange={(v) => update(task, { section_id: v === 'none' ? null : v })}>
            <SelectTrigger className={trig}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">{tr('Sem seção')}</SelectItem>{sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </Row>
      )}
      <Row label={tr('Responsável')}><div className="w-56"><AssigneeCell task={task} update={update} /></div></Row>
      <Row label={tr('Colaboradores')}><CollaboratorsPicker task={task} update={update} /></Row>
      <Row label={tr('Data inicial')}><div className="w-40"><DateCell task={task} update={update} field="start_date" /></div></Row>
      <Row label={tr('Data de conclusão')}><div className="w-40"><DateCell task={task} update={update} /></div></Row>
      <Row label={tr('Prioridade')}><div className="w-40"><PriorityCell task={task} update={update} /></div></Row>
      <Row label={tr('Status')}><div className="w-44"><StatusCell task={task} update={update} /></div></Row>
      <Row label={tr('Recorrência')}>
        <Select value={task.recurrence || 'none'} onValueChange={(v) => update(task, { recurrence: v, is_recurring: v !== 'none' })}>
          <SelectTrigger className={trig + ' w-44'}><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(RECUR).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </Row>
      <Row label={tr('Etiquetas')}><TagsInput task={task} update={update} /></Row>
    </div>
  );
}