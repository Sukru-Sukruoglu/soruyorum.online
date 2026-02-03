import { NextResponse } from 'next/server';
import { prisma } from '@ks-interaktif/database';

export async function GET() {
    try {
        // Prisma Client instance'ının üzerindeki modeller (propertyler)
        // Prisma Client instance'ı enumerable olmayabilir, bu yüzden underscore ile başlayanları filtreleyelim
        // Ancak model isimleri (event, user) enumerable olmalı.
        const keys = Object.keys(prisma).filter(key => key !== '_' && key !== '$');

        // Prototype chain üzerinden mi geliyor bakalım
        // PrismaClient dymanic property kullanıyor olabilir.

        return NextResponse.json({
            keys,
            hasEvent: 'event' in prisma,
            hasEvents: 'events' in prisma,
            hasWheelSetting: 'wheel_setting' in prisma,
            hasWheelSettings: 'wheel_settings' in prisma,
            hasUser: 'user' in prisma,
            hasUsers: 'users' in prisma
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
