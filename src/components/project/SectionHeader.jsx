import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import InlineText from '@/components/common/InlineText';
import { tr } from '@/lib/i18n';

export default function SectionHeader({ group, sections, projectId }) {
  const qc = useQueryClient();
  const S = base44.entities.Section;
  const refresh = () => qc.invalidateQueries({ queryKey: ['sections', projectId] });
  if (!group.section) return <span className="font-semibold text-sm">{group.label}</span>;
  const idx = sections.findIndex((s) => s.id === group.id);
  const swap = async (dir) => {
    const other = sections[idx + dir];
    if (!other) return;
    await Promise.all([S.update(group.id, { order: other.order }), S.update(other.id, { order: group.section.order })]);
    refresh();
  };
  return (
    <div className="flex items-center gap-1 group/sh">
      <InlineText value={group.label} onSave={async (v) => { await S.update(group.id, { name: v }); refresh(); }} className="font-semibold text-sm" />
      <DropdownMenu>
        <DropdownMenuTrigger className="p-1 rounded hover:bg-muted opacity-0 group-hover/sh:opacity-100 focus:opacity-100" aria-label={tr('Ações da seção')}><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem disabled={idx === 0} onClick={() => swap(-1)}><ArrowUp className="h-4 w-4 mr-2" />{tr('Mover para cima')}</DropdownMenuItem>
          <DropdownMenuItem disabled={idx === sections.length - 1} onClick={() => swap(1)}><ArrowDown className="h-4 w-4 mr-2" />{tr('Mover para baixo')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}