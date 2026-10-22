import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { tr } from '@/lib/i18n';

export default function CustomizePopover({ columns, hidden, setHidden, extra }) {
  const toggle = (k) => setHidden(hidden.includes(k) ? hidden.filter((x) => x !== k) : [...hidden, k]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5"><SlidersHorizontal className="h-4 w-4" />{tr('Personalizar')}</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <p className="text-xs font-medium text-muted-foreground mb-2">{tr('Colunas visíveis')}</p>
        <div className="space-y-2">
          {columns.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={!hidden.includes(c.key)} onCheckedChange={() => toggle(c.key)} />{c.label}
            </label>
          ))}
        </div>
        {extra && <div className="border-t mt-3 pt-3">{extra}</div>}
      </PopoverContent>
    </Popover>
  );
}