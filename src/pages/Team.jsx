import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UserPlus, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import MemberAvatar from '@/components/common/MemberAvatar';
import TableSkeleton from '@/components/common/TableSkeleton';
import { useMembers, useWorkspace } from '@/hooks/useNexo';
import { ROLES } from '@/lib/nexo';
import MemberMenu from '@/components/team/MemberMenu';
import { tn, tr } from '@/lib/i18n';

export default function Team() {
  const { data: members = [], isLoading } = useMembers();
  const { data: ws } = useWorkspace();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [sending, setSending] = useState(false);

  const invite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      await base44.users.inviteUser(email.trim(), role === 'admin' ? 'admin' : 'user');
      await base44.entities.WorkspaceMember.create({ workspace_id: ws?.id, email: email.trim(), name: name.trim() || email.split('@')[0], role, status: 'invited' });
      qc.invalidateQueries({ queryKey: ['members'] });
      toast({ title: tr('Convite enviado'), description: email });
      setEmail(''); setName('');
    } catch {
      toast({ title: tr('Não foi possível enviar o convite'), variant: 'destructive' });
    }
    setSending(false);
  };
  useEffect(() => {
    const pending = members.filter((m) => m.status === 'invited');
    if (!pending.length) return;
    base44.entities.User.list().then(async (users) => {
      const joined = new Set(users.map((u) => u.email?.toLowerCase()));
      const done = pending.filter((m) => joined.has(m.email?.toLowerCase()));
      if (!done.length) return;
      await base44.entities.WorkspaceMember.bulkUpdate(done.map((m) => ({ id: m.id, status: 'active' })));
      qc.invalidateQueries({ queryKey: ['members'] });
    }).catch(() => {});
  }, [members]);

  const changeRole = async (m, r) => {
    await base44.entities.WorkspaceMember.update(m.id, { role: r });
    qc.invalidateQueries({ queryKey: ['members'] });
    toast({ title: tr('Função atualizada') });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{tr('Equipe')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ws?.name || tr('Espaço de trabalho')} · {tn(members.length, '1 membro', '{n} membros')}</p>
      </div>
      <form onSubmit={invite} className="rounded-xl border p-4 grid sm:grid-cols-[1fr_1fr_160px_auto] gap-2">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={tr('email@empresa.com')} required />
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('Nome (opcional)')} />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{['admin', 'member', 'guest'].map((r) => <SelectItem key={r} value={r}>{ROLES[r]}</SelectItem>)}</SelectContent>
        </Select>
        <Button type="submit" disabled={sending} className="gap-1.5">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}{tr('Convidar')}</Button>
      </form>
      {isLoading ? <TableSkeleton rows={5} /> : (
        <div className="rounded-xl border divide-y">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <MemberAvatar name={m.name} url={m.avatar_url} size={36} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium flex items-center gap-2">{m.name}{m.status === 'invited' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">{tr('Convite pendente')}</span>}</div>
                <div className="text-xs text-muted-foreground truncate">{m.title ? `${m.title} · ` : ''}{m.email}</div>
              </div>
              {m.role === 'owner' ? <span className="text-xs text-muted-foreground px-3">{ROLES.owner}</span> : (
                <Select value={m.role} onValueChange={(r) => changeRole(m, r)}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{['admin', 'member', 'guest'].map((r) => <SelectItem key={r} value={r}>{ROLES[r]}</SelectItem>)}</SelectContent>
                </Select>
              )}
              {m.role !== 'owner' ? <MemberMenu member={m} /> : <span className="w-8" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}