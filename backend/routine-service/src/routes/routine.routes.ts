import { Router } from 'express';
import {
  getAllRoutines,
  getRoutineById,
  createRoutine,
  updateRoutine,
  deleteRoutine
} from '../controllers/routineController';
import { verifyToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// middlewares para rutas protegidas de admin
const adminMiddleware = [verifyToken, isAdmin];

// Rutas públicas (no requieren autenticación para ver)
router.get('/', getAllRoutines);
router.get('/:id', getRoutineById);

// Rutas protegidas (requieren autenticación y rol admin)
router.post('/', ...adminMiddleware, createRoutine);
router.put('/:id', ...adminMiddleware, updateRoutine);
router.delete('/:id', ...adminMiddleware, deleteRoutine);

export default router;
