import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma as db } from '@ks-interaktif/database';

export const invitationsRouter = router({
    // Send email invitation(s)
    send: protectedProcedure
        .input(
            z.object({
                emails: z.array(z.string().email()),
                organizationId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { emails, organizationId } = input;
            const userId = ctx.user.id;

            const invitationsTable = (db as any).email_invitations as
                | {
                      findUnique: (args: any) => Promise<any>;
                      create: (args: any) => Promise<any>;
                      findMany: (args: any) => Promise<any>;
                      count: (args: any) => Promise<number>;
                      delete: (args: any) => Promise<any>;
                  }
                | undefined;

            if (!invitationsTable) {
                throw new TRPCError({
                    code: 'NOT_IMPLEMENTED',
                    message: 'Invitations are not enabled on this deployment',
                });
            }

            // Check if user has permission (admin or organizer)
            if (ctx.user.role !== 'admin' && ctx.user.role !== 'organizer') {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Only admins and organizers can send invitations',
                });
            }

            const invitations = [];
            const errors = [];

            for (const email of emails) {
                try {
                    // Check if invitation already exists
                    const existing = await invitationsTable.findUnique({
                        where: { email },
                    });

                    if (existing) {
                        errors.push({ email, error: 'Invitation already sent' });
                        continue;
                    }

                    // Create invitation
                    const invitation = await invitationsTable.create({
                        data: {
                            email,
                            invited_by: userId,
                            organization_id: organizationId || ctx.user.organizationId,
                        },
                    });

                    invitations.push(invitation);

                    // TODO: Send email notification
                    // await sendInvitationEmail(email, invitation.id);
                } catch (error) {
                    errors.push({ email, error: 'Failed to create invitation' });
                }
            }

            return {
                success: true,
                sent: invitations.length,
                failed: errors.length,
                invitations,
                errors,
            };
        }),

    // List all invitations
    list: protectedProcedure
        .input(
            z
                .object({
                    used: z.boolean().optional(),
                    limit: z.number().min(1).max(100).default(50),
                    offset: z.number().min(0).default(0),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            const { used, limit = 50, offset = 0 } = input || {};

            const invitationsTable = (db as any).email_invitations as
                | {
                      findMany: (args: any) => Promise<any>;
                      count: (args: any) => Promise<number>;
                  }
                | undefined;

            if (!invitationsTable) {
                throw new TRPCError({
                    code: 'NOT_IMPLEMENTED',
                    message: 'Invitations are not enabled on this deployment',
                });
            }

            const where: any = {};

            // Filter by organization if not admin
            if (ctx.user.role !== 'admin') {
                where.organization_id = ctx.user.organizationId;
            }

            if (used !== undefined) {
                where.used = used;
            }

            const [invitations, total] = await Promise.all([
                invitationsTable.findMany({
                    where,
                    include: {
                        users: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { invited_at: 'desc' },
                    take: limit,
                    skip: offset,
                }),
                invitationsTable.count({ where }),
            ]);

            return {
                invitations,
                total,
                limit,
                offset,
            };
        }),

    // Delete invitation
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { id } = input;

            const invitationsTable = (db as any).email_invitations as
                | {
                      findUnique: (args: any) => Promise<any>;
                      delete: (args: any) => Promise<any>;
                  }
                | undefined;

            if (!invitationsTable) {
                throw new TRPCError({
                    code: 'NOT_IMPLEMENTED',
                    message: 'Invitations are not enabled on this deployment',
                });
            }

            // Check if user has permission
            if (ctx.user.role !== 'admin' && ctx.user.role !== 'organizer') {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Only admins and organizers can delete invitations',
                });
            }

            const invitation = await invitationsTable.findUnique({
                where: { id },
            });

            if (!invitation) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Invitation not found',
                });
            }

            // Check if invitation belongs to user's organization
            if (
                ctx.user.role !== 'admin' &&
                invitation.organization_id !== ctx.user.organizationId
            ) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You can only delete invitations from your organization',
                });
            }

            await invitationsTable.delete({
                where: { id },
            });

            return { success: true };
        }),

    // Check if email is invited
    checkInvitation: protectedProcedure
        .input(z.object({ email: z.string().email() }))
        .query(async ({ input }) => {
            const { email } = input;

            const invitationsTable = (db as any).email_invitations as
                | {
                      findUnique: (args: any) => Promise<any>;
                  }
                | undefined;

            if (!invitationsTable) {
                throw new TRPCError({
                    code: 'NOT_IMPLEMENTED',
                    message: 'Invitations are not enabled on this deployment',
                });
            }

            const invitation = await invitationsTable.findUnique({
                where: { email },
            });

            return {
                invited: !!invitation,
                used: invitation?.used || false,
            };
        }),
});
