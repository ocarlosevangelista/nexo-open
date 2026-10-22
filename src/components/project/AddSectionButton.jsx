import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { tr } from '@/lib/i18n';

export default function AddSectionButton({ projectId, sections }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState('');
  const submit = async () => {
    const name = v.trim();
    setOpen(false); setV('');
    if (!name) return;
    const order = Math.max(-1, ...sections.map((s) => s.order || 0)) + 1;
    await base44.entities.Section.create({ project_id: projectId, name, order, archived: false });
    qc.invalidateQueries({ queryKey: ['sections', projectId] });
    toast({ title: tr('Seção criada') });
  };
  if (open) return (
    <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onBlur={submit} onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
      placeholder={tr('Nome da seção')} className="ml-8 my-3 h-9 px-2 text-sm font-semibold outline-none rounded ring-1 ring-primary/40 bg-transparent" />
  );
  return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground ml-2 my-3 h-9 px-2 rounded hover:bg-muted">
      <Plus className="h-4 w-4" />{tr('Adicionar seção')}
    </button>
  );
}