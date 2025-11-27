import jwt from 'jsonwebtoken';
import { env } from '../config';
import { JWTPayload } from '../types';

/**
 * Generate a JWT token for a user
 */
export const generateToken = (payload: JWTPayload): string => {
  // Cast to any to avoid type issues with jsonwebtoken
  return jwt.sign(
    payload as any,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decode a JWT token without verifying it
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
