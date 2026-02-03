"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const trpc_1 = require("../trpc");
const pctChange = (current, previous) => {
    if (previous === 0)
        return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
};
const round1 = (value) => {
    return Math.round(value * 10) / 10;
};
exports.dashboardRouter = (0, trpc_1.router)({
    getStats: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        const orgId = ctx.user.organizationId;
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const [totalParticipants, participantsThisMonth, participantsPrevMonth, activeEvents, eventsThisMonth, eventsPrevMonth, engagedParticipantsThisMonth, engagedParticipantsPrevMonth,] = await Promise.all([
            ctx.prisma.participants.count({
                where: { events: { organization_id: orgId } },
            }),
            ctx.prisma.participants.count({
                where: {
                    events: { organization_id: orgId },
                    joined_at: { gte: thisMonthStart, lt: nextMonthStart },
                },
            }),
            ctx.prisma.participants.count({
                where: {
                    events: { organization_id: orgId },
                    joined_at: { gte: prevMonthStart, lt: thisMonthStart },
                },
            }),
            ctx.prisma.events.count({
                where: { organization_id: orgId, status: "active" },
            }),
            ctx.prisma.events.count({
                where: {
                    organization_id: orgId,
                    created_at: { gte: thisMonthStart, lt: nextMonthStart },
                },
            }),
            ctx.prisma.events.count({
                where: {
                    organization_id: orgId,
                    created_at: { gte: prevMonthStart, lt: thisMonthStart },
                },
            }),
            ctx.prisma.participants.count({
                where: {
                    events: { organization_id: orgId },
                    joined_at: { gte: thisMonthStart, lt: nextMonthStart },
                    OR: [{ responses: { some: {} } }, { qanda_submissions: { some: {} } }],
                },
            }),
            ctx.prisma.participants.count({
                where: {
                    events: { organization_id: orgId },
                    joined_at: { gte: prevMonthStart, lt: thisMonthStart },
                    OR: [{ responses: { some: {} } }, { qanda_submissions: { some: {} } }],
                },
            }),
        ]);
        const participantsChangePct = round1(pctChange(participantsThisMonth, participantsPrevMonth));
        const meetingsChangePct = round1(pctChange(eventsThisMonth, eventsPrevMonth));
        const engagementRateThisMonth = participantsThisMonth
            ? round1((engagedParticipantsThisMonth / participantsThisMonth) * 100)
            : 0;
        const engagementRatePrevMonth = participantsPrevMonth
            ? round1((engagedParticipantsPrevMonth / participantsPrevMonth) * 100)
            : 0;
        const engagementRateDelta = round1(engagementRateThisMonth - engagementRatePrevMonth);
        return {
            totalParticipants,
            participantsChangePct,
            activeEvents,
            meetingsThisMonth: eventsThisMonth,
            meetingsChangePct,
            engagementRate: engagementRateThisMonth,
            engagementRateDelta,
        };
    }),
});
