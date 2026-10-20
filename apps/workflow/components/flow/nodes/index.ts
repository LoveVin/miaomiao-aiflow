import { StartNode, WorkflowNode } from './start-node'

export const nodeTypes = {
    start: StartNode,
    model: WorkflowNode,
    knowledge: WorkflowNode,
    http: WorkflowNode,
    condition: WorkflowNode,
    output: WorkflowNode,
}
