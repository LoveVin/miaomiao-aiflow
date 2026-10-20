import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { generateToken, setAuthCookie } from '@/lib/auth'
import { verifyPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'

interface UserResponse {
    id: string
    name: string | null
    avatar: string | null
}

const loginSchema = z.object({
    name: z.string().min(1, '请输入用户名'),
    password: z.string().min(1, '请输入密码'),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // 验证输入
        const result = loginSchema.safeParse(body)
        if (!result.success) {
            return apiError(ErrorCode.VALIDATION_ERROR, result.error.issues[0].message)
        }

        const { name, password } = result.data

        // 查找用户
        const user = await prisma.user.findUnique({
            where: { name },
        })

        if (!user) {
            return apiError(ErrorCode.PASSWORD_INCORRECT, '用户名或密码错误')
        }

        // 验证密码
        const isValid = await verifyPassword(password, user.password)
        if (!isValid) {
            return apiError(ErrorCode.PASSWORD_INCORRECT, '用户名或密码错误')
        }

        // 生成令牌并设置 Cookie
        const token = generateToken(user.id)
        await setAuthCookie(token)

        const userData: UserResponse = {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
        }

        return apiSuccess<{ user: UserResponse }>({ user: userData }, '登录成功')
    } catch (error) {
        return handleApiError(error)
    }
}
