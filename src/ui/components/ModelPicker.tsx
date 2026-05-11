import React, { useState, useEffect } from 'react';

interface ModelPickerProps {
  onChange?: (model: string) => void;
}

const MODEL_OPTIONS = ['Default', 'Claude Opus', 'Claude Sonnet', 'GPT-4o', 'Custom'];
const STORAGE_KEY = 'bmad-preferred-model';

export function ModelPicker({ onChange }: ModelPickerProps) {
  const [selected, setSelected] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'Default'; } catch { return 'Default'; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, selected); } catch {}
    onChange?.(selected);
  }, [selected, onChange]);

  return (
    <select
      value={selected}
      onChange={(e) => setSelected(e.target.value)}
      className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
    >
      {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

export function usePreferredModel(): string {
  try { return localStorage.getItem(STORAGE_KEY) || 'Default'; } catch { return 'Default'; }
}
