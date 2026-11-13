import { apiFetch } from "./client";
import type { Setup2FAResponse } from "../types/api";

export const authApi = {
    getOAuthLoginUrl: (provider: 'github' | 'google') => `/api/auth/${provider}`,

    setup2FA: () =>
        apiFetch<Setup2FAResponse>('/api/auth/2fa/setup', {
            method: 'POST',
        }),

    verify2FA: (code: string) =>
        apiFetch<{ message: string }>('/api/auth/2fa/verify', {
            method: 'POST',
            body: JSON.stringify({ code }),
        }),
    
    logout: () =>
        apiFetch<{ message: string }>('/api/auth/logout', {
            method: 'POST',
        }),
};