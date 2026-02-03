import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

async function handler(req: NextRequest) {
    const url = new URL(req.url);
    const path = url.pathname.replace('/api/trpc', '/trpc');
    const targetUrl = `${API_URL}${path}${url.search}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Forward Authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }

    try {
        const body = req.method !== 'GET' ? await req.text() : undefined;
        
        const response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body,
        });

        const data = await response.text();
        
        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('TRPC proxy error:', error);
        return NextResponse.json(
            { error: 'API connection failed' },
            { status: 500 }
        );
    }
}

export const GET = handler;
export const POST = handler;
