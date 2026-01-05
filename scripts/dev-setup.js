#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');
const { Pool } = require('pg');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

function ensureEnv() {
  if (fs.existsSync(envPath)) return;

  const content = `DATABASE_URL=postgresql://presttech:presttech@localhost:5432/presttech_ops
SESSION_SECRET=dev_secret_change_me
CASA_API_KEY=
NODE_ENV=development
PORT=5000
DEV_ADMIN_USERNAME=admin@local
DEV_ADMIN_PASSWORD=admin123
DEV_ADMIN_NAME=Admin Local
`;
  fs.writeFileSync(envPath, content);
  console.log('.env file created with default dev values');
}

function commandExists(cmd) {
  const res = spawnSync(cmd, ['--version'], { shell: true });
  return res.status === 0;
}

async function waitForDb(connectionString, timeout = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const pool = new Pool({ connectionString, max: 1 });
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
      return true;
    } catch (err) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Timed out waiting for database');
}

async function main() {
  ensureEnv();

  if (!commandExists('docker')) {
    console.error('Docker not found in PATH. Please install Docker and try again.');
    process.exit(1);
  }

  console.log('Bringing up postgres via docker-compose...');
  const up = spawnSync('docker-compose', ['up', '-d'], { cwd: root, stdio: 'inherit', shell: true });
  if (up.status !== 0) process.exit(up.status);

  const env = Object.assign({}, process.env, parseEnvFile(envPath));
  const connectionString = env.DATABASE_URL;

  console.log('Waiting for database to become available...');
  await waitForDb(connectionString);
  console.log('Database is up - applying schema (npm run db:push)...');

  const push = spawnSync('npm', ['run', 'db:push'], { cwd: root, stdio: 'inherit', shell: true });
  if (push.status !== 0) process.exit(push.status);

  console.log('Creating default user if none exist...');
  const createUser = spawnSync('node', ['scripts/create-default-user.js'], { cwd: root, stdio: 'inherit', shell: true, env });
  if (createUser.status !== 0) process.exit(createUser.status);

  console.log('Starting dev server (npm run dev:local)...');
  const dev = spawn('npm', ['run', 'dev:local'], { cwd: root, stdio: 'inherit', shell: true, env });

  dev.on('close', (code) => {
    process.exit(code);
  });
}

function parseEnvFile(p) {
  const raw = fs.readFileSync(p, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const out = {};
  for (const l of lines) {
    const m = l.match(/^([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});