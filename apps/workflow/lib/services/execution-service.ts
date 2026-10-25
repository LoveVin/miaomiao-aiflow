import { apiRequest } from '@/lib/services/api-client'
import type { DemoExecution } from '@/types/workflow'

export type ExecutionRecord = DemoExecution & { tokens: number; source: string; user: string; demo: boolean }
export type ExecutionListResponse = { items: ExecutionRecord[]; total: number }

export const executionService = {
    getList: async (appId: string, query?: { page?: number; pageSize?: number }) => {
        const params = new URLSearchParams()
        if (query?.page) params.set('page', String(query.page))
        if (query?.pageSize) params.set('pageSize', String(query.pageSize))
        return apiRequest<ExecutionListResponse>(`/api/apps/${appId}/executions?${params.toString()}`)
    },
}
