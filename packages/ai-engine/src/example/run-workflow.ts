/**
 * 简单工作流示例
 */
import { createWorkflowEngine } from '../index'
import { WorkflowDefinition } from '../types'

const simpleWorkflow: WorkflowDefinition = {
    id: 'workflow-simple-1',
    name: '简单问答工作流',
    nodes: [
        {
            id: 'start-1',
            type: 'start',
            data: {
                label: '开始',
                config: {
                    inputs: [
                        {
                            name: 'question',
                            type: 'string',
                            required: true,
                            description: '用户问题',
                        },
                    ],
                },
            },
        },
        {
            id: 'llm-1',
            type: 'llm',
            data: {
                label: '大模型',
                config: {
                    model: 'qwen3.5:0.8b',
                    systemPrompt: '你是一个AI助手，请简洁地回答用户的问题',
                    userPrompt: '${start-1.question}',
                    temperature: 0.7,
                    maxTokens: 500,
                },
            },
        },
        {
            id: 'end-1',
            type: 'end',
            data: {
                label: '结束',
                config: {
                    outputs: [
                        {
                            name: 'answer',
                            type: 'string',
                            value: '${llm-1.output}',
                        },
                        {
                            name: 'tokens',
                            type: 'number',
                            value: '${llm-1.tokens}',
                        },
                    ],
                },
            },
        },
    ],
    edges: [
        {
            id: 'e1',
            source: 'start-1',
            target: 'llm-1',
        },
        {
            id: 'e2',
            source: 'llm-1',
            target: 'end-1',
        },
    ],
}

async function run() {
    console.log('='.repeat(60))
    console.log('示例运行')
    console.log('='.repeat(60))

    // 创建引擎，启用详细信息
    const engine = createWorkflowEngine({
        verbose: true,
    })

    const workflow = simpleWorkflow

    const inputs = {
        question: '你好，请介绍下你自己',
    }

    try {
        // 执行工作流
        const result = await engine.execute(workflow, inputs)

        if (result.success) {
            console.log('✅ 执行成功！')
            console.log(`执行 ID: ${result.executionId}`)
            console.log(`总耗时: ${result.duration}ms`)
            console.log()
            console.log('输出:')
            console.log(JSON.stringify(result.outputs, null, 2))
        } else {
            console.log('❌ 执行失败！')
            console.log(`错误: ${result.error?.message}`)
        }
    } catch (error) {
        console.error('执行出错:', error)
    }
}

run().catch(console.error)
