import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUI } from '@/components/layout/UIContext';
import { useMembers, useProjects, useSections, useTaskActions } from '@/hooks/useNexo';
import { PRIORITY } from '@/lib/nexo';
import { tr } from '@/lib/i18n';

function Field({ label, children }) {
  return <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}

export default function CreateTaskDialog() {
  const { createTask, setCreateTask } = useUI();
  const { create, me } = useTaskActions();
  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useMembers();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (createTask) setForm({ title: '', priority: 'medium', assignee_email: me?.email || 'none', project_id: 'none', section_id: '', due_date: '', ...createTask });
  }, [createTask]);
  const pid = form.project_id && form.project_id !== 'none' ? form.project_id : null;
  const { data: sections = [] } = useSections(pid);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    setSaving(true);
    const assignee = form.assignee_email === 'none' ? null : form.assignee_email;
    await create({
      title: form.title.trim(), priority: form.priority, due_date: form.due_date || null, project_id: pid,
      section_id: pid ? form.section_id || sections[0]?.id || null : null,
      assignee_email: assignee, assignee_name: members.find((m) => m.email === assignee)?.name || null,
    });
    setSaving(false);
    setCreateTask(null);
  };

  return (
    <Dialog open={!!createTask} onOpenChange={(o) => !o && setCreateTask(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{tr('Nova tarefa')}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Input autoFocus value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder={tr('Nome da tarefa')} className="h-11 text-base" />
          <div className="grid grid-cols-2 gap-3">
            <Field label={tr('Projeto')}>
              <Select value={form.project_id || 'none'} onValueChange={(v) => { set('project_id', v); set('section_id', ''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">{tr('Sem projeto')}</SelectItem>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={tr('Seção')}>
              <Select value={form.section_id || sections[0]?.id || ''} onValueChange={(v) => set('section_id', v)} disabled={!pid}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={tr('Responsável')}>
              <Select value={form.assignee_email || 'none'} onValueChange={(v) => set('assignee_email', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">{tr('Sem responsável')}</SelectItem>{members.map((m) => <SelectItem key={m.id} value={m.email}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={tr('Data de conclusão')}><Input type="date" value={form.due_date || ''} onChange={(e) => set('due_date', e.target.value)} /></Field>
            <Field label={tr('Prioridade')}>
              <Select value={form.priority || 'medium'} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PRIORITY).map(([k, p]) => <SelectItem key={k} value={k}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateTask(null)}>{tr('Cancelar')}</Button>
            <Button type="submit" disabled={saving || !form.title?.trim()}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{tr('Criar tarefa')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}