import { NextRequest, NextResponse } from 'next/server';
import { applyAuthorizationHeader } from '../_lib/authCookie';
import { validateCsrf } from '../_lib/csrf';
import { copyForwardedContextHeaders } from '../_lib/forwardProxyHeaders';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
    const csrfFailure = validateCsrf(req);
    if (csrfFailure) return csrfFailure;

    const targetUrl = `${API_URL}/api/events`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Forward Authorization header
    applyAuthorizationHeader(req, headers);

    copyForwardedContextHeaders(req, headers);

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

    applyAuthorizationHeader(req, headers);

    copyForwardedContextHeaders(req, headers);

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
