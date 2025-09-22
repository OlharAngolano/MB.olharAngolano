#!/bin/bash

# Script de Correção Rápida para o Problema do package-lock.json
# ===========================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_info "🔧 Iniciando correção rápida do problema do package-lock.json"

# Step 1: Verificar se estamos no diretório correto
log_step "1. Verificando diretório do projeto..."
if [ ! -f "package.json" ]; then
    log_error "Este script deve ser executado no diretório raiz do projeto."
    exit 1
fi

# Step 2: Verificar se o package-lock.json existe
log_step "2. Verificando package-lock.json..."
if [ ! -f "package-lock.json" ]; then
    log_warn "package-lock.json não encontrado. Gerando..."
    npm install
    log_info "package-lock.json gerado com sucesso"
else
    log_info "package-lock.json encontrado"
fi

# Step 3: Verificar status do Git
log_step "3. Verificando status do Git..."
if ! git status | grep -q "package-lock.json"; then
    log_info "package-lock.json já está no Git"
else
    log_info "package-lock.json não está no Git. Adicionando..."
    
    # Step 4: Adicionar ao Git
    log_step "4. Adicionando package-lock.json ao Git..."
    git add package-lock.json
    
    # Step 5: Fazer commit
    log_step "5. Fazendo commit..."
    git commit -m "Add package-lock.json for reliable deployments
    
    - This ensures consistent builds across environments
    - Fixes deployment issues with npm ci
    - Follows Node.js best practices"
    
    # Step 6: Push para o GitHub
    log_step "6. Enviando para o GitHub..."
    git push origin main
    
    log_info "✅ package-lock.json enviado para o GitHub com sucesso"
fi

# Step 7: Verificar o repositório remoto
log_step "7. Verificando repositório remoto..."
REMOTE_URL=$(git remote get-url origin)
log_info "URL do repositório: $REMOTE_URL"

# Step 8: Testar se o arquivo está no repositório
log_step "8. Verificando se o arquivo está no repositório remoto..."
if git ls-files | grep -q "package-lock.json"; then
    log_info "✅ package-lock.json está no repositório"
else
    log_error "❌ package-lock.json não está no repositório"
    exit 1
fi

# Step 9: Verificar o tamanho do arquivo
log_step "9. Verificando tamanho do arquivo..."
FILE_SIZE=$(du -h package-lock.json | cut -f1)
log_info "Tamanho do package-lock.json: $FILE_SIZE"

# Step 10: Fazer backup do arquivo
log_step "10. Fazendo backup do arquivo..."
cp package-lock.json "package-lock.json.backup.$(date +%Y%m%d_%H%M%S)"
log_info "Backup criado com sucesso"

log_info "✅ Correção concluída com sucesso!"
log_info ""
log_info "📋 Próximos passos:"
log_info "   1. Aguarde alguns minutos para o GitHub processar"
log_info "   2. Tente fazer o deploy novamente no Dokploy"
log_info "   3. Verifique se o build foi bem sucedido"
log_info ""
log_warn "⚠️  Se o problema persistir:"
log_warn "   - Verifique as configurações do Dokploy"
log_warn "   - Limpe o cache do deploy"
log_warn "   - Tente reiniciar o deployment"
log_info ""
log_info "🔧 Comandos úteis:"
log_info "   - Verificar status: git status"
log_info "   - Verificar log: git log --oneline -n 5"
log_info "   - Testar local: npm ci"
log_info "   - Verificar remote: git remote -v"