import { Request, Response, NextFunction } from 'express';
import { lucia } from '@ks-interaktif/auth';
import { verifyToken, JWTPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Yetkilendirme token\'ı gerekli' });
    }

    try {
        const decoded = verifyToken(token);
        (req as AuthenticatedRequest).user = decoded;
        next();
        return;
    } catch {
        void lucia.validateSession(token)
            .then((result) => {
                if (!result.session || !result.user?.organizationId) {
                    return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token' });
                }

                (req as AuthenticatedRequest).user = {
                    userId: result.user.id,
                    organizationId: result.user.organizationId,
                    email: result.user.email,
                    role: result.user.role,
                } satisfies JWTPayload;
                next();
            })
            .catch(() => {
                return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token' });
            });
    }
};
