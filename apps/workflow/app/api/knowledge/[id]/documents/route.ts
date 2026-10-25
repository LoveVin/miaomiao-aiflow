import { NextRequest } from 'next/server'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const sliceText = (text: string) => text.match(/[\s\S]{1,500}/g) ?? []

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const knowledgeBase = await prisma.knowledgeBase.findFirst({
            where: { id, userId: await getAuthenticatedUser() },
            include: { documents: true },
        })
        if (!knowledgeBase) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        return apiSuccess({ items: knowledgeBase.documents })
    } catch (error) {
        return handleApiError(error)
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const knowledgeBase = await prisma.knowledgeBase.findFirst({ where: { id, userId: await getAuthenticatedUser() } })
        if (!knowledgeBase) return apiError(ErrorCode.RESOURCE_NOT_FOUND)
        const formData = await request.formData()
        const files = formData.getAll('files').filter((item): item is File => item instanceof File)
        if (!files.length) return apiError(ErrorCode.VALIDATION_ERROR, '请选择至少一个文件')
        const imported: unknown[] = []
        const rejected: string[] = []
        for (const file of files) {
            const textLike = /\.(md|txt)$/i
            if (file.size > 20 * 1024 * 1024 || !/\.(pdf|docx?|md|txt)$/i.test(file.name)) {
                rejected.push(file.name)
                continue
            }
            const content = textLike.test(file.name) ? await file.text() : ''
            const document = await prisma.document.create({
                data: {
                    knowledgeBaseId: knowledgeBase.id,
                    name: file.name,
                    originalName: file.name,
                    mimeType: file.type || 'application/octet-stream',
                    size: file.size,
                    content,
                    chunkCount: content ? sliceText(content).length : 0,
                    status: content ? 'COMPLETED' : 'PENDING',
                    errorMessage: '',
                    processedAt: content ? new Date() : null,
                },
            })
            imported.push(document)
        }
        return apiSuccess({ imported, rejected }, '上传完成', 201)
    } catch (error) {
        return handleApiError(error)
    }
}
