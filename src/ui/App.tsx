import React, { useState, useCallback } from 'react';
import { useBmadApp } from './hooks/useApp';
import { ViewId } from '../shared/types';
import { Dashboard } from './views/Dashboard';
import { PhaseView } from './views/PhaseView';
import { SprintBoard } from './views/SprintBoard';
import { EpicDetail } from './views/EpicDetail';
import { StoryDetail } from './views/StoryDetail';
import { QuickMode } from './views/QuickMode';
import { DocsView } from './views/DocsView';
import { AgentRoster } from './views/AgentRoster';
import { FlowDiagram } from './views/FlowDiagram';
import { ParallelView } from './views/ParallelView';
import { InitView } from './views/InitView';
import { HelpButton } from './components/HelpButton';
import { HelpChat } from './components/HelpChat';
import { ToolResultPanel } from './components/ToolResultPanel';
import { InputModal, SKILL_INPUT_CONFIGS, NO_INPUT_SKILLS } from './components/InputModal';
import { useHostStyles } from '@modelcontextprotocol/ext-apps/react';

const MENU_ITEMS: { id: ViewId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'sprint-board', label: 'Sprint Board', icon: '🏃' },
  { id: 'docs', label: 'Documents', icon: '📄' },
  { id: 'quick-mode', label: 'Quick Mode', icon: '⚡' },
  { id: 'agent-roster', label: 'Agents', icon: '🤖' },
  { id: 'flow-diagram', label: 'Workflow', icon: '🔄' },
  { id: 'parallel', label: 'Parallel', icon: '⚡️' },
];

export function App() {
  const { app, isConnected, isLoading, projectState, callTool, callToolWithResult, toolResult, dismissResult, navState, navigate, refreshState } = useBmadApp();
  const [helpOpen, setHelpOpen] = useState(false);
  const [inputModal, setInputModal] = useState<{ skill: string; triggerCode: string; extraContext?: Record<string, string> } | null>(null);
  useHostStyles(app, app?.getHostContext());

  // Smart skill trigger: shows input modal if skill needs user data, otherwise fires directly
  const triggerSkill = useCallback((skill: string, triggerCode: string, extraContext?: Record<string, string>) => {
    const normalized = skill.replace(/^\//, '');
    const config = SKILL_INPUT_CONFIGS[normalized];
    if (config && !NO_INPUT_SKILLS.has(normalized)) {
      setInputModal({ skill, triggerCode, extraContext });
    } else {
      callToolWithResult('bmad_orchestrate', { skill, triggerCode, context: extraContext });
    }
  }, [callToolWithResult]);

  const handleInputSubmit = useCallback((values: Record<string, string>) => {
    if (!inputModal) return;
    const context = { ...inputModal.extraContext, ...values };
    // Filter empty values
    const filtered = Object.fromEntries(Object.entries(context).filter(([, v]) => v?.trim()));
    callToolWithResult('bmad_orchestrate', { skill: inputModal.skill, triggerCode: inputModal.triggerCode, context: filtered });
    setInputModal(null);
  }, [inputModal, callToolWithResult]);

  if (!isConnected) {
    return (
      <div className="flex min-h-[800px] w-full items-center justify-center bg-gray-900 text-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-medium">Connecting to Host...</p>
        </div>
      </div>
    );
  }

  if (projectState && !projectState.initialized) {
    return (
      <div className="min-h-[800px] w-full bg-gray-900 text-gray-100">
        <InitView callTool={callToolWithResult} onInitComplete={refreshState} />
        <HelpButton onClick={() => setHelpOpen(true)} />
        <HelpChat isOpen={helpOpen} onClose={() => setHelpOpen(false)} callTool={callTool} />
        <ToolResultPanel result={toolResult} onDismiss={dismissResult} />
      </div>
    );
  }

  const renderView = () => {
    switch (navState.view) {
      case 'dashboard': return <Dashboard projectState={projectState} navigate={navigate} callTool={callToolWithResult} triggerSkill={triggerSkill} />;
      case 'phase': return <PhaseView phase={navState.params?.phase as any} projectState={projectState} callTool={callToolWithResult} triggerSkill={triggerSkill} />;
      case 'sprint-board': return <SprintBoard projectState={projectState} navigate={navigate} />;
      case 'epic-detail': return <EpicDetail epicId={navState.params?.id || ''} projectState={projectState} navigate={navigate} callTool={callToolWithResult} triggerSkill={triggerSkill} />;
      case 'story-detail': return <StoryDetail slug={navState.params?.slug || ''} projectState={projectState} navigate={navigate} callTool={callToolWithResult} triggerSkill={triggerSkill} />;
      case 'quick-mode': return <QuickMode callTool={callTool} />;
      case 'docs': return <DocsView callTool={callTool} callToolWithResult={callToolWithResult} />;
      case 'agent-roster': return <AgentRoster callTool={callTool} callToolWithResult={callToolWithResult} triggerSkill={triggerSkill} />;
      case 'flow-diagram': return <FlowDiagram callTool={callTool} callToolWithResult={callToolWithResult} triggerSkill={triggerSkill} />;
      case 'parallel': return <ParallelView callTool={callToolWithResult} />;
      default: return <Dashboard projectState={projectState} navigate={navigate} callTool={callToolWithResult} triggerSkill={triggerSkill} />;
    }
  };

  return (
    <div className="flex min-h-[800px] w-full bg-gray-900 text-gray-100 overflow-hidden">
      <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">BM</div>
          <span className="font-bold text-lg">BMad App</span>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {MENU_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${navState.view === item.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        {isLoading && (
          <div className="p-4 border-t border-gray-700 text-sm text-gray-400 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Working...
          </div>
        )}
      </div>
      <main className="flex-1 overflow-y-auto bg-gray-900">
        {renderView()}
      </main>
      <HelpButton onClick={() => setHelpOpen(true)} />
      <HelpChat isOpen={helpOpen} onClose={() => setHelpOpen(false)} callTool={callTool} />
      <ToolResultPanel result={toolResult} onDismiss={dismissResult} />
      {inputModal && SKILL_INPUT_CONFIGS[inputModal.skill.replace(/^\//, '')] && (
        <InputModal
          title={SKILL_INPUT_CONFIGS[inputModal.skill.replace(/^\//, '')].title}
          description={SKILL_INPUT_CONFIGS[inputModal.skill.replace(/^\//, '')].description}
          fields={SKILL_INPUT_CONFIGS[inputModal.skill.replace(/^\//, '')].fields}
          onSubmit={handleInputSubmit}
          onCancel={() => setInputModal(null)}
        />
      )}
    </div>
  );
}
