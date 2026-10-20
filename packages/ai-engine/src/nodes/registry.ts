import { NodeExecutor, NodeType } from '../types'

export class NodeRegistry {
    private executors: Map<NodeType, NodeExecutor> = new Map()

    /**
     * 注册节点执行器
     * @param type 节点类型
     * @param executor 节点执行器
     */
    register<T = Record<string, unknown>>(type: NodeType, executor: NodeExecutor<T>): void {
        if (this.executors.has(type)) {
            console.warn(`[NodeRegistry] Node executor for type "${type}" is being overwritten`)
        }
        this.executors.set(type, executor as NodeExecutor)
    }

    /**
     * 获取节点执行器
     * @param type 节点类型
     * @returns 节点执行器
     */
    get(type: NodeType): NodeExecutor | undefined {
        return this.executors.get(type)
    }

    /**
     * 检查是否支持某节点类型
     * @param type 节点类型
     * @returns 是否支持
     */
    has(type: NodeType): boolean {
        return this.executors.has(type)
    }

    /**
     * 获取所有已注册的节点类型
     * @returns 所有已注册的节点类型
     */
    getRegisteredTypes(): NodeType[] {
        return [...this.executors.keys()]
    }

    /**
     * 注销节点执行器
     * @param type 节点类型
     * @returns 是否成功注销
     */
    unregister(type: NodeType): boolean {
        return this.executors.delete(type)
    }

    /**
     * 清空所有已注册的节点执行器
     */
    clear(): void {
        this.executors.clear()
    }
}

/**
 * 创建节点注册中心
 * @returns 节点注册中心
 */
export function createNodeRegistry(): NodeRegistry {
    return new NodeRegistry()
}
