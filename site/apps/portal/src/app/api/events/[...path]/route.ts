import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

async function handler(req: NextRequest) {
    const url = new URL(req.url);
    // Extract path after /api/events/
    const pathMatch = url.pathname.match(/^\/api\/events\/(.*)$/);
    const path = pathMatch ? pathMatch[1] : '';
    const targetUrl = `${API_URL}/api/events/${path}${url.search}`;

    const headers: Record<string, string> = {};

    // Forward Authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }

    try {
        const body = req.method !== 'GET' && req.method !== 'DELETE' ? await req.text() : undefined;

        // Forward content type only when sending a body
        if (body !== undefined) {
            headers['Content-Type'] = req.headers.get('Content-Type') || 'application/json';
        }
        
        const response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body,
        });

        // Handle 204 No Content
        if (response.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await response.text();

        const nextHeaders: Record<string, string> = {};
        const contentType = response.headers.get('content-type');
        if (contentType) nextHeaders['Content-Type'] = contentType;
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) nextHeaders['Content-Disposition'] = contentDisposition;

        return new NextResponse(data, {
            status: response.status,
            headers: nextHeaders,
        });
    } catch (error) {
        console.error('Events API proxy error:', error);
        return NextResponse.json(
            { error: 'API connection failed' },
            { status: 500 }
        );
    }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
