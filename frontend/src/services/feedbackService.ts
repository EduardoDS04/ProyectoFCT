import axios from 'axios';
import type {
  Feedback,
  CreateFeedbackData,
  ApiResponse
} from '../types';

const FEEDBACK_SERVICE_URL = import.meta.env.VITE_FEEDBACK_SERVICE_URL;

if (!FEEDBACK_SERVICE_URL) {
  console.error('Error: VITE_FEEDBACK_SERVICE_URL no está definida en las variables de entorno');
  console.error('Por favor, configura VITE_FEEDBACK_SERVICE_URL en tu archivo .env');
  throw new Error('VITE_FEEDBACK_SERVICE_URL no está configurada. Por favor, configura las variables de entorno.');
}

// Crear instancia de axios para el servicio de feedback
const feedbackApi = axios.create({
  baseURL: FEEDBACK_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a las peticiones
feedbackApi.interceptors.request.use(
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

class FeedbackService {
  /**
   * Crear un nuevo feedback (solo para socios)
   */
  async createFeedback(data: CreateFeedbackData): Promise<Feedback> {
    try {
      const response = await feedbackApi.post<ApiResponse<Feedback>>('/api/feedback', data);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al crear el feedback');
    } catch (error) {
      console.error('Error al crear feedback:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Error al crear el feedback');
      }
      throw error;
    }
  }

  /**
   * Obtener todos los feedbacks (solo para admin)
   */
  async getAllFeedbacks(): Promise<Feedback[]> {
    try {
      const response = await feedbackApi.get<ApiResponse<Feedback[]>>('/api/feedback');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al obtener los feedbacks');
    } catch (error) {
      console.error('Error al obtener feedbacks:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Error al obtener los feedbacks');
      }
      throw error;
    }
  }

  /**
   * Obtener un feedback por ID (solo para admin)
   */
  async getFeedbackById(id: string): Promise<Feedback> {
    try {
      const response = await feedbackApi.get<ApiResponse<Feedback>>(`/api/feedback/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al obtener el feedback');
    } catch (error) {
      console.error('Error al obtener feedback:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Error al obtener el feedback');
      }
      throw error;
    }
  }
}

export default new FeedbackService();

