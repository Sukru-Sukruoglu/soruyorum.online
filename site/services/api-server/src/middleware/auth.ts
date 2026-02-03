import { Request, Response, NextFunction } from 'express';
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
    } catch (error) {
        return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token' });
    }
};
