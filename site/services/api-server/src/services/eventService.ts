import crypto from 'crypto';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import { prisma } from '@ks-interaktif/database';
import { tenantDb } from '../database/tenantDb';
import { getOrganizationJoinBaseUrl } from '../utils/domains';

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

    static async generateJoinUrl(
        eventId: string,
        pin: string,
        organizationId: string,
        req?: { headers?: Record<string, unknown> | null } | null
    ): Promise<string> {
        const baseUrl = (await getOrganizationJoinBaseUrl(prisma as any, organizationId, req as any)).replace(/\/+$/, '');
        return `${baseUrl}/join?pin=${pin}`;
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
        maxParticipants?: number | null;
        eventPin?: string;
        settings: EventSettings;
        req?: { headers?: Record<string, unknown> | null } | null;
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
            // Role-based enforcement happens in routes; service persists requested value.
            max_participants: data.maxParticipants ?? null,
            settings: data.settings as any,
            created_by: data.userId,
            access_type: 'pin',
            updated_at: new Date(),
        });

        const joinUrl = await this.generateJoinUrl(tempEvent.id, eventPin, data.organizationId, data.req);
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
        organizationId: string,
        req?: { headers?: Record<string, unknown> | null } | null
    ): Promise<{ pin: string; joinUrl: string; qrCodeUrl: string }> {
        const newPin = await this.generateUniquePin(organizationId);
        const joinUrl = await this.generateJoinUrl(eventId, newPin, organizationId, req);
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
