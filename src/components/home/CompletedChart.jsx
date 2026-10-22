import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { startOfWeek, subWeeks, addWeeks } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { fmt, tr } from '@/lib/i18n';

export default function CompletedChart({ email }) {
  const { data = [] } = useQuery({
    queryKey: ['home', 'chart', email], enabled: !!email,
    queryFn: async () => {
      const start = startOfWeek(subWeeks(new Date(), 7));
      const weeks = Array.from({ length: 8 }, (_, i) => addWeeks(start, i));
      const counts = await Promise.all(weeks.map((w) => base44.entities.Task.count({
        assignee_email: email, status: 'done',
        completed_at: { $gte: w.toISOString(), $lt: addWeeks(w, 1).toISOString() },
      })));
      return weeks.map((w, i) => ({ name: fmt(w, 'd MMM', 'MMM d'), value: counts[i] }));
    },
  });
  return (
    <div className="rounded-xl border bg-background p-4">
      <h3 className="text-sm font-semibold">{tr('Tarefas concluídas')}</h3>
      <p className="text-xs text-muted-foreground mb-3">{tr('Últimas 8 semanas')}</p>
      <div className="h-44">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip />
            <Area type="monotone" dataKey="value" name={tr('Concluídas')} stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#cc)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}