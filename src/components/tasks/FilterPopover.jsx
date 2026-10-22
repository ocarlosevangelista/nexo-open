import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { STATUS, PRIORITY } from '@/lib/nexo';
import { DEFAULT_FILTERS } from '@/lib/grouping';
import { tr } from '@/lib/i18n';

export default function FilterPopover({ filters, setFilters, projects }) {
  const project = filters.project || 'all';
  const active = (filters.status !== 'all') + (filters.priority !== 'all') + (project !== 'all') + !!filters.hideDone;
  const set = (k, v) => setFilters({ ...filters, [k]: v });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5"><Filter className="h-4 w-4" />{tr('Filtros')}{active > 0 && <span className="ml-1 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center">{active}</span>}</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-4">
        {projects && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{tr('Projeto')}</label>
            <Select value={project} onValueChange={(v) => set('project', v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr('Todos')}</SelectItem>
                <SelectItem value="none">{tr('Sem projeto')}</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{tr('Status')}</label>
          <Select value={filters.status} onValueChange={(v) => set('status', v)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{tr('Todos')}</SelectItem>{Object.entries(STATUS).map(([k, s]) => <SelectItem key={k} value={k}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{tr('Prioridade')}</label>
          <Select value={filters.priority} onValueChange={(v) => set('priority', v)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{tr('Todas')}</SelectItem>{Object.entries(PRIORITY).map(([k, s]) => <SelectItem key={k} value={k}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <label className="flex items-center justify-between text-sm">{tr('Ocultar concluídas')} <Switch checked={!!filters.hideDone} onCheckedChange={(v) => set('hideDone', v)} /></label>
        <Button variant="outline" size="sm" className="w-full" onClick={() => setFilters(DEFAULT_FILTERS)}>{tr('Limpar filtros')}</Button>
      </PopoverContent>
    </Popover>
  );
}