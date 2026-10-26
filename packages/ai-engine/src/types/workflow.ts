import type { NodeRegistry } from '../nodes/registry'
import { ExecutionLogEntry, NodeExecutionResult } from './logger'

// 节点类型枚举
export type NodeType = 'start' | 'llm' | 'knowledge' | 'http' | 'condition' | 'end'

// 工作流节点定义
export interface WorkflowNode {
    id: string // 节点唯一标识
    type: NodeType // 节点类型
    data: {
        label?: string // 节点显示名称
        config?: Record<string, unknown> // 节点配置参数，不同类型配置不同
    }
}

// 工作流边定义
export interface WorkflowEdge {
    id: string // 边唯一标识
    source: string // 源节点ID
    sourceHandle?: string // 源节点的输出句柄，用于条件分支
    target: string // 目标节点ID
}

// 工作流定义
export interface WorkflowDefinition {
    id: string
    name: string
    nodes: WorkflowNode[] // 工作流节点列表
    edges: WorkflowEdge[] // 工作流边列表
}

// 工作流执行输入
export type WorkflowInput = Record<string, unknown>

// 验证结果
export interface ValidationResult {
    valid: boolean // 是否有效
    errors?: string[] // 验证失败信息
}

// 工作流执行上下文
export interface WorkflowExecutionContext {
    nodes: Record<string, unknown> // 工作流节点上下文，键为节点ID，值为节点上下文
    edges: WorkflowEdge[] // 工作流边列表
}

// 工作流执行结果
export interface WorkflowResult {
    success: boolean // 是否成功
    outputs: Record<string, unknown>
    error?: Error // 错误信息
    executionId: string // 执行 ID
    duration?: number // 总耗时
    logs: unknown[] // 执行日志，每个元素为 NodeExecutionResult 类型 // 执行日志
}

// 工作流执行选项，用于实时回调
export interface ExecuteOptions {
    // 节点开始执行时回调
    onNodeStart?: (nodeId: string, nodeType: NodeType, nodeName: string) => void
    // 节点执行完成回调
    onNodeEnd?: (nodeId: string, result: NodeExecutionResult) => void
    // 日志记录回调
    onLog?: (entry: ExecutionLogEntry) => void
}

// ====== 工作流引擎接口 ======
/** 工作流引擎配置 */
export interface WorkflowEngineConfig {
    // Ollama 服务器地址
    ollamaBaseUrl?: string
    // 知识库检索服务，由宿主应用提供
    knowledgeRetrievalProvider?: import('./knowledge').KnowledgeRetrievalProvider
    // 默认超时时间，毫秒
    defaultTimeout?: number
    // 是否启用详细日志
    verbose?: boolean
}

/** 工作流引擎接口 */
export interface IWorkflowEngine {
    /**
     * 执行工作流
     * @param workflow 工作流定义
     * @param input 输入参数
     * @param options 执行选项，可选，用于实时回调
     */
    execute(workflow: WorkflowDefinition, input: WorkflowInput, options?: ExecuteOptions): Promise<WorkflowResult>

    /**
     * 验证工作流
     * @param workflow 工作流定义
     */
    validate(workflow: WorkflowDefinition): ValidationResult

    /**
     * 获取节点注册中心
     */
    getRegistry(): NodeRegistry
}

// ====== 工作流验证器接口 ======
/** 节点验证器接口 */
export interface NodeValidator<TConfig = unknown> {
    // 节点类型
    readonly type: string

    // 验证节点配置
    validate(config: TConfig): ValidationResult

    // 验证节点在工作流中的说过你下文，可选
    // 例如验证节点的连接关系，前置条件等
    validateInWorkflow?(node: WorkflowNode, workflow: WorkflowDefinition): ValidationResult
}

/** 工作流验证器接口 */
export interface WorkflowValidator {
    // 验证工作流定义
    validate(workflow: WorkflowDefinition): ValidationResult
}
