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

// Rutas públicas (no requieren autenticación para ver)
router.get('/', getAllExercises);
router.get('/:id', getExerciseById);

// Rutas protegidas (requieren autenticación y rol admin)
router.post('/', verifyToken, isAdmin, createExercise);
router.put('/:id', verifyToken, isAdmin, updateExercise);
router.delete('/:id', verifyToken, isAdmin, deleteExercise);

export default router;

