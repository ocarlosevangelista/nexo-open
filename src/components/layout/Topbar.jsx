import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Menu, Plus, Bell, CircleCheck, FolderKanban, LogOut, Users, CalendarDays } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import GlobalSearch from '@/components/layout/GlobalSearch';
import MemberAvatar from '@/components/common/MemberAvatar';
import { useUI } from '@/components/layout/UIContext';
import { useMe } from '@/hooks/useNexo';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { tr } from '@/lib/i18n';

export default function Topbar({ onMenu }) {
  const { setCreateTask, setCreateProject, setImportCalendar } = useUI();
  const { data: me } = useMe();
  const { data: unread = 0 } = useQuery({
    queryKey: ['notifCount', me?.email], enabled: !!me,
    queryFn: () => base44.entities.Notification.count({ recipient_email: me.email, read: false }),
    refetchInterval: 30000,
  });
  return (
    <header className="h-14 border-b bg-background flex items-center gap-2 md:gap-3 px-3 md:px-5 shrink-0">
      <Button variant="ghost" size="icon" onClick={onMenu} aria-label={tr('Alternar menu')}><Menu className="h-5 w-5" /></Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="rounded-full gap-1.5 px-4"><Plus className="h-4 w-4" /><span className="hidden sm:inline">{tr('Criar')}</span></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => setCreateTask({})}><CircleCheck className="h-4 w-4 mr-2" />{tr('Tarefa')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCreateProject(true)}><FolderKanban className="h-4 w-4 mr-2" />{tr('Projeto')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setImportCalendar(true)}><CalendarDays className="h-4 w-4 mr-2" />{tr('Importar do Google Agenda')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex-1 flex justify-center min-w-0"><GlobalSearch /></div>
      <LanguageSwitcher />
      <Button variant="ghost" size="icon" asChild className="relative">
        <Link to="/caixa-de-entrada" aria-label={tr('Notificações')}>
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label={tr('Menu do usuário')}>
          <MemberAvatar name={me?.full_name || me?.email || ''} size={32} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="text-sm font-medium">{me?.full_name}</div>
            <div className="text-xs text-muted-foreground truncate">{me?.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/equipe"><Users className="h-4 w-4 mr-2" />{tr('Equipe e perfis')}</Link></DropdownMenuItem>
          <DropdownMenuItem onClick={() => base44.auth.logout('/login')}><LogOut className="h-4 w-4 mr-2" />{tr('Sair')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}