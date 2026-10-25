import { apiRequest } from '@/lib/services/api-client'

export type KnowledgeDocument = {
    id: string
    name: string
    size: string
    slices: number
    time: string
    content: string[]
    demo: boolean
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
    documents: KnowledgeDocument[]
}

export const knowledgeService = {
    getList: () => apiRequest<{ items: RawKnowledgeBase[] }>('/api/knowledge'),
    create: (data: { name: string; description?: string; icon?: string }) =>
        apiRequest<{ id: string }>('/api/knowledge', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; description?: string; retrievalMode?: string }) =>
        apiRequest<{ id: string }>(`/api/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest<void>(`/api/knowledge/${id}`, { method: 'DELETE' }),
    uploadDocuments: async (id: string, files: File[]) => {
        const body = new FormData()
        files.forEach(file => body.append('files', file))
        return apiRequest<{ imported: KnowledgeDocument[]; rejected: string[] }>(`/api/knowledge/${id}/documents`, { method: 'POST', body })
    },
    deleteDocument: async (id: string, docId: string) => {
        await apiRequest<void>(`/api/knowledge/${id}/documents/${docId}`, { method: 'DELETE' })
    },
    search: (id: string, query: string) =>
        apiRequest<{ results: { id: string; documentId: string; documentName: string; content: string; index: number; score: number }[] }>(
            `/api/knowledge/${id}/search?query=${encodeURIComponent(query)}`
        ),
}
