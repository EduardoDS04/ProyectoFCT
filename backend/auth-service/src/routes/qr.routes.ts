import { Router } from 'express';
import { verifyToken } from '../middleware/authJwt';
import { getMyQR } from '../controllers/qrController';

const router = Router();

// Ruta para obtener el QR del usuario autenticado
router.get('/me', verifyToken, getMyQR);

export default router;

