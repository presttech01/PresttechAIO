#!/usr/bin/env node
/**
 * Script para criar usuarios no Presttech Ops Console
 * 
 * Uso:
 *   node scripts/create-user.js
 * 
 * Ou com argumentos:
 *   node scripts/create-user.js admin@email.com "Nome Completo" senha123 HEAD
 */

const crypto = require('crypto');
const readline = require('readline');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  let username, name, password, role;

  if (process.argv.length >= 6) {
    [,, username, name, password, role] = process.argv;
  } else {
    console.log('\n=== Criador de Usuario - Presttech Ops Console ===\n');
    
    username = await prompt('Email/Username: ');
    name = await prompt('Nome completo: ');
    password = await prompt('Senha: ');
    role = await prompt('Perfil (SDR ou HEAD): ');
  }

  role = role.toUpperCase();
  if (!['SDR', 'HEAD'].includes(role)) {
    console.error('Erro: Perfil deve ser SDR ou HEAD');
    process.exit(1);
  }

  const hashedPassword = await hashPassword(password);

  console.log('\n=== SQL para inserir usuario ===\n');
  console.log(`INSERT INTO users (username, password, name, role)`);
  console.log(`VALUES ('${username}', '${hashedPassword}', '${name}', '${role}');`);
  console.log('\n=== Execute este comando no PostgreSQL ===\n');
  console.log(`psql -U presttech -d presttech_ops -c "INSERT INTO users (username, password, name, role) VALUES ('${username}', '${hashedPassword}', '${name}', '${role}');"`);
  console.log('\n');
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
