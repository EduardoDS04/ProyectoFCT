import { Router } from 'express';
import { verifyToken } from '../middleware/authJwt';
import { getMyQR, validateQR } from '../controllers/qrController';

const router = Router();

// Ruta para obtener el QR del usuario autenticado
router.get('/me', verifyToken, getMyQR);

// Ruta para validar un QR escaneado (para uso futuro)
router.post('/validate', verifyToken, validateQR);

export default router;

