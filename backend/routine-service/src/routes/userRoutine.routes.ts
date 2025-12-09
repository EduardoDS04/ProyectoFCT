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

// Todas las rutas requieren autenticación y ser socio
router.get('/me', verifyToken, isSocio, getMyRoutine);
router.post('/me', verifyToken, isSocio, createOrUpdateMyRoutine);
router.post('/me/exercises', verifyToken, isSocio, addExerciseToMyRoutine);
router.put('/me/exercises/:exerciseIndex', verifyToken, isSocio, updateExerciseInMyRoutine);
router.post('/me/exercises/reorder', verifyToken, isSocio, reorderExercisesInMyRoutine);
router.delete('/me/exercises/:exerciseIndex', verifyToken, isSocio, removeExerciseFromMyRoutine);
router.delete('/me', verifyToken, isSocio, deleteMyRoutine);

export default router;

