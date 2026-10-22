import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import MemberAvatar from '@/components/common/MemberAvatar';
import { useMe, useMembers } from '@/hooks/useNexo';
import { recordComment } from '@/lib/recordEvent';
import { tr } from '@/lib/i18n';

const first = (n) => n.split(' ')[0];

export default function CommentComposer({ task }) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: members = [] } = useMembers();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const m = body.match(/@(\w*)$/);
  const sugg = m ? members.filter((x) => x.name.toLowerCase().startsWith(m[1].toLowerCase())).slice(0, 5) : [];

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      await recordComment(task, text, me);
      setBody('');
      qc.invalidateQueries({ queryKey: ['comments', task.id] });
      qc.invalidateQueries({ queryKey: ['activity', task.id] });
    } catch {
      toast({ title: tr('Não foi possível publicar o comentário'), variant: 'destructive' });
    }
    setSending(false);
  };

  return (
    <div className="border-t bg-muted/30 p-4 relative shrink-0">
      {sugg.length > 0 && (
        <div className="absolute bottom-full left-14 mb-1 w-56 rounded-lg border bg-popover shadow-md p-1 z-10">
          {sugg.map((x) => (
            <button key={x.id} onClick={() => setBody(body.replace(/@(\w*)$/, '@' + first(x.name) + ' '))} className="flex items-center gap-2 w-full text-sm px-2 py-1.5 rounded hover:bg-muted">
              <MemberAvatar name={x.name} url={x.avatar_url} size={20} />{x.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <MemberAvatar name={me?.full_name || ''} size={30} />
        <div className="flex-1 space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
            placeholder={tr('Escreva um comentário… use @nome para mencionar')}
            className="min-h-[64px] bg-background resize-none text-sm"
          />
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">{tr('Ctrl + Enter para publicar')}</span>
            <Button size="sm" onClick={submit} disabled={sending || !body.trim()} className="gap-1.5">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}{tr('Publicar')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}