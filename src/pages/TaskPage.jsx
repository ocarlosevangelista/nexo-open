import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskDetailBody from '@/components/detail/TaskDetailBody';
import { tr } from '@/lib/i18n';

export default function TaskPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col">
      <div className="px-4 pt-4"><Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5"><ArrowLeft className="h-4 w-4" />{tr('Voltar')}</Button></div>
      <div className="flex-1 min-h-0 border-x mt-2 bg-background"><TaskDetailBody key={id} taskId={id} /></div>
    </div>
  );
}