import api from './api';
import type { User, ApiResponse } from '../types';

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    socios: number;
    monitores: number;
    admins: number;
  };
}

class AdminService {
  /**
   * Obtener todos los usuarios
   */
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/api/admin/users');
    return response.data.data || [];
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getStats(): Promise<UserStats> {
    const response = await api.get<ApiResponse<UserStats>>('/api/admin/stats');
    return response.data.data!;
  }
}

export default new AdminService();

