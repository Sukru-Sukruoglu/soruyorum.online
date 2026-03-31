import axios from 'axios';
import { clearLegacyAuthStorage } from '../utils/authSession';

// Use relative URL to go through Next.js API proxy (no DNS issues)
const API_URL = '';

// Axios instance. Auth is handled server-side via secure httpOnly cookie.
export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor (Error handling)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearLegacyAuthStorage();
        }
        return Promise.reject(error);
    }
);

// ==========================================
// Types
// ==========================================

export interface CreateEventPayload {
    title: string;
    description?: string;
    eventType: 'quiz' | 'poll' | 'tombala' | 'wheel' | 'ranking' | 'wordcloud' | 'matching';
    maxParticipants?: number | null;
    // Optional pre-generated fields
    eventPin?: string;
    joinUrl?: string;
    qrCodeUrl?: string;
    settings: {
        registration: {
            requirePin: boolean;
            requireName: boolean;
            requireEmail: boolean;
            requirePhone: boolean;
            requireAvatar: boolean;
            requireId: boolean;
            allowAnonymous: boolean;
            requireKvkkConsent: boolean;
        };
        gameplay: {
            autoMarkNumbers: boolean;
            autoStartEvent: boolean;
            startDateTime?: string;
        };
    };
    status?: 'draft' | 'active' | 'completed' | 'cancelled';
}

export interface Event {
    id: string;
    name: string;
    title?: string;
    eventType: string;
    eventCode: string;
    eventPin: string;
    joinUrl: string;
    qrCodeUrl: string;
    maxParticipants: number | null;
    status: 'draft' | 'active' | 'completed';
    createdAt: string;
}

// ==========================================
// API Functions
// ==========================================

/**
 * Create a new event
 */
export const createEvent = async (payload: CreateEventPayload): Promise<Event> => {
    const response = await apiClient.post('/api/events', payload);
    return response.data.event;
};

/**
 * Start an event
 */
export const startEvent = async (eventId: string): Promise<Event> => {
    const response = await apiClient.post(`/api/events/${eventId}/start`);
    return response.data.event;
};

/**
 * Update an event
 */
export const updateEvent = async (eventId: string, payload: Partial<CreateEventPayload>): Promise<Event> => {
    const response = await apiClient.patch(`/api/events/${eventId}`, payload);
    return response.data.event;
};

/**
 * Regenerate PIN
 */
export const regeneratePin = async (eventId: string): Promise<{
    pin: string;
    joinUrl: string;
    qrCodeUrl: string;
}> => {
    const response = await apiClient.post(`/api/events/${eventId}/regenerate-pin`);
    return response.data;
};

/**
 * Get event details
 */
export const getEvent = async (eventId: string): Promise<Event> => {
    const response = await apiClient.get(`/api/events/${eventId}`);
    return response.data.event;
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
    await apiClient.delete(`/api/events/${eventId}`);
};
