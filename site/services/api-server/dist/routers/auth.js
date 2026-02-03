"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const auth_1 = require("@ks-interaktif/auth");
const server_1 = require("@trpc/server");
const jwt_1 = require("../utils/jwt");
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);
exports.authRouter = (0, trpc_1.router)({
    registerAdmin: trpc_1.publicProcedure
        .input(zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
        name: zod_1.z.string().min(2),
        phone: zod_1.z.string().trim().min(7).max(20).optional(),
        organizationName: zod_1.z.string().min(2),
        kvkkAccepted: zod_1.z.literal(true),
        explicitConsentAccepted: zod_1.z.literal(true),
        consentVersion: zod_1.z.string().min(1).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const { email, password, name, organizationName } = input;
        const phone = input.phone?.trim();
        // Check if user exists
        const existingUser = await ctx.prisma.users.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new server_1.TRPCError({
                code: "CONFLICT",
                message: "User already exists"
            });
        }
        // Create Organization and User transactionally
        const user = await ctx.prisma.$transaction(async (tx) => {
            const now = new Date();
            const org = await tx.organizations.create({
                data: {
                    id: crypto_1.default.randomUUID(),
                    name: organizationName,
                    plan: "free",
                    updated_at: now,
                }
            });
            const hashedPassword = await bcrypt_1.default.hash(password, BCRYPT_ROUNDS);
            const newUser = await tx.users.create({
                data: {
                    id: crypto_1.default.randomUUID(),
                    email,
                    password_hash: hashedPassword,
                    name,
                    phone: phone || null,
                    role: "admin",
                    organization_id: org.id,
                    updated_at: now,
                }
            });
            const userAgentHeader = ctx.req?.headers["user-agent"];
            const userAgent = Array.isArray(userAgentHeader)
                ? userAgentHeader.join(" ")
                : userAgentHeader;
            await tx.audit_logs.create({
                data: {
                    id: crypto_1.default.randomUUID(),
                    organization_id: org.id,
                    user_id: newUser.id,
                    action: "consent.accepted",
                    resource: "users",
                    resource_id: newUser.id,
                    details: {
                        kvkkAccepted: true,
                        explicitConsentAccepted: true,
                        consentVersion: input.consentVersion ?? "v1",
                        source: "registerAdmin",
                        acceptedAt: now.toISOString(),
                    },
                    ip_address: ctx.req?.ip ?? null,
                    user_agent: userAgent ?? null,
                }
            });
            return newUser;
        });
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            organizationId: user.organization_id || "",
            email: user.email,
            role: user.role,
        });
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organization_id
            }
        };
    }),
    registerUser: trpc_1.publicProcedure
        .input(zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
        name: zod_1.z.string().min(2),
        phone: zod_1.z.string().trim().min(7).max(20).optional(),
        organizationId: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { email, password, name, organizationId } = input;
        const phone = input.phone?.trim();
        const existingUser = await ctx.prisma.users.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new server_1.TRPCError({
                code: "CONFLICT",
                message: "User already exists"
            });
        }
        // Verify Organization exists
        const org = await ctx.prisma.organizations.findUnique({
            where: { id: organizationId }
        });
        if (!org) {
            throw new server_1.TRPCError({
                code: "NOT_FOUND",
                message: "Organization not found"
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, BCRYPT_ROUNDS);
        const user = await ctx.prisma.users.create({
            data: {
                id: crypto_1.default.randomUUID(),
                email,
                password_hash: hashedPassword,
                name,
                phone: phone || null,
                role: "member",
                organization_id: organizationId,
                updated_at: new Date()
            }
        });
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            organizationId: user.organization_id || "",
            email: user.email,
            role: user.role,
        });
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organization_id
            }
        };
    }),
    login: trpc_1.publicProcedure
        .input(zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { email, password } = input;
        const user = await ctx.prisma.users.findUnique({
            where: { email }
        });
        if (!user || !user.password_hash) {
            throw new server_1.TRPCError({
                code: "UNAUTHORIZED",
                message: "Invalid email or password"
            });
        }
        // Support both legacy bcrypt hashes and newer scrypt hashes.
        // Some older stacks stored bcrypt hashes (REST routes), while newer tRPC auth used scrypt.
        let validPassword = false;
        try {
            validPassword = await new auth_1.Scrypt().verify(user.password_hash, password);
        }
        catch {
            validPassword = false;
        }
        if (!validPassword) {
            try {
                validPassword = await bcrypt_1.default.compare(password, user.password_hash);
            }
            catch {
                validPassword = false;
            }
        }
        if (!validPassword) {
            throw new server_1.TRPCError({
                code: "UNAUTHORIZED",
                message: "Invalid email or password"
            });
        }
        // LOGIN - Generate JWT instead of just session ID
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            organizationId: user.organization_id || '',
            email: user.email,
            role: user.role
        });
        return {
            token: token, // Send JWT
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organization_id
            }
        };
    }),
    logout: trpc_1.publicProcedure
        .input(zod_1.z.object({
        sessionId: zod_1.z.string()
    }))
        .mutation(async ({ input }) => {
        // Most clients use JWT; there's nothing to invalidate server-side.
        // If a legacy Lucia session id is passed, best-effort invalidate.
        try {
            await auth_1.lucia.invalidateSession(input.sessionId);
        }
        catch {
            // ignore
        }
        return { success: true };
    })
});
