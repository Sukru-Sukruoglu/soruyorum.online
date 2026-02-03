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
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedProcedure = exports.publicProcedure = exports.router = exports.createContext = void 0;
const server_1 = require("@trpc/server");
const database_1 = require("@ks-interaktif/database");
const auth_1 = require("@ks-interaktif/auth");
const createContext = async ({ req, res, }) => {
    // 1. Check for Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    let sessionId = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        sessionId = authHeader.split(" ")[1];
    }
    else {
        // 2. Fallback to cookies (if implemented later)
        // sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
    }
    let user = null;
    let session = null;
    if (sessionId) {
        // 1. Try Lucia Session
        try {
            const result = await auth_1.lucia.validateSession(sessionId);
            if (result.session && result.user) {
                user = result.user;
                session = result.session;
            }
        }
        catch (e) {
            // Check if it's a JWT if session validation failed/threw
        }
        // 2. Fallback to JWT if no session found yet
        if (!user) {
            try {
                const { verifyToken } = await Promise.resolve().then(() => __importStar(require("./utils/jwt")));
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
            }
            catch (e) {
                // Invalid JWT too
            }
        }
    }
    return {
        req,
        res,
        prisma: database_1.prisma,
        user,
        session
    };
};
exports.createContext = createContext;
const t = server_1.initTRPC.context().create();
exports.router = t.router;
exports.publicProcedure = t.procedure;
exports.protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session || !ctx.user || !ctx.user.organizationId) {
        throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "User not part of an organization" });
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
