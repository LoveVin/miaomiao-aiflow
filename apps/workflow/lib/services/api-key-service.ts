import { apiRequest } from '@/lib/services/api-client'

export type ApiKeyInfo = {
    id: string
    name: string
    isActive: boolean
    createdAt: string
    keyPrefix: string
    usageCount: number
    lastUsedAt: string | null
}
export type ApiKeyWithSecret = ApiKeyInfo & { key: string }

export const apiKeyService = {
    getList: (appId: string) => apiRequest<{ items: ApiKeyInfo[] }>(`/api/apps/${appId}/api-keys`),
    create: (appId: string, data: { name: string }) =>
        apiRequest<ApiKeyWithSecret>(`/api/apps/${appId}/api-keys`, { method: 'POST', body: JSON.stringify(data) }),
    update: (appId: string, keyId: string, data: { isActive?: boolean; name?: string }) =>
        apiRequest<ApiKeyInfo>(`/api/apps/${appId}/api-keys/${keyId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: async (appId: string, keyId: string) => {
        await apiRequest<void>(`/api/apps/${appId}/api-keys/${keyId}`, { method: 'DELETE' })
    },
}
