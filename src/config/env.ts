import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_POOL_SIZE: number;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // OpenAI
  OPENAI_API_KEY: string;

  // Server
  PORT: number;
  HOST: string;
  NODE_ENV: string;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

// Se DATABASE_URL existe (produção), variáveis individuais não são obrigatórias
const hasDatabaseUrl = !!process.env.DATABASE_URL;

export const env: EnvConfig = {
  // Database - opcionais se DATABASE_URL estiver definida
  DB_HOST: hasDatabaseUrl ? (process.env.DB_HOST || 'localhost') : getEnv('DB_HOST', 'localhost'),
  DB_PORT: getEnvNumber('DB_PORT', 5432),
  DB_USER: hasDatabaseUrl ? (process.env.DB_USER || 'postgres') : getEnv('DB_USER', 'postgres'),
  DB_PASSWORD: hasDatabaseUrl ? (process.env.DB_PASSWORD || '') : getEnv('DB_PASSWORD'),
  DB_NAME: hasDatabaseUrl ? (process.env.DB_NAME || 'estud_ai') : getEnv('DB_NAME', 'estud_ai'),
  DB_POOL_SIZE: getEnvNumber('DB_POOL_SIZE', 10),

  // JWT
  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),

  // OpenAI
  OPENAI_API_KEY: getEnv('OPENAI_API_KEY'),

  // Server
  PORT: getEnvNumber('PORT', 3000),
  HOST: getEnv('HOST', process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
};

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
