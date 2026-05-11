import React from 'react';
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
  const { app, isConnected, isLoading, projectState, callTool, navState, navigate } = useBmadApp();
  useHostStyles(app, app?.getHostContext());

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

  const renderView = () => {
    switch (navState.view) {
      case 'dashboard': return <Dashboard projectState={projectState} navigate={navigate} />;
      case 'phase': return <PhaseView phase={navState.params?.phase as any} projectState={projectState} />;
      case 'sprint-board': return <SprintBoard projectState={projectState} navigate={navigate} />;
      case 'epic-detail': return <EpicDetail epicId={navState.params?.id || ''} projectState={projectState} navigate={navigate} />;
      case 'story-detail': return <StoryDetail slug={navState.params?.slug || ''} projectState={projectState} navigate={navigate} callTool={callTool} />;
      case 'quick-mode': return <QuickMode callTool={callTool} />;
      case 'docs': return <DocsView callTool={callTool} />;
      case 'agent-roster': return <AgentRoster callTool={callTool} />;
      case 'flow-diagram': return <FlowDiagram callTool={callTool} />;
      case 'parallel': return <ParallelView callTool={callTool} />;
      default: return <Dashboard projectState={projectState} navigate={navigate} />;
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
    </div>
  );
}
