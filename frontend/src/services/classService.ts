import api from './api';
import type {
  Class,
  CreateClassData,
  UpdateClassData,
  ApiResponse
} from '../types';

const CLASS_SERVICE_URL = import.meta.env.VITE_CLASS_SERVICE_URL;

if (!CLASS_SERVICE_URL) {
  console.error('Error: VITE_CLASS_SERVICE_URL no está definida en las variables de entorno');
  console.error('Por favor, configura VITE_CLASS_SERVICE_URL en tu archivo .env');
  throw new Error('VITE_CLASS_SERVICE_URL no está configurada. Por favor, configura las variables de entorno.');
}

class ClassService {
  /**
   * Obtener todas las clases
   */
  async getAllClasses(filters?: {
    status?: string;
    monitorId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<Class[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.monitorId) params.append('monitorId', filters.monitorId);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);

    const queryString = params.toString();
    const url = `${CLASS_SERVICE_URL}/api/classes${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<ApiResponse<Class[]>>(url);
    return response.data.data || [];
  }

  /**
   * Obtener una clase por ID
   */
  async getClassById(id: string): Promise<Class> {
    const response = await api.get<ApiResponse<Class>>(
      `${CLASS_SERVICE_URL}/api/classes/${id}`
    );
    return response.data.data!;
  }

  /**
   * Obtener mis clases (como monitor)
   */
  async getMyClasses(): Promise<Class[]> {
    const response = await api.get<ApiResponse<Class[]>>(
      `${CLASS_SERVICE_URL}/api/classes/my-classes`
    );
    return response.data.data || [];
  }

  /**
   * Crear una clase
   */
  async createClass(data: CreateClassData): Promise<Class> {
    const response = await api.post<ApiResponse<Class>>(
      `${CLASS_SERVICE_URL}/api/classes`,
      data
    );
    return response.data.data!;
  }

  /**
   * Actualizar una clase
   */
  async updateClass(id: string, data: UpdateClassData): Promise<Class> {
    const response = await api.put<ApiResponse<Class>>(
      `${CLASS_SERVICE_URL}/api/classes/${id}`,
      data
    );
    return response.data.data!;
  }

  /**
   * Cancelar una clase
   */
  async cancelClass(id: string): Promise<Class> {
    const response = await api.put<ApiResponse<Class>>(
      `${CLASS_SERVICE_URL}/api/classes/${id}/cancel`
    );
    return response.data.data!;
  }

  /**
   * Eliminar una clase
   */
  async deleteClass(id: string): Promise<void> {
    await api.delete(`${CLASS_SERVICE_URL}/api/classes/${id}`);
  }
}

export default new ClassService();

