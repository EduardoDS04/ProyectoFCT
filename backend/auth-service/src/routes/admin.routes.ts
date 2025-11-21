import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  toggleUserActive,
  createAdmin,
  deleteUser,
  getUserStats
} from '../controllers/adminController';
import { verifyToken, isAdmin } from '../middleware/authJwt';

const router = Router();

/**
 * Todas las rutas
 */

// GET /api/admin/stats - Estadisticas de usuarios
router.get('/stats', verifyToken, isAdmin, getUserStats);

// GET /api/admin/users - Listar todos los usuarios
router.get('/users', verifyToken, isAdmin, getAllUsers);

// POST /api/admin/users/create-admin - Crear nuevo administrador
router.post('/users/create-admin', verifyToken, isAdmin, createAdmin);

// PUT /api/admin/users/:id/role - Cambiar rol de usuario
router.put('/users/:id/role', verifyToken, isAdmin, updateUserRole);

// PUT /api/admin/users/:id/toggle-active - Activar/desactivar usuario
router.put('/users/:id/toggle-active', verifyToken, isAdmin, toggleUserActive);

// DELETE /api/admin/users/:id - Eliminar usuario
router.delete('/users/:id', verifyToken, isAdmin, deleteUser);

export default router;

