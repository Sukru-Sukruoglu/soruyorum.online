import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

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

app.get("/health", (req, res) => {
    res.send("OK");
});

httpServer.listen(port, () => {
    console.log(`WebSocket Server listening on port ${port}`);
});
