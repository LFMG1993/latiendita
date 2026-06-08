export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

/**
 * Base fetch wrapper with default headers and error handling
 */
export async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    // Default headers
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Include auth token if available (e.g. from local storage)
    // TODO: Connect this to the new Go Auth token logic once authServices is migrated
    const token = localStorage.getItem('auth_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        
        // Handle No Content response
        if (response.status === 204) {
            return {} as T;
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new ApiError(
                data?.error || `API request failed with status ${response.status}`,
                response.status,
                data
            );
        }

        return data as T;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new Error(error instanceof Error ? error.message : 'Unknown network error');
    }
}
