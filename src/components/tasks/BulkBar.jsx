import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Archive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { tn, tr } from '@/lib/i18n';

export default function BulkBar({ count, onComplete, onArchive, onClear }) {
  const btn = 'text-white hover:bg-white/10 hover:text-white rounded-full';
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-full bg-sidebar text-white pl-4 pr-1.5 py-1.5 shadow-xl"
        >
          <span className="text-sm mr-2 tabular-nums">{tn(count, '1 selecionada', '{n} selecionadas')}</span>
          <Button size="sm" variant="ghost" className={btn} onClick={onComplete}><Check className="h-4 w-4 mr-1" />{tr('Concluir')}</Button>
          <ConfirmDialog
            title={tn(count, 'Arquivar 1 tarefa?', 'Arquivar {n} tarefas?')}
            description={tr('As tarefas arquivadas deixam de aparecer nas listas, mas não são apagadas.')}
            confirmLabel={tr('Arquivar')}
            onConfirm={onArchive}
            trigger={<Button size="sm" variant="ghost" className={btn}><Archive className="h-4 w-4 mr-1" />{tr('Arquivar')}</Button>}
          />
          <Button size="icon" variant="ghost" className={btn + ' h-8 w-8'} onClick={onClear} aria-label={tr('Limpar seleção')}><X className="h-4 w-4" /></Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}