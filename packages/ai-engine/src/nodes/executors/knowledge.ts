// 知识库节点
import type { KnowledgeRetrievalProvider } from '../../types'
import { ExecutionContext, ExecutionLogger, KnowledgeNodeConfig, NodeExecutionResult, OutputVariableSchema } from '../../types'
import { BaseNodeExecutor } from '../base-executor'

export class KnowledgeExecutor extends BaseNodeExecutor<KnowledgeNodeConfig> {
    readonly type = 'knowledge' as const

    constructor(private readonly retrievalProvider?: KnowledgeRetrievalProvider) {
        super()
    }

    protected async doExecute(
        nodeId: string,
        config: KnowledgeNodeConfig,
        context: ExecutionContext,
        logger: ExecutionLogger
    ): Promise<NodeExecutionResult> {
        // 解析配置中的变量
        const resolvedConfig = this.resolveConfigVariables(config, context, logger)

        const { knowledgeBaseIds, query, retrievalMode, topK, threshold = 0.2, outputFormat } = resolvedConfig

        // 验证配置
        if (!knowledgeBaseIds || knowledgeBaseIds.length === 0) {
            throw new Error('Knowledge base IDs are required')
        }

        if (!query || query.trim().length === 0) {
            throw new Error('Query is required')
        }

        const startTime = Date.now()

        logger.info(`Knowledge retrieval started`, {
            nodeId,
            query: query.substring(0, 200),
            knowledgeBaseIds,
            retrievalMode,
            topK,
            threshold,
        })

        if (!this.retrievalProvider) {
            throw new Error('Knowledge retrieval provider is not configured')
        }

        const retrievedResults = await this.retrievalProvider({
            query: query.trim(),
            knowledgeBaseIds,
            mode: retrievalMode || 'vector',
            topK: topK || 5,
            threshold,
        })
        const duration = Date.now() - startTime

        const results = retrievedResults.map(result => ({
            id: result.chunkId,
            chunkId: result.chunkId,
            documentId: result.documentId,
            documentName: result.metadata?.documentName ?? '',
            knowledgeBaseId: result.knowledgeBaseId,
            content: result.content,
            index: result.chunkIndex,
            score: result.score,
            metadata: result.metadata,
        }))

        let output: unknown
        if (outputFormat === 'json') {
            output = results
        } else {
            output = results.map(r => r.content).join('\n\n')
        }

        return {
            success: true,
            outputs: {
                results,
                output,
                count: results.length,
            },
            duration,
        }
    }

    override validate(config: KnowledgeNodeConfig): { valid: boolean; errors?: string[] } {
        const errors: string[] = []

        if (!config.knowledgeBaseIds || config.knowledgeBaseIds.length === 0) {
            errors.push('At least one knowledge base must be selected')
        }

        if (!config.query || config.query.trim().length === 0) {
            errors.push('Query is required')
        }

        if (config.topK !== undefined && (config.topK < 1 || config.topK > 20)) {
            errors.push('Top K must be between 1 and 20')
        }

        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        }
    }

    override getOutputSchema(): OutputVariableSchema[] {
        return [
            { name: 'results', type: 'array', description: '检索结果列表' },
            { name: 'output', type: 'string', description: '格式化后的输出文本' },
            { name: 'count', type: 'number', description: '检索结果数量' },
        ]
    }
}
