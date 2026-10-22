import React, { useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { tr } from '@/lib/i18n';

export default function MemberMenu({ member }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const remove = async () => {
    await base44.entities.WorkspaceMember.delete(member.id);
    qc.invalidateQueries({ queryKey: ['members'] });
    toast({ title: tr('Pessoa removida da equipe'), description: member.name });
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-destructive focus:text-destructive gap-2" onSelect={() => setOpen(true)}>
            <Trash2 className="h-4 w-4" />{tr('Remover da equipe')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('Remover {name}?', { name: member.name })}</AlertDialogTitle>
            <AlertDialogDescription>{tr('Essa pessoa deixará de aparecer na equipe e não poderá mais ser atribuída a tarefas.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr('Cancelar')}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{tr('Remover')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}