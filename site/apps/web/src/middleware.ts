import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl

    if (pathname.startsWith('/admin')) {
        // Tüm /admin isteklerini iç sunucuya (3010) olduğu gibi yönlendir
        // Hikaye frontend basePath: '/admin' olarak ayarlı olduğu için prefix korunmalı
        const targetUrl = new URL(pathname + search, 'http://127.0.0.1:3010');

        const response = NextResponse.rewrite(targetUrl);
        response.headers.set('x-proxy-target', targetUrl.toString());
        return response;
    }

    if (pathname.startsWith('/api')) {
        // Tüm /api isteklerini Hikaye backend'e (3011) yönlendir
        const targetUrl = new URL(pathname + search, 'http://127.0.0.1:3011');

        const response = NextResponse.rewrite(targetUrl);
        response.headers.set('x-proxy-target', targetUrl.toString());
        return response;
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/api/:path*'],
}
