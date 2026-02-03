"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.participantsRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
exports.participantsRouter = (0, trpc_1.router)({
    join: trpc_1.publicProcedure
        .input(zod_1.z.object({
        pin: zod_1.z.string(),
        name: zod_1.z.string(),
        avatarSeed: zod_1.z.string().optional()
    }))
        .mutation(async ({ ctx, input }) => {
        // Find cached PIN in Redis (in real app) or DB
        // For now, create a participant record
        // This is a stub logic
        return {
            success: true,
            participantId: "demo-p-id",
            event: { title: "Demo Event" }
        };
    }),
});
