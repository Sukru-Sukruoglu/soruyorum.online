/**
 * WebSocket Server Communication Service
 * 
 * Handles communication between API server and WebSocket server
 * for real-time notifications like:
 * - Kicking users when PIN changes
 * - Notifying users when event ends
 * - Broadcasting game state changes
 */

const WS_SERVER_URL = process.env.WS_SERVER_URL || 'http://localhost:4001';

interface BroadcastPayload {
    eventId: string;
    type: string;
    payload?: Record<string, unknown>;
}

interface KickRoomPayload {
    eventId: string;
    reason?: string;
}

interface EndEventPayload {
    eventId: string;
    message?: string;
}

/**
 * Broadcast a message to all participants in an event room
 */
export async function broadcastToEvent(data: BroadcastPayload): Promise<boolean> {
    try {
        const response = await fetch(`${WS_SERVER_URL}/internal/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            console.error(`Failed to broadcast to event ${data.eventId}:`, await response.text());
            return false;
        }
        
        return true;
    } catch (error) {
        console.error(`Error broadcasting to event ${data.eventId}:`, error);
        return false;
    }
}

/**
 * Kick all participants from an event room
 * Used when PIN is regenerated or event access is revoked
 */
export async function kickEventParticipants(data: KickRoomPayload): Promise<{ success: boolean; kickedCount: number }> {
    try {
        const response = await fetch(`${WS_SERVER_URL}/internal/kick-room`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            console.error(`Failed to kick room for event ${data.eventId}:`, await response.text());
            return { success: false, kickedCount: 0 };
        }
        
        const result = await response.json();
        console.log(`Kicked ${result.kickedCount} participants from event ${data.eventId}`);
        return { success: true, kickedCount: result.kickedCount };
    } catch (error) {
        console.error(`Error kicking room for event ${data.eventId}:`, error);
        return { success: false, kickedCount: 0 };
    }
}

/**
 * End an event and notify all participants
 * Used when event status changes to 'finished' or 'closed'
 */
export async function endEvent(data: EndEventPayload): Promise<{ success: boolean; notifiedCount: number }> {
    try {
        const response = await fetch(`${WS_SERVER_URL}/internal/end-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            console.error(`Failed to end event ${data.eventId}:`, await response.text());
            return { success: false, notifiedCount: 0 };
        }
        
        const result = await response.json();
        console.log(`Ended event ${data.eventId}, notified ${result.notifiedCount} participants`);
        return { success: true, notifiedCount: result.notifiedCount };
    } catch (error) {
        console.error(`Error ending event ${data.eventId}:`, error);
        return { success: false, notifiedCount: 0 };
    }
}
