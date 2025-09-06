# 🚨 PLANO DE CORREÇÃO DE TRAVAMENTOS - OPUS
**Data:** 2025-09-05  
**Prioridade:** 🔴 CRÍTICA - Sistema em produção travando  
**Tempo Estimado Total:** 2-3 horas

## 📋 DIAGNÓSTICO COMPLETO

### Problemas Identificados

#### 1. **PROBLEMA PRINCIPAL: Query Aninhada no AuthProvider**
**Localização:** `src/contextos/auth-contexto.tsx:148-163`
```typescript
// PROBLEMA: Query com relacionamento aninhado PostgREST
.select(`
  workspace_id,
  fp_workspaces!inner (...)  // ❌ TRAVAMENTO AQUI
`)
```
**Causa:** Relacionamento aninhado PostgREST pode causar timeout/travamento
**Impacto:** Loading infinito - usuário fica preso no skeleton

#### 2. **SWR Config Muito Agressiva**
**Localização:** `src/app/layout.tsx:111`
```typescript
refreshInterval: 60000,  // ⚠️ Re-fetch a cada 60s
dedupingInterval: 10000  // ⚠️ Muito curto
```
**Impacto:** Múltiplas re-queries causam race conditions

#### 3. **Providers Aninhados Demais**
```
7 providers aninhados = re-renders em cascata
```
**Impacto:** Performance degradada, múltiplos re-fetches

#### 4. **Middleware Redundante**
- Middleware verifica auth
- AuthProvider verifica auth novamente  
**Impacto:** Duplicação de verificações, latência aumentada

#### 5. **Timeout de 5s Não Funciona Corretamente**
**Localização:** `auth-contexto.tsx:61-64`
- Timeout existe mas não cobre todos os cenários
- Query travada não é cancelada

---

## 🎯 PLANO DE AÇÃO - 5 CORREÇÕES FOCADAS

### 🔴 **CORREÇÃO 1: Query Otimizada (PRIORIDADE MÁXIMA)**
**Tempo:** 30 min

#### Problema Atual:
```typescript
// ❌ Query com JOIN aninhado (TRAVA)
const { data } = await supabase
  .from('fp_usuarios')
  .select(`
    workspace_id,
    fp_workspaces!inner (...)
  `)
```

#### Solução:
```typescript
// ✅ Duas queries separadas e simples
// 1. Buscar workspace_id do usuário
const { data: userData } = await supabase
  .from('fp_usuarios')
  .select('workspace_id')
  .eq('id', userId)
  .single()

// 2. Buscar workspace diretamente
if (userData?.workspace_id) {
  const { data: workspaceData } = await supabase
    .from('fp_workspaces')
    .select('*')
    .eq('id', userData.workspace_id)
    .single()
}
```

**Benefícios:**
- Elimina JOIN complexo
- Queries mais rápidas
- Timeout funciona corretamente
- Fácil debug

---

### 🟡 **CORREÇÃO 2: SWR Config Menos Agressiva**
**Tempo:** 15 min

#### Configuração Atual:
```typescript
// ❌ Re-fetch muito frequente
refreshInterval: 60000,    // A cada 1 minuto
dedupingInterval: 10000    // Dedupe 10 segundos
```

#### Solução:
```typescript
// ✅ Intervals mais conservadores
refreshInterval: 300000,    // 5 minutos (era 1 min)
dedupingInterval: 60000,    // 1 minuto (era 10s)
revalidateOnFocus: false,   // Mantém false
revalidateOnReconnect: false // Mudar para false
```

**Benefícios:**
- Menos queries desnecessárias
- Reduz race conditions
- Menor consumo de banda

---

### 🟠 **CORREÇÃO 3: Cache de Workspace**
**Tempo:** 20 min

#### Implementação:
```typescript
// Cache em memória do workspace
let workspaceCache: {
  userId: string
  workspace: Workspace
  timestamp: number
} | null = null

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

const loadWorkspace = async (userId: string) => {
  // Verificar cache primeiro
  if (workspaceCache?.userId === userId) {
    const age = Date.now() - workspaceCache.timestamp
    if (age < CACHE_DURATION) {
      setWorkspace(workspaceCache.workspace)
      return
    }
  }
  
  // Query normal...
  // Após sucesso, cachear
  workspaceCache = { userId, workspace: data, timestamp: Date.now() }
}
```

**Benefícios:**
- Evita re-queries desnecessárias
- Loading instantâneo em navegação
- Reduz carga no Supabase

---

### 🟢 **CORREÇÃO 4: Timeout Robusto com AbortController**
**Tempo:** 25 min

#### Implementação:
```typescript
const loadWorkspace = async (userId: string) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
    console.error('❌ Workspace query timeout após 3s')
    setLoading(false)
  }, 3000) // 3 segundos máximo
  
  try {
    // Queries com signal
    const { data } = await supabase
      .from('fp_usuarios')
      .select('workspace_id')
      .eq('id', userId)
      .single()
      .abortSignal(controller.signal)
    
    clearTimeout(timeoutId)
    // ... resto do código
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Query cancelada por timeout')
    }
    setLoading(false)
  }
}
```

**Benefícios:**
- Timeout garantido em 3 segundos
- Query é realmente cancelada
- Nunca fica travado

---

### 🔵 **CORREÇÃO 5: Loading State com Fallback**
**Tempo:** 20 min

#### Implementação:
```typescript
// Estados mais granulares
const [authState, setAuthState] = useState<
  'idle' | 'loading' | 'authenticated' | 'error' | 'timeout'
>('idle')

// Timeout fallback
useEffect(() => {
  if (authState === 'loading') {
    const timeout = setTimeout(() => {
      setAuthState('timeout')
      // Mostrar botão de retry
    }, 5000)
    return () => clearTimeout(timeout)
  }
}, [authState])

// UI com estados específicos
if (authState === 'timeout') {
  return <TimeoutErrorScreen onRetry={retry} />
}
```

**Benefícios:**
- Usuário nunca fica travado
- Feedback claro do problema
- Opção de retry manual

---

## 📊 MÉTRICAS DE SUCESSO

### Antes:
- ❌ Loading infinito frequente
- ❌ F5 necessário várias vezes
- ❌ Queries travando > 10s
- ❌ Race conditions em logout

### Depois (Meta):
- ✅ Loading máximo: 3 segundos
- ✅ Zero travamentos
- ✅ Queries < 500ms
- ✅ Logout sempre funciona
- ✅ Cache reduz queries em 70%

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO

### FASE 1: Correções Críticas (1h)
1. **[30min]** Correção 1: Query otimizada ⭐
2. **[15min]** Correção 2: SWR Config
3. **[15min]** Teste rápido

### FASE 2: Melhorias de Robustez (1h)
4. **[20min]** Correção 3: Cache workspace
5. **[25min]** Correção 4: Timeout robusto
6. **[15min]** Teste completo

### FASE 3: Polish (30min)
7. **[20min]** Correção 5: Loading states
8. **[10min]** Teste final em produção

---

## 🔧 COMANDOS DE TESTE

```bash
# Após cada correção
npx tsc --noEmit        # Validar TypeScript
npm run build           # Testar build (43s atual)

# Teste de carga local
# Abrir 5 abas simultaneamente
# Fazer login/logout 10x seguidas
# Navegar rapidamente entre páginas
```

---

## 📝 CÓDIGO COMPLETO - CORREÇÃO 1 (MAIS CRÍTICA)

```typescript
// src/contextos/auth-contexto.tsx - linha 134
const loadWorkspace = useCallback(async (userId: string) => {
  try {
    // Validação
    if (!userId || userId.length !== 36) {
      console.warn('UserId inválido:', userId)
      return
    }

    const supabase = createClient()
    
    // NOVA IMPLEMENTAÇÃO - Queries separadas
    console.log('🔍 Buscando workspace do usuário...')
    
    // 1. Buscar workspace_id (query simples)
    const { data: userData, error: userError } = await supabase
      .from('fp_usuarios')
      .select('workspace_id')
      .eq('id', userId)
      .single()
    
    if (userError || !userData?.workspace_id) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }
    
    // 2. Buscar workspace diretamente (sem JOIN)
    const { data: workspaceData, error: wsError } = await supabase
      .from('fp_workspaces')
      .select('*')
      .eq('id', userData.workspace_id)
      .single()
    
    if (wsError) {
      console.error('❌ Erro ao buscar workspace:', wsError)
      return
    }
    
    if (workspaceData) {
      setWorkspace(workspaceData as Workspace)
      console.log('✅ Workspace carregado:', workspaceData.nome)
    }
    
  } catch (error) {
    console.error('❌ Erro geral ao carregar workspace:', error)
  }
}, [])
```

---

## ⚡ AÇÃO IMEDIATA

1. **AGORA:** Implementar Correção 1 (query otimizada)
2. **Testar:** Login/logout 5x para validar
3. **Deploy:** Se funcionar, deploy imediato
4. **Depois:** Implementar outras correções incrementalmente

---

## 🎯 RESULTADO ESPERADO

**Após implementar apenas a Correção 1:**
- 80% dos travamentos devem parar
- Loading < 2 segundos na maioria dos casos
- Sistema utilizável sem F5

**Após todas as correções:**
- 100% dos travamentos resolvidos
- Performance 5x melhor
- UX fluida e profissional

---

**STATUS:** 🟡 Aguardando Implementação
**Última Atualização:** 2025-09-05