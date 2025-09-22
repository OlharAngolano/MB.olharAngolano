# Olhar Angolano - Guia de Implantação

## 📋 Visão Geral

Olhar Angolano é uma plataforma de comunidade completa construída com Next.js 15, TypeScript, Prisma e SQLite. Este guia fornece instruções detalhadas para implantar a aplicação em um servidor de produção.

## 🏗️ Arquitetura da Aplicação

### Stack Tecnológica
- **Frontend**: Next.js 15 com App Router
- **Linguagem**: TypeScript 5
- **Estilização**: Tailwind CSS 4 com shadcn/ui
- **Banco de Dados**: SQLite com Prisma ORM
- **Autenticação**: Sistema de sessão personalizado
- **WebSocket**: Socket.IO para chat em tempo real
- **Upload de Arquivos**: Sistema integrado de upload de imagens
- **Servidor**: Node.js com HTTP customizado

### Estrutura do Projeto
```
/home/z/my-project/
├── src/
│   ├── app/                 # Páginas Next.js (App Router)
│   ├── components/          # Componentes React
│   ├── hooks/              # Hooks personalizados
│   └── lib/                # Utilitários e configurações
├── prisma/                 # Schema e migrations do banco de dados
├── public/                 # Arquivos estáticos (logo, imagens)
├── data/                  # Banco de dados SQLite (produção)
├── .env.production        # Variáveis de ambiente de produção
├── .env.security         # Configurações de segurança
├── nginx.conf            # Configuração do Nginx
├── olhar-angolano.service# Configuração do systemd
├── build-production.sh   # Script de build
└── deploy.sh            # Script de deploy
```

## 🔧 Pré-requisitos do Servidor

### Sistema Operacional
- Ubuntu 20.04 LTS ou superior (recomendado)
- Debian 10+ ou CentOS 8+ (alternativas)

### Software Necessário
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+ (recomendado usar NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Instalar Nginx
sudo apt install nginx -y

# Instalar Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y

# Instalar ferramentas úteis
sudo apt install git curl wget -y
```

### Configuração de Usuário
```bash
# Criar usuário para a aplicação
sudo useradd -m -s /bin/bash olhar
sudo usermod -aG sudo olhar

# Criar diretórios necessários
sudo mkdir -p /var/www/olhar-angolano
sudo mkdir -p /backups/olhar-angolano
sudo chown -R olhar:olhar /var/www/olhar-angolano
sudo chown -R olhar:olhar /backups/olhar-angolano
```

## 🔒 Configuração de Segurança

### 1. Firewall
```bash
# Instalar UFW (Uncomplicated Firewall)
sudo apt install ufw -y

# Configurar regras do firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3000/tcp  # Porta da aplicação

# Habilitar firewall
sudo ufw enable
```

### 2. SSL/TLS com Let's Encrypt
```bash
# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Testar renovação automática
sudo certbot renew --dry-run
```

### 3. Variáveis de Ambiente
Copie e configure os arquivos de ambiente:

```bash
# Arquivo .env.production
cp .env.production.example .env.production
nano .env.production
```

Configure as seguintes variáveis:
```env
DATABASE_URL="file:./data/database.db"
NEXTAUTH_SECRET="sua-chave-secreta-ultra-segura-aqui"
NEXTAUTH_URL="https://seu-dominio.com"
NODE_ENV="production"
PORT="3000"
HOSTNAME="0.0.0.0"
```

## 🚀 Processo de Implantação

### Método 1: Deploy Automatizado (Recomendado)

1. **Configure o acesso SSH**:
```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t rsa -b 4096

# Copiar chave para o servidor
ssh-copy-id olhar@seu-servidor.com
```

2. **Configure o script de deploy**:
```bash
# Editar o script de deploy
nano deploy.sh

# Alterar as variáveis no início do arquivo:
SERVER_USER="olhar"
SERVER_HOST="seu-servidor.com"
SERVER_PATH="/var/www/olhar-angolano"
```

3. **Execute o deploy**:
```bash
./deploy.sh
```

### Método 2: Deploy Manual

1. **Build da aplicação**:
```bash
# Executar script de build
./build-production.sh
```

2. **Transferir arquivos**:
```bash
# Copiar arquivos para o servidor
scp -r .next data public package.json package-lock.json .env.production .env.security prisma server.ts olhar@seu-servidor.com:/var/www/olhar-angolano/
```

3. **Configurar no servidor**:
```bash
# Conectar ao servidor
ssh olhar@seu-servidor.com
cd /var/www/olhar-angolano

# Instalar dependências
npm ci --only=production

# Gerar Prisma Client
npx prisma generate

# Configurar permissões
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod 600 .env.production
sudo chmod 600 .env.security
```

4. **Configurar Nginx**:
```bash
# Copiar configuração do Nginx
sudo cp nginx.conf /etc/nginx/sites-available/olhar-angolano
sudo ln -sf /etc/nginx/sites-available/olhar-angolano /etc/nginx/sites-enabled/olhar-angolano

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

5. **Configurar serviço systemd**:
```bash
# Copiar arquivo de serviço
sudo cp olhar-angolano.service /etc/systemd/system/

# Habilitar e iniciar serviço
sudo systemctl daemon-reload
sudo systemctl enable olhar-angolano
sudo systemctl start olhar-angolano

# Verificar status
sudo systemctl status olhar-angolano
```

## 🗄️ Configuração do Banco de Dados

### SQLite
A aplicação usa SQLite por padrão. O banco de dados será criado em:
- Desenvolvimento: `db/custom.db`
- Produção: `data/database.db`

### Backup do Banco de Dados
```bash
# Script de backup automático
sudo nano /etc/cron.daily/olhar-angolano-backup
```

Adicione o conteúdo:
```bash
#!/bin/bash
BACKUP_DIR="/backups/olhar-angolano"
APP_DIR="/var/www/olhar-angolano"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
sqlite3 $APP_DIR/data/database.db ".backup $BACKUP_DIR/database_$DATE.db"

# Manter apenas os últimos 7 dias de backup
find $BACKUP_DIR -name "database_*.db" -mtime +7 -delete
```

Torne o script executável:
```bash
sudo chmod +x /etc/cron.daily/olhar-angolano-backup
```

## 📊 Monitoramento e Manutenção

### 1. Logs da Aplicação
```bash
# Verificar logs do serviço
sudo journalctl -u olhar-angolano -f

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/olhar-angolano-access.log
sudo tail -f /var/log/nginx/olhar-angolano-error.log
```

### 2. Monitoramento de Recursos
```bash
# Instalar htop para monitoramento
sudo apt install htop -y

# Monitorar uso de CPU e memória
htop

# Monitorar espaço em disco
df -h
```

### 3. Atualizações
```bash
# Atualizar dependências
cd /var/www/olhar-angolano
npm update

# Rebuild da aplicação
npm run build
sudo systemctl restart olhar-angolano
```

## 🚨 Solução de Problemas

### Problemas Comuns

1. **Aplicação não inicia**:
```bash
# Verificar status do serviço
sudo systemctl status olhar-angolano

# Verificar logs
sudo journalctl -u olhar-angolano -n 50
```

2. **Erro de permissão**:
```bash
# Corrigir permissões
sudo chown -R www-data:www-data /var/www/olhar-angolano
sudo chmod -R 755 /var/www/olhar-angolano
```

3. **Problemas com SSL**:
```bash
# Renovar certificado
sudo certbot renew --nginx

# Testar configuração SSL
sudo nginx -t
sudo systemctl reload nginx
```

4. **Banco de dados corrompido**:
```bash
# Restaurar backup
sudo cp /backups/olhar-angolano/database_ultimo_backup.db /var/www/olhar-angolano/data/database.db
sudo systemctl restart olhar-angolano
```

### Verificação de Saúde
```bash
# Script de verificação de saúde
cat > health-check.sh << 'EOF'
#!/bin/bash

# Verificar se a aplicação está respondendo
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Aplicação está saudável"
    exit 0
else
    echo "❌ Aplicação não está respondendo"
    exit 1
fi
EOF

chmod +x health-check.sh
./health-check.sh
```

## 📈 Otimização de Desempenho

### 1. Nginx
```bash
# Configurar cache estático
sudo nano /etc/nginx/sites-available/olhar-angolano
```

Adicione no bloco server:
```nginx
# Cache para assets estáticos
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Habilitar compressão Brotli (se disponível)
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### 2. Node.js
```bash
# Aumentar limite de arquivos
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Configurar garbage collection do Node.js
echo 'export NODE_OPTIONS="--max-old-space-size=4096"' | sudo tee -a /etc/environment
```

## 🔐 Segurança Adicional

### 1. Fail2Ban
```bash
# Instalar Fail2Ban
sudo apt install fail2ban -y

# Configurar para Nginx
sudo nano /etc/fail2ban/jail.local
```

Adicione:
```ini
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

### 2. Hardening do Sistema
```bash
# Desabilitar login root
sudo passwd -l root

# Configurar atualizações automáticas de segurança
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```

## 📞 Suporte

Em caso de problemas, verifique:
1. Os logs da aplicação e do Nginx
2. As configurações de firewall
3. As permissões dos arquivos
4. O status do serviço systemd

Para suporte adicional, consulte a documentação oficial do Next.js, Nginx e das tecnologias utilizadas.

---

## 📝 Checklist de Implantação

- [ ] Configurar servidor e pré-requisitos
- [ ] Configurar firewall e segurança
- [ ] Configurar SSL/TLS
- [ ] Configurar variáveis de ambiente
- [ ] Fazer build da aplicação
- [ ] Transferir arquivos para o servidor
- [ ] Configurar Nginx
- [ ] Configurar serviço systemd
- [ ] Iniciar aplicação
- [ ] Testar todas as funcionalidades
- [ ] Configurar backups automáticos
- [ ] Configurar monitoramento
- [ ] Testar processo de recuperação

---

**Importante**: Este guia assume que você tem acesso root ou sudo ao servidor. Ajuste os comandos conforme necessário para o seu ambiente específico.