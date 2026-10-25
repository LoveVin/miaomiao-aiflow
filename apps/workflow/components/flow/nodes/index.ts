import { ConditionNode } from './condition-node'
import { HttpNode } from './http-node'
import { KnowledgeNode } from './knowledge-node'
import { LLMNode } from './llm-node'
import { OutputNode } from './output-node'
import { StartNode } from './start-node'

export const nodeTypes = {
    start: StartNode,
    llm: LLMNode,
    knowledge: KnowledgeNode,
    http: HttpNode,
    condition: ConditionNode,
    output: OutputNode,
}
