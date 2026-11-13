export interface Post {
    id: number;
    user_id: number;
    title: string;
    slug: string;
    topic: string;
    summary: string;
    content?: string;
    reading_time: number;
    created_at: string;
    updated_at: string;
}

export interface PaginatedPostsResponse {
    data: Post[];
    page: number;
    limit: number;
    topic?: string;
}

export interface PostInput {
    title: string;
    topic?: string;
    summary?: string;
    body: string;
}

export interface UploadResponse {
    url: string;
    filename: string;
}

export interface Setup2FAResponse {
    secret: string;
    qr_code_url: string;
}

export interface ApiError {
    error: string;
    current_stage?: string;
    required_stage?: string;
}
