import { Response, NextFunction } from 'express';
import axios from 'axios';
import { AuthRequest, UserRole, AuthServiceUserResponse } from '../types';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

if (!AUTH_SERVICE_URL) {
  console.error('Error: AUTH_SERVICE_URL no está definida en las variables de entorno');
  console.error('Por favor, configura AUTH_SERVICE_URL en tu archivo .env');
  process.exit(1);
}

/**
 * Middleware para verificar el token JWT con el Auth Service
 */
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
      return;
    }

    // Llamar al Auth Service para verificar el token y obtener datos del usuario
    const response = await axios.get<AuthServiceUserResponse>(
      `${AUTH_SERVICE_URL}/api/auth/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.data.success || !response.data.data) {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
      return;
    }

    // Agregar informacion del usuario al request
    const user = response.data.data;
    req.userId = user._id;
    req.userRole = user.role;
    req.userEmail = user.email;
    req.userName = user.name;

    next();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        res.status(401).json({
          success: false,
          message: 'Token inválido o expirado'
        });
        return;
      }
    }

    console.error('Error al verificar token:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación'
    });
  }
};

/**
 * Middleware para verificar si el usuario es Admin
 */
export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Requiere permisos de administrador'
    });
    return;
  }
  next();
};

/**
 * Middleware para verificar si el usuario es Monitor o Admin
 */
export const isMonitorOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== UserRole.MONITOR && req.userRole !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Requiere permisos de monitor o administrador'
    });
    return;
  }
  next();
};