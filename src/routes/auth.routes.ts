import { Router } from 'express';
import { AuthController } from '../controllers';
import { authenticate } from '../middlewares';

const router = Router();
const authController = new AuthController();

/**
 * Public routes (no authentication required)
 */

// Register a new user
// POST /api/auth/register
// Body: { nome_completo, email, senha, data_nascimento }
router.post('/register', authController.register);

// Login user
// POST /api/auth/login
// Body: { email, senha }
router.post('/login', authController.login);

/**
 * Protected routes (authentication required)
 */

// Get current user profile
// GET /api/auth/me
// Headers: { Authorization: "Bearer <token>" }
router.get('/me', authenticate, authController.getProfile);

// Update user profile
// PUT /api/auth/me
// Headers: { Authorization: "Bearer <token>" }
// Body: { nome_completo?, email?, senha?, data_nascimento? }
router.put('/me', authenticate, authController.updateProfile);

// Delete user account (soft delete)
// DELETE /api/auth/me
// Headers: { Authorization: "Bearer <token>" }
router.delete('/me', authenticate, authController.deleteAccount);

export default router;
