import { apiRequest } from '@/lib/services/api-client'

export type KnowledgeDocument = {
    id: string
    name: string
    size: string
    slices: number
    time: string
    content: string[]
    status: string
}

export type RawKnowledgeDocument = {
    id: string
    name: string
    size: number
    chunkCount: number
    updatedAt: string
    content: string | null
    status: string
}

export type RawKnowledgeBase = {
    id: string
    name: string
    description: string | null
    icon: string
    iconColor: string
    retrievalMode: string
    embeddingModel: string
    embeddingProvider: string
    dimensions: number
    chunkSize: number
    chunkOverlap: number
    vectorWeight: number
    topK: number
    threshold: number
    updatedAt: string
    documents: RawKnowledgeDocument[]
}

export type KnowledgeLibrary = {
    id: string
    name: string
    desc: string
    docs: number
    slices: number
    time: string
    color: string
    icon?: string
    mode: string
    embeddingModel: string
    embeddingProvider: string
    dimensions: number
    chunkSize: number
    chunkOverlap: number
    vectorWeight: number
    topK: number
    threshold: number
    documents: KnowledgeDocument[]
}

export type SearchResponse = {
    query: string
    mode: string
    topK: number
    threshold: number
    duration: number
    total: number
    results: {
        chunkId: string
        documentId: string
        documentName: string
        content: string
        chunkIndex: number
        score: number
    }[]
}

export type DocumentChunk = {
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

export type DocumentChunksResponse = {
    documentId: string
    documentName: string
    total: number
    documentStats: {
        totalChars: number
        totalWords: number
        embeddingModel: string
        embeddingDimensions: number
    }
    chunks: DocumentChunk[]
}

export const knowledgeService = {
    getList: () => apiRequest<{ items: RawKnowledgeBase[] }>('/api/knowledge'),
    create: (data: { name: string; description?: string; icon?: string }) =>
        apiRequest<{ id: string }>('/api/knowledge', { method: 'POST', body: JSON.stringify(data) }),
    update: (
        id: string,
        data: {
            name?: string
            description?: string
            retrievalMode?: string
            vectorWeight?: number
            topK?: number
            threshold?: number
            chunkSize?: number
            chunkOverlap?: number
        }
    ) => apiRequest<{ id: string }>(`/api/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest<void>(`/api/knowledge/${id}`, { method: 'DELETE' }),
    uploadDocuments: async (id: string, files: File[]) => {
        const body = new FormData()
        files.forEach(file => body.append('files', file))
        return apiRequest<{ imported: RawKnowledgeDocument[]; rejected: string[] }>(`/api/knowledge/${id}/documents`, {
            method: 'POST',
            body,
        })
    },
    deleteDocument: async (id: string, docId: string) => {
        await apiRequest<void>(`/api/knowledge/${id}/documents/${docId}`, { method: 'DELETE' })
    },
    search: (id: string, params: { query: string; mode?: string; topK?: number; threshold?: number }) => {
        const searchParams = new URLSearchParams({ query: params.query })
        if (params.mode) searchParams.set('mode', params.mode)
        if (params.topK) searchParams.set('topK', String(params.topK))
        if (params.threshold !== undefined) searchParams.set('threshold', String(params.threshold))
        return apiRequest<SearchResponse>(`/api/knowledge/${id}/search?${searchParams.toString()}`)
    },
    getDocumentChunks: (id: string, docId: string) => apiRequest<DocumentChunksResponse>(`/api/knowledge/${id}/documents/${docId}/chunks`),
}
