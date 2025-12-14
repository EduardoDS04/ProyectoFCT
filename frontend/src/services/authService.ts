import api from './api';
import type { 
  LoginData, 
  RegisterData, 
  AuthResponse, 
  ApiResponse, 
  User,
  UpdateProfileData,
  ChangePasswordData
} from '../types';

class AuthService {
  /**
   * Registro de nuevo usuario
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  }

  /**
   * Login de usuario
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  }

  /**
   * Obtener perfil de usuario
   */
  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/api/auth/profile');
    return response.data.data!;
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put<ApiResponse<User>>('/api/auth/profile', data);
    return response.data.data!;
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.put('/api/auth/change-password', data);
  }

  /**
   * Guardar token en localStorage
   */
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Obtener token de localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Eliminar token de localStorage
   */
  removeToken(): void {
    localStorage.removeItem('token');
  }

  /**
   * Guardar usuario en localStorage
   */
  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Obtener usuario de localStorage
   */
  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Eliminar usuario de localStorage
   */
  removeUser(): void {
    localStorage.removeItem('user');
  }

  /**
   * Logout - limpiar todo
   */
  logout(): void {
    this.removeToken();
    this.removeUser();
  }
}

export default new AuthService();

