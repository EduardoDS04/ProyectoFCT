import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthRequest, UserRole } from '../types';

/**
 * Obtener todos los usuarios
 * GET /api/admin/users
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
};

/**
 * Promover usuario a un rol específico
 * PUT /api/admin/users/:id/role
 */
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validar que el rol sea válido
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: `Rol inválido. Roles permitidos: ${Object.values(UserRole).join(', ')}`
      });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Actualizar rol
    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Usuario promovido a ${role} correctamente`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol del usuario'
    });
  }
};

/**
 * Activar/Desactivar usuario
 * PUT /api/admin/users/:id/toggle-active
 */
export const toggleUserActive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // No permitir desactivar al propio admin
    if (String(user._id) === req.userId) {
      res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
      return;
    }

    // Toggle estado
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} correctamente`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario'
    });
  }
};

/**
 * Crear usuario admin directamente
 * POST /api/admin/users/create-admin
 */
export const createAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone } = req.body;

    // Validar campos requeridos
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Email, contraseña y nombre son obligatorios'
      });
      return;
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
      return;
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo admin
    const newAdmin = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: UserRole.ADMIN,
      phone,
      isActive: true
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Administrador creado exitosamente',
      data: {
        id: String(newAdmin._id),
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error('Error al crear admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear administrador'
    });
  }
};

/**
 * Eliminar usuario
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // No permitir eliminar al propio admin
    if (String(user._id) === req.userId) {
      res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
      return;
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario'
    });
  }
};

/**
 * Obtener estadísticas de usuarios
 * GET /api/admin/stats
 */
export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    const socios = await User.countDocuments({ role: UserRole.SOCIO });
    const monitores = await User.countDocuments({ role: UserRole.MONITOR });
    const admins = await User.countDocuments({ role: UserRole.ADMIN });

    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: {
          socios,
          monitores,
          admins
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

