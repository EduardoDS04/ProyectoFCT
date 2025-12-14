import api from './api';
import type {
  Subscription,
  CreateSubscriptionData,
  ApiResponse
} from '../types';

const PAYMENT_SERVICE_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:3003';

class PaymentService {
  // Obtener todas las suscripciones del usuario actual
  async getMySubscriptions(): Promise<Subscription[]> {
    const response = await api.get<ApiResponse<Subscription[]>>(
      `${PAYMENT_SERVICE_URL}/api/payments/my-subscriptions`
    );
    return response.data.data || [];
  }

  // Obtener una suscripción específica por su ID
  async getSubscriptionById(id: string): Promise<Subscription> {
    const response = await api.get<ApiResponse<Subscription>>(
      `${PAYMENT_SERVICE_URL}/api/payments/my-subscriptions/${id}`
    );
    return response.data.data!;
  }

  // Crear una nueva suscripción para el usuario actual
  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    const response = await api.post<ApiResponse<Subscription>>(
      `${PAYMENT_SERVICE_URL}/api/payments/subscribe`,
      data
    );
    return response.data.data!;
  }

  // Verificar si el usuario tiene una suscripción activa
  async checkActiveSubscription(): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse<{ hasActiveSubscription: boolean }>>(
        `${PAYMENT_SERVICE_URL}/api/payments/me/active`
      );
      return response.data.data?.hasActiveSubscription || false;
    } catch (error) {
      console.warn('Error al verificar suscripción activa:', error);
      return false;
    }
  }

  // cancelar una suscripción existente
  async cancelSubscription(id: string): Promise<Subscription> {
    const response = await api.put<ApiResponse<Subscription>>(
      `${PAYMENT_SERVICE_URL}/api/payments/cancel/${id}`
    );
    return response.data.data!;
  }
}

export default new PaymentService();
