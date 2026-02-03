import axios from 'axios';

// Use relative URL to go through Next.js API proxy (no DNS issues)
const API_URL = '';

// Axios instance (JWT token automatically added via interceptor if available)
export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor (Add JWT token)
apiClient.interceptors.request.use((config) => {
    // In a real app, you might get this from a Context or formatted from Clerk/NextAuth
    // For now, we assume it's stored in localStorage during login
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor (Error handling)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token invalid, clear it
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                // window.location.href = '/login'; // Optional: redirect
            }
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
    eventType: 'quiz' | 'poll' | 'tombala';
    maxParticipants?: number;
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
    maxParticipants: number;
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
