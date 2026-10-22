import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

export default function InlineText({ value, onSave, className, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value || '');
  useEffect(() => setV(value || ''), [value]);

  const commit = () => {
    setEditing(false);
    const t = v.trim();
    if (t && t !== value) onSave(t);
    else setV(value || '');
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setV(value || ''); setEditing(false); }
        }}
        className={cn('bg-transparent outline-none ring-1 ring-primary/40 rounded px-1 -mx-1 min-w-0 flex-1', className)}
      />
    );
  }
  return (
    <button type="button" onClick={() => setEditing(true)} className={cn('truncate text-left rounded px-1 -mx-1 hover:bg-muted/70 min-w-0', className)}>
      {value || placeholder || tr('Sem título')}
    </button>
  );
}