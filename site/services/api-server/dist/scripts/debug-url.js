"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@ks-interaktif/database");
async function run() {
    const event = await database_1.prisma.events.findFirst({
        where: { event_pin: '917028' },
        select: { id: true, name: true, join_url: true, qr_code_url: true }
    });
    if (event) {
        console.log('--- EVENT DATA ---');
        console.log('ID:', event.id);
        console.log('Name:', event.name);
        console.log('Join URL:', event.join_url);
        console.log('QR Code URL contains localhost:', event.qr_code_url?.includes('localhost'));
        console.log('Join URL contains localhost:', event.join_url?.includes('localhost'));
        if (event.qr_code_url && event.qr_code_url.length > 200) {
            console.log('QR Code URL start:', event.qr_code_url.substring(0, 100));
            console.log('QR Code URL end:', event.qr_code_url.substring(event.qr_code_url.length - 100));
        }
        console.log('--- END ---');
    }
    else {
        console.log('Event not found');
    }
    await database_1.prisma.$disconnect();
}
run();
