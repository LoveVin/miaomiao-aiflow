import { NextRequest } from 'next/server'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { runWorkflow } from '@/lib/workflow-engine'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const authorization = request.headers.get('authorization') ?? ''
        const key = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
        if (!key) return apiError(ErrorCode.UNAUTHORIZED)
        const apiKey = await prisma.apiKey.findUnique({ where: { key }, include: { app: true } })
        if (!apiKey || !apiKey.isActive || apiKey.app.isDeleted || apiKey.app.activePublishedId !== id)
            return apiError(ErrorCode.UNAUTHORIZED)
        const publishedApp = await prisma.publishedApp.findUnique({ where: { id } })
        if (!publishedApp) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const body = (await request.json()) as { inputs?: Record<string, string> }
        const inputs = body.inputs ?? {}
        const result = await runWorkflow(publishedApp.nodes as never[], publishedApp.edges as never[], inputs)
        await prisma.$transaction([
            prisma.appExecution.create({
                data: {
                    executionId: crypto.randomUUID(),
                    status: result.status,
                    publishedAppId: publishedApp.id,
                    apiKeyId: apiKey.id,
                    inputs,
                    outputs: { output: result.outputs },
                    error: result.error,
                    duration: result.duration,
                    nodeTraces: JSON.parse(JSON.stringify(result.nodeTraces)),
                    startedAt: new Date(Date.now() - result.duration),
                    completedAt: new Date(),
                },
            }),
            prisma.apiKey.update({ where: { id: apiKey.id }, data: { usageCount: { increment: 1 }, lastUsedAt: new Date() } }),
        ])
        if (result.status === 'ERROR') return apiError(ErrorCode.INTERNAL_SERVER_ERROR, result.error ?? '工作流执行失败')
        return apiSuccess({ output: result.outputs, nodeTraces: result.nodeTraces, duration: result.duration })
    } catch (error) {
        return handleApiError(error)
    }
}
