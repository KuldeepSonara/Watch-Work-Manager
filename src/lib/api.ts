import axios, { AxiosError } from 'axios'
import { APP_CONFIG } from './constants'

const api = axios.create({
    baseURL: APP_CONFIG.API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Centralized error handling
export const handleApiError = (error: unknown, defaultMessage: string): string => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error?: string }>
        return axiosError.response?.data?.error || axiosError.message || defaultMessage
    }
    return error instanceof Error ? error.message : defaultMessage
}

// Add request interceptor if needed in future (e.g. for auth tokens)
api.interceptors.request.use(
    (config) => {
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Add response interceptor to handle data extraction
api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        // You could handle global things here like 401 redirects
        return Promise.reject(error)
    }
)

export default api
