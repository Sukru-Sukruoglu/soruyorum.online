import { io, Socket } from "socket.io-client";

// In production, this URL should come from env vars
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ["websocket"],
        });
    }
    return socket;
};
