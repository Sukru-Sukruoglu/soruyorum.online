"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("./trpc");
const auth_1 = require("./routers/auth");
const events_1 = require("./routers/events");
const participants_1 = require("./routers/participants");
const users_1 = require("./routers/users");
const qanda_1 = require("./routers/qanda");
const invitations_1 = require("./routers/invitations");
const dashboard_1 = require("./routers/dashboard");
exports.appRouter = (0, trpc_1.router)({
    auth: auth_1.authRouter,
    events: events_1.eventsRouter,
    participants: participants_1.participantsRouter,
    users: users_1.usersRouter,
    qanda: qanda_1.qandaRouter,
    invitations: invitations_1.invitationsRouter,
    dashboard: dashboard_1.dashboardRouter,
    health: trpc_1.publicProcedure.query(() => "OK"),
});
