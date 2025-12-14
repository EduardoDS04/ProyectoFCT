import api from './api';
import type { User, ApiResponse, UserRole } from '../types';

class AdminService {
  /**
   * Obtener todos los usuarios
   */
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/api/admin/users');
    return response.data.data || [];
  }

  /**
   * Cambiar el rol de un usuario
   */
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    await api.put<ApiResponse>(`/api/admin/users/${userId}/role`, { role });
  }

  /**
   * Activar/desactivar usuario
   */
  async toggleUserActive(userId: string): Promise<void> {
    await api.put<ApiResponse>(`/api/admin/users/${userId}/toggle-active`);
  }

  /**
   * Eliminar usuario definitivamente
   */
  async deleteUser(userId: string): Promise<void> {
    await api.delete<ApiResponse>(`/api/admin/users/${userId}`);
  }
}

export default new AdminService();

