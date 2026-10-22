import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, CircleCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProjectIcon from '@/components/common/ProjectIcon';
import { useDebounce, useOpenTask } from '@/hooks/useNexo';
import { items } from '@/lib/nexo';
import { tr } from '@/lib/i18n';

export default function GlobalSearch() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const dq = useDebounce(q.trim());
  const openTask = useOpenTask();
  const navigate = useNavigate();
  const rx = { $regex: dq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const { data, isFetching } = useQuery({
    queryKey: ['search', dq], enabled: dq.length > 1,
    queryFn: async () => {
      const [t, p] = await Promise.all([
        base44.entities.Task.filter({ archived: false, title: rx }, { limit: 6 }),
        base44.entities.Project.filter({ archived: false, name: rx }, { limit: 4 }),
      ]);
      return { tasks: items(t), projects: items(p) };
    },
  });

  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const go = (fn) => { fn(); setOpen(false); setQ(''); };
  const empty = data && !data.tasks.length && !data.projects.length;

  return (
    <div className="relative w-full max-w-md">
      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => e.key === 'Escape' && ref.current.blur()}
        placeholder={tr('Buscar tarefas e projetos')}
        className="w-full h-9 rounded-full bg-muted/70 pl-9 pr-14 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/30 transition-all"
      />
      <kbd className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border rounded px-1.5">Ctrl K</kbd>
      {open && dq.length > 1 && (
        <div className="absolute top-full mt-2 w-full rounded-xl border bg-popover shadow-lg p-1.5 z-50">
          {isFetching && !data && <p className="text-xs text-muted-foreground p-3">{tr('Buscando…')}</p>}
          {empty && <p className="text-xs text-muted-foreground p-3">{tr('Nenhum resultado para “{q}”.', { q: dq })}</p>}
          {data?.projects.map((p) => (
            <button key={p.id} onMouseDown={() => go(() => navigate(`/projetos/${p.id}`))} className="flex items-center gap-2.5 w-full text-left text-sm px-2.5 py-2 rounded-lg hover:bg-muted">
              <ProjectIcon project={p} size={20} />{p.name}
            </button>
          ))}
          {data?.tasks.map((t) => (
            <button key={t.id} onMouseDown={() => go(() => openTask(t.id))} className="flex items-center gap-2.5 w-full text-left text-sm px-2.5 py-2 rounded-lg hover:bg-muted">
              <CircleCheck className="h-4 w-4 text-muted-foreground" /><span className="truncate">{t.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}