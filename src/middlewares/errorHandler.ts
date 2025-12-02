import { Request, Response, NextFunction } from 'express';
import { logger, AppError, isDevelopment } from '../utils';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error:', err);

  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';

  // Check if it's an AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.message) {
    message = err.message;
  }

  // Build response
  const response: any = {
    timestamp: new Date().toISOString(),
    message,
    path: req.originalUrl,
    method: req.method,
  };

  // Include stack trace in development
  if (isDevelopment) {
    response.stack = err.stack;
    response.error = err;
  }

  // Send response
  res.status(statusCode).json(response);
};
