import jwt from 'jsonwebtoken'
import { cookies, headers } from 'next/headers'

import { ApiError, ErrorCode } from '@/lib/api-response'

const JWT_SECRET = process.env.JWT_SECRET!
const TOKEN_NAME = 'auth-token'
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

/**
 *
 * Generate a JWT token for a user
 */
export function generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Set the auth cookie with the token
 */
export async function setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies()
    // secure 不能绑定 NODE_ENV：HTTP 直连部署时浏览器会丢弃 Secure Cookie，
    // 导致登录后仍被跳回 /login。以实际请求协议（x-forwarded-proto）为准。
    const headerList = await headers()
    const proto = headerList.get('x-forwarded-proto')?.split(',')[0]?.trim()
    cookieStore.set(TOKEN_NAME, token, {
        httpOnly: true,
        secure: proto === 'https',
        sameSite: 'lax',
        maxAge: TOKEN_MAX_AGE,
        path: '/',
    })
}

export async function clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set(TOKEN_NAME, '', { httpOnly: true, maxAge: 0, path: '/' })
}

export async function getAuthenticatedUser(): Promise<string> {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_NAME)?.value
    if (!token) throw new ApiError(ErrorCode.UNAUTHORIZED)

    let payload: { userId?: string }
    try {
        payload = jwt.verify(token, JWT_SECRET) as { userId?: string }
    } catch {
        throw new ApiError(ErrorCode.UNAUTHORIZED)
    }

    if (!payload.userId) throw new ApiError(ErrorCode.UNAUTHORIZED)
    return payload.userId
}
