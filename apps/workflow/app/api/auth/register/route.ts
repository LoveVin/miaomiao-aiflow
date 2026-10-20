import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { hashPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'

const registerSchema = z.object({
    name: z.string().min(1, '请输入用户名'),
    password: z.string().min(8, '密码至少需要8个字符'),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // 验证输入
        const result = registerSchema.safeParse(body)
        if (!result.success) {
            return apiError(ErrorCode.VALIDATION_ERROR, result.error.issues[0].message)
        }

        const { name, password } = result.data

        // 检查用户名是否已经存在
        const existingUser = await prisma.user.findUnique({
            where: { name },
        })

        if (existingUser) {
            return apiError(ErrorCode.EMAIL_ALREADY_EXISTS, '用户名已存在')
        }

        // 加密密码
        const hashedPassword = await hashPassword(password)

        // 创建用户
        const user = await prisma.user.create({
            data: {
                name,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
            },
        })

        return apiSuccess({ userId: user.id }, '注册成功')
    } catch (error) {
        return handleApiError(error)
    }
}
