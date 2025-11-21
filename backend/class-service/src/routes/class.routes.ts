import { Router } from 'express';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  cancelClass,
  deleteClass,
  getMyClasses
} from '../controllers/classController';
import {
  verifyToken,
  isAdmin,
  isMonitorOrAdmin
} from '../middleware/authMiddleware';

const router = Router();

/**
 * Rutas públicas (requieren autenticación)
 */

// GET /api/classes - Listar todas las clases
router.get('/', verifyToken, getAllClasses);

// GET /api/classes/my-classes - Mis clases (como monitor)
router.get('/my-classes', verifyToken, isMonitorOrAdmin, getMyClasses);

// GET /api/classes/:id - Obtener una clase
router.get('/:id', verifyToken, getClassById);

/**
 * Rutas protegidas (Monitor o Admin)
 */

// POST /api/classes - Crear clase
router.post('/', verifyToken, isMonitorOrAdmin, createClass);

// PUT /api/classes/:id - Actualizar clase
router.put('/:id', verifyToken, isMonitorOrAdmin, updateClass);

// PUT /api/classes/:id/cancel - Cancelar clase
router.put('/:id/cancel', verifyToken, isMonitorOrAdmin, cancelClass);

/**
 * Rutas solo Admin
 */

// DELETE /api/classes/:id - Eliminar clase
router.delete('/:id', verifyToken, isAdmin, deleteClass);

export default router;

