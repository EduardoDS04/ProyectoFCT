import { Router } from 'express';
import { createFeedback, getAllFeedbacks, getFeedbackById } from '../controllers/feedbackController';
import { verifyToken, isSocio, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Ruta para crear un feedback (solo socios)
router.post('/', verifyToken, isSocio, createFeedback);

// Ruta para obtener todos los feedbacks (solo admin)
router.get('/', verifyToken, isAdmin, getAllFeedbacks);

// Ruta para obtener un feedback por ID (solo admin)
router.get('/:id', verifyToken, isAdmin, getFeedbackById);

export default router;

