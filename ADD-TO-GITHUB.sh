#!/bin/bash

# Script para Adicionar package-lock.json ao GitHub
# ================================================

set -e

echo "🔧 Script para adicionar package-lock.json ao GitHub"
echo "================================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Este script deve ser executado no diretório raiz do projeto."
    exit 1
fi

# Verificar se o Git está inicializado
if [ ! -d ".git" ]; then
    echo "❌ Erro: Este não é um repositório Git."
    exit 1
fi

# Verificar se o package-lock.json existe
if [ ! -f "package-lock.json" ]; then
    echo "📦 Gerando package-lock.json..."
    npm install
    echo "✅ package-lock.json gerado com sucesso"
else
    echo "✅ package-lock.json já existe"
fi

# Verificar o tamanho do arquivo
FILE_SIZE=$(du -h package-lock.json | cut -f1)
echo "📏 Tamanho do arquivo: $FILE_SIZE"

# Adicionar ao Git
echo "📝 Adicionando package-lock.json ao Git..."
git add package-lock.json

# Verificar status
echo "📊 Status do Git:"
git status

# Perguntar se quer fazer commit
echo ""
read -p "Deseja fazer commit agora? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "💾 Fazendo commit..."
    git commit -m "Add package-lock.json for reliable deployments

- This ensures consistent builds across environments
- Fixes deployment issues with npm ci
- Follows Node.js best practices
- Required for CI/CD pipelines"
    
    echo "✅ Commit realizado com sucesso"
    
    # Perguntar se quer fazer push
    read -p "Deseja enviar para o GitHub agora? (s/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "🚀 Enviando para o GitHub..."
        git push origin main
        echo "✅ Arquivo enviado para o GitHub com sucesso!"
    else
        echo "💡 Para enviar manualmente: git push origin main"
    fi
else
    echo "💡 Para fazer commit manualmente:"
    echo "   git commit -m 'Add package-lock.json for reliable deployments'"
    echo "   git push origin main"
fi

echo ""
echo "🎉 Pronto! Agora seu repositório GitHub tem o package-lock.json"
echo "📋 Próximos passos:"
echo "   1. Tente fazer o deploy novamente no Dokploy"
echo "   2. Verifique se o build foi bem sucedido"
echo "   3. Teste a aplicação em produção"
echo ""
echo "🔧 Comandos úteis:"
echo "   - Verificar status: git status"
echo "   - Verificar log: git log --oneline -n 3"
echo "   - Testar local: npm ci"