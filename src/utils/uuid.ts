import { uuidv7 } from 'uuidv7';

/**
 * Generate a UUIDv7 (time-ordered UUID)
 */
export const generateUUID = (): string => {
  return uuidv7();
};
