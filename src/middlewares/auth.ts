import { Request, NextFunction } from 'express';
import { verifyToken, UnauthorizedError } from '../utils';

/**
 * Authentication middleware using JWT
 * Verifies the Bearer token in the Authorization header
 */
export const authenticate = (
  req: Request,
  _res: unknown,
  next: NextFunction
): void => {
  // Skip authentication for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de autenticação não fornecido');
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      throw new UnauthorizedError('Token de autenticação não fornecido');
    }

    // Verify and decode token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Token inválido ou expirado'));
    }
  }
};

/**
 * Optional authentication middleware
 * Verifies token if present, but doesn't fail if not
 */
export const optionalAuthenticate = (
  req: Request,
  _res: unknown,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (token) {
        const decoded = verifyToken(token);
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};
