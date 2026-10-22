import React from 'react';
import { Plus, Search, ArrowUpDown, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import FilterPopover from '@/components/tasks/FilterPopover';
import CustomizePopover from '@/components/tasks/CustomizePopover';
import { GROUP_OPTIONS, SORT_OPTIONS } from '@/lib/grouping';
import { tr } from '@/lib/i18n';

const trig = 'h-8 w-auto gap-1.5 border-0 shadow-none text-sm hover:bg-muted focus:ring-0';

export default function TaskToolbar({ onAdd, search, setSearch, filters, setFilters, sort, setSort, groupBy, setGroupBy, columns, hidden, setHidden, customizeExtra, projects }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-3">
      <Button size="sm" onClick={onAdd} className="gap-1.5"><Plus className="h-4 w-4" />{tr('Adicionar tarefa')}</Button>
      <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
      <FilterPopover filters={filters} setFilters={setFilters} projects={projects} />
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger className={trig} aria-label={tr('Ordenar')}><ArrowUpDown className="h-4 w-4" /><span>{tr('Ordenar')}: {SORT_OPTIONS[sort]}</span></SelectTrigger>
        <SelectContent>{Object.entries(SORT_OPTIONS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
      </Select>
      {setGroupBy && (
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className={trig} aria-label={tr('Agrupar')}><Layers className="h-4 w-4" /><span>{tr('Agrupar')}: {GROUP_OPTIONS[groupBy]}</span></SelectTrigger>
          <SelectContent>{Object.entries(GROUP_OPTIONS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {columns && <CustomizePopover columns={columns} hidden={hidden} setHidden={setHidden} extra={customizeExtra} />}
      <div className="relative ml-auto w-full sm:w-60">
        <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr('Buscar nesta visualização')} className="h-8 pl-8 text-sm" />
      </div>
    </div>
  );
}