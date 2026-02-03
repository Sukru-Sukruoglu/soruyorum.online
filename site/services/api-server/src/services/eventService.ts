import crypto from 'crypto';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import { tenantDb } from '../database/tenantDb';

export interface EventSettings {
    registration: {
        requirePin: boolean;
        requireName: boolean;
        requireEmail: boolean;
        requirePhone: boolean;
        requireAvatar: boolean;
        requireId: boolean;
        allowAnonymous: boolean;
        requireKvkkConsent: boolean;
    };
    gameplay: {
        autoMarkNumbers: boolean;
        autoStartEvent: boolean;
        startDateTime?: string;
    };
}

export class EventService {
    static async generateUniquePin(organizationId: string): Promise<string> {
        let pin: string;
        let isUnique = false;

        while (!isUnique) {
            pin = Math.floor(100000 + Math.random() * 900000).toString();
            const existing = await tenantDb.findFirst(
                'event',
                organizationId,
                { where: { event_pin: pin } }
            );

            if (!existing) {
                isUnique = true;
            }
        }

        return pin!;
    }

    static generateJoinUrl(eventId: string, pin: string): string {
        const baseUrl = (process.env.FRONTEND_URL || 'https://mobil.ksinteraktif.com').replace(/\/+$/, '');
        const timestamp = Date.now();
        const hash = crypto
            .createHash('sha256')
            .update(`${eventId}-${pin}-${timestamp}`)
            .digest('hex')
            .substring(0, 16);

        return `${baseUrl}/join?event=${eventId}&pin=${pin}&hash=${hash}&t=${timestamp}`;
    }

    static async generateQRCode(joinUrl: string): Promise<string> {
        try {
            const qrDataUrl = await QRCode.toDataURL(joinUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });
            return qrDataUrl;
        } catch (error) {
            console.error('[QR CODE ERROR]', error);
            throw new Error('QR kod oluşturulamadı');
        }
    }

    static async createEvent(data: {
        organizationId: string;
        userId: string;
        title: string;
        description?: string;
        eventType: string; // 'quiz', 'poll', etc.
        maxParticipants?: number;
        eventPin?: string;
        settings: EventSettings;
    }) {
        const eventPin = data.eventPin || (await this.generateUniquePin(data.organizationId));
        const eventCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const eventId = randomUUID();

        // Map new fields to Prisma schema. 
        // Note: We use the existing 'name' field for title, and add new fields.
        const tempEvent = await tenantDb.create<any>('event', data.organizationId, {
            id: eventId,
            name: data.title, // 'title' in API mapped to 'name' in DB
            description: data.description,
            // We store eventType in 'event_type' if schema has it, or reuse 'accessType'? 
            // Schema has 'event_type' now (snake_case).
            event_type: data.eventType,
            event_code: eventCode,
            event_pin: eventPin,
            pin: eventPin, // Sync legacy field
            max_participants: data.maxParticipants || 100,
            settings: data.settings as any,
            created_by: data.userId,
            access_type: 'pin',
            updated_at: new Date(),
        });

        const joinUrl = this.generateJoinUrl(tempEvent.id, eventPin);
        const qrCodeUrl = await this.generateQRCode(joinUrl);

        const event = await tenantDb.update<any>(
            'event',
            data.organizationId,
            { id: tempEvent.id },
            { join_url: joinUrl, qr_code_url: qrCodeUrl }
        );

        return event;
    }

    static async regeneratePin(
        eventId: string,
        organizationId: string
    ): Promise<{ pin: string; joinUrl: string; qrCodeUrl: string }> {
        const newPin = await this.generateUniquePin(organizationId);
        const joinUrl = this.generateJoinUrl(eventId, newPin);
        const qrCodeUrl = await this.generateQRCode(joinUrl);

        await tenantDb.update(
            'event',
            organizationId,
            { id: eventId },
            { event_pin: newPin, pin: newPin, join_url: joinUrl, qr_code_url: qrCodeUrl }
        );

        return { pin: newPin, joinUrl, qrCodeUrl };
    }
}
