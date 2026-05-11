import { getDashboardState } from './dashboard.js';
function getBmadFlowNodes() {
    return [
        { id: 'analysis', label: 'Analysis', type: 'phase', phase: 'analysis', status: 'pending' },
        { id: 'planning', label: 'Planning', type: 'phase', phase: 'planning', status: 'pending' },
        { id: 'solutioning', label: 'Solutioning', type: 'phase', phase: 'solutioning', status: 'pending' },
        { id: 'implementation', label: 'Implementation', type: 'phase', phase: 'implementation', status: 'pending' },
        { id: 'analyze-brief', label: 'Analyze Brief', type: 'workflow', phase: 'analysis', status: 'pending', agent: 'Mary', triggerCode: 'AB' },
        { id: 'create-prd', label: 'Create PRD', type: 'workflow', phase: 'planning', status: 'pending', agent: 'John', triggerCode: 'CP' },
        { id: 'create-ux', label: 'Create UX Spec', type: 'workflow', phase: 'planning', status: 'pending', agent: 'Sally', triggerCode: 'CU' },
        { id: 'create-arch', label: 'Create Architecture', type: 'workflow', phase: 'solutioning', status: 'pending', agent: 'Winston', triggerCode: 'CA' },
        { id: 'create-epics', label: 'Create Epics', type: 'workflow', phase: 'solutioning', status: 'pending', agent: 'John', triggerCode: 'CE' },
        { id: 'sprint-planning', label: 'Sprint Planning', type: 'workflow', phase: 'implementation', status: 'pending', agent: 'Amelia', triggerCode: 'SP' },
        { id: 'dev-story', label: 'Dev Story', type: 'workflow', phase: 'implementation', status: 'pending', agent: 'Amelia', triggerCode: 'DS' },
        { id: 'code-review', label: 'Code Review', type: 'workflow', phase: 'implementation', status: 'pending', agent: 'Amelia', triggerCode: 'CR' },
    ];
}
function getBmadFlowEdges() {
    return [
        { id: 'e-a-p', source: 'analysis', target: 'planning' },
        { id: 'e-p-s', source: 'planning', target: 'solutioning' },
        { id: 'e-s-i', source: 'solutioning', target: 'implementation' },
        { id: 'e-ab-prd', source: 'analyze-brief', target: 'create-prd' },
        { id: 'e-prd-ux', source: 'create-prd', target: 'create-ux' },
        { id: 'e-prd-arch', source: 'create-prd', target: 'create-arch' },
        { id: 'e-arch-epics', source: 'create-arch', target: 'create-epics' },
        { id: 'e-epics-sp', source: 'create-epics', target: 'sprint-planning' },
        { id: 'e-sp-ds', source: 'sprint-planning', target: 'dev-story' },
        { id: 'e-ds-cr', source: 'dev-story', target: 'code-review' },
    ];
}
function getQuickFlowNodes() {
    return [
        { id: 'intent', label: 'Describe Intent', type: 'workflow', phase: 'analysis', status: 'pending' },
        { id: 'quick-dev', label: 'Quick Dev', type: 'workflow', phase: 'implementation', status: 'pending', agent: 'Amelia', triggerCode: 'QD' },
    ];
}
function getQuickFlowEdges() {
    return [{ id: 'e-i-qd', source: 'intent', target: 'quick-dev' }];
}
const PHASES_ORDER = ['analysis', 'planning', 'solutioning', 'implementation'];
function applyLiveStatus(nodes, state) {
    const currentIdx = state.phase ? PHASES_ORDER.indexOf(state.phase) : -1;
    return nodes.map((node) => {
        let status = 'pending';
        if (node.type === 'phase') {
            const nodeIdx = PHASES_ORDER.indexOf(node.phase);
            if (nodeIdx < currentIdx)
                status = 'done';
            else if (nodeIdx === currentIdx)
                status = 'active';
        }
        else {
            switch (node.triggerCode) {
                case 'AB':
                    status = state.documents.projectContext ? 'done' : 'pending';
                    break;
                case 'CP':
                    status = state.documents.prd ? 'done' : 'pending';
                    break;
                case 'CU':
                    status = state.documents.uxSpec ? 'done' : 'pending';
                    break;
                case 'CA':
                    status = state.documents.architecture ? 'done' : 'pending';
                    break;
                case 'CE':
                    status = state.epics.length > 0 ? 'done' : 'pending';
                    break;
                case 'SP':
                    status = state.sprint ? 'done' : 'pending';
                    break;
                case 'DS':
                    status = state.sprint ? 'in-progress' : 'pending';
                    break;
                default: break;
            }
        }
        return { ...node, status };
    });
}
export async function handleFlow(track, projectPath) {
    const state = await getDashboardState(projectPath);
    let nodes;
    let edges;
    if (track === 'quick') {
        nodes = getQuickFlowNodes();
        edges = getQuickFlowEdges();
    }
    else {
        nodes = getBmadFlowNodes();
        edges = getBmadFlowEdges();
    }
    nodes = applyLiveStatus(nodes, state);
    return { nodes, edges, track };
}
