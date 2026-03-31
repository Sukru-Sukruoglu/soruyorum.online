import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "@ks-interaktif/database";
import { clearWaitingParticipantsForEvent } from "./services/participantQueue";

const app = express();
const httpServer = createServer(app);
import { setupGameEvents } from "./events/game";

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const port = process.env.PORT || 4001;

app.use(express.json());

// Internal endpoint for API server to broadcast events
app.post("/internal/broadcast", (req, res) => {
    const { eventId, type, payload } = req.body;

    if (!eventId || !type) {
        return res.status(400).json({ error: "Missing eventId or type" });
    }

    // Broadcast to the specific room
    // Note: Clients must join "event-{eventId}" room
    const roomName = `event-${eventId}`;
    io.to(roomName).emit(type, payload);

    console.log(`Broadcasted ${type} to ${roomName}`);
    res.json({ success: true });
});

// Internal endpoint: Kick all participants when PIN is regenerated
app.post("/internal/kick-room", async (req, res) => {
    const { eventId, reason } = req.body;

    if (!eventId) {
        return res.status(400).json({ error: "Missing eventId" });
    }

    const roomName = `event-${eventId}`;

    try {
        // Get all sockets in the room
        const socketsInRoom = await io.in(roomName).fetchSockets();
        const kickedCount = socketsInRoom.length;

        // Notify all clients they're being kicked
        io.to(roomName).emit("kicked", {
            reason: reason || "PIN kodu değiştirildi. Lütfen yeni PIN ile tekrar katılın.",
            code: "PIN_CHANGED"
        });

        const event = await prisma.events.findUnique({
            where: { id: eventId },
            select: { id: true, name: true },
        });
        clearWaitingParticipantsForEvent(io, eventId, event?.name || "Etkinlik", {
            type: "kicked",
            data: {
                reason: reason || "PIN kodu değiştirildi. Lütfen yeni PIN ile tekrar katılın.",
                code: "PIN_CHANGED",
            },
        });

        // Force disconnect all sockets in the room
        for (const socket of socketsInRoom) {
            socket.leave(roomName);
            // Clear socket data
            socket.data.eventId = null;
            socket.data.eventPin = null;
        }

        console.log(`Kicked ${kickedCount} users from room ${roomName}. Reason: ${reason || 'PIN_CHANGED'}`);
        res.json({ success: true, kickedCount });
    } catch (error) {
        console.error("Error kicking room:", error);
        res.status(500).json({ error: "Failed to kick room" });
    }
});

// Internal endpoint: End event and notify all participants
app.post("/internal/end-event", async (req, res) => {
    const { eventId, message } = req.body;

    if (!eventId) {
        return res.status(400).json({ error: "Missing eventId" });
    }

    const roomName = `event-${eventId}`;

    try {
        const socketsInRoom = await io.in(roomName).fetchSockets();
        const notifiedCount = socketsInRoom.length;

        // Notify all clients the event has ended
        io.to(roomName).emit("event_ended", {
            message: message || "Etkinlik sona erdi. Katıldığınız için teşekkürler!",
            code: "EVENT_ENDED"
        });

        const event = await prisma.events.findUnique({
            where: { id: eventId },
            select: { id: true, name: true },
        });
        clearWaitingParticipantsForEvent(io, eventId, event?.name || "Etkinlik", {
            type: "event_ended",
            data: {
                message: message || "Etkinlik sona erdi. Katıldığınız için teşekkürler!",
                code: "EVENT_ENDED",
            },
        });

        // Disconnect all sockets after a short delay
        setTimeout(async () => {
            for (const socket of socketsInRoom) {
                socket.leave(roomName);
                socket.data.eventId = null;
            }
        }, 2000);

        console.log(`Event ${eventId} ended. Notified ${notifiedCount} users.`);
        res.json({ success: true, notifiedCount });
    } catch (error) {
        console.error("Error ending event:", error);
        res.status(500).json({ error: "Failed to end event" });
    }
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    setupGameEvents(io, socket);

    // Generic join room for events (used by Play app and Presentation screen)
    socket.on("join_event", ({ eventId }) => {
        const roomName = `event-${eventId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined ${roomName}`);
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Internal endpoint: Get active connections stats
app.get("/internal/stats", async (req, res) => {
    try {
        const allSockets = await io.fetchSockets();
        const totalConnections = allSockets.length;

        // Build per-room stats
        const rooms = io.sockets.adapter.rooms;
        const roomStats: Array<{ room: string; count: number }> = [];

        rooms.forEach((sids, roomName) => {
            // Skip personal rooms (socket id rooms)
            if (!roomName.startsWith("event-")) return;
            roomStats.push({
                room: roomName,
                count: sids.size,
            });
        });

        // Build connection list with details
        const connections = allSockets.map((s) => ({
            id: s.id,
            connectedAt: s.handshake.time,
            address: s.handshake.address,
            rooms: Array.from(s.rooms).filter((r) => r !== s.id),
            userAgent: s.handshake.headers["user-agent"] || "Unknown",
            eventId: s.data.eventId || null,
        }));

        res.json({
            totalConnections,
            rooms: roomStats.sort((a, b) => b.count - a.count),
            connections,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

app.get("/health", (req, res) => {
    res.send("OK");
});

httpServer.listen(port, () => {
    console.log(`WebSocket Server listening on port ${port}`);
});
