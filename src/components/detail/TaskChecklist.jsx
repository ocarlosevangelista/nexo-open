import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

export default function TaskChecklist({ task, update }) {
  const list = task.checklist || [];
  const [v, setV] = useState('');
  const set = (l) => update(task, { checklist: l });
  const done = list.filter((i) => i.done).length;
  const add = () => { if (v.trim()) set([...list, { text: v.trim(), done: false }]); setV(''); };
  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <h4 className="text-sm font-semibold">{tr('Checklist')}</h4>
        {list.length > 0 && <><Progress value={(done / list.length) * 100} className="h-1.5 flex-1" /><span className="text-xs text-muted-foreground tabular-nums">{done}/{list.length}</span></>}
      </div>
      <div className="space-y-1">
        {list.map((i, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm group/ck h-8">
            <Checkbox checked={i.done} onCheckedChange={(c) => set(list.map((x, j) => (j === idx ? { ...x, done: !!c } : x)))} />
            <span className={cn('flex-1', i.done && 'line-through text-muted-foreground')}>{i.text}</span>
            <button onClick={() => set(list.filter((_, j) => j !== idx))} className="opacity-0 group-hover/ck:opacity-100 text-muted-foreground" aria-label={tr('Remover item')}><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={tr('+ Adicionar item')} className="text-sm bg-transparent outline-none w-full h-8 px-1" />
      </div>
    </section>
  );
}