# 🧪 Teste Automatizado de Frontend

## 📋 O que faz este teste

Este script automatizado detecta erros de webpack, JavaScript e problemas de carregamento no frontend do seu sistema financeiro.

### ✅ Funcionalidades

- 🚀 **Inicia servidor Next.js automaticamente**
- 🌐 **Testa múltiplas páginas** (home, dashboard, transações, etc.)
- 🔍 **Captura erros de console** (webpack, TypeError, etc.)
- 📸 **Tira screenshots** para validação visual
- 📊 **Gera relatório detalhado** em JSON e console
- ⏱️ **Mede tempo de carregamento** de cada página
- 🛡️ **Detecta erros críticos** que podem quebrar o sistema

### 🎯 Detecta especificamente:

- ❌ Erros de webpack (`Cannot read properties of undefined`)
- ❌ TypeErrors JavaScript
- ❌ Páginas que não carregam (status != 200)
- ❌ Conteúdo vazio ou loading infinito
- ❌ Erros não tratados no console

## 🚀 Como usar

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar o teste
```bash
# Método 1: Comando direto
npm run test:frontend

# Método 2: Comando alternativo
npm run test:errors

# Método 3: Execução direta
node scripts/test-frontend-errors.js
```

## 📊 Saída do teste

### Console em tempo real:
```
📋 [2025-09-01T19:30:00.000Z] Iniciando servidor Next.js...
✅ [2025-09-01T19:30:15.000Z] Servidor Next.js iniciado com sucesso!
📋 [2025-09-01T19:30:16.000Z] Testando página: home (http://localhost:3000)
✅ [2025-09-01T19:30:18.000Z] Página home carregada em 1250ms
⚠️ Webpack/TypeError detectado em dashboard: Cannot read properties of undefined (reading 'call')
```

### Relatório final:
```
============================================================
📊 RELATÓRIO DE TESTES FRONTEND
============================================================
📋 Páginas testadas: 5
✅ Páginas carregadas: 4
❌ Páginas com falha: 1
⚠️ Total de erros: 3
🔥 Erros de webpack: 2
💥 Erros críticos: 0

📄 DETALHES POR PÁGINA:
  ✅ home: 1250ms (0 erros, 0 webpack)
  ❌ dashboard: 2100ms (2 erros, 2 webpack)
  ✅ transacoes: 1800ms (1 erros, 0 webpack)

🔥 ERROS DE WEBPACK DETECTADOS:
  1. [dashboard] Cannot read properties of undefined (reading 'call')
  2. [dashboard] TypeError: supabaseClient is undefined

============================================================
❌ TESTES FALHARAM! Verifique os erros acima.
============================================================
```

## 📁 Arquivos gerados

- `frontend-test-report.json` - Relatório completo com screenshots em base64
- Screenshots das páginas (embutidos no JSON)
- Log detalhado de todos os erros

## 🔧 Configuração

### Páginas testadas (editável no script):
- `http://localhost:3000` (home)
- `http://localhost:3000/auth/dev` (auth-dev)
- `http://localhost:3000/dashboard` (dashboard)
- `http://localhost:3000/transacoes` (transacoes)
- `http://localhost:3000/categorias` (categorias)

### Timeouts:
- Servidor: 60 segundos para iniciar
- Página: 30 segundos para carregar
- JavaScript: 3 segundos para executar

## 🐛 Solução de problemas

### Erro: "Puppeteer not installed"
```bash
npm install puppeteer
```

### Erro: "Server startup timeout"
- Verifique se porta 3000 está disponível
- Confirme que `npm run dev` funciona manualmente

### Erro: "Page load timeout"
- Pode indicar problema real no frontend
- Verifique se a correção do auth-contexto foi aplicada

## 🎯 Como interpretar resultados

### ✅ Teste passou:
- Todas as páginas carregaram (status 200)
- Zero erros de webpack
- Zero erros críticos
- Conteúdo presente nas páginas

### ❌ Teste falhou:
- Páginas com erro 404/500
- Erros de webpack detectados
- JavaScript quebrado
- Páginas vazias ou loading infinito

## 💡 Uso recomendado

Execute este teste:
- ✅ **Após mudanças no código** (especialmente contextos/imports)
- ✅ **Antes de deployar** para produção
- ✅ **Após instalar/atualizar dependências**
- ✅ **Quando houver erros reportados** no browser
- ✅ **Durante desenvolvimento** para validação contínua

---
**Criado para detectar e resolver o erro de webpack que estava aparecendo no browser! 🎯**