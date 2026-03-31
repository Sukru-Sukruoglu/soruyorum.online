import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import * as trpcExpress from "@trpc/server/adapters/express";
import { prisma } from "@ks-interaktif/database";
import { lucia } from "@ks-interaktif/auth";

export const createContext = async ({
    req,
    res,
}: trpcExpress.CreateExpressContextOptions) => {
    // 1. Check for Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    let sessionId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        sessionId = authHeader.split(" ")[1];
    } else {
        // 2. Fallback to cookies (if implemented later)
        // sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
    }

    let user = null;
    let session = null;

    if (sessionId) {
        // 1. Try Lucia Session
        try {
            const result = await lucia.validateSession(sessionId);
            if (result.session && result.user) {
                user = result.user;
                session = result.session;
            }
        } catch (e) {
            // Check if it's a JWT if session validation failed/threw
        }

        // 2. Fallback to JWT if no session found yet
        if (!user) {
            try {
                const { verifyToken } = await import("./utils/jwt");
                const payload = verifyToken(sessionId);
                if (payload) {
                    user = {
                        id: payload.userId,
                        email: payload.email,
                        role: payload.role,
                        organizationId: payload.organizationId
                    };
                    session = { id: 'jwt', userId: payload.userId, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), fresh: true };
                }
            } catch (e) {
                // Invalid JWT too
            }
        }
    }

    return {
        req,
        res,
        prisma,
        user,
        session
    };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session || !ctx.user || !ctx.user.organizationId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not part of an organization" });
    }
    return next({
        ctx: {
            session: ctx.session,
            user: {
                ...ctx.user,
                organizationId: ctx.user.organizationId, // Explicitly typed as string
            },
        },
    });
});

export const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    const { isSuperAdmin } = await import("./utils/access");
    if (!isSuperAdmin({ role: ctx.user.role as string, email: ctx.user.email as string })) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Superadmin access required" });
    }
    return next({ ctx });
});
