import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest, context: { params: { id: string } }) {
    try {
        const eventId = context.params.id;

        const cookie = request.headers.get('cookie') || '';
        const authorization = request.headers.get('authorization') || '';

        let body: unknown = undefined;
        try {
            body = await request.json();
        } catch {
            // no body
        }

        const response = await fetch(`${API_URL}/api/events/${eventId}/qanda/stop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(cookie ? { cookie } : {}),
                ...(authorization ? { authorization } : {}),
            },
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
