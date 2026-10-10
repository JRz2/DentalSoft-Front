import { AxiosError } from 'axios';

export interface ParsedApiError {
    /** Mensaje listo para mostrar al usuario */
    message: string;
    /** Título opcional para el toast (corto) */
    title?: string;
    /** HTTP status code (0 si no hay respuesta) */
    status: number;
    /** true si es un error "esperado" de negocio (400/409/422) */
    isBusinessError: boolean;
    /** true si es error de red (sin respuesta del server) */
    isNetworkError: boolean;
    /** Código interno del error si el back lo manda (ej: 'DOCTOR_UNAVAILABLE') */
    code?: string;
}

/**
 * Traduce cualquier error (Axios, Error nativo, desconocido) a un objeto
 * listo para mostrar al usuario con el nivel de severidad adecuado.
 */
export function parseApiError(error: unknown): ParsedApiError {
    // ─── Error de red (sin internet, server caído, CORS) ───
    if (error instanceof AxiosError && !error.response) {
        return {
            message: 'No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.',
            title: 'Error de conexión',
            status: 0,
            isBusinessError: false,
            isNetworkError: true,
        };
    }

    // ─── Error con respuesta del servidor ───
    if (error instanceof AxiosError && error.response) {
        const status = error.response.status;
        const data = error.response.data as any;

        // El back puede mandar: string, { message }, { message: [] }, { error }
        let message = 'Ocurrió un error inesperado';
        let code: string | undefined;

        if (typeof data === 'string') {
            message = data;
        } else if (Array.isArray(data?.message)) {
            message = data.message.join('. ');
        } else if (typeof data?.message === 'string') {
            message = data.message;
        } else if (typeof data?.error === 'string') {
            message = data.error;
        }

        // Códigos custom del back (si los implementás después)
        code = data?.code;

        return {
            message,
            status,
            // 400/409/422 → errores de negocio (el usuario puede corregir)
            isBusinessError: [400, 409, 422].includes(status),
            isNetworkError: false,
            code,
        };
    }

    // ─── Error nativo de JS ───
    if (error instanceof Error) {
        return {
            message: error.message || 'Ocurrió un error inesperado',
            status: 0,
            isBusinessError: false,
            isNetworkError: false,
        };
    }

    // ─── Fallback ───
    return {
        message: 'Ocurrió un error inesperado',
        status: 0,
        isBusinessError: false,
        isNetworkError: false,
    };
}

/**
 * Muestra un toast con el nivel correcto según el tipo de error.
 * Uso: showApiErrorToast(error, toast);
 */
export function showApiErrorToast(
    error: unknown,
    toastFn: {
        warning: (msg: string, opts?: any) => void;
        error: (msg: string, opts?: any) => void;
    }
): ParsedApiError {
    const parsed = parseApiError(error);

    if (parsed.isBusinessError) {
        toastFn.warning(parsed.title || 'Acción no permitida', {
            description: parsed.message,
            duration: 6000,
        });
    } else {
        toastFn.error(parsed.title || 'Error', {
            description: parsed.message,
            duration: 5000,
        });
    }

    // Log solo en dev
    if (import.meta.env.DEV) {
        console.error('[API Error]', { error, parsed });
    }

    return parsed;
}