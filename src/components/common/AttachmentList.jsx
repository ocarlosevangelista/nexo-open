import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Paperclip, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useMe } from '@/hooks/useNexo';
import { items, fmtDateTime } from '@/lib/nexo';
import { tr } from '@/lib/i18n';

export default function AttachmentList({ query, defaults, title }) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const { data: list = [], isLoading } = useQuery({
    queryKey: ['attachments', query],
    queryFn: async () => items(await base44.entities.Attachment.filter(query, { sort: '-created_date', limit: 100 })),
  });

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.Attachment.create({ ...defaults, name: file.name, size: file.size, file_uri, uploaded_by: me?.full_name || me?.email });
      qc.invalidateQueries({ queryKey: ['attachments'] });
      toast({ title: tr('Arquivo anexado') });
    } catch {
      toast({ title: tr('Falha ao enviar o arquivo'), variant: 'destructive' });
    }
    setUploading(false);
    e.target.value = '';
  };

  const openFile = async (a) => {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: a.file_uri });
    window.open(signed_url, '_blank');
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">{title || tr('Anexos')}</h4>
        <Button variant="ghost" size="sm" onClick={() => ref.current.click()} disabled={uploading} className="gap-1.5 h-7">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}{tr('Anexar')}
        </Button>
        <input ref={ref} type="file" className="hidden" onChange={onFile} />
      </div>
      {!isLoading && list.length === 0 && <p className="text-xs text-muted-foreground">{tr('Nenhum arquivo anexado.')}</p>}
      <div className="grid sm:grid-cols-2 gap-2">
        {list.map((a) => (
          <button key={a.id} onClick={() => openFile(a)} className="flex items-center gap-3 rounded-lg border p-2.5 text-left hover:border-primary/40 transition-colors">
            <span className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0"><FileText className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block text-sm font-medium truncate">{a.name}</span>
              <span className="block text-[11px] text-muted-foreground truncate">{a.uploaded_by} · {fmtDateTime(a.created_date)}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}