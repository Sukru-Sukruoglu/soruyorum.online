import { Request, Response, NextFunction } from 'express';
import { lucia } from '@ks-interaktif/auth';
import { verifyToken } from '../utils/jwt';

export const tenantContextMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Yetkisiz erişim: Token bulunamadı'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        try {
            const decoded = verifyToken(token);

            req.organizationId = decoded.organizationId;
            req.userId = decoded.userId;
            req.userRole = decoded.role;
            req.userEmail = decoded.email;

            next();
            return;
        } catch {
            const result = await lucia.validateSession(token);
            if (!result.session || !result.user?.organizationId) {
                throw new Error('Invalid legacy session');
            }

            req.organizationId = result.user.organizationId;
            req.userId = result.user.id;
            req.userRole = result.user.role;
            req.userEmail = result.user.email;

            next();
            return;
        }
    } catch (error) {
        if (req.ip) {
            console.error('[GÜVENLİK] Geçersiz token denemesi:', {
                ip: req.ip,
                path: req.path,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        return res.status(401).json({
            error: 'Geçersiz veya süresi dolmuş token'
        });
    }
};
