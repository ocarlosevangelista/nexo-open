import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { tr } from '@/lib/i18n';

export function CustomFieldCell({ field, task, value }) {
  const qc = useQueryClient();
  const save = async (v) => {
    if ((value?.value || '') === v) return;
    if (value) await base44.entities.CustomFieldValue.update(value.id, { value: v });
    else await base44.entities.CustomFieldValue.create({ field_id: field.id, task_id: task.id, project_id: field.project_id, value: v });
    qc.invalidateQueries({ queryKey: ['fieldValues', field.project_id] });
  };
  return (
    <input
      key={value?.value}
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      defaultValue={value?.value || ''}
      onBlur={(e) => save(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      placeholder="—"
      className="w-full bg-transparent text-xs h-8 px-1.5 rounded hover:bg-muted outline-none focus:ring-1 focus:ring-primary/40"
    />
  );
}

export const customColumn = (field, values) => ({
  key: 'cf:' + field.id, label: field.name, width: '140px',
  render: (t) => <CustomFieldCell field={field} task={t} value={values.find((v) => v.task_id === t.id && v.field_id === field.id)} />,
});

export function AddFieldForm({ projectId }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const add = async () => {
    if (!name.trim()) return;
    await base44.entities.CustomField.create({ project_id: projectId, name: name.trim(), type });
    qc.invalidateQueries({ queryKey: ['fields', projectId] });
    setName('');
    toast({ title: tr('Campo personalizado adicionado') });
  };
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{tr('Novo campo personalizado')}</p>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('Nome do campo')} className="h-8 text-sm" />
      <div className="flex gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="text">{tr('Texto')}</SelectItem><SelectItem value="number">{tr('Número')}</SelectItem><SelectItem value="date">{tr('Data')}</SelectItem></SelectContent>
        </Select>
        <Button size="sm" onClick={add}>{tr('Adicionar')}</Button>
      </div>
    </div>
  );
}