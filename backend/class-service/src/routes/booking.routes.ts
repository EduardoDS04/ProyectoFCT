import { Router } from 'express';
import {
  createBooking,
  cancelBooking,
  getMyBookings,
  getClassBookings,
  getAllBookings
} from '../controllers/bookingController';
import {
  verifyToken,
  isAdmin,
  isMonitorOrAdmin
} from '../middleware/authMiddleware';

const router = Router();

/**
 * Rutas para usuarios autenticados
 */

// POST /api/bookings - Crear reserva
router.post('/', verifyToken, createBooking);

// GET /api/bookings/my-bookings - Mis reservas - Ruta específica primero
router.get('/my-bookings', verifyToken, getMyBookings);

// PUT /api/bookings/:id/cancel - Cancelar reserva
router.put('/:id/cancel', verifyToken, cancelBooking);

/**
 * Rutas para monitores y admins
 */

// GET /api/bookings/class/:classId - Reservas de una clase - Ruta específica con prefijo
router.get('/class/:classId', verifyToken, isMonitorOrAdmin, getClassBookings);

/**
 * Rutas solo para admins
 */

// GET /api/bookings - Todas las reservas - Ruta raíz al final para evitar conflictos
router.get('/', verifyToken, isAdmin, getAllBookings);

export default router;

