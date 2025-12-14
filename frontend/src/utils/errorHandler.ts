/**
 * Utilidad para manejar errores de Axios de forma tipada
 */

import { AxiosError } from 'axios';

interface ErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Extrae el mensaje de error de diferentes tipos de errores
 */
export const getErrorMessage = (error: unknown, defaultMessage = 'Ha ocurrido un error'): string => {
  // Error de Axios con respuesta del servidor
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ErrorResponse;
    
    if (data.message) {
      return data.message;
    }
    if (data.error) {
      return data.error;
    }
    // Si hay un mensaje genérico de Axios
    if (error.message) {
      return error.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  // Objeto con propiedad message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  
  return defaultMessage;
};

/**
 * Verifica si el error es un error de red
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || false;
  }
  return false;
};

