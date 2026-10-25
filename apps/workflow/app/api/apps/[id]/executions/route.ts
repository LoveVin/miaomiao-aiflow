import { NextRequest } from 'next/server'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const app = await prisma.app.findFirst({ where: { id, userId: await getAuthenticatedUser(), isDeleted: false } })
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? 1))
        const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? 20)))
        const [total, records] = await prisma.$transaction([
            prisma.appExecution.count({ where: { publishedApp: { appId: app.id } } }),
            prisma.workflowExecution.findMany({
                where: { appId: app.id },
                orderBy: { startedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ])
        const apiRecords = await prisma.appExecution.findMany({
            where: { publishedApp: { appId: app.id } },
            orderBy: { startedAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: { apiKey: true, publishedApp: true },
        })
        const items = [
            ...records.map(record => ({
                id: record.id,
                time: record.startedAt.toISOString(),
                duration: record.duration ?? 0,
                success: record.status === 'SUCCESS',
                input: (record.inputs as Record<string, string>) ?? {},
                output: String((record.outputs as { output?: string })?.output ?? ''),
                steps: record.nodeTraces as never[],
                demo: false,
                tokens: record.totalTokens,
                source: '网页应用',
                user: '当前用户',
            })),
            ...apiRecords.map(record => ({
                id: record.id,
                time: record.startedAt.toISOString(),
                duration: record.duration ?? 0,
                success: record.status === 'SUCCESS',
                input: (record.inputs as Record<string, string>) ?? {},
                output: String((record.outputs as { output?: string })?.output ?? ''),
                steps: record.nodeTraces as never[],
                demo: false,
                tokens: record.totalTokens,
                source: 'API',
                user: record.apiKey?.name ?? 'API 调用',
            })),
        ].sort((left, right) => right.time.localeCompare(left.time))
        return apiSuccess({ items, total })
    } catch (error) {
        return handleApiError(error)
    }
}
