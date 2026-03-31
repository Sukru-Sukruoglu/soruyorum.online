import { NextRequest, NextResponse } from 'next/server';
import { applyAuthorizationHeader } from '../../_lib/authCookie';
import { validateCsrf } from '../../_lib/csrf';

const API_URL = process.env.API_URL;

const API_URL_FALLBACKS = [
    'http://soruyorum-api-server:4000',
    'http://api-server:4000',
    'http://localhost:4000',
];

function getApiBaseUrl() {
    if (API_URL && API_URL.trim().length > 0) return API_URL;
    return API_URL_FALLBACKS[0];
}

const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'host',
    'content-length',
    'accept-encoding',
]);

function buildUpstreamHeaders(req: NextRequest) {
    const headers = new Headers();

    for (const [key, value] of req.headers.entries()) {
        const lowerKey = key.toLowerCase();
        if (HOP_BY_HOP_HEADERS.has(lowerKey)) continue;
        headers.set(key, value);
    }

    // Ensure we pass a content-type on non-GET methods if caller didn't.
    if (req.method !== 'GET' && !headers.get('content-type')) {
        headers.set('Content-Type', 'application/json');
    }

    applyAuthorizationHeader(req, headers);

    return headers;
}

async function handler(req: NextRequest) {
    const csrfFailure = validateCsrf(req);
    if (csrfFailure) return csrfFailure;

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\/trpc/, '/trpc');
    const apiBaseUrl = getApiBaseUrl().replace(/\/$/, '');
    const targetUrl = `${apiBaseUrl}${path}${url.search}`;
    const headers = buildUpstreamHeaders(req);

    if (!API_URL) {
        console.warn('[trpc-proxy] API_URL is not set; using fallback', getApiBaseUrl());
    }

    try {
        const body = req.method !== 'GET' ? await req.text() : undefined;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);

        const response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body,
            signal: controller.signal,
        });

        clearTimeout(timeout);

        const data = await response.text();
        const contentType = response.headers.get('content-type') || 'application/json';

        if (!response.ok) {
            console.error('[trpc-proxy] upstream error', {
                method: req.method,
                path: url.pathname,
                search: url.search,
                targetUrl,
                status: response.status,
                statusText: response.statusText,
                bodyPreview: data.slice(0, 800),
            });
        }

        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('[trpc-proxy] fetch failed', {
            method: req.method,
            path: url.pathname,
            search: url.search,
            targetUrl,
            error,
        });
        return NextResponse.json({ error: 'API connection failed' }, { status: 502 });
    }
}

export const GET = handler;
export const POST = handler;
