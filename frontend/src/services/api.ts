import axios, { type AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('Error: VITE_API_URL no está definida en las variables de entorno');
  console.error('Por favor, configura VITE_API_URL en tu archivo .env');
  throw new Error('VITE_API_URL no está configurada. Por favor, configura las variables de entorno.');
}

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Solo redirigir si NO es un error de cambio de contraseña
      // Los errores de cambio de contraseña también pueden ser 401 
      const url = error.config?.url || '';
      if (!url.includes('/change-password')) {
        // Token expirado o inválido
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

