import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
    const targetUrl = `${API_URL}/api/events`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Forward Authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }

    try {
        const body = await req.text();
        
        const response = await fetch(targetUrl, {
            method: 'POST',
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
        console.error('Events API proxy error:', error);
        return NextResponse.json(
            { error: 'API connection failed' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const targetUrl = `${API_URL}/api/events${url.search}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers,
        });

        const data = await response.text();
        
        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Events API proxy error:', error);
        return NextResponse.json(
            { error: 'API connection failed' },
            { status: 500 }
        );
    }
}
