import { ConditionNode } from './condition-node'
import { HttpNode } from './http-node'
import { KnowledgeNode } from './knowledge-node'
import { ModelNode } from './model-node'
import { OutputNode } from './output-node'
import { StartNode } from './start-node'

export const nodeTypes = {
    start: StartNode,
    model: ModelNode,
    knowledge: KnowledgeNode,
    http: HttpNode,
    condition: ConditionNode,
    output: OutputNode,
}
