import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const randomKey = () => {
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    return `sk-mm-${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const app = await prisma.app.findFirst({ where: { id, userId: await getAuthenticatedUser(), isDeleted: false } })
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        return apiSuccess({ items: await prisma.apiKey.findMany({ where: { appId: app.id }, orderBy: { createdAt: 'desc' } }) })
    } catch (error) {
        return handleApiError(error)
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const app = await prisma.app.findFirst({ where: { id, userId: await getAuthenticatedUser(), isDeleted: false } })
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const parsed = z.object({ name: z.string().trim().min(1, '请输入名称').max(50) }).safeParse(await request.json())
        if (!parsed.success) return apiError(ErrorCode.VALIDATION_ERROR, parsed.error.issues[0]?.message)
        const key = randomKey()
        const result = await prisma.apiKey.create({
            data: { appId: app.id, name: parsed.data.name, key, keyPrefix: key.slice(0, 12) },
        })
        return apiSuccess(result, '创建成功', 201)
    } catch (error) {
        return handleApiError(error)
    }
}
