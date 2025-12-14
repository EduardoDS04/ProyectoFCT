import { Router } from 'express';
import {
  getAllExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise
} from '../controllers/exerciseController';
import { verifyToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// middlewares para rutas protegidas de admin
const adminMiddleware = [verifyToken, isAdmin];

// Rutas públicas (no requieren autenticación para ver)
router.get('/', getAllExercises);
router.get('/:id', getExerciseById);

// Rutas protegidas (requieren autenticación y rol admin)
router.post('/', ...adminMiddleware, createExercise);
router.put('/:id', ...adminMiddleware, updateExercise);
router.delete('/:id', ...adminMiddleware, deleteExercise);

export default router;
