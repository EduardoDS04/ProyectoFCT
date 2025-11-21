import { createContext, useState, useEffect, type ReactNode } from 'react';
import authService from '../services/authService';
import { getErrorMessage } from '../utils/errorHandler';
import type { AuthContextType, User, LoginData, RegisterData } from '../types';

// Contexto de autenticacion que proporciona el estado del usuario y funciones de autenticacion
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
interface AuthProviderProps {
  children: ReactNode;
}

// Componente proveedor que envuelve la aplicacion y gestiona el estado de autenticacion
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Estado del usuario autenticado
  const [user, setUser] = useState<User | null>(null);
  // Token JWT del usuario autenticado
  const [token, setToken] = useState<string | null>(null);
  // Estado de carga inicial para verificar si hay una sesion guardada
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario y token al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedToken = authService.getToken();
        const savedUser = authService.getUser();

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
          
          // Verificar que el token siga siendo válido
          try {
            const profile = await authService.getProfile();
            setUser(profile);
          } catch {
            // Token inválido
            authService.logout();
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Funcion para iniciar sesion con email y contraseña
  const login = async (data: LoginData) => {
    try {
      const response = await authService.login(data);
      
      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;
        
        // Guardar token y usuario en localStorage para persistir la sesion
        authService.setToken(newToken);
        authService.setUser(userData);
        
        // Actualizar el estado del contexto
        setToken(newToken);
        setUser(userData as User);
      } else {
        throw new Error(response.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Error al iniciar sesión'));
    }
  };

  // Funcion para registrar un nuevo usuario
  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      
      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;
        
        // Guardar token y usuario en localStorage
        authService.setToken(newToken);
        authService.setUser(userData);
        
        // Actualizar el estado del contexto
        setToken(newToken);
        setUser(userData as User);
      } else {
        throw new Error(response.message || 'Error al registrar usuario');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Error al registrar usuario'));
    }
  };

  // Funcion para cerrar sesion y limpiar el estado
  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  // Funcion para actualizar los datos del usuario en el contexto y localStorage
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    authService.setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

