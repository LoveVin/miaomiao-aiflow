import { NextRequest } from 'next/server'

import { apiSuccess, handleApiError } from '@/lib/api-response'
import { clearAuthCookie } from '@/lib/auth'

export async function POST(_request: NextRequest) {
    try {
        await clearAuthCookie()
        return apiSuccess(null, '退出成功')
    } catch (error) {
        return handleApiError(error)
    }
}
