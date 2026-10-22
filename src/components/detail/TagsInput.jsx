import React, { useState } from 'react';
import { X } from 'lucide-react';
import { tr } from '@/lib/i18n';

export default function TagsInput({ task, update }) {
  const tags = task.tags || [];
  const [v, setV] = useState('');
  const add = () => {
    const t = v.trim();
    if (t && !tags.includes(t)) update(task, { tags: [...tags, t] });
    setV('');
  };
  return (
    <div className="flex flex-wrap items-center gap-1 py-1">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
          {t}
          <button onClick={() => update(task, { tags: tags.filter((x) => x !== t) })} aria-label={tr('Remover {name}', { name: t })}><X className="h-3 w-3" /></button>
        </span>
      ))}
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
        onBlur={add}
        placeholder={tr('+ etiqueta')}
        className="text-xs bg-transparent outline-none w-24 h-6 px-1"
      />
    </div>
  );
}