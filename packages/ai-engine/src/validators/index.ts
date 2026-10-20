import { ConditionValidator } from './node-validators/condition'
import { EndValidator } from './node-validators/end'
import { HTTPValidator } from './node-validators/http'
import { KnowledgeValidator } from './node-validators/knowledge'
import { LLMValidator } from './node-validators/llm'
import { StartValidator } from './node-validators/start'
import { DefaultWorkflowValidator } from './workflow-validator'

export { StartValidator } from './node-validators/start'
export { LLMValidator } from './node-validators/llm'
export { KnowledgeValidator } from './node-validators/knowledge'
export { HTTPValidator } from './node-validators/http'
export { ConditionValidator } from './node-validators/condition'
export { EndValidator } from './node-validators/end'
export { DefaultWorkflowValidator } from './workflow-validator'

/**
 * 创建默认的工作流验证器，包含所有内置节点的验证器
 * @returns
 */
export function createDefaultWorkflowValidator(): DefaultWorkflowValidator {
    return new DefaultWorkflowValidator([
        new StartValidator(),
        new LLMValidator(),
        new KnowledgeValidator(),
        new HTTPValidator(),
        new ConditionValidator(),
        new EndValidator(),
    ])
}
