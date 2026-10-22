import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { tr } from '@/lib/i18n';

const modules = { toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'code-block']] };

export default function DescriptionEditor({ task, update }) {
  const [html, setHtml] = useState(task.description || '');
  useEffect(() => setHtml(task.description || ''), [task.id]);
  return (
    <div className="nexo-quill">
      <h4 className="text-sm font-semibold mb-2">{tr('Descrição')}</h4>
      <ReactQuill
        theme="snow"
        value={html}
        onChange={setHtml}
        onBlur={() => { if (html !== (task.description || '')) update(task, { description: html }); }}
        placeholder={tr('Adicione mais detalhes a esta tarefa…')}
        modules={modules}
      />
    </div>
  );
}