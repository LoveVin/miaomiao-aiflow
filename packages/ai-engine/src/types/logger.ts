import { NodeType } from './workflow'

// 日志级别
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 日志阶段
export type LogPhase =
    | 'workflow:start'
    | 'workflow:end'
    | 'node:start'
    | 'node:end'
    | 'variable:resolve'
    | 'llm:request'
    | 'llm:response'
    | 'http:request'
    | 'http:response'
    | 'condition:evaluate'

// 日志条目
export interface ExecutionLogEntry {
    timestamp: Date // 执行时间
    level: LogLevel // 日志级别
    nodeId?: string // 节点ID
    phase: LogPhase // 日志阶段
    message: string // 日志消息
    data?: Record<string, unknown> // 日志数据
    duration?: number // 执行耗时
}

// LLM 请求日志
export interface LLMRequestLog {
    model: string
    messages: Array<{ role: string; content: string }>
    temperature?: number // 温度参数
    maxTokens?: number // 最大token数
}

// LLM 响应日志
export interface LLMResponseLog {
    content: string
    tokens: number
    duration: number
}

// HTTP 请求日志
export interface HTTPRequestLog {
    method: string
    url: string
    headers: Record<string, string>
    body?: unknown
}

// HTTP 响应日志
export interface HTTPResponseLog {
    status: number
    headers: Record<string, string>
    data: unknown
    duration: number
}

// 节点执行结果
export interface NodeExecutionResult {
    success: boolean // 是否成功
    outputs: Record<string, unknown>
    inputs?: Record<string, unknown>
    error?: Error // 错误信息
    matchedBranch?: string // 条件节点专用：匹配的意图分支ID
    duration: number // 执行耗时
}

// 日志回调函数
export type LogCallback = (entry: ExecutionLogEntry) => void

// 执行日志器接口
export interface ExecutionLogger {
    debug(message: string, data?: Record<string, unknown>): void

    info(message: string, data?: Record<string, unknown>): void

    warn(message: string, data?: Record<string, unknown>): void

    error(message: string, data?: Record<string, unknown>): void

    // 记录节点开始
    nodeStart(nodeId: string, nodeType: NodeType, config: unknown): void

    // 记录节点结束
    nodeEnd(nodeId: string, result: NodeExecutionResult): void

    // 记录变量解析
    variableResolve(expression: string, originalValue: unknown, resolvedValue: unknown): void

    /** 记录 LLM 请求 */
    llmRequest(nodeId: string, request: LLMRequestLog): void

    /** 记录 LLM 响应 */
    llmResponse(nodeId: string, response: LLMResponseLog): void

    /** 记录 HTTP 请求 */
    httpRequest(nodeId: string, request: HTTPRequestLog): void

    /** 记录 HTTP 响应 */
    httpResponse(nodeId: string, response: HTTPResponseLog): void

    /** 获取所有日志条目 */
    getEntries(): ExecutionLogEntry[]

    /** 设置当前节点上下文 */
    setCurrentNode(nodeId: string | null): void
}
