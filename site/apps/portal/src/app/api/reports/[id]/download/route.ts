import { NextRequest, NextResponse } from 'next/server';
import { applyAuthorizationHeader } from '../../../_lib/authCookie';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
    try {
        const reportId = context.params.id;
        const format = request.nextUrl.searchParams.get('format') || '';

        const upstreamHeaders = new Headers();
        applyAuthorizationHeader(request, upstreamHeaders);

        const url = format 
            ? `${API_URL}/api/reports/${reportId}/download?format=${format}`
            : `${API_URL}/api/reports/${reportId}/download`;

        const response = await fetch(url, {
            method: 'GET',
            headers: upstreamHeaders,
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            return NextResponse.json(data ?? { error: 'İndirme hatası' }, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const contentDisposition = response.headers.get('content-disposition') || '';
        const arrayBuffer = await response.arrayBuffer();

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        if (contentDisposition) headers.set('Content-Disposition', contentDisposition);

        return new NextResponse(arrayBuffer, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Report download proxy error:', error);
        return NextResponse.json({ error: 'Bağlantı hatası' }, { status: 500 });
    }
}
