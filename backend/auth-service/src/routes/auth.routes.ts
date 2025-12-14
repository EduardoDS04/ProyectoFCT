import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/authController';
import {
  checkDuplicateEmail,
  validateRequiredFields
} from '../middleware/verifySignUp';
import { verifyToken } from '../middleware/authJwt';

const router = Router();

/**
 * Rutas públicas
 */

// POST /api/auth/register - Registro de usuario
router.post(
  '/register',
  [validateRequiredFields, checkDuplicateEmail],
  register
);

// POST /api/auth/login - Login de usuario
router.post('/login', login);

/**
 * Rutas protegidas (requieren autenticación)
 */

// GET /api/auth/profile - Obtener perfil
router.get('/profile', verifyToken, getProfile);

// PUT /api/auth/profile - Actualizar perfil
router.put('/profile', verifyToken, updateProfile);

// PUT /api/auth/change-password - Cambiar contraseña
router.put('/change-password', verifyToken, changePassword);

export default router;

