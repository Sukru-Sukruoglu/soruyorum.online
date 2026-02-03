"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lucia = void 0;
const lucia_1 = require("lucia");
const adapter_prisma_1 = require("@lucia-auth/adapter-prisma");
const database_1 = require("@ks-interaktif/database");
const adapter = new adapter_prisma_1.PrismaAdapter(database_1.prisma.sessions, database_1.prisma.users);
exports.lucia = new lucia_1.Lucia(adapter, {
    sessionCookie: {
        attributes: {
            secure: process.env.NODE_ENV === "production"
        }
    },
    getUserAttributes: (attributes) => {
        return {
            email: attributes.email,
            role: attributes.role,
            organizationId: attributes.organization_id
        };
    }
});
