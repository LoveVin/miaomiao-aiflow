import { NextRequest } from 'next/server'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runWorkflow } from '@/lib/workflow-engine'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const app = await prisma.app.findFirst({
            where: { id, userId: await getAuthenticatedUser(), isDeleted: false },
            include: { workflows: { orderBy: { version: 'desc' }, take: 1 } },
        })
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const workflow = app.workflows[0]
        if (!workflow) return apiError(ErrorCode.VALIDATION_ERROR, '请先保存工作流')
        const body = (await request.json()) as { inputs?: Record<string, string> }
        const inputs = body.inputs ?? {}
        const nodes = workflow.nodes as never[]
        const edges = workflow.edges as never[]
        const result = runWorkflow(nodes, edges, inputs)
        const execution = await prisma.workflowExecution.create({
            data: {
                executionId: crypto.randomUUID(),
                appId: app.id,
                status: result.status,
                inputs,
                outputs: { output: result.outputs },
                error: result.error,
                duration: result.duration,
                nodeTraces: JSON.parse(JSON.stringify(result.nodeTraces)),
                startedAt: new Date(Date.now() - result.duration),
                completedAt: new Date(),
            },
        })
        return apiSuccess({
            id: execution.id,
            time: execution.startedAt.toISOString(),
            duration: result.duration,
            success: result.status === 'SUCCESS',
            input: inputs,
            output: result.outputs,
            steps: result.nodeTraces,
            status: result.status,
            totalTokens: 0,
        })
    } catch (error) {
        return handleApiError(error)
    }
}
