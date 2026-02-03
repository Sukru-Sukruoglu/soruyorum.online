import { router, publicProcedure } from "./trpc";
import { authRouter } from "./routers/auth";
import { eventsRouter } from "./routers/events";
import { participantsRouter } from "./routers/participants";
import { usersRouter } from "./routers/users";
import { qandaRouter } from "./routers/qanda";
import { invitationsRouter } from "./routers/invitations";
import { dashboardRouter } from "./routers/dashboard";

export const appRouter = router({
    auth: authRouter,
    events: eventsRouter,
    participants: participantsRouter,
    users: usersRouter,
    qanda: qandaRouter,
    invitations: invitationsRouter,
    dashboard: dashboardRouter,
    health: publicProcedure.query(() => "OK"),
});

export type AppRouter = typeof appRouter;
