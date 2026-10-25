import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
const saveSchema = z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()).optional(),
    name: z.string().trim().max(50).optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const app = await prisma.app.findFirst({
            where: { id, userId: await getAuthenticatedUser(), isDeleted: false },
            include: { workflows: { orderBy: { version: 'desc' }, take: 1 } },
        })
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const workflow = app.workflows[0]
        return apiSuccess({
            version: workflow?.version ?? 1,
            nodes: workflow ? (workflow.nodes as unknown[]) : [],
            edges: workflow ? (workflow.edges as unknown[]) : [],
            updatedAt: workflow?.updatedAt ?? app.updatedAt,
        })
    } catch (error) {
        return handleApiError(error)
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const app = await prisma.app.findFirst({
            where: { id, userId: await getAuthenticatedUser(), isDeleted: false },
            include: { workflows: { orderBy: { version: 'desc' }, take: 1 } },
        })
        if (!app) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const parsed = saveSchema.safeParse(await request.json())
        if (!parsed.success) return apiError(ErrorCode.VALIDATION_ERROR, parsed.error.issues[0]?.message)
        const nextVersion = (app.workflows[0]?.version ?? 0) + 1
        const workflow = await prisma.workflow.create({
            data: {
                appId: app.id,
                name: parsed.data.name || app.name,
                description: app.description,
                version: nextVersion,
                nodes: parsed.data.nodes,
                edges: parsed.data.edges ?? [],
            },
        })
        const data = { name: parsed.data.name }
        if (Object.keys(data).length) await prisma.app.update({ where: { id: app.id }, data })
        return apiSuccess(
            { version: workflow.version, nodes: workflow.nodes, edges: workflow.edges, updatedAt: workflow.updatedAt },
            '保存成功'
        )
    } catch (error) {
        return handleApiError(error)
    }
}
