import { apiFetch } from "./client";
import type { PaginatedPostsResponse, Post, PostInput, UploadResponse } from "../types/api";

export const postsApi = {
    list: (page = 1, limit = 10, topic = '') => {
        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
        });
        if (topic) params.set('topic', topic);
        return apiFetch<PaginatedPostsResponse>(`/api/posts?${params.toString()}`);
    },

    listTopics: () =>
        apiFetch<{ topics: string[] }>('/api/posts/topics'),

    getBySlug: (slug: string) =>
        apiFetch<Post>(`/api/posts/${encodeURIComponent(slug)}`),

    create: (input: PostInput) =>
        apiFetch<Post>('/api/posts', {
            method: 'POST',
            body: JSON.stringify(input),
        }),

    update: (slug: string, input: PostInput) =>
        apiFetch<Post>(`/api/posts/${encodeURIComponent(slug)}`, {
            method: 'PUT',
            body: JSON.stringify(input),
        }),

    delete: (slug: string) =>
        apiFetch<void>(`/api/posts/${encodeURIComponent(slug)}`, {
            method: 'DELETE',
        }),

    uploadMedia: async (file: File): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/posts/uploads', {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent('portfolio:unauthorized'));
        }

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Falha no upload' }));
            throw new Error(err.error || 'Erro ao enviar arquivo');
        }

        return response.json();
    },
};
