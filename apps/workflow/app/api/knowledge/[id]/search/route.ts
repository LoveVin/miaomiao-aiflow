import { NextRequest } from 'next/server'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const query = request.nextUrl.searchParams.get('query')?.trim() ?? ''
        if (!query) return apiSuccess({ results: [] })
        const knowledgeBase = await prisma.knowledgeBase.findFirst({
            where: { id, userId: await getAuthenticatedUser() },
            include: { documents: true },
        })
        if (!knowledgeBase) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const results = knowledgeBase.documents
            .flatMap(
                document =>
                    (document.content ?? '')
                        .match(/[\s\S]{1,500}/g)
                        ?.map((content, index) => ({
                            document,
                            content,
                            index,
                            score: content.toLowerCase().includes(query.toLowerCase()) ? 1 : 0,
                        }))
                        .filter(item => item.score > 0) ?? []
            )
            .sort((left, right) => right.score - left.score)
            .slice(0, 5)
            .map(item => ({
                id: crypto.randomUUID(),
                documentId: item.document.id,
                documentName: item.document.name,
                content: item.content,
                index: item.index,
                score: item.score,
            }))
        return apiSuccess({ results })
    } catch (error) {
        return handleApiError(error)
    }
}
