import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getOwnedKnowledgeBase(id: string, userId: string) {
    return prisma.knowledgeBase.findFirst({ where: { id, userId } })
}

type WorkflowNodeLike = {
    data?: { config?: { knowledgeBaseIds?: string[] } }
}

/**
 * 找出引用了指定知识库的工作流应用（编辑中的工作流版本 + 已发布的版本）
 */
async function findReferencingWorkflowApps(knowledgeBaseId: string, userId: string) {
    const apps = await prisma.app.findMany({
        where: { userId, type: 'WORKFLOW', isDeleted: false },
        select: {
            id: true,
            name: true,
            workflows: { select: { nodes: true } },
            publishedVersions: { select: { nodes: true } },
        },
    })
    return apps.filter(app => {
        const nodes: WorkflowNodeLike[] = [
            ...app.workflows.flatMap(workflow => (workflow.nodes as unknown[] | null) ?? []),
            ...app.publishedVersions.flatMap(published => (published.nodes as unknown[] | null) ?? []),
        ] as WorkflowNodeLike[]
        return nodes.some(node => node.data?.config?.knowledgeBaseIds?.includes(knowledgeBaseId) ?? false)
    })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const knowledgeBase = await getOwnedKnowledgeBase(id, await getAuthenticatedUser())
        if (!knowledgeBase) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const parsed = z
            .object({
                name: z.string().trim().min(1).max(60).optional(),
                description: z.string().max(500).optional(),
                retrievalMode: z.enum(['VECTOR', 'FULLTEXT', 'HYBRID']).optional(),
                vectorWeight: z.number().min(0).max(1).optional(),
                topK: z.number().int().min(1).max(20).optional(),
                threshold: z.number().min(0).max(1).optional(),
                chunkSize: z.number().int().min(100).max(2000).optional(),
                chunkOverlap: z.number().int().min(0).max(500).optional(),
            })
            .safeParse(await request.json())
        if (!parsed.success) return apiError(ErrorCode.VALIDATION_ERROR, parsed.error.issues[0]?.message)
        return apiSuccess(await prisma.knowledgeBase.update({ where: { id: knowledgeBase.id }, data: parsed.data }))
    } catch (error) {
        return handleApiError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const userId = await getAuthenticatedUser()
        const knowledgeBase = await getOwnedKnowledgeBase(id, userId)
        if (!knowledgeBase) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const referencingApps = await findReferencingWorkflowApps(id, userId)
        if (referencingApps.length > 0) {
            const appNames = referencingApps.map(app => app.name)
            return apiError(
                ErrorCode.KNOWLEDGE_BASE_IN_USE,
                `该知识库正被工作流应用“${appNames.join('、')}”引用，请先在对应应用中解除引用后再删除。`,
                { apps: referencingApps.map(app => ({ id: app.id, name: app.name })) }
            )
        }
        await prisma.knowledgeBase.delete({ where: { id: knowledgeBase.id } })
        return apiSuccess(null, '删除成功')
    } catch (error) {
        return handleApiError(error)
    }
}
