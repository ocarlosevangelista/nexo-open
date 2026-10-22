import React from 'react';
import DashboardView from '@/components/tasks/DashboardView';
import { tr } from '@/lib/i18n';

export default function Reports() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{tr('Relatórios')}</h1>
      <p className="text-sm text-muted-foreground mt-1">{tr('Visão consolidada de todas as tarefas do espaço de trabalho.')}</p>
      <DashboardView query={{}} />
    </div>
  );
}