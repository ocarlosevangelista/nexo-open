import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import CreateTaskDialog from '@/components/layout/CreateTaskDialog';
import CreateProjectDialog from '@/components/layout/CreateProjectDialog';
import ImportCalendarDialog from '@/components/layout/ImportCalendarDialog';
import TaskDetailBody from '@/components/detail/TaskDetailBody';
import { UIProvider } from '@/components/layout/UIContext';
import { usePersistentState } from '@/hooks/useNexo';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

export default function AppLayout() {
  const [collapsed, setCollapsed] = usePersistentState('sidebar:collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sp, setSp] = useSearchParams();
  const taskId = sp.get('task');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);
  const closeTask = () => { const n = new URLSearchParams(sp); n.delete('task'); setSp(n); };

  return (
    <UIProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside className={cn('hidden md:flex shrink-0 transition-[width] duration-300 ease-out', collapsed ? 'w-16' : 'w-64')}>
          <Sidebar collapsed={collapsed} />
        </aside>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-72 border-0 bg-sidebar [&>button]:text-white">
            <SheetTitle className="sr-only">{tr('Menu')}</SheetTitle>
            <Sidebar />
          </SheetContent>
        </Sheet>
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMenu={() => (window.innerWidth < 768 ? setMobileOpen(true) : setCollapsed(!collapsed))} />
          <main className="flex-1 overflow-y-auto"><Outlet /></main>
        </div>
        <Sheet open={!!taskId} onOpenChange={(o) => !o && closeTask()}>
          <SheetContent side="right" className="p-0 w-full sm:max-w-xl [&>button]:hidden">
            <SheetTitle className="sr-only">{tr('Detalhes da tarefa')}</SheetTitle>
            {taskId && <TaskDetailBody key={taskId} taskId={taskId} onClose={closeTask} onExpand={() => navigate(`/tarefa/${taskId}`)} />}
          </SheetContent>
        </Sheet>
        <CreateTaskDialog />
        <CreateProjectDialog />
        <ImportCalendarDialog />
      </div>
    </UIProvider>
  );
}