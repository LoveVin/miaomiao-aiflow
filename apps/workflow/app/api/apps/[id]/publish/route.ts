import { NextRequest } from 'next/server'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const app = await prisma.app.findFirst({
            where: { id, userId: await getAuthenticatedUser(), isDeleted: false },
            include: { workflows: { orderBy: { version: 'desc' }, take: 1 } },
        })
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const workflow = app.workflows[0]
        if (!workflow) return apiError(ErrorCode.VALIDATION_ERROR, '请先保存工作流')
        const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : []
        if (!nodes.some(node => (node as { type?: string })?.type === 'output')) return apiError(ErrorCode.VALIDATION_ERROR, '缺少结束节点')
        const version = app.version + 1
        const published = await prisma.$transaction(async transaction => {
            const record = await transaction.publishedApp.create({
                data: {
                    appId: app.id,
                    version,
                    name: app.name,
                    description: app.description,
                    nodes: workflow.nodes ?? [],
                    edges: workflow.edges ?? [],
                    publishedBy: app.userId,
                },
            })
            await transaction.app.update({
                where: { id: app.id },
                data: { version, isPublished: true, publishedAt: record.publishedAt, activePublishedId: record.id },
            })
            return record
        })
        return apiSuccess({ id: published.id, version: published.version }, '发布成功')
    } catch (error) {
        return handleApiError(error)
    }
}
