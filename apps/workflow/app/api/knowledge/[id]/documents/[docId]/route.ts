import { NextRequest } from 'next/server'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
    try {
        const { id, docId } = await params
        const knowledgeBase = await prisma.knowledgeBase.findFirst({ where: { id, userId: await getAuthenticatedUser() } })
        const document = await prisma.document.findFirst({ where: { id: docId, knowledgeBaseId: id } })
        if (!knowledgeBase || !document) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        await prisma.document.delete({ where: { id: document.id } })
        return apiSuccess(null, '删除成功')
    } catch (error) {
        return handleApiError(error)
    }
}
