import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocsViewProps {
  callTool: (name: string, args: any) => Promise<any>;
}

const DOCS = [
  { id: 'prd', label: 'PRD' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'ux', label: 'UX Spec' },
  { id: 'project-context', label: 'Project Context' }
];

export function DocsView({ callTool }: DocsViewProps) {
  const [selected, setSelected] = useState(DOCS[0].id);
  const [search, setSearch] = useState('');
  const [content, setContent] = useState<string>('');
  const [allContents, setAllContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    callTool('bmad_docs', { document: selected }).then(res => {
      if (active) {
        const text = res?.content || '*No content found.*';
        setContent(text);
        setAllContents(prev => ({ ...prev, [selected]: text }));
        setLoading(false);
      }
    }).catch(() => {
      if (active) {
        setContent('*Failed to load document.*');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [selected, callTool]);

  const filteredDocs = DOCS.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (d.label.toLowerCase().includes(q)) return true;
    const docContent = allContents[d.id];
    if (docContent && docContent.toLowerCase().includes(q)) return true;
    return false;
  });

  return (
    <div className="flex h-full w-full">
      <div className="w-64 border-r border-gray-700 bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <input 
            type="text" 
            placeholder="Search docs..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col p-2 gap-1 overflow-y-auto">
          {filteredDocs.map(doc => (
            <button
              key={doc.id}
              onClick={() => setSelected(doc.id)}
              className={`text-left px-3 py-2 rounded text-sm transition-colors ${selected === doc.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            >
              {doc.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-8 bg-gray-900 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full text-gray-500">Loading document...</div>
        ) : (
          <div className="prose prose-invert max-w-3xl mx-auto">
            <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
