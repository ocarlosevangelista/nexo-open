import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AtSign, MessageSquare, UserPlus, CalendarClock, FolderKanban, CheckCheck, Inbox as InboxIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import EmptyState from '@/components/common/EmptyState';
import TableSkeleton from '@/components/common/TableSkeleton';
import { useMe, useOpenTask, usePersistentState } from '@/hooks/useNexo';
import { items, fmtDateTime } from '@/lib/nexo';
import { cn } from '@/lib/utils';
import { tr, tStored } from '@/lib/i18n';

const TYPES = {
  all: { label: 'Todas' }, mention: { label: 'Menções', icon: AtSign }, comment: { label: 'Comentários', icon: MessageSquare },
  assigned: { label: 'Atribuídas', icon: UserPlus }, due_change: { label: 'Prazos', icon: CalendarClock }, project_update: { label: 'Projetos', icon: FolderKanban },
};

export default function Inbox() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const openTask = useOpenTask();
  const navigate = useNavigate();
  const [type, setType] = usePersistentState('inbox:type', 'all');
  const query = { recipient_email: me?.email, ...(type !== 'all' && { type }) };
  const { data: list = [], isLoading } = useQuery({
    queryKey: ['notifications', query], enabled: !!me,
    queryFn: async () => items(await base44.entities.Notification.filter(query, { sort: '-created_date', limit: 100 })),
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['notifCount'] }); };

  const openItem = async (n) => {
    if (!n.read) { await base44.entities.Notification.update(n.id, { read: true }); refresh(); }
    if (n.task_id) openTask(n.task_id); else if (n.project_id) navigate(`/projetos/${n.project_id}`);
  };
  const markAll = async () => {
    await base44.entities.Notification.updateMany({ recipient_email: me.email, read: false }, { $set: { read: true } });
    refresh();
    toast({ title: tr('Todas as notificações foram marcadas como lidas') });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{tr('Caixa de entrada')}</h1>
        <Button variant="outline" size="sm" onClick={markAll} className="gap-1.5"><CheckCheck className="h-4 w-4" />{tr('Marcar tudo como lido')}</Button>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b mb-2">
        {Object.entries(TYPES).map(([k, t]) => (
          <button key={k} onClick={() => setType(k)} className={cn('px-3 h-9 text-sm border-b-2 -mb-px whitespace-nowrap', type === k ? 'border-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground')}>{tr(t.label)}</button>
        ))}
      </div>
      {isLoading ? <TableSkeleton rows={5} /> : list.length === 0 ? (
        <EmptyState icon={InboxIcon} title={tr('Caixa de entrada vazia')} description={tr('Menções, comentários e atualizações aparecerão aqui.')} />
      ) : (
        <div className="divide-y">
          {list.map((n) => {
            const Icon = TYPES[n.type]?.icon || InboxIcon;
            return (
              <button key={n.id} onClick={() => openItem(n)} className={cn('w-full flex items-start gap-3 py-3.5 px-2 text-left rounded-lg hover:bg-muted/40 transition-colors', !n.read && 'bg-primary/[0.03]')}>
                <span className={cn('h-9 w-9 rounded-full flex items-center justify-center shrink-0', n.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}><Icon className="h-4 w-4" /></span>
                <span className="flex-1 min-w-0">
                  <span className={cn('block text-sm', !n.read && 'font-semibold')}>{tStored(n.title)}</span>
                  {n.body && <span className="block text-sm text-muted-foreground truncate mt-0.5">{n.type === 'project_update' ? tStored(n.body) : n.body}</span>}
                  <span className="block text-xs text-muted-foreground/80 mt-1">{fmtDateTime(n.created_date)}</span>
                </span>
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-2" aria-label={tr('Não lida')} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}