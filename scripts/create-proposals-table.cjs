#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const sql = `CREATE TABLE IF NOT EXISTS proposals (
      id serial PRIMARY KEY,
      lead_id integer NOT NULL,
      plan text NOT NULL,
      status text NOT NULL DEFAULT 'DRAFT',
      value integer NOT NULL DEFAULT 0,
      public_token text NOT NULL UNIQUE,
      created_at timestamp DEFAULT now()
    );`;
    await pool.query(sql);
    console.log('Ensured proposals table exists');
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
