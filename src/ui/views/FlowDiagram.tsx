import React, { useEffect, useState, useMemo } from 'react';
import { ReactFlow, ReactFlowProvider, Controls, MiniMap, Background, useNodesState, useEdgesState, Panel, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { Track } from '../../shared/types';
import { ActionButton } from '../components/ActionButton';

interface FlowDiagramProps {
  callTool: (name: string, args: any) => Promise<any>;
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

const MOCK_NODES = [
  { id: '1', data: { label: 'Analysis' }, position: { x: 0, y: 0 }, style: { background: '#1e3a8a', color: '#fff', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px' } },
  { id: '2', data: { label: 'Planning' }, position: { x: 0, y: 0 }, style: { background: '#1e3a8a', color: '#fff', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px' } },
  { id: '3', data: { label: 'Solutioning' }, position: { x: 0, y: 0 }, style: { background: '#1e3a8a', color: '#fff', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px' } },
  { id: '4', data: { label: 'Implementation' }, position: { x: 0, y: 0 }, style: { background: '#374151', color: '#fff', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px' } }
];

const MOCK_EDGES = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4' }
];

function FlowContent({ callTool }: FlowDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [track, setTrack] = useState<Track>('bmad');

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(MOCK_NODES, MOCK_EDGES);
    setNodes(layoutedNodes as any[]);
    setEdges(layoutedEdges as any[]);
  }, [track, setNodes, setEdges]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
