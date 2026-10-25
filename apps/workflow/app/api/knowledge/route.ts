import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const userId = await getAuthenticatedUser()
        const items = await prisma.knowledgeBase.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: { documents: true },
        })
        return apiSuccess({ items })
    } catch (error) {
        return handleApiError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()
        const parsed = z
            .object({
                name: z.string().trim().min(1).max(60),
                description: z.string().max(500).optional(),
                icon: z.string().max(10).optional(),
            })
            .safeParse(await request.json())
        if (!parsed.success) return apiError(ErrorCode.VALIDATION_ERROR, parsed.error.issues[0]?.message)
        const knowledgeBase = await prisma.knowledgeBase.create({
            data: {
                userId,
                name: parsed.data.name,
                description: parsed.data.description,
                icon: parsed.data.icon || parsed.data.name.slice(0, 1),
            },
        })
        return apiSuccess({ id: knowledgeBase.id }, '创建成功', 201)
    } catch (error) {
        return handleApiError(error)
    }
}
