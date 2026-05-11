import { useState, useCallback, useEffect } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import { ProjectState, NavigationState, ViewId } from '../../shared/types';

export function useBmadApp() {
  const { app, isConnected, error } = useApp({
    appInfo: { name: 'BMad App', version: '1.0.0' },
    capabilities: {},
    autoResize: true,
  });

  const [projectState, setProjectState] = useState<ProjectState | null>(null);
  const [navState, setNavState] = useState<NavigationState>({ view: 'dashboard' });
  const [isLoading, setIsLoading] = useState(false);
  const [toolResult, setToolResult] = useState<string | null>(null);

  const callTool = useCallback(async (name: string, args: any) => {
    if (!app || !isConnected) throw new Error('Not connected');
    setIsLoading(true);
    try {
      const result = await app.callServerTool({ name, arguments: args });
      if (result.structuredContent) return result.structuredContent;
      const textItem = (result as any).content?.find((c: any) => c.type === 'text');
      if (textItem?.text) {
        try { return JSON.parse(textItem.text); } catch { return textItem.text; }
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [app, isConnected]);

  const callToolWithResult = useCallback(async (name: string, args: any) => {
    const result = await callTool(name, args);
    let display: string;
    if (typeof result === 'string') {
      display = result;
    } else if (result?.message) {
      display = result.message;
    } else if (result?.content) {
      display = typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);
    } else {
      display = JSON.stringify(result, null, 2);
    }
    setToolResult(display);
    return result;
  }, [callTool]);

  const dismissResult = useCallback(() => {
    setToolResult(null);
  }, []);

  const refreshState = useCallback(async () => {
    if (!isConnected) return;
    try {
      const result = await callTool('bmad_dashboard', {});
      if (result) setProjectState(result as unknown as ProjectState);
    } catch (e) {
      console.error('Failed to fetch project state', e);
    }
  }, [callTool, isConnected]);

  useEffect(() => {
    if (isConnected) refreshState();
  }, [isConnected, refreshState]);

  const navigate = useCallback((view: ViewId, params?: Record<string, string>) => {
    setNavState({ view, params });
  }, []);

  return {
    app,
    isConnected,
    error,
    isLoading,
    projectState,
    refreshState,
    callTool,
    callToolWithResult,
    toolResult,
    dismissResult,
    navState,
    navigate
  };
}
