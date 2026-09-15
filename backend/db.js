/**
 * PostgreSQL pool — one shared connection set for all routes.
 * Credentials come from .env (see .env.example). Never hard-code passwords.
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL error', error);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
