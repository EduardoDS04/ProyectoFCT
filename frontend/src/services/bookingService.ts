import api from './api';
import type {
  Booking,
  CreateBookingData,
  ApiResponse
} from '../types';

const CLASS_SERVICE_URL = import.meta.env.VITE_CLASS_SERVICE_URL;

if (!CLASS_SERVICE_URL) {
  console.error('Error: VITE_CLASS_SERVICE_URL no está definida en las variables de entorno');
  console.error('Por favor, configura VITE_CLASS_SERVICE_URL en tu archivo .env');
  throw new Error('VITE_CLASS_SERVICE_URL no está configurada. Por favor, configura las variables de entorno.');
}

class BookingService {
  /**
   * Crear una reserva
   */
  async createBooking(data: CreateBookingData): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>(
      `${CLASS_SERVICE_URL}/api/bookings`,
      data
    );
    return response.data.data!;
  }

  /**
   * Obtener mis reservas
   */
  async getMyBookings(status?: string): Promise<Booking[]> {
    const url = status
      ? `${CLASS_SERVICE_URL}/api/bookings/my-bookings?status=${status}`
      : `${CLASS_SERVICE_URL}/api/bookings/my-bookings`;

    const response = await api.get<ApiResponse<Booking[]>>(url);
    return response.data.data || [];
  }

  /**
   * Cancelar una reserva
   */
  async cancelBooking(id: string): Promise<Booking> {
    const response = await api.put<ApiResponse<Booking>>(
      `${CLASS_SERVICE_URL}/api/bookings/${id}/cancel`
    );
    return response.data.data!;
  }

  /**
   * Obtener reservas de una clase (Monitor/Admin)
   */
  async getClassBookings(classId: string, status?: string): Promise<Booking[]> {
    const url = status
      ? `${CLASS_SERVICE_URL}/api/bookings/class/${classId}?status=${status}`
      : `${CLASS_SERVICE_URL}/api/bookings/class/${classId}`;

    const response = await api.get<ApiResponse<Booking[]>>(url);
    return response.data.data || [];
  }
}

export default new BookingService();

