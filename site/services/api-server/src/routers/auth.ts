import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { lucia, Scrypt } from "@ks-interaktif/auth";
import { TRPCError } from "@trpc/server";
import { generateToken } from "../utils/jwt";
import crypto from "crypto";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

export const authRouter = router({
    registerAdmin: publicProcedure
        .input(z.object({
            email: z.string().email(),
            password: z.string().min(6),
            name: z.string().min(2),
            phone: z.string().trim().min(7).max(20).optional(),
            organizationName: z.string().min(2),
            kvkkAccepted: z.literal(true),
            explicitConsentAccepted: z.literal(true),
            consentVersion: z.string().min(1).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { email, password, name, organizationName } = input;
            const phone = input.phone?.trim();

            // Check if user exists
            const existingUser = await ctx.prisma.users.findUnique({
                where: { email }
            });

            if (existingUser) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "User already exists"
                });
            }

            // Create Organization and User transactionally
            const user = await ctx.prisma.$transaction(async (tx) => {
                const now = new Date();
                const org = await tx.organizations.create({
                    data: {
                        id: crypto.randomUUID(),
                        name: organizationName,
                        plan: "free",
                        updated_at: now,
                    }
                });

                const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
                const newUser = await tx.users.create({
                    data: {
                        id: crypto.randomUUID(),
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
                        id: crypto.randomUUID(),
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

            const token = generateToken({
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

    registerUser: publicProcedure
        .input(z.object({
            email: z.string().email(),
            password: z.string().min(6),
            name: z.string().min(2),
            phone: z.string().trim().min(7).max(20).optional(),
            organizationId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const { email, password, name, organizationId } = input;
            const phone = input.phone?.trim();

            const existingUser = await ctx.prisma.users.findUnique({
                where: { email }
            });

            if (existingUser) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "User already exists"
                });
            }

            // Verify Organization exists
            const org = await ctx.prisma.organizations.findUnique({
                where: { id: organizationId }
            });

            if (!org) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Organization not found"
                });
            }

            const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
            const user = await ctx.prisma.users.create({
                data: {
                    id: crypto.randomUUID(),
                    email,
                    password_hash: hashedPassword,
                    name,
                    phone: phone || null,
                    role: "member",
                    organization_id: organizationId,
                    updated_at: new Date()
                }
            });

            const token = generateToken({
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

    login: publicProcedure
        .input(z.object({
            email: z.string().email(),
            password: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const { email, password } = input;

            const user = await ctx.prisma.users.findUnique({
                where: { email }
            });

            if (!user || !user.password_hash) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid email or password"
                });
            }

            // Support both legacy bcrypt hashes and newer scrypt hashes.
            // Some older stacks stored bcrypt hashes (REST routes), while newer tRPC auth used scrypt.
            let validPassword = false;
            try {
                validPassword = await new Scrypt().verify(user.password_hash, password);
            } catch {
                validPassword = false;
            }

            if (!validPassword) {
                try {
                    validPassword = await bcrypt.compare(password, user.password_hash);
                } catch {
                    validPassword = false;
                }
            }

            if (!validPassword) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid email or password"
                });
            }

            // LOGIN - Generate JWT instead of just session ID
            const token = generateToken({
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

    logout: publicProcedure
        .input(z.object({
            sessionId: z.string()
        }))
        .mutation(async ({ input }) => {
            // Most clients use JWT; there's nothing to invalidate server-side.
            // If a legacy Lucia session id is passed, best-effort invalidate.
            try {
                await lucia.invalidateSession(input.sessionId);
            } catch {
                // ignore
            }
            return { success: true };
        })
});
