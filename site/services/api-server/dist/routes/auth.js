"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const tenantDb_1 = require("../database/tenantDb");
const jwt_1 = require("../utils/jwt");
const router = express_1.default.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');
router.post('/register', async (req, res, next) => {
    try {
        const { organizationName, email, password, name } = req.body;
        if (!organizationName || !email || !password) {
            return res.status(400).json({
                error: 'Organizasyon adı, email ve şifre gereklidir'
            });
        }
        const existingUser = await tenantDb_1.tenantDb.direct.users.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(409).json({
                error: 'Bu email adresi zaten kullanılıyor'
            });
        }
        const passwordHash = await bcrypt_1.default.hash(password, BCRYPT_ROUNDS);
        // Slug generation
        const slug = organizationName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require('crypto')));
        const result = await tenantDb_1.tenantDb.transaction(async (tx) => {
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
        const token = (0, jwt_1.generateToken)({
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
    }
    catch (error) {
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
        const user = await tenantDb_1.tenantDb.direct.users.findUnique({
            where: { email },
            include: { organizations: true },
        });
        if (!user || !user.password_hash) {
            return res.status(401).json({
                error: 'Geçersiz email veya şifre'
            });
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Geçersiz email veya şifre'
            });
        }
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            organizationId: user.organization_id,
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
                id: user.organizations.id,
                name: user.organizations.name,
                slug: user.organizations.slug,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
