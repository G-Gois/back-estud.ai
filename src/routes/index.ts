import { Router } from 'express';
import authRoutes from './auth.routes';
import conteudoRoutes from './conteudo.routes';
import questionarioRoutes from './questionario.routes';

const router = Router();

// Health check route
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'estud.ai API',
  });
});

// Register routes
router.use('/auth', authRoutes);
router.use('/conteudos', conteudoRoutes);
router.use('/questionarios', questionarioRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
  });
});

export default router;
