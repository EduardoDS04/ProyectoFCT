import { Router } from 'express';
import {
  getMyRoutine,
  createOrUpdateMyRoutine,
  addExerciseToMyRoutine,
  updateExerciseInMyRoutine,
  removeExerciseFromMyRoutine,
  reorderExercisesInMyRoutine,
  deleteMyRoutine
} from '../controllers/userRoutineController';
import { verifyToken, isSocio } from '../middleware/authMiddleware';

const router = Router();

// middlewares para todas las rutas (requieren autenticación y ser socio)
const socioMiddleware = [verifyToken, isSocio];

// Todas las rutas requieren autenticación y ser socio
router.get('/me', ...socioMiddleware, getMyRoutine);
router.post('/me', ...socioMiddleware, createOrUpdateMyRoutine);
router.post('/me/exercises', ...socioMiddleware, addExerciseToMyRoutine);
router.put('/me/exercises/:exerciseIndex', ...socioMiddleware, updateExerciseInMyRoutine);
router.post('/me/exercises/reorder', ...socioMiddleware, reorderExercisesInMyRoutine);
router.delete('/me/exercises/:exerciseIndex', ...socioMiddleware, removeExerciseFromMyRoutine);
router.delete('/me', ...socioMiddleware, deleteMyRoutine);

export default router;
