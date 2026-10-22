import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { useMe } from '@/hooks/useNexo';
import { items, PROJECT_STATUS } from '@/lib/nexo';
import { recordProjectStatus } from '@/lib/recordEvent';
import { tr } from '@/lib/i18n';

const E = base44.entities;

export function useProjectMembers(id) {
  return useQuery({ queryKey: ['projectMembers', id], queryFn: async () => items(await E.ProjectMember.filter({ project_id: id }, { limit: 100 })) });
}

export function useSaveProject(project) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  return async (changes) => {
    qc.setQueryData(['project', project.id], (o) => (o ? { ...o, ...changes } : o));
    try {
      await E.Project.update(project.id, changes);
      if (changes.status && changes.status !== project.status)
        await recordProjectStatus({ ...project, ...changes }, me);
    } catch {
      toast({ title: tr('Não foi possível salvar o projeto'), variant: 'destructive' });
    }
    qc.invalidateQueries({ queryKey: ['project', project.id] });
    qc.invalidateQueries({ queryKey: ['projects'] });
  };
}