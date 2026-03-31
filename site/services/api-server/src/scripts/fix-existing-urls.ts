import { prisma as db } from '@ks-interaktif/database';
import { EventService } from '../services/eventService';

async function main() {
    console.log('🔄 Veritabanındaki localhost linkleri ve QR kodları düzeltiliyor...');

    const prodDomain = 'https://mobil.soruyorum.online';

    // 1. Fetch all events with localhost in joinUrl OR qrCodeUrl
    // Even if qrCodeUrl is base64, it might contain the substring 'localhost' if it was pre-generated.
    const eventsToFix = await db.events.findMany({
        where: {
            OR: [
                { join_url: { contains: 'localhost' } },
                { qr_code_url: { contains: 'localhost' } },
                { join_url: { contains: '127.0.0.1' } }
            ]
        }
    });

    console.log(`🔍 Düzeltilecek ${eventsToFix.length} etkinlik bulundu.`);

    for (const event of eventsToFix) {
        // Fix joinUrl
        let newJoinUrl = event.join_url;
        if (newJoinUrl?.includes('localhost') || newJoinUrl?.includes('127.0.0.1')) {
            newJoinUrl = newJoinUrl.replace(/https?:\/\/localhost:300[12]/g, prodDomain)
                .replace(/https?:\/\/127\.0\.0\.1:300[12]/g, prodDomain);
        }

        // Regenerate QR Code always if joinUrl was fixed or if it was localhost before
        console.log(`🎨 QR kod yeniden oluşturuluyor: ${event.name}`);
        const newQrCodeUrl = await EventService.generateQRCode(newJoinUrl!);

        await db.events.update({
            where: { id: event.id },
            data: {
                join_url: newJoinUrl,
                qr_code_url: newQrCodeUrl
            }
        });
        console.log(`✅ Güncellendi: ${event.name} (${event.id})`);
    }

    console.log('✨ Tüm linkler ve QR kodlar başarıyla güncellendi.');
}

main()
    .catch(e => {
        console.error('❌ Hata oluştu:', e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
