import { ExecutionContext, VariableStore, WorkflowDefinition, WorkflowInput } from '../types'
import { GraphBuilder } from './graph-builder'
import { VariableResolver } from './variable-resolver'

/**
 * 变量存储实现
 */
class DefaultVariableStore implements VariableStore {
    private store: Map<string, Record<string, unknown>> = new Map()

    get(nodeId: string, variableName: string): unknown {
        const nodeOutputs = this.store.get(nodeId)
        return nodeOutputs?.[variableName]
    }

    set(nodeId: string, variableName: string, value: unknown): void {
        const nodeOutputs = this.store.get(nodeId) || {}
        nodeOutputs[variableName] = value
        this.store.set(nodeId, nodeOutputs)
    }

    getNodeOutputs(nodeId: string): Record<string, unknown> | undefined {
        return this.store.get(nodeId)
    }

    setNodeOutputs(nodeId: string, outputs: Record<string, unknown>): void {
        this.store.set(nodeId, outputs)
    }

    getAll(): Map<string, Record<string, unknown>> {
        return new Map(this.store)
    }
}

class DefaultExecutionContext implements ExecutionContext {
    readonly executionId: string
    readonly workflow: WorkflowDefinition
    readonly variables: VariableStore
    readonly inputs: WorkflowInput
    readonly startTime: Date

    private completedNodes: Set<string> = new Set()
    private graphBuilder: GraphBuilder
    private variableResolver: VariableResolver

    constructor(executionId: string, workflow: WorkflowDefinition, inputs: WorkflowInput) {
        this.executionId = executionId
        this.workflow = workflow
        this.inputs = inputs
        this.startTime = new Date()
        this.variables = new DefaultVariableStore()
        this.graphBuilder = new GraphBuilder(workflow)
        this.variableResolver = new VariableResolver()
    }

    resolveVariable(expression: string): unknown {
        const { value, found } = this.variableResolver.resolveExpression(expression, this.variables)
        return found ? value : undefined
    }

    resolveText(text: string): string {
        const resolvedVariables = this.variableResolver.resolveText(text, this.variables)
        return resolvedVariables.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, name: string) => {
            const value = this.inputs[name]
            return value === undefined ? match : String(value)
        })
    }

    getUpstreamNodes(nodeId: string): string[] {
        return this.graphBuilder.getUpstreamNodes(nodeId)
    }

    isNodeCompleted(nodeId: string): boolean {
        return this.completedNodes.has(nodeId)
    }

    markNodeCompleted(nodeId: string): void {
        this.completedNodes.add(nodeId)
    }
}

/**
 * 创建执行上下文
 */
export function createExecutionContext(executionId: string, workflow: WorkflowDefinition, inputs: WorkflowInput): ExecutionContext {
    return new DefaultExecutionContext(executionId, workflow, inputs)
}
