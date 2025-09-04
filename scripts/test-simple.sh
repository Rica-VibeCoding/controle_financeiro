#!/bin/bash

# Teste simples do agente multiusuário
# Versão simplificada sem dependência de jq

set -euo pipefail

# Cores para output
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

log_success() {
    echo -e "${GREEN}✅ $*${NC}"
}

log_error() {
    echo -e "${RED}❌ $*${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $*${NC}"
}

print_header() {
    local title="$1"
    echo ""
    echo -e "${BLUE}======================================================"
    echo -e "  ${title}"
    echo -e "======================================================${NC}"
    echo ""
}

# Teste básico de estrutura do agente
test_agent_structure() {
    print_header "🧪 TESTE BÁSICO DO AGENTE MULTIUSUÁRIO"
    
    log_info "Teste 1: Verificando estrutura do agente..."
    
    if [[ -f "scripts/test-multiuser-complete.sh" ]]; then
        log_success "Agente encontrado em scripts/"
    else
        log_error "Agente não encontrado"
        return 1
    fi
    
    log_info "Teste 2: Verificando permissões..."
    
    if [[ -x "scripts/test-multiuser-complete.sh" ]]; then
        log_success "Agente executável"
    else
        log_error "Agente não executável"
        return 1
    fi
    
    log_info "Teste 3: Verificando help do agente..."
    
    if scripts/test-multiuser-complete.sh --help >/dev/null 2>&1; then
        log_success "Help funciona"
    else
        log_error "Help não funciona"
        return 1
    fi
    
    log_info "Teste 4: Verificando configuração..."
    
    if [[ -f ".env.local" ]]; then
        log_success "Arquivo .env.local encontrado"
    else
        log_error "Arquivo .env.local não encontrado"
        return 1
    fi
    
    log_info "Teste 5: Verificando jq local..."
    
    if [[ -f "jq" ]] && [[ -x "jq" ]]; then
        log_success "jq local disponível"
    else
        log_error "jq local não disponível"
        return 1
    fi
    
    print_header "✅ AGENTE BÁSICO FUNCIONANDO"
    echo "O agente está estruturalmente correto e pronto para uso"
    echo "Para usar: scripts/test-multiuser-complete.sh --help"
    
    return 0
}

# Executar teste
test_agent_structure