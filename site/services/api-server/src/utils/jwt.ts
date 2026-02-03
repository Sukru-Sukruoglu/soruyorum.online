import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
    userId: string;
    organizationId: string;
    email: string;
    role: string;
}

export const generateToken = (payload: JWTPayload, expiresIn: string = JWT_EXPIRES_IN): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
};

export const generateShortLivedToken = (payload: JWTPayload, expiresIn: string): string => {
    return generateToken(payload, expiresIn);
};

export const verifyToken = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        throw new Error('Geçersiz veya süresi dolmuş token');
    }
};

export const extractOrganizationId = (token: string): string => {
    const decoded = verifyToken(token);
    return decoded.organizationId;
};
