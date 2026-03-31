import { NextRequest, NextResponse } from 'next/server';
import { applyAuthorizationHeader } from '../../../../_lib/authCookie';
import { validateCsrf } from '../../../../_lib/csrf';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest, context: { params: { id: string } }) {
    const csrfFailure = validateCsrf(request);
    if (csrfFailure) return csrfFailure;

    try {
        const eventId = context.params.id;

        const headers = new Headers({
            'Content-Type': 'application/json',
        });
        applyAuthorizationHeader(request, headers);

        let body: unknown = undefined;
        try {
            body = await request.json();
        } catch {
            // no body
        }

        const response = await fetch(`${API_URL}/api/events/${eventId}/qanda/stop`, {
            method: 'POST',
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        const data = await response.json().catch(() => null);
        return NextResponse.json(data ?? {}, { status: response.status });
    } catch (error) {
        console.error('Stop Q&A API proxy error:', error);
        return NextResponse.json(
            { error: 'Bağlantı hatası' },
            { status: 500 }
        );
    }
}
