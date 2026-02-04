import { Request, Response, NextFunction } from 'express';
import { AuditLogger } from '../database/auditLog';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const anyErr = error as any;

    // body-parser / raw-body will throw when payload exceeds configured limit.
    if (anyErr?.type === 'entity.too.large' || anyErr?.status === 413) {
        return res.status(413).json({
            error: 'İstek çok büyük',
            message: 'Yüklenen dosya çok büyük. Lütfen daha küçük bir görsel deneyin.',
            code: 'PAYLOAD_TOO_LARGE',
        });
    }

    console.error('[ERROR]', {
        message: error.message,
        stack: error.stack,
        organizationId: req.organizationId,
        userId: req.userId,
        path: req.path,
    });

    if (error.message.includes('GÜVENLİK İHLALİ')) {
        if (req.organizationId) {
            AuditLogger.logSecurityViolation(
                req.organizationId,
                req.userId,
                {
                    error: error.message,
                    path: req.path,
                    method: req.method,
                },
                req.ip
            );
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
