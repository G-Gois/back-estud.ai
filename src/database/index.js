const { Pool } = require('pg');
const { logger } = require('../utils');


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  max: Number(process.env.DB_POOL_SIZE) || 10,
});

pool.on('error', (err) => {
  logger.error('Postgres pool error', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};
