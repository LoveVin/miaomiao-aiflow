import { ExecutionLogger, NodeExecutionResult } from './logger'
import { WorkflowDefinition, WorkflowInput } from './workflow'

// 输入变量 schema
export interface OutputVariableSchema {
    name: string
    type: ParamType
    description?: string // 变量描述
}

// 变量存储接口
export interface VariableStore {
    // 获取变量值
    get(nodeId: string, variableName: string): unknown

    // 设置变量值
    set(nodeId: string, variableName: string, value: unknown): void

    // 获取节点的所有输出
    getNodeOutputs(nodeId: string): Record<string, unknown> | undefined

    // 设置节点的所有输出
    setNodeOutputs(nodeId: string, outputs: Record<string, unknown>): void

    // 获取所有变量，用于调试
    getAll(): Map<string, Record<string, unknown>>
}

// 执行上下文接口
export interface ExecutionContext {
    // 执行ID
    readonly executionId: string

    // 工作流定义
    readonly workflow: WorkflowDefinition

    // 变量存储
    readonly variables: VariableStore

    // 工作流输入参数
    readonly inputs: WorkflowInput

    // 开始时间
    readonly startTime: Date

    // 解析变量表达式
    resolveVariable(expression: string): unknown

    // 解析文本中的所有变量
    resolveText(text: string): string

    // 获取上游节点 ID 列表
    getUpstreamNodes(nodeId: string): string[]

    // 检查节点是否已执行完成
    isNodeCompleted(nodeId: string): boolean

    // 标记节点完成
    markNodeCompleted(nodeId: string): void
}

// 节点执行器接口
export interface NodeExecutor<TConfig = Record<string, unknown>> {
    // 节点类型
    readonly type: string

    /**
     * 执行节点
     * @param nodeId 节点ID
     * @param config 节点配置
     * @param context 执行上下文
     * @param logger 执行日志器
     */
    execute(nodeId: string, config: TConfig, context: ExecutionContext, logger: ExecutionLogger): Promise<NodeExecutionResult>

    /**
     * 验证节点配置
     */
    validate?(config: TConfig): { valid: boolean; errors?: string[] }

    /**
     * 获取节点的输出变量定义
     */
    getOutputSchema?(config: TConfig): OutputVariableSchema[]
}

// ============== 节点配置类型定义 ==============

// 参数类型
export type ParamType = 'string' | 'number' | 'boolean' | 'array' | 'object'

// 输入参数
export interface InputParam {
    name: string // 参数名
    type: ParamType // 参数类型
    defaultValue?: string // 默认值
    required?: boolean // 是否必填
    description?: string // 参数描述
}

// Start 节点配置
export interface StartNodeConfig {
    inputs: InputParam[] // 输入参数列表
}

// LLM 节点配置
export interface LLMNodeConfig {
    model: string // 模型名称
    systemPrompt?: string // 系统提示词
    userPrompt?: string // 用户提示词，支持变量
    assistantPrompt?: string // 助手提示词
    temperature?: number // 温度参数，0-1之间
    maxTokens?: number // 最大 token 数
}

/**
 * Http节点配置
 */
// http 方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// body 类型
export type BodyType = 'none' | 'form-data' | 'json' | 'raw' | 'binary' | 'x-www-form-urlencoded'

export interface KeyValuePair {
    key: string
    value: string // 支持变量引用
}

export interface HTTPNodeConfig {
    url: string // 请求 URL
    method: HttpMethod // http 方法
    headers?: KeyValuePair[] // 请求头
    params?: KeyValuePair[] // URL参数
    bodyType?: BodyType // 请求体类型
    body: string // 请求体内容，根据 bodyType 不同而不同
    formData?: KeyValuePair[] // 表单数据，当 bodyType 为 form-data 时使用
    timeout?: number // 超时时间，单位毫秒
}

/**
 * 知识库节点配置
 */
// 知识库检索模式
export type KnowledgeRetrievalMode = 'vector' | 'fulltext' | 'hybrid'

// 知识库检索输出格式
export type KnowledgeOutputFormat = 'text' | 'json'

export interface KnowledgeNodeConfig {
    knowledgeBaseIds: string[] // 知识库ID列表
    query: string // 查询内容
    retrievalMode?: KnowledgeRetrievalMode // 知识库检索模式
    topK: number // 返回结果数量
    threshold?: number // 相似度阈值（0-1）
    outputFormat?: KnowledgeOutputFormat // 知识库检索输出格式
}

/**
 * Condition 节点配置
 */
// 意图定义
export interface Intent {
    name: string // 意图名称，作为分支标识
    description?: string // 意图描述
    condition?: string // 匹配条件
}

// Condition 节点配置，基于 LLM 进行意图识别
export interface ConditionNodeConfig {
    model: string // 用于意图识别的模型
    intents: Intent[] // 意图列表
}

/**
 * End 节点配置
 */
export interface OutputParam {
    name: string // 输出的变量名
    type: ParamType // 输出参数类型
    value: string // 值表达式
    description?: string // 输出参数描述å
}

export interface EndNodeConfig {
    outputs: OutputParam[] // 输出参数列表
}
