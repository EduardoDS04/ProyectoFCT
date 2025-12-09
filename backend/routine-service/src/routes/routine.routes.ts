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

// Rutas públicas (no requieren autenticación para ver)
router.get('/', getAllRoutines);
router.get('/:id', getRoutineById);

// Rutas protegidas (requieren autenticación y rol admin)
router.post('/', verifyToken, isAdmin, createRoutine);
router.put('/:id', verifyToken, isAdmin, updateRoutine);
router.delete('/:id', verifyToken, isAdmin, deleteRoutine);

export default router;

