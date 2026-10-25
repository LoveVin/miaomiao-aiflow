import jwt from 'jsonwebtoken'
import { type NextRequest, NextResponse } from 'next/server'

const AUTH_TOKEN_NAME = 'auth-token'

export function proxy(request: NextRequest) {
    const token = request.cookies.get(AUTH_TOKEN_NAME)?.value

    try {
        const payload = token ? (jwt.verify(token, process.env.JWT_SECRET!) as { userId?: string }) : null
        if (payload?.userId) return NextResponse.next()
    } catch {
        // Invalid tokens fall through to the login redirect.
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
}

export const config = {
    matcher: ['/((?!api|login|_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|webp|txt|xml)$).*)'],
}
