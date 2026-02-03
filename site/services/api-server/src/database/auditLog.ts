import { tenantDb } from './tenantDb';
import crypto from 'crypto';

interface AuditLogData {
    organizationId: string;
    userId?: string;
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
    resource: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

export class AuditLogger {
    static async log(data: AuditLogData): Promise<void> {
        try {
            await tenantDb.create('auditLog', data.organizationId, {
                id: crypto.randomUUID(),
                userId: data.userId,
                action: data.action,
                resource: data.resource,
                resourceId: data.resourceId,
                details: data.details || {},
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            });
        } catch (error) {
            console.error('[AUDIT LOG HATASI]', error);
        }
    }

    static async logSecurityViolation(
        organizationId: string,
        userId: string | undefined,
        details: Record<string, any>,
        ipAddress?: string
    ): Promise<void> {
        await this.log({
            organizationId,
            userId,
            action: 'READ',
            resource: 'security_violation',
            details: {
                ...details,
                severity: 'HIGH',
                timestamp: new Date().toISOString(),
            },
            ipAddress,
        });

        console.error('[GÜVENLİK İHLALİ]', {
            organizationId,
            userId,
            details,
        });
    }
}
