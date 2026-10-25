import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getOwnedKnowledgeBase(id: string, userId: string) {
    return prisma.knowledgeBase.findFirst({ where: { id, userId } })
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
        const knowledgeBase = await getOwnedKnowledgeBase(id, await getAuthenticatedUser())
        if (!knowledgeBase) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        await prisma.knowledgeBase.delete({ where: { id: knowledgeBase.id } })
        return apiSuccess(null, '删除成功')
    } catch (error) {
        return handleApiError(error)
    }
}
