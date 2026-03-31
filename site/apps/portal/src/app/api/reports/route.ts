import { NextRequest, NextResponse } from 'next/server';
import { applyAuthorizationHeader } from '../_lib/authCookie';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
    try {
        const headers = new Headers();
        applyAuthorizationHeader(request, headers);

        const response = await fetch(`${API_URL}/api/reports`, {
            method: 'GET',
            headers,
        });

        const data = await response.json().catch(() => null);
        return NextResponse.json(data ?? {}, { status: response.status });
    } catch (error) {
        console.error('Reports API proxy error:', error);
        return NextResponse.json({ error: 'Bağlantı hatası' }, { status: 500 });
    }
}
