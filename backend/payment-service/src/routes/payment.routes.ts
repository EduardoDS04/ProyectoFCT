import { Router } from 'express';
import {
  getMySubscriptions,
  getSubscriptionById,
  createSubscription,
  cancelSubscription,
  getAllSubscriptions
} from '../controllers/paymentController';
import { verifyToken, isSocio, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Rutas para socios
router.get('/my-subscriptions', verifyToken, isSocio, getMySubscriptions);
router.get('/my-subscriptions/:id', verifyToken, isSocio, getSubscriptionById);
router.post('/subscribe', verifyToken, isSocio, createSubscription);
router.put('/cancel/:id', verifyToken, isSocio, cancelSubscription);

// Rutas para admin
router.get('/all', verifyToken, isAdmin, getAllSubscriptions);

export default router;

