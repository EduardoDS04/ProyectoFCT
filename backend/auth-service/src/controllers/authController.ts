import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest, RegisterDTO, LoginDTO, AuthResponse, JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
  console.error('Error: JWT_SECRET no está definida en las variables de entorno');
  console.error('Por favor, configura JWT_SECRET en tu archivo .env');
  process.exit(1);
}

// JWT_SECRET no puede ser undefined
const jwtSecret: string = JWT_SECRET;

/**
 * Registro de nuevo usuario
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role, phone, birthDate }: RegisterDTO = req.body;

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo usuario
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: role || 'socio',
      phone,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      isActive: true
    });

    await newUser.save();

    // Generar token JWT
    const payload: JWTPayload = {
      id: String(newUser._id),
      email: newUser.email,
      role: newUser.role
    };

    // @ts-expect-error - Incompatibilidad conocida con tipos de jsonwebtoken
    const token = jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRES_IN });

    const response: AuthResponse = {
      token,
      user: {
        id: String(newUser._id),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: response
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
};

/**
 * Login de usuario
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginDTO = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios'
      });
      return;
    }

    // Buscar usuario
    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });

    if (!user) {
      console.log(`[LOGIN] Usuario no encontrado: ${emailLower}`);
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
      return;
    }

    console.log(`[LOGIN] Usuario encontrado: ${user.email}, Rol: ${user.role}, Activo: ${user.isActive}`);

    // Verificar si está activo
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Usuario desactivado. Contacta al administrador'
      });
      return;
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`[LOGIN] Contraseña incorrecta para usuario: ${user.email}`);
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
      return;
    }

    console.log(`[LOGIN] Login exitoso para usuario: ${user.email}`);

    // Generar token JWT
    const payload: JWTPayload = {
      id: String(user._id),
      email: user.email,
      role: user.role
    };

    // @ts-expect-error - Incompatibilidad conocida con tipos de jsonwebtoken
    const token = jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRES_IN });

    const response: AuthResponse = {
      token,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role
      }
    };

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: response
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
};

/**
 * Obtener perfil de usuario autenticado
 * GET /api/auth/profile
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
};

/**
 * Actualizar perfil de usuario
 * PUT /api/auth/profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, email, phone, birthDate } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    // Si se actualiza el email, verificar que no este en uso por otro usuario
    if (email) {
      const emailLower = email.toLowerCase().trim();
      const existingUser = await User.findOne({ 
        email: emailLower,
        _id: { $ne: userId }
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Este email ya esta en uso por otro usuario'
        });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone) updateData.phone = phone;
    if (birthDate) updateData.birthDate = new Date(birthDate);

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil'
    });
  }
};

/**
 * Cambiar contraseña
 * PUT /api/auth/change-password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva son obligatorias'
      });
      return;
    }

    // Validar que la contraseña actual no este vacia
    if (currentPassword.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'La contraseña actual no puede estar vacia'
      });
      return;
    }

    // Validar que la nueva contraseña sea diferente a la actual
    if (currentPassword.trim() === newPassword.trim()) {
      res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la contraseña actual'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Verificar contraseña actual
    if (!user.password) {
      res.status(400).json({
        success: false,
        message: 'Error: Usuario sin contraseña configurada'
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword.trim(), user.password);

    if (!isPasswordValid) {
      console.log(`[CHANGE_PASSWORD] Intento fallido de cambio de contraseña para usuario: ${user.email}`);
      res.status(401).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
      return;
    }

    console.log(`[CHANGE_PASSWORD] Contraseña actual verificada correctamente para usuario: ${user.email}`);

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
};

