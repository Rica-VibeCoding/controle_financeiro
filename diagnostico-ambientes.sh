#!/bin/bash
# Diagnóstico de Diferenças WSL vs PowerShell
# Execute este script em WSL para comparar com PowerShell

echo "=== DIAGNÓSTICO AMBIENTE ===" 

# Informações básicas
echo "Data/Hora: $(date)"
echo "Ambiente: WSL ($(uname -a))"
echo "Node Version: $(node --version)"
echo "NPM Version: $(npm --version)"
echo "Diretório: $(pwd)"

# Verificar cache
echo ""
echo "=== STATUS CACHE ==="
if [ -d ".next" ]; then
    echo "Cache .next EXISTS"
    ls -la .next/ | head -10
else
    echo "Cache .next CLEAN"
fi

# Verificar processos Next.js
echo ""
echo "=== PROCESSOS NEXT.JS ==="
NEXT_PROCESSES=$(ps aux | grep "next dev" | grep -v grep)
if [ -n "$NEXT_PROCESSES" ]; then
    echo "Processos Next.js rodando:"
    echo "$NEXT_PROCESSES"
else
    echo "Nenhum processo Next.js rodando"
fi

# Verificar variáveis de ambiente importantes
echo ""
echo "=== VARIÁVEIS DE AMBIENTE ==="
for var in NODE_ENV NEXT_PUBLIC_APP_URL NEXT_PUBLIC_DEV_URL NEXT_PUBLIC_DEV_MODE; do
    value=$(printenv $var)
    if [ -n "$value" ]; then
        echo "$var=$value"
    else
        echo "$var=NOT SET"
    fi
done

# Testar conectividade
echo ""
echo "=== TESTE CONECTIVIDADE ==="
for url in "http://localhost:3001" "http://127.0.0.1:3001" "http://172.19.112.1:3001"; do
    if curl -I "$url" --connect-timeout 2 &>/dev/null; then
        echo "$url - OK"
    else
        echo "$url - FAIL"
    fi
done

echo ""
echo "=== COMANDOS PARA TESTAR ==="
echo "1. Limpar cache: rm -rf .next"
echo "2. Iniciar limpo: npm run dev -- -p 3001"
echo "3. Testar URL: curl http://localhost:3001"

echo ""
echo "DIAGNÓSTICO COMPLETO!"