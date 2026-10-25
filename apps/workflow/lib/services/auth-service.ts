import { apiRequest } from '@/lib/services/api-client'

export type Profile = { id: string; name: string; email: string }

export const authService = {
    me: () => apiRequest<{ user: Profile }>('/api/auth/me'),
    logout: async () => {
        await apiRequest<void>('/api/auth/logout', { method: 'POST' })
    },
}
