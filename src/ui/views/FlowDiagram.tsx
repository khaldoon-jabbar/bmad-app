import React, { useEffect, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Controls, MiniMap, Background, useNodesState, useEdgesState, Panel, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { Track, FlowGraph, FlowNode as FlowNodeType, FlowNodeStatus } from '../../shared/types';
import { ActionButton } from '../components/ActionButton';

interface FlowDiagramProps {
  callTool: (name: string, args: any) => Promise<any>;
  callToolWithResult?: (name: string, args: any) => Promise<any>;
}

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 60 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 60 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: 'top',
      sourcePosition: 'bottom',
      position: {
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y - 30,
      },
    };
  });

  return { nodes: newNodes, edges };
};

const STATUS_COLORS: Record<FlowNodeStatus, { bg: string; border: string }> = {
  done: { bg: '#065f46', border: '#10b981' },
  active: { bg: '#1e3a8a', border: '#3b82f6' },
  'in-progress': { bg: '#78350f', border: '#f59e0b' },
  pending: { bg: '#374151', border: '#4b5563' },
};

function FlowContent({ callTool, callToolWithResult }: FlowDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [track, setTrack] = useState<Track>('bmad');
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState<FlowNodeType[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    callTool('bmad_flow', { track }).then((res: FlowGraph) => {
      if (!active || !res || !res.nodes) return;
      setFlowData(res.nodes);
      const rfNodes = res.nodes.map(n => ({
        id: n.id,
        data: { label: n.label },
        position: { x: 0, y: 0 },
        style: {
          background: STATUS_COLORS[n.status].bg,
          color: '#fff',
          border: `1px solid ${STATUS_COLORS[n.status].border}`,
          borderRadius: '8px',
          padding: '10px',
          fontWeight: n.type === 'phase' ? 'bold' : 'normal',
        },
      }));
      const rfEdges = res.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        ...(e.label ? { label: e.label } : {}),
      }));
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rfNodes, rfEdges);
      setNodes(layoutedNodes as any[]);
      setEdges(layoutedEdges as any[]);
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  const onNodeClick = (_: any, node: Node) => {
    const flowNode = flowData.find(n => n.id === node.id);
    if (flowNode?.triggerCode) {
      const skillMap: Record<string, string> = {
        AB: '/bmad-product-brief', CP: '/bmad-product-brief', CU: '/bmad-ux',
        CA: '/bmad-arch', CE: '/bmad-story', SP: '/bmad-sprint-plan',
        DS: '/bmad-dev-story', CR: '/bmad-code-review', QD: '/bmad-quick-dev',
        PB: '/bmad-product-brief', UX: '/bmad-ux', CS: '/bmad-story',
        TW: '/bmad-tech-writer', RT: '/bmad-retro', GC: '/bmad-gate-check',
      };
      const skill = skillMap[flowNode.triggerCode] || `/bmad-${flowNode.id}`;
      (callToolWithResult || callTool)('bmad_orchestrate', { skill, triggerCode: flowNode.triggerCode });
    }
  };

  return (
    <div className="w-full h-full">
      {loading && <div className="absolute top-4 right-4 z-10 text-gray-400 text-sm">Loading flow...</div>}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Panel position="top-left" className="bg-gray-800 p-2 rounded flex gap-2 border border-gray-700">
          <ActionButton variant={track === 'quick' ? 'primary' : 'secondary'} onClick={() => setTrack('quick')} className="text-xs py-1">Quick Flow</ActionButton>
          <ActionButton variant={track === 'bmad' ? 'primary' : 'secondary'} onClick={() => setTrack('bmad')} className="text-xs py-1">BMad Method</ActionButton>
          <ActionButton variant={track === 'enterprise' ? 'primary' : 'secondary'} onClick={() => setTrack('enterprise')} className="text-xs py-1">Enterprise</ActionButton>
        </Panel>
        <Controls />
        <MiniMap nodeStrokeColor="#4b5563" nodeColor="#1f2937" maskColor="#111827" />
        <Background color="#374151" gap={16} />
      </ReactFlow>
    </div>
  );
}

export function FlowDiagram(props: FlowDiagramProps) {
  return (
    <ReactFlowProvider>
      <FlowContent {...props} />
    </ReactFlowProvider>
  );
}
