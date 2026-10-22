import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MoreHorizontal, Palette, Link2, Archive, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import ProjectIcon, { PROJECT_ICONS } from '@/components/common/ProjectIcon';
import InlineText from '@/components/common/InlineText';
import MemberAvatar from '@/components/common/MemberAvatar';
import ShareDialog from '@/components/project/ShareDialog';
import { useMembers } from '@/hooks/useNexo';
import { useProjectMembers, useSaveProject } from '@/hooks/useProject';
import { PROJECT_COLORS, PROJECT_STATUS } from '@/lib/nexo';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

export default function ProjectHeader({ project, children }) {
  const save = useSaveProject(project);
  const navigate = useNavigate();
  const [confirm, setConfirm] = React.useState(false);
  const { data: pm = [] } = useProjectMembers(project.id);
  const { data: all = [] } = useMembers();
  const st = PROJECT_STATUS[project.status] || PROJECT_STATUS.on_track;

  return (
    <div className="px-4 md:px-8 pt-5 border-b bg-background">
      <div className="flex items-center gap-3 flex-wrap">
        <ProjectIcon project={project} size={36} />
        <InlineText value={project.name} onSave={(v) => save({ name: v })} className="text-xl font-semibold tracking-tight" />
        <button onClick={() => save({ favorite: !project.favorite })} aria-label={tr('Favoritar')} className="p-1 rounded hover:bg-muted">
          <Star className={cn('h-4 w-4', project.favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
        </button>
        <Select value={project.status || 'on_track'} onValueChange={(v) => save({ status: v })}>
          <SelectTrigger className={cn('h-7 w-auto gap-1.5 rounded-full border-0 text-xs font-medium px-3', st.cls)}><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(PROJECT_STATUS).map(([k, s]) => <SelectItem key={k} value={k}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex -space-x-2">
            {pm.slice(0, 5).map((m) => <MemberAvatar key={m.id} name={m.name || m.email} url={all.find((x) => x.email === m.email)?.avatar_url} size={28} className="ring-2 ring-background" />)}
          </div>
          <ShareDialog project={project} />
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-1.5"><Palette className="h-4 w-4" /><span className="hidden sm:inline">{tr('Personalizar')}</span></Button></PopoverTrigger>
            <PopoverContent align="end" className="w-64 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">{tr('Cor')}</p>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((c) => <button key={c} onClick={() => save({ color: c })} className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: c }} aria-label={c}>{project.color === c && <Check className="h-4 w-4 text-white" />}</button>)}
              </div>
              <p className="text-xs font-medium text-muted-foreground">{tr('Ícone')}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PROJECT_ICONS).map(([k, Icon]) => <button key={k} onClick={() => save({ icon: k })} aria-label={k} className={cn('h-8 w-8 rounded-lg border flex items-center justify-center', project.icon === k ? 'border-primary text-primary bg-primary/10' : 'text-muted-foreground')}><Icon className="h-4 w-4" /></button>)}
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={tr('Ações do projeto')}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => save({ favorite: !project.favorite })}><Star className="h-4 w-4 mr-2" />{project.favorite ? tr('Remover dos favoritos') : tr('Adicionar aos favoritos')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: tr('Link copiado') }); }}><Link2 className="h-4 w-4 mr-2" />{tr('Copiar link')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirm(true)} className="text-rose-600"><Archive className="h-4 w-4 mr-2" />{tr('Arquivar projeto')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{tr('Arquivar este projeto?')}</AlertDialogTitle><AlertDialogDescription>{tr('O projeto sairá das listas, mas seus dados continuarão guardados.')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{tr('Cancelar')}</AlertDialogCancel><AlertDialogAction onClick={async () => { await save({ archived: true }); toast({ title: tr('Projeto arquivado') }); navigate('/projetos'); }}>{tr('Arquivar')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="mt-3">{children}</div>
    </div>
  );
}