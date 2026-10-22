import React from 'react';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

export default function ViewTabs({ views, value, onChange }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto -mb-px" role="tablist">
      {views.map((v) => (
        <button
          key={v.id}
          role="tab"
          aria-selected={value === v.id}
          onClick={() => onChange(v.id)}
          className={cn('flex items-center gap-1.5 px-3 h-10 text-sm border-b-2 whitespace-nowrap transition-colors', value === v.id ? 'border-primary text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground')}
        >
          {v.icon && <v.icon className="h-4 w-4" />}{tr(v.label)}
        </button>
      ))}
    </div>
  );
}