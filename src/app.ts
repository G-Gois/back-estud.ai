import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, requestLogger } from './middlewares';
import routes from './routes';
import { isDevelopment } from './config';

/**
 * Create and configure Express application
 */
export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: isDevelopment ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // API routes
  app.use('/api', routes);

  // Root route
  app.get('/', (_req, res) => {
    res.json({
      message: 'Estud.ai API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    });
  });

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
};
