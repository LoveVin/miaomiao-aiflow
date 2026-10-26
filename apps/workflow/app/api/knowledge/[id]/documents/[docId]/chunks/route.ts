import { createOllamaEmbeddingService } from '@miaomiao-aiflow/ai-engine'
import { NextRequest } from 'next/server'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ApiChunk = {
    chunkId: string
    content: string
    chunkIndex: number
    startOffset: number
    endOffset: number
    charCount: number
    wordCount: number
    embeddingStats: {
        dimensions: number
        mean: number
        std: number
        min: number
        max: number
        norm: number
        preview: number[]
    } | null
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
    try {
        const { id, docId } = await params
        const knowledgeBase = await prisma.knowledgeBase.findFirst({
            where: { id, userId: await getAuthenticatedUser() },
        })
        if (!knowledgeBase) return apiError(ErrorCode.RESOURCE_NOT_FOUND)

        const document = await prisma.document.findFirst({
            where: { id: docId, knowledgeBaseId: knowledgeBase.id },
        })
        if (!document) return apiError(ErrorCode.RESOURCE_NOT_FOUND)

        const chunks: ApiChunk[] = []
        let offset = 0
        document.content?.match(/[\s\S]{1,500}/g)?.forEach((content, index) => {
            const startOffset = offset
            const endOffset = startOffset + content.length
            offset += content.length
            chunks.push({
                chunkId: `${document.id}_${index}`,
                content,
                chunkIndex: index,
                startOffset,
                endOffset,
                charCount: content.length,
                wordCount: content.split(/\s+/).filter(Boolean).length,
                embeddingStats: null,
            })
        })

        const embeddableChunks = chunks.filter(chunk => chunk.content.trim())
        if (embeddableChunks.length) {
            const embeddingService = createOllamaEmbeddingService({
                model: knowledgeBase.embeddingModel,
                baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
                dimensions: knowledgeBase.dimensions,
            })
            const vectors = await embeddingService.embedTexts(embeddableChunks.map(chunk => chunk.content))
            embeddableChunks.forEach((chunk, index) => {
                const vector = vectors[index]
                if (!vector?.length) return
                const mean = vector.reduce((total, value) => total + value, 0) / vector.length
                const std = Math.sqrt(vector.reduce((total, value) => total + (value - mean) ** 2, 0) / vector.length)
                chunk.embeddingStats = {
                    dimensions: vector.length,
                    mean: Number(mean.toFixed(6)),
                    std: Number(std.toFixed(6)),
                    min: Number(Math.min(...vector).toFixed(6)),
                    max: Number(Math.max(...vector).toFixed(6)),
                    norm: Number(Math.sqrt(vector.reduce((total, value) => total + value ** 2, 0)).toFixed(6)),
                    preview: vector.slice(0, 10).map(value => Number(value.toFixed(4))),
                }
            })
        }

        return apiSuccess({
            documentId: document.id,
            documentName: document.name,
            total: chunks.length,
            documentStats: {
                totalChars: chunks.reduce((total, chunk) => total + chunk.charCount, 0),
                totalWords: chunks.reduce((total, chunk) => total + chunk.wordCount, 0),
                embeddingModel: knowledgeBase.embeddingModel,
                embeddingDimensions: knowledgeBase.dimensions,
            },
            chunks,
        })
    } catch (error) {
        return handleApiError(error)
    }
}
