import React, { useState } from 'react';
import { Plus, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

export default function QuickAddRow({ onAdd, className }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState('');

  const submit = async () => {
    const t = v.trim();
    if (!t) return setOpen(false);
    setV('');
    await onAdd(t);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={cn('flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground hover:text-foreground w-full text-left rounded-md', className)}>
        <Plus className="h-4 w-4" /> {tr('Adicionar tarefa…')}
      </button>
    );
  }
  return (
    <div className={cn('flex items-center gap-2 h-9 px-3', className)}>
      <Circle className="h-4 w-4 text-muted-foreground" />
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') { setOpen(false); setV(''); }
        }}
        onBlur={() => { if (!v.trim()) setOpen(false); }}
        placeholder={tr('Nome da tarefa e Enter')}
        className="flex-1 bg-transparent outline-none text-sm"
      />
    </div>
  );
}