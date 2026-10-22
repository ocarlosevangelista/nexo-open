import React from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Star, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProjectIcon from '@/components/common/ProjectIcon';
import { PROJECT_STATUS, fmtDate } from '@/lib/nexo';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/i18n';

export default function ProjectCard({ project }) {
  const qc = useQueryClient();
  const st = PROJECT_STATUS[project.status] || PROJECT_STATUS.on_track;
  const fav = async (e) => {
    e.preventDefault();
    await base44.entities.Project.update(project.id, { favorite: !project.favorite });
    qc.invalidateQueries({ queryKey: ['projects'] });
  };
  return (
    <Link to={`/projetos/${project.id}`} className="group rounded-xl border bg-background p-4 hover:border-primary/40 transition-all block">
      <div className="flex items-start justify-between">
        <ProjectIcon project={project} size={36} />
        <button onClick={fav} aria-label={tr('Favoritar')} className="p-1 rounded hover:bg-muted">
          <Star className={cn('h-4 w-4', project.favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground opacity-0 group-hover:opacity-100')} />
        </button>
      </div>
      <h3 className="font-semibold mt-3 truncate flex items-center gap-1.5">{project.name}{project.privacy === 'private' && <Lock className="h-3 w-3 text-muted-foreground" />}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">{project.description || tr('Sem descrição')}</p>
      <div className="flex items-center justify-between mt-3">
        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', st.cls)}>{st.label}</span>
        {project.end_date && <span className="text-[11px] text-muted-foreground">{tr('Até {date}', { date: fmtDate(project.end_date) })}</span>}
      </div>
    </Link>
  );
}