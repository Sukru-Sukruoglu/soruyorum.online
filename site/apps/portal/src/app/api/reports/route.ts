import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
    try {
        const cookie = request.headers.get('cookie') || '';
        const authorization = request.headers.get('authorization') || '';

        const response = await fetch(`${API_URL}/api/reports`, {
            method: 'GET',
            headers: {
                ...(cookie ? { cookie } : {}),
                ...(authorization ? { authorization } : {}),
            },
        });

        const data = await response.json().catch(() => null);
        return NextResponse.json(data ?? {}, { status: response.status });
    } catch (error) {
        console.error('Reports API proxy error:', error);
        return NextResponse.json({ error: 'Bağlantı hatası' }, { status: 500 });
    }
}
