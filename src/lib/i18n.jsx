// Tradução PT/EN. O texto em português é a própria chave: tr('Minhas tarefas')
// devolve o texto em inglês quando o idioma é 'en' e o original quando é 'pt'.
// Chaves sem tradução caem no português.
import React, { createContext, Fragment, useContext, useState } from 'react';
import { format } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';
import EN from '@/lib/i18n-en';

export const LANGS = { pt: 'Português', en: 'English' };
const KEY = 'nexo:lang';

function detect() {
  try {
    const saved = localStorage.getItem(KEY);
    if (LANGS[saved]) return saved;
  } catch { /* sem storage */ }
  const nav = (typeof navigator !== 'undefined' && (navigator.languages?.[0] || navigator.language)) || 'pt';
  return nav.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

let current = detect();
if (typeof document !== 'undefined') document.documentElement.lang = current === 'en' ? 'en' : 'pt-BR';

export const getLang = () => current;

export function tr(text, vars) {
  let s = current === 'en' ? (EN[text] ?? text) : text;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}

// Plural simples: tn(n, '1 item', '{n} itens').
export const tn = (n, one, many, vars) => tr(n === 1 ? one : many, { n, ...vars });

export const dateLocale = () => (current === 'en' ? enUS : ptBR);

// Formata datas com um padrão por idioma.
export const fmt = (d, pt, en) => format(d, current === 'en' ? en : pt, { locale: dateLocale() });

// Textos gravados no banco pelo app (histórico e notificações) ficam sempre em português.
// Aqui eles são traduzidos na exibição; nomes de pessoas, tarefas e projetos ficam como estão.
const STORED = [
  [/^(.+) atribuiu uma tarefa a você$/, '{0} atribuiu uma tarefa a você'],
  [/^(.+) alterou o prazo$/, '{0} alterou o prazo'],
  [/^(.+) atualizou o status de (.+)$/, '{0} atualizou o status de {1}'],
  [/^(.+) mencionou você em (.+)$/, '{0} mencionou você em {1}'],
  [/^(.+) comentou em (.+)$/, '{0} comentou em {1}'],
];
export function tStored(text) {
  if (!text || current !== 'en') return text;
  if (EN[text]) return EN[text];
  for (const [rx, tpl] of STORED) {
    const m = text.match(rx);
    if (m) return tr(tpl).replace(/\{(\d)\}/g, (_, i) => m[Number(i) + 1]);
  }
  return text;
}

const Ctx = createContext({ lang: current, setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(current);
  const setLang = (l) => {
    if (!LANGS[l] || l === current) return;
    current = l;
    try { localStorage.setItem(KEY, l); } catch { /* sem storage */ }
    document.documentElement.lang = l === 'en' ? 'en' : 'pt-BR';
    setLangState(l);
  };
  // A key remonta a árvore para que textos calculados fora do React (tr()) sejam refeitos.
  return <Ctx.Provider value={{ lang, setLang }}><Fragment key={lang}>{children}</Fragment></Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
