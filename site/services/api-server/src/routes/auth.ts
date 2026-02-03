import express from 'express';
import bcrypt from 'bcrypt';
import { tenantDb } from '../database/tenantDb';
import { generateToken } from '../utils/jwt';

const router = express.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

router.post('/register', async (req, res, next) => {
    try {
        const { organizationName, email, password, name } = req.body;

        if (!organizationName || !email || !password) {
            return res.status(400).json({
                error: 'Organizasyon adı, email ve şifre gereklidir'
            });
        }

        const existingUser = await tenantDb.direct.users.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'Bu email adresi zaten kullanılıyor'
            });
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Slug generation
        const slug = organizationName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const { randomUUID } = await import('crypto');
        
        const result = await tenantDb.transaction(async (tx) => {
            const organization = await tx.organizations.create({
                data: {
                    id: randomUUID(),
                    name: organizationName,
                    slug: `${slug}-${Date.now()}`,
                    plan: 'free',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            const user = await tx.users.create({
                data: {
                    id: randomUUID(),
                    organization_id: organization.id,
                    email,
                    password_hash: passwordHash,
                    name,
                    role: 'admin',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            return { organization, user };
        });

        const token = generateToken({
            userId: result.user.id,
            organizationId: result.organization.id,
            email: result.user.email,
            role: result.user.role,
        });

        res.status(201).json({
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role,
            },
            organization: {
                id: result.organization.id,
                name: result.organization.name,
                slug: result.organization.slug,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email ve şifre gereklidir'
            });
        }

        const user = await tenantDb.direct.users.findUnique({
            where: { email },
            include: { organizations: true },
        });

        if (!user || !user.password_hash) {
            return res.status(401).json({
                error: 'Geçersiz email veya şifre'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Geçersiz email veya şifre'
            });
        }

        const token = generateToken({
            userId: user.id,
            organizationId: user.organization_id!,
            email: user.email,
            role: user.role,
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            organization: {
                id: user.organizations!.id,
                name: user.organizations!.name,
                slug: user.organizations!.slug,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
