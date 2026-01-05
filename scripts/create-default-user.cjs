#!/usr/bin/env node
const { Pool } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT COUNT(*) FROM users');
    const count = parseInt(res.rows[0].count, 10);
    if (count > 0) {
      console.log('Users already exist, skipping default user creation');
      return;
    }

    const username = process.env.DEV_ADMIN_USERNAME || 'admin@local';
    const name = process.env.DEV_ADMIN_NAME || 'Admin Local';
    const password = process.env.DEV_ADMIN_PASSWORD || 'admin123';
    const role = 'HEAD';

    const hashed = await hashPassword(password);

    await client.query(
      'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)',
      [username, hashed, name, role],
    );

    console.log(`Inserted default user ${username} with password '${password}'.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Failed to create default user:', err);
  process.exit(1);
});