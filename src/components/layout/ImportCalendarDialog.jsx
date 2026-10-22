import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, endOfDay, parseISO, startOfDay } from 'date-fns';
import { CalendarDays, Loader2, MapPin, Unplug } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useUI } from '@/components/layout/UIContext';
import { useMe, useProjects, useSections, useTaskActions } from '@/hooks/useNexo';
import { createTask } from '@/lib/taskApi';
import { items } from '@/lib/nexo';
import { GCAL_RETURN_KEY, gcalCalendars, gcalConnect, gcalDisconnect, gcalEvents, gcalStatus } from '@/lib/googleCalendar';
import { cn } from '@/lib/utils';
import { fmt, tn, tr } from '@/lib/i18n';

const RANGES = [7, 14, 30, 90];

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function when(ev) {
  const d = (s) => fmt(parseISO(s), "EEE, d 'de' MMM", 'EEE, MMM d');
  if (ev.allDay) return ev.endDate !== ev.startDate ? `${d(ev.startDate)} – ${d(ev.endDate)} · ${tr('Dia inteiro')}` : `${d(ev.startDate)} · ${tr('Dia inteiro')}`;
  return `${d(ev.startDate)} · ${fmt(parseISO(ev.start), 'HH:mm', 'h:mm a')}–${fmt(parseISO(ev.end), 'HH:mm', 'h:mm a')}`;
}

function description(ev) {
  const parts = [ev.description];
  parts.push(`<p>${esc(when(ev))}${ev.location ? ` · ${esc(ev.location)}` : ''}</p>`);
  if (ev.htmlLink) parts.push(`<p><a href="${esc(ev.htmlLink)}" target="_blank" rel="noopener noreferrer">${esc(tr('Abrir no Google Agenda'))}</a></p>`);
  return parts.filter(Boolean).join('');
}

function Field({ label, children }) {
  return <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}

export default function ImportCalendarDialog() {
  const { importCalendar, setImportCalendar } = useUI();
  const { data: me } = useMe();
  const { refresh } = useTaskActions();
  const { data: projects = [] } = useProjects();
  const qc = useQueryClient();
  const [calendarId, setCalendarId] = useState('primary');
  const [range, setRange] = useState('14');
  const [selected, setSelected] = useState(new Set());
  const [projectId, setProjectId] = useState('none');
  const [sectionId, setSectionId] = useState('');
  const [busy, setBusy] = useState(false);
  const pid = projectId !== 'none' ? projectId : null;
  const { data: sections = [] } = useSections(pid);
  const open = !!importCalendar;

  useEffect(() => { if (open) { setSelected(new Set()); setBusy(false); } }, [open]);
  // Na volta do consentimento do Google, reabre a importação.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(GCAL_RETURN_KEY)) { sessionStorage.removeItem(GCAL_RETURN_KEY); setImportCalendar(true); }
    } catch { /* sem storage */ }
  }, []);
  useEffect(() => setSelected(new Set()), [calendarId, range]);

  const status = useQuery({ queryKey: ['gcal', 'status'], queryFn: gcalStatus, enabled: open, staleTime: 0 });
  const connected = !!status.data?.connected;
  const calendars = useQuery({ queryKey: ['gcal', 'calendars'], queryFn: gcalCalendars, enabled: open && connected });
  const events = useQuery({
    queryKey: ['gcal', 'events', calendarId, range], enabled: open && connected,
    queryFn: () => {
      const now = new Date();
      return gcalEvents(calendarId, startOfDay(now).toISOString(), endOfDay(addDays(now, Number(range))).toISOString());
    },
  });
  // Eventos já importados por este usuário, para não duplicar.
  const imported = useQuery({
    queryKey: ['gcal', 'imported', me?.email], enabled: open && connected && !!me,
    queryFn: async () => new Set(items(await base44.entities.Task.filter({ creator_email: me.email, source: 'google_calendar' }, { limit: 1000 })).map((t) => t.google_event_id)),
  });

  const list = events.data?.events || [];
  const done = imported.data || new Set();
  const available = useMemo(() => list.filter((e) => !done.has(e.id)), [list, done]);
  const needsReconnect = status.data?.reconnect || calendars.data?.reconnect || events.data?.reconnect;

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allChecked = available.length > 0 && available.every((e) => selected.has(e.id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(available.map((e) => e.id)));

  const connect = async () => {
    setBusy(true);
    try { await gcalConnect(); } catch { setBusy(false); toast({ title: tr('Não foi possível iniciar a conexão com o Google'), variant: 'destructive' }); }
  };
  const disconnect = async () => {
    setBusy(true);
    try { await gcalDisconnect(); toast({ title: tr('Google Agenda desconectada') }); } catch { toast({ title: tr('Erro ao desconectar'), variant: 'destructive' }); }
    qc.invalidateQueries({ queryKey: ['gcal'] });
    setBusy(false);
  };

  const submit = async () => {
    const chosen = list.filter((e) => selected.has(e.id) && !done.has(e.id));
    if (!chosen.length) return;
    setBusy(true);
    const section = pid ? sectionId || sections[0]?.id || null : null;
    let ok = 0;
    for (const ev of chosen) {
      try {
        await createTask({
          title: ev.title, description: description(ev), start_date: ev.startDate, due_date: ev.endDate,
          project_id: pid, section_id: section, assignee_email: me.email, assignee_name: me.full_name || null,
          source: 'google_calendar', google_event_id: ev.id, google_calendar_id: ev.calendarId,
        }, me);
        ok++;
      } catch { /* segue com os demais */ }
    }
    refresh();
    qc.invalidateQueries({ queryKey: ['gcal', 'imported'] });
    setBusy(false);
    if (ok === chosen.length) {
      toast({ title: tn(ok, '1 evento importado', '{n} eventos importados') });
      setImportCalendar(false);
    } else {
      toast({ title: tr('{ok} de {total} eventos importados', { ok, total: chosen.length }), description: tr('Tente importar os restantes novamente.'), variant: 'destructive' });
      setSelected(new Set());
    }
  };

  const loadingList = events.isLoading || imported.isLoading;
  const failed = calendars.isError || events.isError || (events.data?.error && !needsReconnect);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && setImportCalendar(false)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />{tr('Importar do Google Agenda')}</DialogTitle>
          <DialogDescription>{tr('Escolha os eventos que devem virar tarefas no Nexo.')}</DialogDescription>
        </DialogHeader>

        {status.isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : status.data?.unavailable ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">{tr('A importação do Google Agenda ainda não está configurada. Peça ao administrador para concluir a configuração.')}</p>
          </div>
        ) : status.isError ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">{tr('Não foi possível verificar a conexão com o Google Agenda.')}</p>
            <Button variant="outline" onClick={() => status.refetch()}>{tr('Tentar novamente')}</Button>
          </div>
        ) : !connected ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {needsReconnect
                ? tr('A conexão com o Google expirou. Conecte de novo para continuar importando.')
                : tr('Conecte sua conta Google para ver seus eventos. O Nexo só lê sua agenda e nunca altera nada nela.')}
            </p>
            <Button onClick={connect} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{needsReconnect ? tr('Reconectar Google Agenda') : tr('Conectar Google Agenda')}</Button>
          </div>
        ) : (
          <div className="space-y-4 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={tr('Agenda')}>
                <Select value={calendarId} onValueChange={setCalendarId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(calendars.data?.calendars || [{ id: 'primary', name: tr('Agenda principal') }]).map((c) => (
                      <SelectItem key={c.id} value={c.primary ? 'primary' : c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={tr('Período')}>
                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RANGES.map((n) => <SelectItem key={n} value={String(n)}>{tr('Próximos {n} dias', { n })}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            <div className="border rounded-lg">
              <div className="flex items-center gap-3 px-3 h-10 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
                <Checkbox checked={allChecked} onCheckedChange={toggleAll} disabled={!available.length} aria-label={tr('Selecionar todos')} />
                <span>{selected.size ? tn(selected.size, '1 selecionado', '{n} selecionados') : tr('Selecionar todos')}</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y">
                {loadingList ? (
                  <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : needsReconnect ? (
                  <div className="py-8 text-center text-sm text-muted-foreground space-y-3">
                    <p>{tr('A conexão com o Google expirou.')}</p>
                    <Button size="sm" onClick={connect} disabled={busy}>{tr('Reconectar')}</Button>
                  </div>
                ) : failed ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">{tr('Não foi possível carregar os eventos. Tente novamente em instantes.')}</p>
                ) : !list.length ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">{tr('Nenhum evento neste período.')}</p>
                ) : list.map((ev) => {
                  const isDone = done.has(ev.id);
                  return (
                    <label key={ev.id} className={cn('flex items-start gap-3 px-3 py-2.5', isDone ? 'opacity-60' : 'cursor-pointer hover:bg-muted/40')}>
                      <Checkbox className="mt-0.5" checked={isDone || selected.has(ev.id)} disabled={isDone} onCheckedChange={() => toggle(ev.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{ev.title}</div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2">
                          <span className="capitalize">{when(ev)}</span>
                          {ev.location && <span className="inline-flex items-center gap-1 min-w-0"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{ev.location}</span></span>}
                        </div>
                      </div>
                      {isDone && <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 shrink-0">{tr('Já importado')}</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={tr('Projeto')}>
                <Select value={projectId} onValueChange={(v) => { setProjectId(v); setSectionId(''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">{tr('Sem projeto')}</SelectItem>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={tr('Seção')}>
                <Select value={sectionId || sections[0]?.id || ''} onValueChange={setSectionId} disabled={!pid}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={disconnect} disabled={busy}>
                <Unplug className="h-4 w-4 mr-1.5" />{tr('Desconectar Google')}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setImportCalendar(false)} disabled={busy}>{tr('Cancelar')}</Button>
                <Button onClick={submit} disabled={busy || !selected.size}>
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selected.size ? tn(selected.size, 'Importar 1 evento', 'Importar {n} eventos') : tr('Importar')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}