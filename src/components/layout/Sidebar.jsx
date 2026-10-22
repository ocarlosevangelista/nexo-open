import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, Inbox, CircleCheck, FolderKanban, Users, ChartColumn, Star, Plus } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useUI } from '@/components/layout/UIContext';
import { useProjects } from '@/hooks/useNexo';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

const NAV = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/caixa-de-entrada', label: 'Caixa de entrada', icon: Inbox },
  { to: '/minhas-tarefas', label: 'Minhas tarefas', icon: CircleCheck },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban, end: true },
  { to: '/equipe', label: 'Equipe', icon: Users },
  { to: '/relatorios', label: 'Relatórios', icon: ChartColumn },
  { to: '/favoritos', label: 'Favoritos', icon: Star },
];

const link = (collapsed) => ({ isActive }) =>
  cn('flex items-center gap-3 rounded-md h-9 text-sm transition-colors', collapsed ? 'justify-center' : 'px-3',
    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5');

export default function Sidebar({ collapsed = false }) {
  const { setCreateProject } = useUI();
  const { data: projects = [] } = useProjects();
  return (
    <div className="h-full w-full bg-sidebar flex flex-col overflow-hidden">
      <div className={cn('h-14 flex items-center gap-2.5 shrink-0', collapsed ? 'justify-center' : 'px-5')}>
        <Logo size={26} />
        {!collapsed && <span className="font-semibold tracking-tight text-white text-[15px]">Nexo</span>}
      </div>
      <nav className="px-2 space-y-0.5 mt-2">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={link(collapsed)} title={collapsed ? tr(n.label) : undefined}>
            <n.icon className="h-4 w-4 shrink-0" />{!collapsed && tr(n.label)}
          </NavLink>
        ))}
      </nav>
      <div className={cn('mt-7 flex items-center', collapsed ? 'justify-center' : 'px-5 justify-between')}>
        {!collapsed && <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">{tr('Projetos recentes')}</span>}
        <button onClick={() => setCreateProject(true)} aria-label={tr('Novo projeto')} className="text-white/50 hover:text-white p-1 rounded hover:bg-white/5"><Plus className="h-4 w-4" /></button>
      </div>
      <div className="px-2 mt-1 space-y-0.5 overflow-y-auto flex-1">
        {projects.slice(0, 8).map((p) => (
          <NavLink key={p.id} to={`/projetos/${p.id}`} className={link(collapsed)} title={p.name}>
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: p.color }} />
            {!collapsed && <span className="truncate">{p.name}</span>}
          </NavLink>
        ))}
      </div>
      <div className="p-3 shrink-0">
        <button onClick={() => setCreateProject(true)} className="w-full flex items-center justify-center gap-2 h-9 rounded-md border border-white/10 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
          <Plus className="h-4 w-4" />{!collapsed && tr('Novo projeto')}
        </button>
      </div>
    </div>
  );
}