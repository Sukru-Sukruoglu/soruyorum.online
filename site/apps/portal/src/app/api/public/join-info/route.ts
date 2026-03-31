import { NextRequest, NextResponse } from 'next/server';
import { copyForwardedContextHeaders } from '../../_lib/forwardProxyHeaders';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
    try {
        const pin = request.nextUrl.searchParams.get('pin');
        if (!pin) return NextResponse.json({ error: 'PIN gerekli' }, { status: 400 });

        // Forward to backend REST endpoint
        const headers = new Headers();
        copyForwardedContextHeaders(request, headers);

        const response = await fetch(`${API_URL}/api/public/join-info?pin=${pin}`, {
            headers,
        });
        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('join-info error:', error);
        return NextResponse.json({ error: 'Bağlantı hatası' }, { status: 500 });
    }
}
