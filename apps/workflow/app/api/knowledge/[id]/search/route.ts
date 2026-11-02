import { NextRequest } from 'next/server'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { scoreChunk, sliceKnowledgeText } from '@/lib/knowledge/text-chunking'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const query = request.nextUrl.searchParams.get('query')?.trim() ?? ''
        if (!query) return apiSuccess({ results: [] })
        const mode = request.nextUrl.searchParams.get('mode')?.toUpperCase() || 'VECTOR'
        const topK = Math.min(20, Math.max(1, Number(request.nextUrl.searchParams.get('topK')) || 5))
        const threshold = Math.min(1, Math.max(0, Number(request.nextUrl.searchParams.get('threshold') ?? 0)))
        const startedAt = performance.now()
        const knowledgeBase = await prisma.knowledgeBase.findFirst({
            where: { id, userId: await getAuthenticatedUser() },
            include: { documents: true },
        })
        if (!knowledgeBase) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const results = knowledgeBase.documents
            .flatMap(
                document =>
                    sliceKnowledgeText(document.content ?? '')
                        .map((content, index) => ({
                            document,
                            content,
                            index,
                            score: scoreChunk(content, query),
                        }))
                        .filter(item => item.score >= threshold) ?? []
            )
            .sort((left, right) => right.score - left.score)
            .slice(0, topK)
            .map(item => ({
                chunkId: crypto.randomUUID(),
                documentId: item.document.id,
                documentName: item.document.name,
                content: item.content,
                chunkIndex: item.index,
                score: item.score,
            }))
        return apiSuccess({
            query,
            mode,
            topK,
            threshold,
            duration: Math.round(performance.now() - startedAt),
            total: results.length,
            results,
        })
    } catch (error) {
        return handleApiError(error)
    }
}
