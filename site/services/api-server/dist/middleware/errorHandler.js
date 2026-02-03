"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const auditLog_1 = require("../database/auditLog");
const errorHandler = (error, req, res, next) => {
    console.error('[ERROR]', {
        message: error.message,
        stack: error.stack,
        organizationId: req.organizationId,
        userId: req.userId,
        path: req.path,
    });
    if (error.message.includes('GÜVENLİK İHLALİ')) {
        if (req.organizationId) {
            auditLog_1.AuditLogger.logSecurityViolation(req.organizationId, req.userId, {
                error: error.message,
                path: req.path,
                method: req.method,
            }, req.ip);
        }
        return res.status(403).json({
            error: 'Erişim reddedildi',
            message: 'Bu kaynağa erişim yetkiniz yok',
        });
    }
    if (error.message.includes('Unique constraint')) {
        return res.status(409).json({
            error: 'Bu kayıt zaten mevcut',
        });
    }
    res.status(500).json({
        error: 'Sunucu hatası',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
};
exports.errorHandler = errorHandler;
