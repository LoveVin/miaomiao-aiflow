import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getOwnedApp(id: string, userId: string) {
    return prisma.app.findFirst({ where: { id, userId, isDeleted: false } })
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const app = await getOwnedApp(id, await getAuthenticatedUser())
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        return apiSuccess(app)
    } catch (error) {
        return handleApiError(error)
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const userId = await getAuthenticatedUser()
        const app = await getOwnedApp(id, userId)
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const parsed = z
            .object({
                name: z.string().trim().min(1).max(50).optional(),
                description: z.string().max(500).optional(),
                icon: z.string().max(10).optional(),
                iconColor: z.string().max(20).optional(),
            })
            .safeParse(await request.json())
        if (!parsed.success) return apiError(ErrorCode.VALIDATION_ERROR, parsed.error.issues[0]?.message)
        return apiSuccess(
            await prisma.app.update({
                where: { id: app.id },
                data: {
                    ...parsed.data,
                    icon: parsed.data.icon || undefined,
                    iconColor: parsed.data.iconColor || undefined,
                },
            })
        )
    } catch (error) {
        return handleApiError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const app = await getOwnedApp(id, await getAuthenticatedUser())
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        await prisma.app.update({ where: { id: app.id }, data: { isDeleted: true } })
        return apiSuccess(null, '删除成功')
    } catch (error) {
        return handleApiError(error)
    }
}
