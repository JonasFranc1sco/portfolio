export class HttpError extends Error {
    status: number;
    data: any;

    constructor(status: number, message: string, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}):
Promise<T> {
    const response = await fetch(path, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('portfolio_is_authenticated');
            window.dispatchEvent(new Event('portfolio:unauthorized'));
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        throw new HttpError(
            response.status,
            data.error || 'Ocorreu um erro inesperado na comunicação com o servidor',
            data
        );
    }

    return data as T;
}