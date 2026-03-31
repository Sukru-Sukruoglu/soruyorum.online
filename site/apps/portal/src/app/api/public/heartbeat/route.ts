import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        if (!rawBody.trim()) {
            return NextResponse.json(
                { error: 'Heartbeat payload gerekli' },
                { status: 400 }
            );
        }

        const response = await fetch(`${API_URL}/api/public/heartbeat`, {
            method: 'POST',
            headers: {
                'Content-Type': request.headers.get('content-type') || 'application/json',
            },
            body: rawBody,
        });

        const responseText = await response.text();
        const contentType = response.headers.get('content-type') || 'application/json';

        return new NextResponse(responseText, {
            status: response.status,
            headers: {
                'Content-Type': contentType,
            },
        });
    } catch (error) {
        console.error('Heartbeat API proxy error:', error);
        return NextResponse.json(
            { error: 'Bağlantı hatası' },
            { status: 500 }
        );
    }
}
