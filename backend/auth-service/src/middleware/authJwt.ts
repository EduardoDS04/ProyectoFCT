import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Error: JWT_SECRET no está definida en las variables de entorno');
  console.error('Por favor, configura JWT_SECRET en tu archivo .env');
  process.exit(1);
}

// Después de la validacion, JWT_SECRET no puede ser undefined
const jwtSecret: string = JWT_SECRET;

/**
 * Middleware para verificar el token JWT
 */
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false,
        message: 'No se proporcionó token de autenticación' 
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Agregar información del usuario al request
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Token inválido o expirado' 
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


