import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
    try {
        const pin = request.nextUrl.searchParams.get('pin');
        if (!pin) return NextResponse.json({ error: 'PIN gerekli' }, { status: 400 });

        // Forward to backend tRPC procedure or REST endpoint
        // Since we are adding it to tRPC, we can use the trpc fetch pattern or 
        // add a specific REST endpoint. Let's assume we add a REST one for simplicity or 
        // use the TRPC internal caller if we had access here. 
        // Easiest is to add a small REST route in participants.ts for this.

        const response = await fetch(`${API_URL}/api/public/event-info?pin=${pin}`);
        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: 'Bağlantı hatası' }, { status: 500 });
    }
}
