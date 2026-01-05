#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');
(async () => {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const r = await pool.query("select to_regclass('public.proposals') as exists");
    console.log(r.rows);
    await pool.end();
  } catch (e) {
    console.error('ERROR', e && e.message);
    process.exit(1);
  }
})();
