import { Server, Socket } from "socket.io";
import { prisma } from "@ks-interaktif/database";
import {
    clearWaitingParticipantsForEvent,
    enqueueWaitingParticipant,
    getParticipantLimit,
    promoteNextWaitingParticipant,
    removeWaitingParticipant,
} from "../services/participantQueue";

// Valid statuses for joining an event
const JOINABLE_STATUSES = ['draft', 'ready', 'active', 'lobby', 'playing'];

export const setupGameEvents = (io: Server, socket: Socket) => {
    // Join Room with PIN validation
    socket.on("join_room", async ({ pin, name, avatar }) => {
        try {
            // Validate PIN - check if event exists and is joinable
            const event = await prisma.events.findFirst({
                where: {
                    OR: [
                        { event_pin: pin },
                        { pin: pin }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    event_pin: true,
                    max_participants: true,
                    organizations: {
                        select: {
                            plan: true,
                        },
                    },
                }
            });

            if (!event) {
                socket.emit("join_error", { 
                    code: "INVALID_PIN",
                    message: "Geçersiz PIN kodu. Lütfen kontrol edip tekrar deneyin."
                });
                console.log(`Invalid PIN attempt: ${pin} from ${socket.id}`);
                return;
            }

            // Check if event is in a joinable status
            if (!JOINABLE_STATUSES.includes(event.status.toLowerCase())) {
                socket.emit("join_error", { 
                    code: "EVENT_NOT_ACTIVE",
                    message: "Bu etkinlik şu anda aktif değil veya sona ermiş."
                });
                console.log(`Event not joinable: ${event.id} status=${event.status} from ${socket.id}`);
                return;
            }

            // Use event ID for room name (more reliable than PIN which can change)
            const roomName = `event-${event.id}`;

            const participantLimit = getParticipantLimit(
                event.max_participants,
                event.organizations?.plan,
            );
            const roomSockets = await io.in(roomName).fetchSockets();

            if (roomSockets.length >= participantLimit) {
                socket.data.waitingEventId = event.id;
                socket.data.eventPin = event.event_pin;
                socket.data.userName = name;
                socket.data.avatar = avatar;

                const position = enqueueWaitingParticipant(io, {
                    socketId: socket.id,
                    eventId: event.id,
                    eventName: event.name,
                    pin,
                    name,
                    avatar,
                    limit: participantLimit,
                });

                socket.emit("waiting_room", {
                    eventId: event.id,
                    eventName: event.name,
                    position,
                    limit: participantLimit,
                });

                console.log(`User ${name} queued for event ${event.id} (PIN: ${pin}) at position ${position}`);
                return;
            }

            await socket.join(roomName);

            // Store event info on socket for later reference
            socket.data.eventId = event.id;
            socket.data.eventPin = event.event_pin;
            socket.data.userName = name;
            socket.data.avatar = avatar;

            // Notify others in the room
            socket.to(roomName).emit("participant_joined", { 
                name, 
                avatar,
                socketId: socket.id 
            });

            console.log(`User ${name} joined event ${event.id} (PIN: ${pin}) room ${roomName}`);

            // Send success and current state
            socket.emit("join_success", {
                eventId: event.id,
                eventName: event.name,
                status: event.status
            });

            socket.emit("game_state", { 
                status: event.status.toUpperCase(), 
                participantsCount: roomSockets.length + 1
            });

        } catch (error) {
            console.error("Error in join_room:", error);
            socket.emit("join_error", { 
                code: "SERVER_ERROR",
                message: "Bir hata oluştu. Lütfen tekrar deneyin."
            });
        }
    });

    // Submit Answer
    socket.on("submit_answer", ({ pin, questionId, answerId }) => {
        const eventId = socket.data.eventId;
        if (!eventId) {
            socket.emit("error", { message: "Önce bir etkinliğe katılmalısınız." });
            return;
        }
        
        const roomName = `event-${eventId}`;
        console.log(`Answer received for ${roomName}: Q${questionId} -> A${answerId}`);

        // In real app: Validate and save to Redis/DB
    });

    // Handle disconnect - notify others
    socket.on("disconnect", () => {
        const eventId = socket.data.eventId;
        const waitingEventId = socket.data.waitingEventId;
        const userName = socket.data.userName;

        if (waitingEventId) {
            removeWaitingParticipant(io, waitingEventId, socket.id);
        }
        
        if (eventId && userName) {
            const roomName = `event-${eventId}`;
            socket.to(roomName).emit("participant_left", {
                name: userName,
                socketId: socket.id
            });
            console.log(`User ${userName} left event ${eventId}`);

            void (async () => {
                const event = await prisma.events.findUnique({
                    where: { id: eventId },
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        event_pin: true,
                        max_participants: true,
                        organizations: {
                            select: {
                                plan: true,
                            },
                        },
                    },
                });

                if (!event) return;

                await promoteNextWaitingParticipant(io, {
                    eventId: event.id,
                    eventName: event.name,
                    status: event.status,
                    eventPin: event.event_pin,
                    limit: getParticipantLimit(event.max_participants, event.organizations?.plan),
                });
            })().catch((error) => {
                console.error("Error promoting waiting participant:", error);
            });
        }
    });
};
