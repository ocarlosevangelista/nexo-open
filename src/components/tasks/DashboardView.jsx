import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { ListTodo, CheckCircle2, Clock, CircleAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/common/StatCard';
import { STATUS, PRIORITY, todayStr } from '@/lib/nexo';
import { tr } from '@/lib/i18n';

const PCOLORS = { low: '#cbd5e1', medium: '#38bdf8', high: '#fb923c', urgent: '#f43f5e' };

function ChartCard({ title, data }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <h4 className="text-sm font-semibold mb-4">{title}</h4>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} name={tr('Tarefas')}>
              {data.map((d) => <Cell key={d.name} fill={d.color || 'hsl(var(--primary))'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DashboardView({ query = {} }) {
  const q = { archived: false, parent_task_id: null, ...query };
  const { data, isLoading } = useQuery({
    queryKey: ['agg', q],
    queryFn: async () => {
      const T = base44.entities.Task;
      const [s, p, overdue] = await Promise.all([
        T.aggregate({ query: q, groupBy: 'status' }),
        T.aggregate({ query: q, groupBy: 'priority' }),
        T.count({ ...q, status: { $ne: 'done' }, due_date: { $lt: todayStr() } }),
      ]);
      return { s: s.rows || [], p: p.rows || [], overdue };
    },
  });
  const byStatus = Object.fromEntries((data?.s || []).map((r) => [r.status, r.count]));
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const statusData = Object.entries(STATUS).map(([k, v]) => ({ name: v.label, value: byStatus[k] || 0 }));
  const prio = Object.fromEntries((data?.p || []).map((r) => [r.priority, r.count]));
  const prioData = Object.entries(PRIORITY).map(([k, v]) => ({ name: v.label, value: prio[k] || 0, color: PCOLORS[k] }));

  return (
    <div className="py-4 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={tr('Total de tarefas')} value={total} icon={ListTodo} loading={isLoading} />
        <StatCard label={tr('Concluídas')} value={byStatus.done} icon={CheckCircle2} tone="text-emerald-500" loading={isLoading} />
        <StatCard label={tr('Pendentes')} value={total - (byStatus.done || 0)} icon={Clock} tone="text-sky-500" loading={isLoading} />
        <StatCard label={tr('Atrasadas')} value={data?.overdue} icon={CircleAlert} tone="text-rose-500" loading={isLoading} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title={tr('Tarefas por status')} data={statusData} />
        <ChartCard title={tr('Tarefas por prioridade')} data={prioData} />
      </div>
    </div>
  );
}