import { router, publicProcedure } from "../trpc";
import { z } from "zod";

export const participantsRouter = router({
    join: publicProcedure
        .input(z.object({
            pin: z.string(),
            name: z.string(),
            avatarSeed: z.string().optional()
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
