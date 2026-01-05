# Guia de Instalacao - Presttech Ops Console

Este documento contem instrucoes detalhadas para instalar e configurar o Presttech Ops Console em diferentes ambientes.

## Sumario

1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Instalacao em Localhost](#instalacao-em-localhost)
3. [Instalacao em VPS (Hostinger)](#instalacao-em-vps-hostinger)
4. [Instalacao em Replit](#instalacao-em-replit)
5. [Configuracao do Banco de Dados](#configuracao-do-banco-de-dados)
6. [Criacao de Usuarios](#criacao-de-usuarios)
7. [Solucao de Problemas](#solucao-de-problemas)

---

## Requisitos do Sistema

### Software Necessario
- **Node.js**: 20.x ou superior
- **npm**: 10.x ou superior (vem com Node.js)
- **PostgreSQL**: 14.x ou superior
- **Git**: Para clonar o repositorio

### Recursos de Hardware (Minimo)
- **CPU**: 1 vCPU
- **RAM**: 1 GB
- **Disco**: 10 GB SSD

### Recursos de Hardware (Recomendado)
- **CPU**: 2 vCPUs
- **RAM**: 2 GB
- **Disco**: 20 GB SSD

---

## Instalacao em Localhost

> Observação: este projeto inclui `npm run dev:full` que aplica schema e cria um usuário dev automaticamente se você tiver um PostgreSQL acessível via `DATABASE_URL` em `.env`. Se preferir usar Docker, restaure ou crie `docker-compose.yml` com um serviço Postgres.


### Passo 1: Instalar Node.js

**Windows/Mac:**
1. Acesse https://nodejs.org
2. Baixe a versao LTS (20.x)
3. Execute o instalador

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Passo 2: Instalar PostgreSQL

**Windows:**
1. Baixe de https://www.postgresql.org/download/windows/
2. Execute o instalador
3. Anote a senha do usuario postgres

**Mac:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Passo 3: Criar Banco de Dados

```bash
# Acesse o PostgreSQL
sudo -u postgres psql

# Crie o banco e usuario
CREATE DATABASE presttech_ops;
CREATE USER presttech_user WITH ENCRYPTED PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE presttech_ops TO presttech_user;
\q
```

### Passo 4: Configurar o Projeto

```bash
# Extraia o arquivo zip ou clone o repositorio
unzip presttech-ops-console.zip
cd presttech-ops-console

# Instale as dependencias
npm install

# Crie o arquivo .env
cat > .env << EOF
DATABASE_URL=postgresql://presttech_user:sua_senha_segura@localhost:5432/presttech_ops
SESSION_SECRET=sua_chave_secreta_muito_longa_e_segura_aqui
CASA_API_KEY=sua_api_key_opcional
NODE_ENV=development
EOF

# Aplique o schema ao banco
npm run db:push

# Crie o primeiro usuario
node scripts/create-user.js
```

### Passo 5: Iniciar o Servidor

```bash
# Modo desenvolvimento
npm run dev

# Acesse: http://localhost:5000
```

---

## Instalacao em VPS (Hostinger)

### Passo 1: Acessar VPS via SSH

```bash
ssh root@seu_ip_do_servidor
```

### Passo 2: Atualizar Sistema

```bash
apt update && apt upgrade -y
```

### Passo 3: Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version  # Deve mostrar v20.x.x
```

### Passo 4: Instalar PostgreSQL

```bash
apt install postgresql postgresql-contrib -y
systemctl start postgresql
systemctl enable postgresql
```

### Passo 5: Configurar Banco de Dados

```bash
sudo -u postgres psql << EOF
CREATE DATABASE presttech_ops;
CREATE USER presttech_user WITH ENCRYPTED PASSWORD 'senha_super_segura_123';
GRANT ALL PRIVILEGES ON DATABASE presttech_ops TO presttech_user;
ALTER DATABASE presttech_ops OWNER TO presttech_user;
\c presttech_ops
GRANT ALL ON SCHEMA public TO presttech_user;
EOF
```

### Passo 6: Criar Usuario do Sistema

```bash
useradd -m -s /bin/bash presttech
```

### Passo 7: Instalar PM2

```bash
npm install -g pm2
```

### Passo 8: Fazer Upload do Projeto

```bash
# No seu computador local, envie o projeto:
scp presttech-ops-console.zip root@seu_ip:/home/presttech/

# No servidor:
su - presttech
cd /home/presttech
unzip presttech-ops-console.zip
cd presttech-ops-console
```

### Passo 9: Configurar Ambiente

```bash
# Instalar dependencias
npm install

# Criar arquivo .env
cat > .env << EOF
DATABASE_URL=postgresql://presttech_user:senha_super_segura_123@localhost:5432/presttech_ops
SESSION_SECRET=$(openssl rand -base64 32)
CASA_API_KEY=sua_api_key_aqui
NODE_ENV=production
PORT=5000
EOF

# Aplicar schema
npm run db:push

# Build de producao
npm run build

# Criar primeiro usuario
node scripts/create-user.js
```

### Passo 10: Configurar PM2

```bash
# Iniciar aplicacao
pm2 start dist/index.cjs --name presttech-ops

# Salvar configuracao
pm2 save

# Configurar inicio automatico
pm2 startup
# Execute o comando que aparecer

# Voltar para root
exit
```

### Passo 11: Instalar e Configurar Nginx

```bash
apt install nginx -y

# Criar configuracao do site
cat > /etc/nginx/sites-available/presttech << EOF
server {
    listen 80;
    server_name seu_dominio.com.br;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar site
ln -s /etc/nginx/sites-available/presttech /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Testar e reiniciar
nginx -t
systemctl restart nginx
```

### Passo 12: Configurar SSL (Let's Encrypt)

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d seu_dominio.com.br
```

### Passo 13: Configurar Firewall

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

---

## Instalacao em Replit

### Passo 1: Criar Novo Repl

1. Acesse https://replit.com
2. Clique em "Create Repl"
3. Selecione "Import from GitHub" ou "Upload folder"
4. Faca upload do projeto

### Passo 2: Configurar Banco de Dados

1. Na sidebar, clique em "Database"
2. Selecione "PostgreSQL"
3. O Replit criara automaticamente e definira DATABASE_URL

### Passo 3: Configurar Secrets

1. Na sidebar, clique em "Secrets"
2. Adicione:
   - `SESSION_SECRET`: Uma string aleatoria longa
   - `CASA_API_KEY`: Sua chave da API (opcional)

### Passo 4: Executar

1. Clique em "Run"
2. O projeto iniciara automaticamente
3. Acesse pela URL fornecida pelo Replit

---

## Configuracao do Banco de Dados

### String de Conexao

O formato da DATABASE_URL e:
```
postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
```

Exemplos:
```bash
# Localhost
DATABASE_URL=postgresql://presttech_user:senha123@localhost:5432/presttech_ops

# Servidor remoto
DATABASE_URL=postgresql://presttech_user:senha123@192.168.1.100:5432/presttech_ops

# Neon (cloud)
DATABASE_URL=postgresql://presttech_user:senha123@ep-cool-name-123456.us-east-2.aws.neon.tech/presttech_ops?sslmode=require
```

### Aplicar Schema

Sempre que instalar o projeto ou atualizar o schema:
```bash
npm run db:push
```

### Backup do Banco

```bash
# Criar backup
pg_dump -U presttech_user -h localhost presttech_ops > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U presttech_user -h localhost presttech_ops < backup_20260103.sql
```

---

## Criacao de Usuarios

### Via Script (Recomendado)

```bash
node scripts/create-user.js
```

O script perguntara:
1. Username
2. Password
3. Role (sdr ou head)

### Via SQL Direto

```sql
-- Primeiro, gere o hash da senha com o script ou use uma senha temporaria
INSERT INTO users (username, password, role)
VALUES ('novo_usuario', 'hash_da_senha', 'sdr');
```

### Usuarios Padrao Sugeridos

| Username | Role | Descricao |
|----------|------|-----------|
| admin | head | Administrador principal |
| gestor | head | Gestor de vendas |
| sdr1 | sdr | Primeiro SDR |
| sdr2 | sdr | Segundo SDR |

---

## Comandos Uteis

### Desenvolvimento
```bash
npm run dev          # Inicia em modo desenvolvimento
```

### Producao
```bash
npm run build        # Gera build de producao
node dist/index.cjs  # Executa build
```

### Banco de Dados
```bash
npm run db:push      # Aplica schema
npm run db:studio    # Abre Drizzle Studio (visualizador)
```

### PM2 (Producao)
```bash
pm2 list             # Lista processos
pm2 logs presttech   # Ver logs
pm2 restart presttech # Reiniciar
pm2 stop presttech   # Parar
pm2 delete presttech # Remover
```

---

## Solucao de Problemas

### Erro: "ECONNREFUSED" ao conectar no banco

**Causa**: PostgreSQL nao esta rodando ou configuracao incorreta.

**Solucao**:
```bash
# Verificar se PostgreSQL esta rodando
sudo systemctl status postgresql

# Iniciar se necessario
sudo systemctl start postgresql

# Verificar se o usuario e banco existem
sudo -u postgres psql -c "\du"
sudo -u postgres psql -c "\l"
```

### Erro: "Module not found"

**Causa**: Dependencias nao instaladas.

**Solucao**:
```bash
rm -rf node_modules
npm install
```

### Erro: "Port 5000 already in use"

**Causa**: Outra aplicacao usando a porta.

**Solucao**:
```bash
# Descobrir o que esta usando
lsof -i :5000

# Matar processo (substitua PID)
kill -9 PID

# Ou use outra porta
PORT=3000 npm run dev
```

### Erro: "Session secret not set"

**Causa**: Variavel SESSION_SECRET nao definida.

**Solucao**:
```bash
# Adicionar ao .env
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
```

### Erro: "Permission denied" em arquivos

**Causa**: Permissoes incorretas.

**Solucao**:
```bash
# Se rodando como root, mude para usuario normal
chown -R presttech:presttech /home/presttech/presttech-ops-console

# Ajustar permissoes
chmod -R 755 /home/presttech/presttech-ops-console
```

### Site nao carrega apos configurar Nginx

**Causa**: Configuracao do Nginx incorreta.

**Solucao**:
```bash
# Testar configuracao
nginx -t

# Ver logs de erro
tail -f /var/log/nginx/error.log

# Reiniciar Nginx
systemctl restart nginx
```

### SSL nao funciona

**Causa**: Certificado nao gerado ou expirado.

**Solucao**:
```bash
# Renovar certificado
certbot renew

# Verificar status
certbot certificates
```

---

## Checklist de Instalacao

### Localhost
- [ ] Node.js 20+ instalado
- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados criado
- [ ] Usuario do banco criado
- [ ] Projeto extraido
- [ ] Dependencias instaladas (npm install)
- [ ] Arquivo .env configurado
- [ ] Schema aplicado (npm run db:push)
- [ ] Usuario admin criado
- [ ] Servidor iniciado (npm run dev)

### VPS/Producao
- [ ] Todos os itens de localhost
- [ ] PM2 instalado e configurado
- [ ] Nginx instalado e configurado
- [ ] SSL configurado (Let's Encrypt)
- [ ] Firewall configurado
- [ ] Startup automatico configurado (pm2 startup)
- [ ] Backups agendados

---

## Contato e Suporte

Para duvidas sobre instalacao ou problemas nao listados aqui, consulte a documentacao adicional ou entre em contato com a equipe de desenvolvimento.

---

**Documento atualizado em**: Janeiro 2026
