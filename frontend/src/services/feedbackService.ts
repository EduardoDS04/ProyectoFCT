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
   * Obtener todos los feedbacks con filtro de archivados (solo para admin)
   */
  async getAllFeedbacks(archived: boolean = false): Promise<Feedback[]> {
    try {
      const response = await feedbackApi.get<ApiResponse<Feedback[]>>(
        `/api/feedback?archived=${archived}`
      );
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

  /**
   * Obtener mis feedbacks (solo para socios)
   */
  async getMyFeedbacks(): Promise<Feedback[]> {
    try {
      const response = await feedbackApi.get<ApiResponse<Feedback[]>>('/api/feedback/my-feedbacks');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al obtener tus feedbacks');
    } catch (error) {
      console.error('Error al obtener mis feedbacks:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Error al obtener tus feedbacks');
      }
      throw error;
    }
  }

  /**
   * Responder a un feedback (admin o socio)
   */
  async respondToFeedback(id: string, message: string): Promise<Feedback> {
    try {
      const response = await feedbackApi.post<ApiResponse<Feedback>>(
        `/api/feedback/${id}/respond`,
        { message }
      );
      if (response.data.success && response.data.data) {
        // El backend devuelve el feedback actualizado con los mensajes
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al responder el feedback');
    } catch (error) {
      console.error('Error al responder feedback:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Error al responder el feedback');
      }
      throw error;
    }
  }

  /**
   * Obtener contador de notificaciones sin leer (solo para socios)
   */
  async getUnreadNotificationsCount(): Promise<number> {
    try {
      const response = await feedbackApi.get<ApiResponse<{ count: number }>>('/api/feedback/notifications/count');
      if (response.data.success && response.data.data) {
        return response.data.data.count;
      }
      return 0;
    } catch (error) {
      console.error('Error al obtener contador de notificaciones:', error);
      return 0;
    }
  }

  /**
   * Obtener contador de feedbacks sin responder (solo para admin)
   */
  async getUnansweredFeedbacksCount(): Promise<number> {
    try {
      const response = await feedbackApi.get<ApiResponse<{ count: number }>>('/api/feedback/unanswered/count');
      if (response.data.success && response.data.data) {
        return response.data.data.count;
      }
      return 0;
    } catch (error) {
      console.error('Error al obtener contador de feedbacks sin responder:', error);
      return 0;
    }
  }

  /**
   * Marcar feedback como leído (solo para socios)
   */
  async markAsRead(id: string): Promise<void> {
    try {
      await feedbackApi.post(`/api/feedback/${id}/mark-read`);
    } catch (error) {
      console.error('Error al marcar como leído:', error);
      // No lanzamos error para no interrumpir el flujo
    }
  }

  /**
   * Marcar todos los feedbacks como vistos por el admin (solo para admin)
   */
  async markAllAsReadByAdmin(): Promise<void> {
    try {
      await feedbackApi.post('/api/feedback/mark-all-read-admin');
    } catch (error) {
      console.error('Error al marcar feedbacks como vistos:', error);
      // No lanzamos error para no interrumpir el flujo
    }
  }

  /**
   * Archivar/desarchivar un feedback (solo para admin)
   */
  async archiveFeedback(id: string, archived: boolean): Promise<Feedback> {
    try {
      const response = await feedbackApi.post<ApiResponse<Feedback>>(
        `/api/feedback/${id}/archive`,
        { archived }
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al archivar/desarchivar el feedback');
    } catch (error) {
      console.error('Error al archivar/desarchivar feedback:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Error al archivar/desarchivar el feedback');
      }
      throw error;
    }
  }

  /**
   * Obtener contador de archivados con mensajes nuevos (solo para admin)
   */
  async getArchivedUnreadCount(): Promise<number> {
    try {
      const response = await feedbackApi.get<ApiResponse<{ count: number }>>('/api/feedback/archived/unread/count');
      if (response.data.success && response.data.data) {
        return response.data.data.count;
      }
      return 0;
    } catch (error) {
      console.error('Error al obtener contador de archivados sin leer:', error);
      return 0;
    }
  }

  /**
   * Marcar archivados como leídos (solo para admin)
   */
  async markArchivedAsRead(): Promise<void> {
    try {
      await feedbackApi.post('/api/feedback/mark-archived-read');
    } catch (error) {
      console.error('Error al marcar archivados como leídos:', error);
      // No lanzamos error para no interrumpir el flujo
    }
  }
}

export default new FeedbackService();

