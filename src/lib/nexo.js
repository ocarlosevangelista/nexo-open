import { format, parseISO, addDays, differenceInCalendarDays } from 'date-fns';
import { tr, fmt } from '@/lib/i18n';

export const items = (r) => (Array.isArray(r) ? r : r?.items || []);

export const STATUS = {
  todo: { get label() { return tr('A fazer'); }, cls: 'bg-slate-100 text-slate-600' },
  in_progress: { get label() { return tr('Em andamento'); }, cls: 'bg-indigo-50 text-indigo-600' },
  review: { get label() { return tr('Em revisão'); }, cls: 'bg-amber-50 text-amber-700' },
  done: { get label() { return tr('Concluída'); }, cls: 'bg-emerald-50 text-emerald-700' },
};

export const PRIORITY = {
  low: { get label() { return tr('Baixa'); }, dot: 'bg-slate-300' },
  medium: { get label() { return tr('Média'); }, dot: 'bg-sky-400' },
  high: { get label() { return tr('Alta'); }, dot: 'bg-orange-400' },
  urgent: { get label() { return tr('Urgente'); }, dot: 'bg-rose-500' },
};

export const PROJECT_STATUS = {
  on_track: { get label() { return tr('No prazo'); }, cls: 'bg-emerald-50 text-emerald-700' },
  at_risk: { get label() { return tr('Em risco'); }, cls: 'bg-amber-50 text-amber-700' },
  off_track: { get label() { return tr('Atrasado'); }, cls: 'bg-rose-50 text-rose-700' },
  on_hold: { get label() { return tr('Pausado'); }, cls: 'bg-slate-100 text-slate-600' },
  completed: { get label() { return tr('Concluído'); }, cls: 'bg-indigo-50 text-indigo-700' },
};

export const ROLES = {
  get owner() { return tr('Proprietário'); }, get admin() { return tr('Administrador'); },
  get member() { return tr('Membro'); }, get guest() { return tr('Convidado'); },
};
export const PROJECT_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6'];

export const ymd = (d) => format(d, 'yyyy-MM-dd');
export const todayStr = () => ymd(new Date());
export const plusDays = (n) => ymd(addDays(new Date(), n));
export const isOverdue = (t) => !!t.due_date && t.status !== 'done' && t.due_date < todayStr();

export const fmtDate = (d) => {
  if (!d) return '';
  const diff = differenceInCalendarDays(parseISO(d), new Date());
  if (diff === 0) return tr('Hoje');
  if (diff === 1) return tr('Amanhã');
  if (diff === -1) return tr('Ontem');
  return fmt(parseISO(d), "d 'de' MMM", 'MMM d');
};
export const fmtDateTime = (d) => (d ? fmt(new Date(d), "d 'de' MMM, HH:mm", 'MMM d, h:mm a') : '');