import { NextRequest } from 'next/server'

import { apiSuccess, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return handleApiError(new Error('用户不存在'))
        return apiSuccess({ user: { id: user.id, name: user.name, email: user.name, avatar: user.avatar } })
    } catch (error) {
        return handleApiError(error)
    }
}
