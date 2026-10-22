import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, icon: Icon, tone = 'text-primary', loading }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className={cn('h-4 w-4', tone)} />}
      </div>
      {loading ? <Skeleton className="h-8 w-12 mt-2" /> : <div className="text-2xl font-semibold mt-1.5 tabular-nums">{value ?? 0}</div>}
    </div>
  );
}