import { Server, Socket } from "socket.io";
// import { prisma } from "@ks-interaktif/database"; // Assuming access to shared DB

export const setupGameEvents = (io: Server, socket: Socket) => {
    // Join Room
    socket.on("join_room", async ({ pin, name, avatar }) => {
        const roomName = `event-${pin}`;
        await socket.join(roomName);

        // Notify others
        socket.to(roomName).emit("participant_joined", { name, avatar });
        console.log(`User ${name} joined room ${roomName}`);

        // Send current state
        socket.emit("game_state", { status: "LOBBY", participantsCount: 1 }); // Mock
    });

    // Submit Answer
    socket.on("submit_answer", ({ pin, questionId, answerId }) => {
        const roomName = `event-${pin}`;
        console.log(`Answer received for ${roomName}: Q${questionId} -> A${answerId}`);

        // In real app: Validate and save to Redis/DB
    });
};
