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

/**
 * Reset the socket connection completely.
 * Call this when user joins a new event to ensure clean state.
 */
export const resetSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
        socket = null;
    }
};

/**
 * Get a fresh socket instance, disconnecting any existing one.
 * Use this when joining a new event via QR code.
 */
export const getFreshSocket = (): Socket => {
    resetSocket();
    socket = io(SOCKET_URL, {
        autoConnect: false,
        transports: ["websocket"],
    });
    return socket;
};
