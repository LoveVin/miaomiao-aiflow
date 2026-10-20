import { NodeRegistry } from './registry'

export { NodeRegistry, createNodeRegistry } from './registry'
export { BaseNodeExecutor } from './base-executor'
export { StartExecutor } from './executors/start'
export { LLMExecutor } from './executors/llm'
export { HTTPExecutor } from './executors/http'
export { ConditionExecutor } from './executors/condition'
export { EndExecutor } from './executors/end'
export { KnowledgeExecutor } from './executors/knowledge'

import { ConditionExecutor } from './executors/condition'
import { EndExecutor } from './executors/end'
import { HTTPExecutor } from './executors/http'
import { KnowledgeExecutor } from './executors/knowledge'
import { LLMExecutor } from './executors/llm'
import { StartExecutor } from './executors/start'

/**
 * 创建默认注册中心，包含所有的内置节点
 */
export function createDefaultNodeRegistry(): NodeRegistry {
    const registry = new NodeRegistry()

    // 注册内置节点执行器
    registry.register('start', new StartExecutor())
    registry.register('llm', new LLMExecutor())
    registry.register('http', new HTTPExecutor())
    registry.register('condition', new ConditionExecutor())
    registry.register('end', new EndExecutor())
    registry.register('knowledge', new KnowledgeExecutor())

    return registry
}
