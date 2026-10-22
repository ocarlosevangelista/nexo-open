import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Share2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import MemberAvatar from '@/components/common/MemberAvatar';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useMembers } from '@/hooks/useNexo';
import { useProjectMembers, useSaveProject } from '@/hooks/useProject';
import { tr } from '@/lib/i18n';

const PROLES = {
  get owner() { return tr('Proprietário'); }, get admin() { return tr('Administrador'); }, get editor() { return tr('Editor'); },
  get commenter() { return tr('Comentarista'); }, get viewer() { return tr('Leitor'); },
};

export default function ShareDialog({ project }) {
  const qc = useQueryClient();
  const save = useSaveProject(project);
  const { data: all = [] } = useMembers();
  const { data: pm = [] } = useProjectMembers(project.id);
  const refresh = () => qc.invalidateQueries({ queryKey: ['projectMembers', project.id] });
  const available = all.filter((m) => !pm.some((x) => x.email === m.email));

  const syncAll = async () => {
    const fresh = await base44.entities.ProjectMember.filter({ project_id: project.id }, { limit: 200 });
    const member_emails = [...new Set(fresh.items.map((x) => x.email).filter(Boolean))];
    const admin_emails = [...new Set(fresh.items.filter((x) => x.role === 'owner' || x.role === 'admin').map((x) => x.email).filter(Boolean))];
    await Promise.all([
      base44.entities.Project.update(project.id, { member_emails }),
      base44.entities.Task.updateMany({ project_id: project.id, archived: false }, { $set: { admin_emails } }),
    ]);
    qc.invalidateQueries({ queryKey: ['projects'] });
    qc.invalidateQueries({ queryKey: ['tasks'] });
  };
  const add = async (email) => {
    const m = all.find((x) => x.email === email);
    await base44.entities.ProjectMember.create({ project_id: project.id, email, name: m?.name, role: 'editor' });
    await syncAll();
    refresh(); toast({ title: tr('{name} adicionado ao projeto', { name: m?.name }) });
  };
  const setRole = async (m, role) => { await base44.entities.ProjectMember.update(m.id, { role }); await syncAll(); refresh(); };
  const remove = async (m) => {
    await base44.entities.ProjectMember.delete(m.id);
    await syncAll();
    refresh(); toast({ title: tr('Acesso removido') });
  };

  return (
    <Dialog>
      <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Share2 className="h-4 w-4" />{tr('Compartilhar')}</Button></DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{tr('Compartilhar “{name}”', { name: project.name })}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div><div className="text-sm font-medium">{tr('Visibilidade')}</div><div className="text-xs text-muted-foreground">{tr('Privado: apenas membros do projeto')}</div></div>
            <Select value={project.privacy || 'shared'} onValueChange={(v) => save({ privacy: v })}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="shared">{tr('Compartilhado')}</SelectItem><SelectItem value="private">{tr('Privado')}</SelectItem></SelectContent>
            </Select>
          </div>
          <Select value="" onValueChange={add}>
            <SelectTrigger><SelectValue placeholder={tr('Adicionar membro do espaço…')} /></SelectTrigger>
            <SelectContent>{available.map((m) => <SelectItem key={m.id} value={m.email}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
          <div className="divide-y rounded-lg border">
            {pm.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2">
                <MemberAvatar name={m.name || m.email} url={all.find((x) => x.email === m.email)?.avatar_url} size={28} />
                <span className="text-sm flex-1 truncate">{m.name || m.email}</span>
                {m.role === 'owner' ? <span className="text-xs text-muted-foreground">{PROLES.owner}</span> : (
                  <>
                    <Select value={m.role} onValueChange={(r) => setRole(m, r)}>
                      <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{['admin', 'editor', 'commenter', 'viewer'].map((r) => <SelectItem key={r} value={r}>{PROLES[r]}</SelectItem>)}</SelectContent>
                    </Select>
                    <ConfirmDialog title={tr('Remover acesso?')} description={tr('{name} deixará de acessar este projeto.', { name: m.name })} confirmLabel={tr('Remover')} onConfirm={() => remove(m)}
                      trigger={<Button variant="ghost" size="icon" className="h-7 w-7" aria-label={tr('Remover')}><X className="h-3.5 w-3.5" /></Button>} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}