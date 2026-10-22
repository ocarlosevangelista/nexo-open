import React from 'react';
import { Check, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LANGS, tr, useI18n } from '@/lib/i18n';

export default function LanguageSwitcher({ className }) {
  const { lang, setLang } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className ?? 'gap-1.5 px-2'} aria-label={tr('Idioma')} title={tr('Idioma')}>
          <Languages className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase">{lang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(LANGS).map(([k, label]) => (
          <DropdownMenuItem key={k} onClick={() => setLang(k)} className="justify-between">
            {label}{lang === k && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
