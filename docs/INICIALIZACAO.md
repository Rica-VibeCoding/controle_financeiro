# 📋 INICIALIZAÇÃO - Bíblia do Sistema de Controle Financeiro

> **Documento Living**: Este guia evolui a cada refatoração bem-sucedida. Sempre consulte antes de fazer mudanças no sistema de autenticação.

## 🎯 Status Atual (Setembro 2025)
- ✅ **localhost:3000**: Funcionando completamente
- ✅ **192.168.1.103:3000**: Funcionando completamente  
- ✅ **Loop de autenticação**: RESOLVIDO
- ✅ **AuthProvider**: Robusto com timeout de segurança
- ✅ **Performance**: Build 43s, Ready em ~10s

---

## 🚨 PROBLEMAS HISTÓRICOS E SOLUÇÕES

### 1. **LOOP INFINITO DE AUTENTICAÇÃO** (Resolvido - Set/2025)

#### **Sintomas**
- Login funciona mas volta imediatamente para tela de login
- "Redirecionando para dashboard..." infinito
- Console mostra redirecionamentos em loop

#### **Causa Raiz Identificada**
Múltiplos componentes redirecionavam para `/` que por sua vez redirecionava para `/auth/login`:

```
Login Success → router.push('/') → Middleware → /dashboard → AuthProvider sem user → /auth/login → LOOP
```

#### **Solução Aplicada**
```typescript
// ❌ ANTES (causava loop)
router.push('/')

// ✅ DEPOIS (funciona)  
router.replace('/dashboard')
```

#### **Arquivos Corrigidos**
- `src/app/auth/login/page.tsx:28` 
- `src/app/auth/dev/page.tsx:27`
- `src/app/auth/callback/route.ts:7`

### 2. **AUTHPROVIDER TRAVANDO** (Resolvido - Set/2025)

#### **Sintomas**
- Sistema fica eternamente em "loading: true"
- AuthProvider nunca sai do estado inicial
- Página fica em branco ou com spinner infinito

#### **Solução Aplicada**
Timeout de segurança de 10 segundos:

```typescript
// Timeout de segurança no AuthProvider
useEffect(() => {
  let timeoutId: NodeJS.Timeout
  
  timeoutId = setTimeout(() => {
    console.warn('⚠️ AuthProvider timeout - forçando loading = false')
    setLoading(false)
  }, 10000)
  
  // ... resto do código
  
  return () => {
    clearTimeout(timeoutId)
    subscription.unsubscribe()
  }
}, [isClient])
```

### 3. **ERROS 500 NO LOCALHOST** (Resolvido - Set/2025)

#### **Sintomas**
- `Failed to load resource: status 500 (Internal Server Error)`
- `Unable to add filesystem: <illegal path>`
- Sistema não inicia no localhost:3000

#### **Causa Raiz**
- Múltiplos processos Next.js conflitantes
- Cache `.next` corrompido
- Build inconsistente

#### **Solução**
```bash
# Limpeza completa
pkill -f "next dev"
rm -rf .next
npm run dev
```

### 4. **LOCALHOST:3000 vs WSL2:3001 - CONFLITO DE PORTA** (Resolvido - Set/2025)

#### **Sintomas**
- PowerShell inicia em localhost:3000 (mas não funciona)
- WSL2 automaticamente muda para localhost:3001
- Desenvolvimento inconsistente entre ambientes
- Dois ambientes usando portas diferentes

#### **Causa Raiz Identificada**
WSL2 e Windows têm stacks de rede independentes:
- Windows: Porta 3000 "livre" mas localhost quebrado
- WSL2: Detecta conflito e auto-incrementa para 3001
- Next.js antigo rodando em background ocupando porta

#### **Solução Definitiva Aplicada**
```bash
# 1. Identificar processo conflitante
ss -tulpn | grep :3000
# Resultado: next-server (v1, pid=14954) na porta 3000

# 2. Eliminar processo antigo
kill -9 14954

# 3. Limpar cache DNS Windows
cmd.exe /c "ipconfig /flushdns"

# 4. Verificar porta liberada
ss -tulpn | grep :3000
# Resultado: porta livre
```

#### **Resultado**
- ✅ Ambos ambientes agora usam localhost:3000
- ✅ Desenvolvimento consistente PS + WSL2
- ✅ Não há mais auto-incremento de porta
- ✅ localhost funciona corretamente

#### **Comandos de Diagnóstico**
```bash
# Verificar processos na porta 3000
ss -tulpn | grep :3000

# Matar processos Next.js antigos
pkill -f "next-server"

# Limpar DNS cache
ipconfig /flushdns  # Windows
sudo systemctl flush-dns  # Linux (se necessário)
```

---

## 🛡️ ARQUITETURA ATUAL DE AUTENTICAÇÃO

### **Fluxo de Inicialização Correto**

```mermaid
graph TD
    A[Usuário acessa /] --> B{Middleware}
    B --> C[Redireciona para /dashboard]
    C --> D[AuthProvider carrega]
    D --> E{Usuário autenticado?}
    E -->|Sim| F[Dashboard carrega]
    E -->|Não| G[Redireciona /auth/login]
    G --> H[Login bem-sucedido]
    H --> I[router.replace('/dashboard')]
    I --> F
```

### **Componentes Críticos**

#### **1. AuthProvider** (`src/contextos/auth-contexto.tsx`)
- **Função**: Gerencia estado global de autenticação
- **Timeout**: 10 segundos de segurança
- **Estados**: `loading`, `user`, `session`, `workspace`
- **Características**:
  - Carregamento robusto com fallback
  - Retry automático em caso de erro
  - Limpeza de estado em logout

#### **2. Middleware** (`src/servicos/supabase/middleware.ts`)  
- **Função**: Intercepta rotas e gerencia redirecionamentos
- **Regras**:
  - `/` → `/dashboard` (sempre)
  - `/auth/*` → Passa direto (sem interceptação)
  - Outros → Aplica autenticação Supabase

#### **3. Páginas de Auth**
- **Login**: Redireciona para `/dashboard` após sucesso
- **Register**: Redireciona para `/auth/login` após cadastro  
- **Callback**: Redireciona para `/dashboard` após verificação email

---

## 🔧 COMANDOS DE DIAGNÓSTICO

### **Verificação Rápida**
```bash
# Status dos processos
ps aux | grep -i next

# Limpeza de emergência  
pkill -f "next dev" && rm -rf .next && npm run dev

# Teste de conectividade
curl -I http://localhost:3000/
curl -I http://192.168.1.103:3000/
```

### **Análise de Logs**
```bash
# Ver logs do servidor Next.js em tempo real
npm run dev | grep -E "(error|Error|failed|Failed)"

# Verificar variáveis de ambiente
cat .env.local | head -5
```

### **Validação do Supabase**
```bash
# Testar conexão
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
```

---

## 🚀 PROCEDIMENTOS DE REFATORAÇÃO

### **Antes de Modificar Autenticação**

1. **✅ Backup do Estado Atual**
   ```bash
   git add . && git commit -m "backup: antes de modificar auth"
   ```

2. **✅ Documentar Mudança**
   - Adicionar seção neste documento
   - Descrever problema e solução
   - Incluir código antes/depois

3. **✅ Testar em Ambos IPs**  
   - http://localhost:3000
   - http://192.168.1.103:3000

### **Checklist Pós-Mudança**

- [ ] Login funciona sem loop
- [ ] Dashboard carrega em < 15s
- [ ] Logout funciona corretamente
- [ ] Refresh mantém sessão
- [ ] Ambos IPs funcionando
- [ ] Console sem erros críticos
- [ ] AuthProvider não trava

---

## 📝 CONFIGURAÇÕES CRÍTICAS

### **.env.local**
```env
# URLs corretas
NEXT_PUBLIC_SUPABASE_URL=https://nzgifjdewdfibcopolof.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sua-key]
SUPABASE_SERVICE_ROLE_KEY=[sua-service-key]

# Desenvolvimento
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEV_URL=http://172.19.112.1:3000
```

### **middleware.ts - Configuração**
```typescript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### **AuthProvider - Timeout**
```typescript
// SEMPRE manter timeout de segurança
const TIMEOUT_SAFETY = 10000 // 10 segundos
```

---

## 🏥 PROCEDIMENTOS DE EMERGÊNCIA

### **Sistema Não Inicia**
```bash
# 1. Matar todos os processos
sudo pkill -f node
sudo pkill -f next

# 2. Limpeza profunda
rm -rf .next
rm -rf node_modules/.cache  
npm install

# 3. Restart limpo
npm run dev
```

### **Loop de Login Detectado**
1. **Verificar se alguma página faz `router.push('/')`**
   ```bash
   grep -r "router.push('/')" src/app/auth/
   ```

2. **Verificar middleware redirect**
   - Confirmar que auth routes são excluídas
   - Verificar se `/` redireciona para `/dashboard`

3. **Verificar AuthProvider**
   - Timeout ativo?
   - Loading state sendo limpo?

### **Performance Degradada**
```bash
# Análise de build
npm run build:analyze

# Verificar tempo de startup  
time npm run dev

# Limpar caches do sistema
sudo sysctl -w vm.drop_caches=3 # Linux apenas
```

---

## 📊 MÉTRICAS DE PERFORMANCE

### **Benchmarks Atuais** (Set/2025)
- **Build Time**: 43s (otimizado)
- **Dev Server Ready**: ~10s
- **First Paint**: < 2s
- **Login Flow**: < 3s end-to-end

### **Alertas de Performance**
- ⚠️ Build > 60s: Revisar dependências  
- ⚠️ Ready > 15s: Limpar cache
- ⚠️ Login > 5s: Verificar Supabase connectivity

---

## 🔄 HISTÓRICO DE MUDANÇAS

### **v2.1 - Set/2025** ✅
- **Problema**: Loop infinito de autenticação
- **Solução**: Corrigir redirects para `/dashboard`
- **Files**: login/page.tsx, dev/page.tsx, callback/route.ts  
- **Resultado**: Sistema 100% funcional

### **v2.2 - Set/2025** ✅
- **Problema**: Conflito de porta localhost:3000 vs WSL2:3001
- **Solução**: Eliminar processo Next.js antigo + limpar DNS cache
- **Causa**: next-server (v1) rodando em background
- **Resultado**: Ambos ambientes usam localhost:3000 consistentemente

### **v2.0 - Set/2025** ✅  
- **Problema**: AuthProvider travando
- **Solução**: Timeout de segurança 10s
- **Files**: auth-contexto.tsx
- **Resultado**: Loading nunca trava

---

## 🎯 PRÓXIMAS MELHORIAS PLANEJADAS

1. **Monitoring**: Adicionar telemetria de performance
2. **Error Boundaries**: Captura de erros de auth mais robusta  
3. **Offline Support**: PWA auth resilience
4. **Multi-factor**: Preparar para 2FA futuro

---

> **⚠️ LEMBRE-SE**: Sempre teste em ambos IPs após qualquer mudança. Este documento é a fonte da verdade para problemas de inicialização.

**Última atualização**: Setembro 2025  
**Próxima revisão**: A cada refatoração de auth