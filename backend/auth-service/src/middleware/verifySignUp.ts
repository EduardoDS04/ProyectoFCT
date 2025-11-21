import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { UserRole } from '../types';

/**
 * Middleware para validar datos de registro
 */
export const checkDuplicateEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      res.status(400).json({ 
        success: false,
        message: 'El email ya está registrado' 
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error al verificar email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error de conexión con la base de datos. Verifica que MongoDB esté corriendo.' 
    });
  }
};

/**
 * Middleware para validar el rol
 */
export const checkRoleExists = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { role } = req.body;

  if (role && !Object.values(UserRole).includes(role)) {
    res.status(400).json({ 
      success: false,
      message: `Rol inválido. Roles permitidos: ${Object.values(UserRole).join(', ')}` 
    });
    return;
  }

  next();
};

/**
 * Middleware para validar campos requeridos
 */
export const validateRequiredFields = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ 
      success: false,
      message: 'Email, contraseña y nombre son obligatorios' 
    });
    return;
  }

  // Validar longitud de contraseña
  if (password.length < 6) {
    res.status(400).json({ 
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres' 
    });
    return;
  }

  // Validar formato de email
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ 
      success: false,
      message: 'Por favor ingresa un email válido' 
    });
    return;
  }

  next();
};

