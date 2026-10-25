import { NextRequest } from 'next/server'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const app = await prisma.app.findFirst({ where: { id, userId: await getAuthenticatedUser(), isDeleted: false } })
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const records = await prisma.workflowExecution.findMany({
            where: { appId: app.id },
            orderBy: { startedAt: 'desc' },
            take: 50,
        })
        return apiSuccess({
            items: records.map(record => ({
                id: record.id,
                time: record.startedAt.toISOString(),
                duration: record.duration ?? 0,
                success: record.status === 'SUCCESS',
                input: record.inputs ?? {},
                output:
                    typeof record.outputs === 'string' ? record.outputs : ((record.outputs as { output?: string } | null)?.output ?? ''),
                steps: Array.isArray(record.nodeTraces) ? record.nodeTraces : [],
                status: record.status,
                totalTokens: record.totalTokens,
            })),
        })
    } catch (error) {
        return handleApiError(error)
    }
}
