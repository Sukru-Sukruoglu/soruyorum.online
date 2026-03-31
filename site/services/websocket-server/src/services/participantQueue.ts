import { Server } from "socket.io";

type WaitingParticipant = {
    socketId: string;
    eventId: string;
    eventName: string;
    pin: string;
    name: string;
    avatar?: string;
    limit: number;
};

const PLAN_LIMITS: Record<string, number> = {
    free: 50,
    spring_pilot_500: 500,
    event_starter: 100,
    event_standard: 500,
    event_professional: 2000,
    starter_wl: 100,
    standard_wl: 500,
    professional_wl: 2000,
    event_pack_5: 500,
    event_pack_10: 500,
    event_pack_wl_5: 2000,
    event_pack_wl_10: 2000,
    corporate: 500,
    corporate_pro: 2000,
    corporate_wl: 500,
    corporate_pro_wl: 2000,
};

const waitingQueues = new Map<string, WaitingParticipant[]>();

export function getParticipantLimit(explicitMax: number | null | undefined, plan: string | null | undefined): number {
    if (typeof explicitMax === "number" && explicitMax > 0) {
        return explicitMax;
    }

    const normalizedPlan = String(plan || "free").trim().toLowerCase();
    return PLAN_LIMITS[normalizedPlan] ?? 50;
}

function getQueue(eventId: string): WaitingParticipant[] {
    return waitingQueues.get(eventId) ?? [];
}

function setQueue(eventId: string, queue: WaitingParticipant[]) {
    if (queue.length === 0) {
        waitingQueues.delete(eventId);
        return;
    }

    waitingQueues.set(eventId, queue);
}

function broadcastQueuePositions(io: Server, eventId: string) {
    const queue = getQueue(eventId);
    queue.forEach((entry, index) => {
        const socket = io.sockets.sockets.get(entry.socketId);
        if (!socket || !socket.connected) return;

        socket.emit("waiting_room_update", {
            eventId,
            eventName: entry.eventName,
            position: index + 1,
            limit: entry.limit,
        });
    });
}

export function enqueueWaitingParticipant(
    io: Server,
    participant: WaitingParticipant,
): number {
    const queue = getQueue(participant.eventId).filter((entry) => entry.socketId !== participant.socketId);
    queue.push(participant);
    setQueue(participant.eventId, queue);
    broadcastQueuePositions(io, participant.eventId);
    return queue.findIndex((entry) => entry.socketId === participant.socketId) + 1;
}

export function removeWaitingParticipant(io: Server, eventId: string, socketId: string) {
    const queue = getQueue(eventId);
    const nextQueue = queue.filter((entry) => entry.socketId !== socketId);

    if (nextQueue.length === queue.length) return;

    setQueue(eventId, nextQueue);
    broadcastQueuePositions(io, eventId);
}

export async function promoteNextWaitingParticipant(
    io: Server,
    params: {
        eventId: string;
        eventName: string;
        status: string;
        eventPin: string | null | undefined;
        limit: number;
    },
) {
    const roomName = `event-${params.eventId}`;
    const roomSockets = await io.in(roomName).fetchSockets();
    if (roomSockets.length >= params.limit) return;

    const queue = [...getQueue(params.eventId)];

    while (queue.length > 0) {
        const nextParticipant = queue.shift();
        if (!nextParticipant) break;

        const socket = io.sockets.sockets.get(nextParticipant.socketId);
        if (!socket || !socket.connected) {
            continue;
        }

        setQueue(params.eventId, queue);
        socket.data.waitingEventId = null;
        socket.data.eventId = params.eventId;
        socket.data.eventPin = params.eventPin;
        socket.data.userName = nextParticipant.name;
        socket.data.avatar = nextParticipant.avatar;

        await socket.join(roomName);

        socket.to(roomName).emit("participant_joined", {
            name: nextParticipant.name,
            avatar: nextParticipant.avatar,
            socketId: socket.id,
        });

        socket.emit("join_success", {
            eventId: params.eventId,
            eventName: params.eventName,
            status: params.status,
            fromQueue: true,
        });

        const updatedRoomSockets = await io.in(roomName).fetchSockets();
        socket.emit("game_state", {
            status: params.status.toUpperCase(),
            participantsCount: updatedRoomSockets.length,
        });

        broadcastQueuePositions(io, params.eventId);
        return;
    }

    setQueue(params.eventId, queue);
}

export function clearWaitingParticipantsForEvent(
    io: Server,
    eventId: string,
    eventName: string,
    payload: { type: string; data: Record<string, unknown> },
) {
    const queue = getQueue(eventId);

    for (const entry of queue) {
        const socket = io.sockets.sockets.get(entry.socketId);
        if (!socket || !socket.connected) continue;

        socket.data.waitingEventId = null;
        socket.emit(payload.type, {
            eventId,
            eventName,
            ...payload.data,
        });
    }

    waitingQueues.delete(eventId);
}