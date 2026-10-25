import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getOwnedKey(appId: string, keyId: string, userId: string) {
    return prisma.apiKey.findFirst({ where: { id: keyId, appId, app: { userId, isDeleted: false } } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; keyId: string }> }) {
    try {
        const { id, keyId } = await params
        const key = await getOwnedKey(id, keyId, await getAuthenticatedUser())
        if (!key) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const parsed = z
            .object({ name: z.string().trim().min(1).max(50).optional(), isActive: z.boolean().optional() })
            .safeParse(await request.json())
        if (!parsed.success) return apiError(ErrorCode.VALIDATION_ERROR, parsed.error.issues[0]?.message)
        return apiSuccess(await prisma.apiKey.update({ where: { id: key.id }, data: parsed.data }))
    } catch (error) {
        return handleApiError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; keyId: string }> }) {
    try {
        const { id, keyId } = await params
        const key = await getOwnedKey(id, keyId, await getAuthenticatedUser())
        if (!key) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        await prisma.apiKey.delete({ where: { id: key.id } })
        return apiSuccess(null, '删除成功')
    } catch (error) {
        return handleApiError(error)
    }
}
