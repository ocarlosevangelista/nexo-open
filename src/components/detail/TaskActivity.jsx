import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MemberAvatar from '@/components/common/MemberAvatar';
import { useMembers } from '@/hooks/useNexo';
import { items, fmtDateTime } from '@/lib/nexo';
import { tr, tStored } from '@/lib/i18n';

// Nestes eventos o detalhe é um rótulo do app (status, prioridade, "Sem responsável"); nos demais é texto do usuário.
const TRANSLATED_DETAIL = new Set(['alterou o status', 'concluiu a tarefa', 'alterou a prioridade', 'alterou o responsável']);

const renderBody = (text) => text.split(/(@\w+)/).map((p, i) => (p.startsWith('@') ? <span key={i} className="text-primary font-medium">{p}</span> : p));

export default function TaskActivity({ task }) {
  const { data: members = [] } = useMembers();
  const avatar = (email) => members.find((m) => m.email === email)?.avatar_url;
  const { data: comments = [] } = useQuery({ queryKey: ['comments', task.id], queryFn: async () => items(await base44.entities.Comment.filter({ task_id: task.id }, { sort: 'created_date', limit: 200 })) });
  const { data: acts = [] } = useQuery({ queryKey: ['activity', task.id], queryFn: async () => items(await base44.entities.Activity.filter({ task_id: task.id }, { sort: '-created_date', limit: 100 })) });

  return (
    <Tabs defaultValue="comments">
      <TabsList className="h-8">
        <TabsTrigger value="comments" className="text-xs">{tr('Comentários')} ({comments.length})</TabsTrigger>
        <TabsTrigger value="activity" className="text-xs">{tr('Histórico')}</TabsTrigger>
      </TabsList>
      <TabsContent value="comments" className="space-y-4 mt-4">
        {comments.length === 0 && <p className="text-xs text-muted-foreground">{tr('Nenhum comentário ainda. Inicie a conversa abaixo.')}</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <MemberAvatar name={c.author_name} url={avatar(c.author_email)} size={28} />
            <div className="min-w-0">
              <div className="text-sm"><span className="font-medium">{c.author_name}</span> <span className="text-xs text-muted-foreground ml-1">{fmtDateTime(c.created_date)}</span></div>
              <p className="text-sm text-foreground/85 whitespace-pre-wrap mt-0.5">{renderBody(c.body)}</p>
            </div>
          </div>
        ))}
      </TabsContent>
      <TabsContent value="activity" className="mt-4">
        <ol className="relative border-l ml-2 space-y-3">
          {acts.map((a) => (
            <li key={a.id} className="pl-4 text-xs relative">
              <span className="absolute -left-[4.5px] top-1 h-2 w-2 rounded-full bg-primary/60" />
              <span className="font-medium text-foreground">{a.actor_name}</span> <span className="text-muted-foreground">{tStored(a.action)}</span>
              {a.detail && <span className="text-foreground"> · {TRANSLATED_DETAIL.has(a.action) ? tStored(a.detail) : a.detail}</span>}
              <div className="text-muted-foreground/80 mt-0.5">{fmtDateTime(a.created_date)}</div>
            </li>
          ))}
        </ol>
      </TabsContent>
    </Tabs>
  );
}