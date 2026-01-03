# Guia de Deployment - Presttech Ops Console

Este guia explica como hospedar o Presttech Ops Console fora do Replit, seja em um servidor VPS (como Hostinger) ou em localhost.

## Requisitos do Sistema

- **Node.js**: versao 20 ou superior
- **PostgreSQL**: versao 14 ou superior
- **npm**: versao 9 ou superior

## Passo 1: Preparar os Arquivos

### 1.1 Baixar o Projeto

No Replit, clique nos tres pontos ao lado do nome do projeto e selecione "Download as zip".

Ou, se estiver usando Git:
```bash
git clone <url-do-repositorio>
cd presttech-ops-console
```

### 1.2 Instalar Dependencias

```bash
npm install
```

### 1.3 Remover Dependencias do Replit (Opcional)

Para evitar avisos, remova as dependencias especificas do Replit do package.json:

```bash
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-dev-banner @replit/vite-plugin-runtime-error-modal
```

**Nota**: Essas dependencias sao opcionais e so sao carregadas quando o projeto esta rodando no Replit. Fora do Replit, elas sao ignoradas automaticamente.

## Passo 2: Configurar o Banco de Dados PostgreSQL

### 2.1 Criar o Banco de Dados

#### Localhost (Windows/Mac/Linux):
```bash
# Instalar PostgreSQL se nao tiver
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt install postgresql

# Acessar o PostgreSQL
psql -U postgres

# Criar o banco
CREATE DATABASE presttech_ops;
CREATE USER presttech WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE presttech_ops TO presttech;
\c presttech_ops
GRANT ALL ON SCHEMA public TO presttech;
\q
```

#### Hostinger VPS:
```bash
# Acessar via SSH
ssh root@seu-ip-hostinger

# Instalar PostgreSQL
apt update
apt install postgresql postgresql-contrib

# Configurar banco
sudo -u postgres psql
CREATE DATABASE presttech_ops;
CREATE USER presttech WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE presttech_ops TO presttech;
\c presttech_ops
GRANT ALL ON SCHEMA public TO presttech;
\q
```

### 2.2 Configurar Variaveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Banco de dados
DATABASE_URL=postgresql://presttech:sua_senha_segura@localhost:5432/presttech_ops

# Seguranca
SESSION_SECRET=sua_chave_secreta_muito_longa_e_aleatoria

# API Casa dos Dados (opcional - para geracao de leads)
CASA_API_KEY=sua_chave_api_casa_dos_dados

# Porta do servidor (padrao: 5000)
PORT=5000

# Ambiente
NODE_ENV=production
```

## Passo 3: Build do Projeto

```bash
# Compilar frontend e backend
npm run build
```

Isso vai criar:
- `dist/public/` - Frontend compilado (React)
- `dist/index.cjs` - Backend compilado (Node.js)

## Passo 4: Inicializar o Banco de Dados

```bash
# Criar as tabelas
npm run db:push
```

## Passo 5: Iniciar o Servidor

### Localhost:
```bash
npm start
```

O sistema estara disponivel em: `http://localhost:5000`

### Hostinger VPS com PM2 (Recomendado):

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar a aplicacao
pm2 start dist/index.cjs --name "presttech-ops"

# Configurar para iniciar automaticamente apos reboot
pm2 startup
pm2 save

# Ver logs
pm2 logs presttech-ops

# Reiniciar
pm2 restart presttech-ops
```

## Passo 6: Configurar HTTPS (Hostinger VPS)

### 6.1 Instalar Nginx

```bash
apt install nginx
```

### 6.2 Configurar Nginx como Proxy Reverso

Crie o arquivo `/etc/nginx/sites-available/presttech`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar o site:
```bash
ln -s /etc/nginx/sites-available/presttech /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 6.3 Instalar Certificado SSL (Let's Encrypt)

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d seu-dominio.com.br
```

## Passo 7: Criar Usuario Administrador

Apos iniciar o sistema, acesse o banco de dados para criar o primeiro usuario:

```bash
psql -U presttech -d presttech_ops
```

```sql
-- Criar usuario HEAD (administrador)
INSERT INTO users (username, password, name, role) 
VALUES (
  'admin@presttech.local',
  -- Senha: admin123 (hash scrypt)
  '9a7f55f38d1c79e6db4e285e6a4c1c0b8b8b7c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0.abcdef123456',
  'Administrador',
  'HEAD'
);
```

**IMPORTANTE**: A senha acima e apenas um exemplo. Para gerar uma senha real, use o seguinte script Node.js:

```javascript
// criar-usuario.js
const crypto = require('crypto');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, buf) => {
      if (err) reject(err);
      resolve(buf.toString('hex'));
    });
  });
  return `${hash}.${salt}`;
}

hashPassword('sua_senha_aqui').then(hash => {
  console.log('Hash da senha:', hash);
  console.log('\nSQL para inserir usuario:');
  console.log(`INSERT INTO users (username, password, name, role) VALUES ('admin@presttech.local', '${hash}', 'Administrador', 'HEAD');`);
});
```

Execute:
```bash
node criar-usuario.js
```

## Estrutura de Diretorios Final

```
presttech-ops-console/
├── dist/
│   ├── index.cjs          # Backend compilado
│   └── public/             # Frontend compilado
│       ├── index.html
│       └── assets/
├── .env                    # Variaveis de ambiente
├── package.json
└── node_modules/
```

## Comandos Uteis

| Comando | Descricao |
|---------|-----------|
| `npm run build` | Compilar projeto para producao |
| `npm start` | Iniciar servidor de producao |
| `npm run dev` | Iniciar servidor de desenvolvimento |
| `npm run db:push` | Sincronizar schema do banco |

## Solucao de Problemas

### Erro: "Cannot find module"
```bash
npm install
npm run build
```

### Erro de conexao com banco de dados
- Verifique se o PostgreSQL esta rodando: `systemctl status postgresql`
- Verifique a DATABASE_URL no arquivo .env
- Teste a conexao: `psql -U presttech -d presttech_ops`

### Porta 5000 em uso
Altere a porta no arquivo .env:
```bash
PORT=3000
```

### Erro de permissao no Linux
```bash
sudo chown -R $USER:$USER .
```

## Backup do Banco de Dados

### Criar backup:
```bash
pg_dump -U presttech presttech_ops > backup_$(date +%Y%m%d).sql
```

### Restaurar backup:
```bash
psql -U presttech presttech_ops < backup_20240101.sql
```

## Atualizacoes

Para atualizar o sistema:

```bash
# Baixar novas alteracoes (se usando Git)
git pull

# Reinstalar dependencias
npm install

# Recompilar
npm run build

# Atualizar banco de dados
npm run db:push

# Reiniciar servidor
pm2 restart presttech-ops
```

## Suporte

Para duvidas ou problemas, verifique:
1. Os logs do PM2: `pm2 logs presttech-ops`
2. Os logs do Nginx: `tail -f /var/log/nginx/error.log`
3. Os logs do PostgreSQL: `tail -f /var/log/postgresql/postgresql-14-main.log`
