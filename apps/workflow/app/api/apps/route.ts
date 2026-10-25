import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createSchema = z.object({
    name: z.string().trim().min(1, '请输入应用名称').max(50, '应用名称不能超过 50 个字符'),
    description: z.string().max(500, '应用描述不能超过 500 个字符').optional(),
    icon: z.string().trim().min(1).max(10).optional(),
    iconColor: z.string().trim().min(1).max(20).optional(),
})

export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()
        const search = request.nextUrl.searchParams.get('search')?.trim()
        const apps = await prisma.app.findMany({
            where: {
                userId,
                isDeleted: false,
                ...(search ? { OR: [{ name: { contains: search } }, { description: { contains: search } }] } : {}),
            },
            orderBy: { updatedAt: 'desc' },
        })
        return apiSuccess({ items: apps, total: apps.length })
    } catch (error) {
        return handleApiError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()
        const parsed = createSchema.safeParse(await request.json())
        if (!parsed.success) return apiError(ErrorCode.VALIDATION_ERROR, parsed.error.issues[0]?.message)
        const icon = parsed.data.icon || parsed.data.name.slice(0, 1)
        const app = await prisma.app.create({
            data: {
                userId,
                name: parsed.data.name,
                description: parsed.data.description,
                icon,
                iconColor: parsed.data.iconColor || 'violet',
            },
            select: { id: true },
        })
        return apiSuccess(app, '创建成功', 201)
    } catch (error) {
        return handleApiError(error)
    }
}
