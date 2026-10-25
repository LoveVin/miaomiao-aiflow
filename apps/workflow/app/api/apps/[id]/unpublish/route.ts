import { NextRequest } from 'next/server'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const app = await prisma.app.findFirst({ where: { id, userId: await getAuthenticatedUser(), isDeleted: false } })
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        await prisma.app.update({ where: { id: app.id }, data: { isPublished: false, activePublishedId: null, publishedAt: null } })
        return apiSuccess(null, '已取消发布')
    } catch (error) {
        return handleApiError(error)
    }
}
