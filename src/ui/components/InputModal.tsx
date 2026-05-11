import React, { useState } from 'react';
import { ActionButton } from './ActionButton';

export interface InputField {
  id: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

export interface InputModalProps {
  title: string;
  description?: string;
  fields: InputField[];
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

/**
 * Skills that require user input before triggering.
 * Maps skill ID → modal config.
 */
export const SKILL_INPUT_CONFIGS: Record<string, { title: string; description?: string; fields: InputField[] }> = {
  'bmad-story': {
    title: '📋 Create User Story',
    description: 'Provide context for story generation. Leave fields empty to let the agent infer from project context.',
    fields: [
      { id: 'epicId', label: 'Epic', placeholder: 'Which epic does this belong to?', type: 'text' },
      { id: 'actor', label: 'Actor', placeholder: 'Who needs this? (e.g., "authenticated user")', type: 'text' },
      { id: 'need', label: 'Need', placeholder: 'What do they want?', type: 'text' },
      { id: 'value', label: 'Value', placeholder: 'Why does it matter?', type: 'text' },
      { id: 'constraints', label: 'Constraints', placeholder: 'Technical, deadline, compliance...', type: 'textarea' },
    ],
  },
  'bmad-product-brief': {
    title: '📝 Create PRD',
    description: 'Describe the product you want to build.',
    fields: [
      { id: 'productName', label: 'Product Name', placeholder: 'What is it called?', type: 'text', required: true },
      { id: 'problem', label: 'Problem Statement', placeholder: 'What problem does it solve?', type: 'textarea', required: true },
      { id: 'targetUser', label: 'Target User', placeholder: 'Who is this for?', type: 'text' },
      { id: 'keyFeatures', label: 'Key Features', placeholder: 'Main capabilities (one per line)', type: 'textarea' },
    ],
  },
  'bmad-arch': {
    title: '🏗️ Define Architecture',
    description: 'Provide architectural preferences and constraints.',
    fields: [
      { id: 'stack', label: 'Preferred Stack', placeholder: 'e.g., React, Node.js, PostgreSQL', type: 'text' },
      { id: 'constraints', label: 'Constraints', placeholder: 'Cloud provider, budget, compliance...', type: 'textarea' },
      { id: 'scalability', label: 'Scale Requirements', placeholder: 'Expected users, data volume...', type: 'text' },
    ],
  },
  'bmad-ux': {
    title: '🎨 Create UX Design',
    description: 'Describe the user experience goals.',
    fields: [
      { id: 'audience', label: 'Target Audience', placeholder: 'Who will use this?', type: 'text' },
      { id: 'style', label: 'Design Style', placeholder: 'Minimal, corporate, playful...', type: 'text' },
      { id: 'keyFlows', label: 'Key User Flows', placeholder: 'Main journeys (one per line)', type: 'textarea' },
    ],
  },
  'bmad-quick-dev': {
    title: '⚡ Quick Dev',
    description: 'Describe what you need done — bug fix, small feature, refactor.',
    fields: [
      { id: 'intent', label: 'What do you need?', placeholder: 'Fix the login button...', type: 'textarea', required: true },
    ],
  },
  'bmad-dev-story': {
    title: '💻 Start Dev Story',
    description: 'Select which story to implement.',
    fields: [
      { id: 'storySlug', label: 'Story Slug', placeholder: 'e.g., E1-S3 or story filename', type: 'text', required: true },
      { id: 'approach', label: 'Implementation Notes', placeholder: 'Any specific approach or constraints?', type: 'textarea' },
    ],
  },
  'bmad-code-review': {
    title: '🔍 Code Review',
    description: 'What should be reviewed?',
    fields: [
      { id: 'scope', label: 'Review Scope', placeholder: 'Files, PR number, or "last commit"', type: 'text', required: true },
      { id: 'focus', label: 'Focus Areas', placeholder: 'Security, performance, style...', type: 'text' },
    ],
  },
};

/**
 * Skills that DON'T need user input — they run from project context alone.
 */
export const NO_INPUT_SKILLS = new Set([
  'bmad-sprint-plan',  // Reads epics/stories to plan
  'bmad-retro',        // Reads sprint state
  'bmad-gate-check',   // Validates prerequisites
  'bmad-tech-writer',  // Reads existing docs
]);

export function InputModal({ title, description, fields, onSubmit, onCancel }: InputModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const setValue = (id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const hasRequired = fields.filter(f => f.required).every(f => values[f.id]?.trim());

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100">{title}</h2>
          {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {fields.map(field => (
            <div key={field.id} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-y min-h-[80px]"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={e => setValue(field.id, e.target.value)}
                />
              ) : field.type === 'select' ? (
                <select
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
                  value={values[field.id] || ''}
                  onChange={e => setValue(field.id, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={e => setValue(field.id, e.target.value)}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <ActionButton variant="secondary" type="button" onClick={onCancel}>Cancel</ActionButton>
            <ActionButton type="submit" disabled={!hasRequired}>Run Skill</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
