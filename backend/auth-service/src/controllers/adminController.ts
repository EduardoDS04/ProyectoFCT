import { Response } from 'express';
import axios from 'axios';
import User from '../models/User';
import { AuthRequest, UserRole } from '../types';

const CLASS_SERVICE_URL = process.env.CLASS_SERVICE_URL || 'http://localhost:3002';

/**
 * Obtener todos los usuarios
 * GET /api/admin/users
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Mapear usuarios para incluir id además de _id
    const mappedUsers = users.map(user => ({
      ...user.toObject(),
      id: String(user._id),
      _id: String(user._id)
    }));

    res.status(200).json({
      success: true,
      data: mappedUsers,
      count: mappedUsers.length
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

    // Validar que el ID existe
    if (!id || id === 'undefined') {
      res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
      return;
    }

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

    // no permitir que un admin cambie su propio rol
    if (String(user._id) === req.userId) {
      res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol'
      });
      return;
    }

    // verificar si el usuario tiene reservas antes de cambiar el rol
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const bookingsResponse = await axios.get(
        `${CLASS_SERVICE_URL}/api/bookings?userId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (bookingsResponse.data.success && bookingsResponse.data.data) {
        const bookings = bookingsResponse.data.data;
        if (bookings.length > 0) {
          res.status(400).json({
            success: false,
            message: 'No se puede cambiar el rol de un usuario que tiene reservas de clases. Por favor, cancela o completa todas sus reservas primero.'
          });
          return;
        }
      }
    } catch (error: any) {
      // Si el servicio de clases no está disponible o hay un error, permitir el cambio
      // Continuar con el cambio de rol
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

    // No permitir desactivar administradores (solo monitores y socios)
    if (user.role === UserRole.ADMIN) {
      res.status(400).json({
        success: false,
        message: 'No se pueden desactivar administradores'
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


