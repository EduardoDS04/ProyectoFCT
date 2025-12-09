import { Router } from 'express';
import { createFeedback, getAllFeedbacks, getFeedbackById, getMyFeedbacks, respondToFeedback, getUnreadNotificationsCount, getUnansweredFeedbacksCount, markAsRead, markAllAsReadByAdmin, archiveFeedback, getArchivedUnreadCount, markArchivedAsRead } from '../controllers/feedbackController';
import { verifyToken, isSocio, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// El orden de las rutas es crítico en Express
// Las rutas específicas deben ir antes que las rutas con parámetros
// Las rutas con múltiples segmentos deben ir antes que las rutas con un solo parámetro

// Rutas POST - La ruta con múltiples segmentos
router.post('/:id/respond', verifyToken, respondToFeedback);
router.post('/:id/mark-read', verifyToken, markAsRead);
router.post('/:id/archive', verifyToken, isAdmin, archiveFeedback);
router.post('/', verifyToken, isSocio, createFeedback);

// Rutas GET específicas (antes de las genéricas)
router.get('/my-feedbacks', verifyToken, isSocio, getMyFeedbacks);
router.get('/notifications/count', verifyToken, isSocio, getUnreadNotificationsCount);
router.get('/unanswered/count', verifyToken, isAdmin, getUnansweredFeedbacksCount);
router.get('/archived/unread/count', verifyToken, isAdmin, getArchivedUnreadCount);
router.post('/mark-all-read-admin', verifyToken, isAdmin, markAllAsReadByAdmin);
router.post('/mark-archived-read', verifyToken, isAdmin, markArchivedAsRead);
router.get('/', verifyToken, isAdmin, getAllFeedbacks);

// Rutas GET genéricas (al final)
router.get('/:id', verifyToken, isAdmin, getFeedbackById);

export default router;

