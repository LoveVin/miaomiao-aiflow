import { apiRequest } from '@/lib/services/api-client'

export type AppListItem = {
    id: string
    name: string
    desc: string
    icon: string
    color: string
    status: string
    isPublished: boolean
    publishedAt: string | null
    owner: 'mine'
    updatedAt: string
}

type AppApiRecord = {
    id: string
    name: string
    description: string | null
    icon: string
    iconColor: string
    activePublishedId: string | null
    publishedAt: string | null
    updatedAt: string
}

export type AppListResponse = { items: AppListItem[]; total: number }

function toListItem(app: AppApiRecord): AppListItem {
    const isPublished = Boolean(app.activePublishedId || app.publishedAt)
    return {
        id: app.id,
        name: app.name,
        desc: app.description ?? '',
        icon: app.icon,
        color: app.iconColor,
        status: isPublished ? '已发布' : '草稿',
        isPublished,
        publishedAt: app.publishedAt,
        owner: 'mine',
        updatedAt: app.updatedAt,
    }
}

export const appService = {
    getList: async (query?: { search?: string }) => {
        const search = query?.search?.trim()
        const result = await apiRequest<{ items: AppApiRecord[]; total: number }>(
            `/api/apps${search ? `?search=${encodeURIComponent(search)}` : ''}`
        )
        return { items: result.items.map(toListItem), total: result.total }
    },
    create: async (data: { name: string; description?: string; icon?: string; iconColor?: string }) =>
        apiRequest<{ id: string }>('/api/apps', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: { name?: string; description?: string; icon?: string; iconColor?: string }) => {
        const updated = await apiRequest<AppApiRecord>(`/api/apps/${id}`, { method: 'PUT', body: JSON.stringify(data) })
        return toListItem(updated)
    },
    delete: async (id: string) => apiRequest<void>(`/api/apps/${id}`, { method: 'DELETE' }),
}
