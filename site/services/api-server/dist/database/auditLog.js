"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = void 0;
const tenantDb_1 = require("./tenantDb");
const crypto_1 = __importDefault(require("crypto"));
class AuditLogger {
    static async log(data) {
        try {
            await tenantDb_1.tenantDb.create('auditLog', data.organizationId, {
                id: crypto_1.default.randomUUID(),
                userId: data.userId,
                action: data.action,
                resource: data.resource,
                resourceId: data.resourceId,
                details: data.details || {},
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            });
        }
        catch (error) {
            console.error('[AUDIT LOG HATASI]', error);
        }
    }
    static async logSecurityViolation(organizationId, userId, details, ipAddress) {
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
exports.AuditLogger = AuditLogger;
