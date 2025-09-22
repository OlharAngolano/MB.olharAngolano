#!/bin/bash

# Script de Build e Deploy para Produção
# =====================================

set -e  # Para em caso de erro

echo "🚀 Iniciando processo de build para produção..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    log_error "Node.js não está instalado. Por favor, instale o Node.js."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    log_error "npm não está instalado. Por favor, instale o npm."
    exit 1
fi

# Verificar arquivo .env.production
if [ ! -f ".env.production" ]; then
    log_error "Arquivo .env.production não encontrado. Crie este arquivo antes de continuar."
    exit 1
fi

# Backup do banco de dados atual
if [ -f "db/custom.db" ]; then
    log_info "Fazendo backup do banco de dados atual..."
    mkdir -p backups
    cp db/custom.db backups/database_$(date +%Y%m%d_%H%M%S).db
    log_info "Backup concluído."
fi

# Limpar builds anteriores
log_info "Limpando builds anteriores..."
rm -rf .next
rm -rf node_modules/.cache

# Instalar dependências
log_info "Instalando dependências..."
npm ci --only=production

# Gerar Prisma Client
log_info "Gerando Prisma Client..."
npx prisma generate

# Build da aplicação
log_info "Building da aplicação Next.js..."
npm run build

# Verificar se o build foi bem sucedido
if [ ! -d ".next" ]; then
    log_error "Build falhou. Diretório .next não foi criado."
    exit 1
fi

# Criar diretório de dados para produção
log_info "Criando diretório de dados..."
mkdir -p data

# Copiar banco de dados para o diretório de produção
if [ -f "db/custom.db" ]; then
    log_info "Copiando banco de dados para o diretório de produção..."
    cp db/custom.db data/database.db
fi

# Definir permissões corretas
log_info "Configurando permissões..."
chmod -R 755 .
chmod 600 .env.production
chmod 600 .env.security
chmod 700 data
chmod 600 data/database.db 2>/dev/null || true

# Otimizar assets
log_info "Otimizando assets..."
find .next/static -name "*.js" -exec gzip -k {} \; 2>/dev/null || true
find .next/static -name "*.css" -exec gzip -k {} \; 2>/dev/null || true

log_info "✅ Build concluído com sucesso!"
log_info "📦 Diretório de build: .next"
log_info "🗄️  Banco de dados: data/database.db"
log_info "🔗 Para iniciar o servidor: npm start"
log_info ""
log_warn "⚠️  Lembre-se de:"
log_warn "   - Configurar as variáveis de ambiente no servidor"
log_warn "   - Configurar o proxy reverso (nginx/apache)"
log_warn "   - Configurar SSL/TLS"
log_warn "   - Configurar firewall"
log_warn "   - Monitorar os logs do servidor"