import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useOpenTask, usePersistentState } from '@/hooks/useNexo';
import { isOverdue, ymd } from '@/lib/nexo';
import { cn } from '@/lib/utils';
import { fmt, tr } from '@/lib/i18n';

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];  // traduzidos com tr() na exibição

export default function CalendarView({ tasks, onDateChange }) {
  const [mode, setMode] = usePersistentState('cal:mode', 'month');
  const [cursor, setCursor] = useState(new Date());
  const [over, setOver] = useState(null);
  const open = useOpenTask();
  const days = mode === 'month'
    ? eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor)), end: endOfWeek(endOfMonth(cursor)) })
    : eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) });
  const move = (d) => setCursor(mode === 'month' ? addMonths(cursor, d) : addWeeks(cursor, d));

  const onDrop = (e, day) => {
    e.preventDefault(); setOver(null);
    const t = tasks.find((x) => x.id === e.dataTransfer.getData('text/plain'));
    if (t && t.due_date !== ymd(day)) onDateChange(t, ymd(day));
  };

  return (
    <div className="py-3">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => move(-1)} aria-label={tr('Anterior')}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => move(1)} aria-label={tr('Próximo')}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>{tr('Hoje')}</Button>
        <h3 className="font-semibold capitalize ml-2">{fmt(cursor, "MMMM 'de' yyyy", 'MMMM yyyy')}</h3>
        <div className="ml-auto flex rounded-lg border p-0.5 text-xs">
          {[['month', tr('Mês')], ['week', tr('Semana')]].map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} className={cn('px-3 py-1 rounded-md', mode === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{l}</button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 border-l border-t rounded-lg overflow-hidden min-w-[700px]">
          {WEEK.map((w) => <div key={w} className="text-xs font-medium text-muted-foreground px-2 py-1.5 border-r border-b bg-muted/40">{tr(w)}</div>)}
          {days.map((day) => {
            const key = ymd(day);
            const list = tasks.filter((t) => t.due_date === key);
            return (
              <div
                key={key}
                onDragOver={(e) => { e.preventDefault(); setOver(key); }}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => onDrop(e, day)}
                className={cn('border-r border-b p-1.5 space-y-1 transition-colors', mode === 'month' ? 'min-h-[110px]' : 'min-h-[420px]', !isSameMonth(day, cursor) && mode === 'month' && 'bg-muted/30', over === key && 'bg-primary/5')}
              >
                <div className={cn('text-xs w-6 h-6 flex items-center justify-center rounded-full', isToday(day) ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground')}>{format(day, 'd')}</div>
                {list.map((t) => (
                  <button
                    key={t.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}
                    onClick={() => open(t.id)}
                    className={cn('w-full text-left text-[11px] px-1.5 py-1 rounded truncate font-medium', t.status === 'done' ? 'bg-emerald-50 text-emerald-700 line-through' : isOverdue(t) ? 'bg-rose-50 text-rose-700' : 'bg-primary/10 text-primary')}
                  >{t.title}</button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}