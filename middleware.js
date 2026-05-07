import { NextResponse } from "next/server"
import { USER_DASHBOARD, WEBSITE_LOGIN } from "./routes/WebsiteRoute"
import { jwtVerify } from "jose"
import { ADMIN_DASHBOARD } from "./routes/AdminPanelRoute"
import { getJwtSecret } from "./lib/jwtSecret"

export async function middleware(request) {
    try {
        const pathname = request.nextUrl.pathname
        
        const cookieToken = request.cookies.get('access_token')?.value
        const authHeader = request.headers.get('authorization')
        const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
        const access_token = cookieToken || headerToken
        const hasToken = !!access_token

        const publicRoutes = ['/api/auth/send-otp', '/api/auth/verify-otp-login', '/api/auth/login', '/api/auth/register', '/api/auth/register-seller', '/api/auth/resend-otp', '/api/auth/phone-login']
        if (publicRoutes.some(route => pathname.startsWith(route))) {
            return NextResponse.next()
        }

        if (!hasToken) {
            if (!pathname.startsWith('/auth') && !pathname.startsWith('/api')) {
                const loginUrl = new URL(WEBSITE_LOGIN, request.nextUrl)
                loginUrl.searchParams.set('callback', pathname)
                return NextResponse.redirect(loginUrl)
            }
            return NextResponse.next()
        }

        const { payload } = await jwtVerify(access_token, getJwtSecret())
        const role = payload.role

        if (pathname.startsWith('/auth')) {
            let redirectUrl = '/'
            if (role === 'admin') redirectUrl = ADMIN_DASHBOARD
            else if (role === 'thrift_seller') redirectUrl = '/seller/thrift/dashboard'
            else if (role === 'brand_seller') redirectUrl = '/seller/brand/dashboard'
            return NextResponse.redirect(new URL(redirectUrl, request.nextUrl))
        }

        if (pathname.startsWith('/admin') && role !== 'admin') return NextResponse.redirect(new URL('/', request.nextUrl))
        if (pathname.startsWith('/seller/thrift') && role !== 'thrift_seller' && role !== 'admin') return NextResponse.redirect(new URL('/', request.nextUrl))
        if (pathname.startsWith('/seller/brand') && role !== 'brand_seller' && role !== 'admin') return NextResponse.redirect(new URL('/', request.nextUrl))
        if (pathname.startsWith('/my-account') && role !== 'user') return NextResponse.redirect(new URL('/', request.nextUrl))

        return NextResponse.next()

    } catch (error) {
        console.log('Middleware error:', error.message)
        return NextResponse.redirect(new URL(WEBSITE_LOGIN, request.nextUrl))
    }
}
export const config = {
    matcher: ['/admin/:path*', '/seller/:path*', '/my-account/:path*', '/profile/:path*', '/orders/:path*', '/order-details/:path*', '/order-confirmation/:path*', '/auth/:path*', '/checkout/:path*']
}
