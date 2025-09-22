#!/bin/bash

# Script de Deploy para Servidor
# ==============================

set -e

# Configurações
SERVER_USER="seu-usuario"
SERVER_HOST="seu-servidor.com"
SERVER_PATH="/var/www/olhar-angolano"
BACKUP_PATH="/backups/olhar-angolano"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Este script deve ser executado no diretório raiz do projeto."
    exit 1
fi

# Build local
log_info "Iniciando build local..."
./build-production.sh

# Criar pacote de deploy
log_info "Criando pacote de deploy..."
tar -czf olhar-angolano-deploy.tar.gz \
    .next/ \
    data/ \
    public/ \
    package.json \
    package-lock.json \
    .env.production \
    .env.security \
    prisma/ \
    server.ts \
    nginx.conf \
    olhar-angolano.service

# Fazer backup do servidor atual
log_info "Fazendo backup do servidor atual..."
ssh $SERVER_USER@$SERVER_HOST "sudo mkdir -p $BACKUP_PATH && sudo tar -czf $BACKUP_PATH/backup-$(date +%Y%m%d_%H%M%S).tar.gz -C $SERVER_PATH ."

# Copiar arquivos para o servidor
log_info "Copiando arquivos para o servidor..."
scp olhar-angolano-deploy.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# Extrair arquivos no servidor
log_info "Extraindo arquivos no servidor..."
ssh $SERVER_USER@$SERVER_HOST "
    sudo rm -rf $SERVER_PATH/tmp &&
    sudo mkdir -p $SERVER_PATH/tmp &&
    sudo tar -xzf /tmp/olhar-angolano-deploy.tar.gz -C $SERVER_PATH/tmp &&
    sudo mv $SERVER_PATH/tmp/.next $SERVER_PATH/ &&
    sudo mv $SERVER_PATH/tmp/data $SERVER_PATH/ &&
    sudo mv $SERVER_PATH/tmp/public $SERVER_PATH/ &&
    sudo mv $SERVER_PATH/tmp/package.json $SERVER_PATH/ &&
    sudo mv $SERVER_PATH/tmp/package-lock.json $SERVER_PATH/ &&
    sudo mv $SERVER_PATH/tmp/.env.production $SERVER_PATH/ &&
    sudo mv $SERVER_PATH/tmp/.env.security $SERVER_PATH/ &&
    sudo mv $SERVER_PATH/tmp/prisma $SERVER_PATH/ &&
    sudo mv $SERVER_PATH/tmp/server.ts $SERVER_PATH/ &&
    sudo mv $SERVER_PATH/tmp/nginx.conf $SERVER_PATH/ &&
    sudo mv $SERVER_PATH/tmp/olhar-angolano.service $SERVER_PATH/ &&
    sudo rm -rf $SERVER_PATH/tmp &&
    sudo rm /tmp/olhar-angolano-deploy.tar.gz
"

# Configurar permissões
log_info "Configurando permissões..."
ssh $SERVER_USER@$SERVER_HOST "
    sudo chown -R www-data:www-data $SERVER_PATH &&
    sudo chmod -R 755 $SERVER_PATH &&
    sudo chmod 600 $SERVER_PATH/.env.production &&
    sudo chmod 600 $SERVER_PATH/.env.security &&
    sudo chmod 700 $SERVER_PATH/data &&
    sudo chmod 600 $SERVER_PATH/data/database.db 2>/dev/null || true
"

# Instalar dependências no servidor
log_info "Instalando dependências no servidor..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && sudo -u www-data npm ci --only=production"

# Gerar Prisma Client
log_info "Gerando Prisma Client no servidor..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && sudo -u www-data npx prisma generate"

# Configurar nginx
log_info "Configurando nginx..."
ssh $SERVER_USER@$SERVER_HOST "
    sudo cp $SERVER_PATH/nginx.conf /etc/nginx/sites-available/olhar-angolano &&
    sudo ln -sf /etc/nginx/sites-available/olhar-angolano /etc/nginx/sites-enabled/olhar-angolano &&
    sudo nginx -t && sudo systemctl reload nginx
"

# Configurar systemd service
log_info "Configurando serviço systemd..."
ssh $SERVER_USER@$SERVER_HOST "
    sudo cp $SERVER_PATH/olhar-angolano.service /etc/systemd/system/ &&
    sudo systemctl daemon-reload &&
    sudo systemctl enable olhar-angolano &&
    sudo systemctl restart olhar-angolano
"

# Verificar status do serviço
log_info "Verificando status do serviço..."
ssh $SERVER_USER@$SERVER_HOST "sudo systemctl status olhar-angolano --no-pager"

# Limpar arquivo local
rm olhar-angolano-deploy.tar.gz

log_info "✅ Deploy concluído com sucesso!"
log_info "🌐 Seu site está disponível em: https://seu-dominio.com"
log_info ""
log_warn "⚠️  Não se esqueça de:"
log_warn "   - Configurar o SSL com Let's Encrypt"
log_warn "   - Configurar backups automáticos"
log_warn "   - Monitorar os logs e o desempenho"
log_warn "   - Manter o sistema atualizado"