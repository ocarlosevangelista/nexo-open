import React from 'react';
import { Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import MemberAvatar from '@/components/common/MemberAvatar';
import { usePeople } from '@/hooks/useNexo';
import { tr } from '@/lib/i18n';

export default function CollaboratorsPicker({ task, update }) {
  const members = usePeople(task.project_id);
  const list = task.collaborators || [];
  const toggle = (email) => update(task, { collaborators: list.includes(email) ? list.filter((e) => e !== email) : [...list, email] });
  const chosen = members.filter((m) => list.includes(m.email));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 h-8 px-1.5 rounded hover:bg-muted" aria-label={tr('Colaboradores')}>
          <div className="flex -space-x-1.5">{chosen.map((m) => <MemberAvatar key={m.id} name={m.name} url={m.avatar_url} size={22} className="ring-2 ring-background" />)}</div>
          <span className="h-[22px] w-[22px] rounded-full border border-dashed flex items-center justify-center text-muted-foreground"><Plus className="h-3 w-3" /></span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        {members.map((m) => (
          <label key={m.id} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
            <Checkbox checked={list.includes(m.email)} onCheckedChange={() => toggle(m.email)} />
            <MemberAvatar name={m.name} url={m.avatar_url} size={20} />{m.name}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}