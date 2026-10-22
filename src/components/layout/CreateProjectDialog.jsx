import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { PROJECT_ICONS } from '@/components/common/ProjectIcon';
import { useUI } from '@/components/layout/UIContext';
import { useMe, useWorkspace } from '@/hooks/useNexo';
import { PROJECT_COLORS } from '@/lib/nexo';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

const E = base44.entities;
const EMPTY = { name: '', description: '', color: PROJECT_COLORS[0], icon: 'folder', privacy: 'shared', start_date: '', end_date: '' };

export default function CreateProjectDialog() {
  const { createProject, setCreateProject } = useUI();
  const { data: me } = useMe();
  const { data: ws } = useWorkspace();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (createProject) setF(EMPTY); }, [createProject]);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    setSaving(true);
    try {
      const p = await E.Project.create({ ...f, name: f.name.trim(), start_date: f.start_date || null, end_date: f.end_date || null, workspace_id: ws?.id, owner_email: me.email, owner_name: me.full_name, member_emails: [me.email], status: 'on_track', favorite: false, archived: false });
      await E.Section.bulkCreate([tr('A fazer'), tr('Em andamento'), tr('Concluído')].map((name, i) => ({ project_id: p.id, name, order: i, archived: false })));
      await E.ProjectMember.create({ project_id: p.id, email: me.email, name: me.full_name, role: 'owner' });
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: tr('Projeto criado') });
      setCreateProject(false);
      navigate(`/projetos/${p.id}`);
    } catch {
      toast({ title: tr('Não foi possível criar o projeto'), variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <Dialog open={createProject} onOpenChange={setCreateProject}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{tr('Novo projeto')}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Input autoFocus value={f.name} onChange={(e) => set('name', e.target.value)} placeholder={tr('Nome do projeto')} className="h-11 text-base" />
          <Textarea value={f.description} onChange={(e) => set('description', e.target.value)} placeholder={tr('Descrição (opcional)')} className="resize-none" />
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button type="button" key={c} onClick={() => set('color', c)} aria-label={tr('Cor {c}', { c })} className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: c }}>
                {f.color === c && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PROJECT_ICONS).map(([k, Icon]) => (
              <button type="button" key={k} onClick={() => set('icon', k)} aria-label={tr('Ícone {k}', { k })} className={cn('h-9 w-9 rounded-lg border flex items-center justify-center', f.icon === k ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground')}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input type="date" value={f.start_date} onChange={(e) => set('start_date', e.target.value)} aria-label={tr('Data inicial')} />
            <Input type="date" value={f.end_date} onChange={(e) => set('end_date', e.target.value)} aria-label={tr('Data final')} />
            <Select value={f.privacy} onValueChange={(v) => set('privacy', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="shared">{tr('Compartilhado')}</SelectItem><SelectItem value="private">{tr('Privado')}</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateProject(false)}>{tr('Cancelar')}</Button>
            <Button type="submit" disabled={saving || !f.name.trim()}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{tr('Criar projeto')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}