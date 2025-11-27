import { Pool, PoolConfig } from 'pg';
import { env } from './env';

// Se DATABASE_URL estiver definida, usa ela (padrão Railway/Render/Heroku)
// Senão, usa as variáveis individuais
const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: env.DB_POOL_SIZE,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      max: env.DB_POOL_SIZE,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

export const pool = new Pool(poolConfig);

// Evento de erro do pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Função para testar a conexão
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✓ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error);
    return false;
  }
};

// Função para fechar o pool
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Database pool has been closed');
};
