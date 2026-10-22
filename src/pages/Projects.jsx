import React from 'react';
import { FolderKanban, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProjectCard from '@/components/project/ProjectCard';
import EmptyState from '@/components/common/EmptyState';
import { useUI } from '@/components/layout/UIContext';
import { useProjects } from '@/hooks/useNexo';
import { tr } from '@/lib/i18n';

export default function Projects({ favorites = false }) {
  const { data: projects = [], isLoading } = useProjects();
  const { setCreateProject } = useUI();
  const list = favorites ? projects.filter((p) => p.favorite) : projects;
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{favorites ? tr('Favoritos') : tr('Projetos')}</h1>
        <Button onClick={() => setCreateProject(true)} className="gap-1.5"><Plus className="h-4 w-4" />{tr('Novo projeto')}</Button>
      </div>
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={favorites ? Star : FolderKanban}
          title={favorites ? tr('Nenhum favorito ainda') : tr('Nenhum projeto ainda')}
          description={favorites ? tr('Marque projetos com a estrela para acessá-los rapidamente.') : tr('Crie seu primeiro projeto para organizar o trabalho da equipe.')}
          action={!favorites && <Button onClick={() => setCreateProject(true)}>{tr('Criar projeto')}</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{list.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
      )}
    </div>
  );
}