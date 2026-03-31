import { NextRequest, NextResponse } from 'next/server';
import { copyForwardedContextHeaders } from '../../_lib/forwardProxyHeaders';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const headers = new Headers({
            'Content-Type': 'application/json',
        });
        copyForwardedContextHeaders(request, headers);

        const response = await fetch(`${API_URL}/api/public/join`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        const data = await response.json();
        
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Join API proxy error:', error);
        return NextResponse.json(
            { error: 'Bağlantı hatası' },
            { status: 500 }
        );
    }
}
