# 🚀 PLANO 5X MAIS RÁPIDO - Sistema de Controle Financeiro

## 📋 CONTEXTO DO PROJETO

**Sistema:** Controle Financeiro Pessoal  
**Stack:** Next.js 15.5.2 + TypeScript + Supabase + Tailwind  
**Problema:** Sistema carregando em 2-3 segundos (deveria <500ms)  
**Meta:** **5x mais rápido** através de otimizações de performance  
**Nota Atual:** 6.5/10 → **Meta:** 9/10

### 📊 Diagnóstico Base
- **164 arquivos TypeScript** (9.418 linhas) bem estruturados
- **Código limpo** com arquitetura profissional 
- **Problema:** Gargalos específicos em queries e database
- **Dashboard:** 25-35 requests simultâneos por carregamento

---

## 🎯 OBJETIVOS DE PERFORMANCE

### Tempos Alvo (Antes → Depois)
- **Dashboard:** 2-3s → **<500ms** (6x mais rápido)
- **Lista transações:** 1-2s → **<200ms** (5x mais rápido)
- **Cards resumo:** 1s → **<300ms** (3x mais rápido)
- **Capacidade:** 5 usuários → **50 usuários** simultâneos

### Métricas de Sucesso
- [ ] Dashboard carrega em <500ms
- [ ] Queries database reduzidas de 25+ para <10
- [ ] RLS overhead reduzido em 20-30%
- [ ] Índices otimizados (0 sequential scans)
- [ ] Build time mantido <15s

---

## 📅 CRONOGRAMA DE IMPLEMENTAÇÃO

### **FASE 1: QUICK WINS** (Semana 1)
⏱️ **Duração:** 3-5 dias  
🎯 **Impacto:** **3x mais rápido**  
⚡ **Esforço:** Baixo/Médio

### **FASE 2: OTIMIZAÇÕES DATABASE** (Semana 2)  
⏱️ **Duração:** 5-7 dias  
🎯 **Impacto:** **4x mais rápido**  
⚡ **Esforço:** Médio

### **FASE 3: ARQUITETURA AVANÇADA** (Semana 3)
⏱️ **Duração:** 5-7 dias  
🎯 **Impacto:** **5x mais rápido**  
⚡ **Esforço:** Médio/Alto

### **FASE 4: MONITORAMENTO** (Semana 4)
⏱️ **Duração:** 2-3 dias  
🎯 **Impacto:** Prevenção regressões  
⚡ **Esforço:** Baixo

---

# 🏃‍♂️ FASE 1: QUICK WINS (3-5 dias)

## 🎯 Meta: 3x mais rápido com mudanças simples

### TAREFA 1.1: Otimizar Dashboard Queries (Prioridade CRÍTICA)
**Arquivo:** `src/servicos/supabase/dashboard-queries.ts`  
**Problema:** 4 queries separadas para receitas/despesas  
**Solução:** 1 query com CTEs (Common Table Expressions)

#### ✏️ Implementação Detalhada:

**ANTES (Atual):**
```typescript
// 4 queries separadas
const { data: receitasAtual } = await queryReceitasAtual
const { data: despesasAtual } = await queryDespesasAtual  
const { data: receitasAnterior } = await queryReceitasAnterior
const { data: despesasAnterior } = await queryDespesasAnterior
```

**DEPOIS (Otimizado):**
```typescript
// 1 query unificada com CTEs
const query = `
WITH periodo_atual AS (
  SELECT 
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesas
  FROM fp_transacoes 
  WHERE workspace_id = $1 
    AND status = 'realizado'
    AND data BETWEEN $2 AND $3
),
periodo_anterior AS (
  SELECT 
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesas
  FROM fp_transacoes 
  WHERE workspace_id = $1 
    AND status = 'realizado'
    AND data BETWEEN $4 AND $5
)
SELECT 
  pa.receitas as receitas_atual,
  pa.despesas as despesas_atual,
  pan.receitas as receitas_anterior,
  pan.despesas as despesas_anterior
FROM periodo_atual pa, periodo_anterior pan
`

const { data } = await supabase.rpc('obter_dados_cards_otimizado', {
  workspace_id: workspaceId,
  inicio_atual: periodo.inicio,
  fim_atual: periodo.fim,
  inicio_anterior: periodoAnteriorInicio,
  fim_anterior: periodoAnteriorFim
})
```

#### 📂 Arquivos a Modificar:
1. **Criar função RPC:** Supabase Dashboard → SQL Editor
2. **Atualizar:** `src/servicos/supabase/dashboard-queries.ts`
3. **Validar:** `src/hooks/usar-cards-dados.ts` (sem mudanças)

#### ⏱️ Tempo Estimado: 4-6 horas

---

### TAREFA 1.2: Otimizar Saldos de Contas (Prioridade ALTA)
**Arquivo:** `src/servicos/supabase/dashboard-queries.ts` (função obterSaldosContas)  
**Problema:** 3 queries por conta (normal + transferência entrada + saída)  
**Solução:** 1 query agregada por conta

#### ✏️ Implementação Detalhada:

**Criar função RPC no Supabase:**
```sql
CREATE OR REPLACE FUNCTION obter_saldos_contas_otimizado(workspace_id_param UUID)
RETURNS TABLE(
  conta_id UUID,
  conta_nome TEXT,
  conta_tipo TEXT,
  saldo DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conta_id,
    c.nome as conta_nome,
    c.tipo as conta_tipo,
    COALESCE(
      SUM(CASE 
        WHEN t.conta_id = c.id AND t.tipo = 'receita' THEN t.valor
        WHEN t.conta_id = c.id AND t.tipo = 'despesa' THEN -t.valor
        WHEN t.conta_destino_id = c.id AND t.tipo = 'transferencia' THEN t.valor
        WHEN t.conta_id = c.id AND t.tipo = 'transferencia' THEN -t.valor
        ELSE 0
      END), 0
    ) as saldo
  FROM fp_contas c
  LEFT JOIN fp_transacoes t ON (
    (t.conta_id = c.id OR t.conta_destino_id = c.id) 
    AND t.workspace_id = workspace_id_param 
    AND t.status = 'realizado'
  )
  WHERE c.workspace_id = workspace_id_param
  GROUP BY c.id, c.nome, c.tipo
  ORDER BY c.nome;
END;
$$ LANGUAGE plpgsql;
```

**Atualizar TypeScript:**
```typescript
export async function obterSaldosContas(workspaceId: string): Promise<ContaData[]> {
  const { data, error } = await supabase
    .rpc('obter_saldos_contas_otimizado', { 
      workspace_id_param: workspaceId 
    })
  
  if (error) throw error
  
  return data.map(conta => ({
    id: conta.conta_id,
    nome: conta.conta_nome,
    tipo: conta.conta_tipo,
    saldo: parseFloat(conta.saldo)
  }))
}
```

#### ⏱️ Tempo Estimado: 3-4 horas

---

### TAREFA 1.3: Implementar Batch Loading para Cartões
**Arquivo:** `src/servicos/supabase/dashboard-queries.ts`  
**Problema:** 2 queries por cartão (info + gastos)  
**Solução:** 1 query com LEFT JOIN

#### ✏️ Implementação:

```typescript
export async function obterDadosCartoesOtimizado(workspaceId: string) {
  const { data, error } = await supabase
    .from('fp_contas')
    .select(`
      id,
      nome,
      limite,
      gastos:fp_transacoes!conta_id(valor.sum())
    `)
    .eq('workspace_id', workspaceId)
    .eq('tipo', 'cartao_credito')
    .eq('fp_transacoes.tipo', 'despesa')
    .eq('fp_transacoes.status', 'realizado')
    .gte('fp_transacoes.data', new Date().toISOString().slice(0, 7) + '-01')
  
  if (error) throw error
  
  return data.map(cartao => ({
    id: cartao.id,
    nome: cartao.nome,
    limite: cartao.limite,
    gastos: cartao.gastos?.[0]?.sum || 0,
    disponivel: cartao.limite - (cartao.gastos?.[0]?.sum || 0)
  }))
}
```

#### ⏱️ Tempo Estimado: 2-3 horas

---

### TAREFA 1.4: Otimizar Contexto de Transações  
**Arquivo:** `src/contextos/transacoes-contexto.tsx`  
**Problema:** Re-renders desnecessários  
**Solução:** Memoização avançada

#### ✏️ Implementação:

```typescript
// Adicionar useMemo para valores computados
const contextValue = useMemo(() => ({
  transacoes,
  loading,
  error,
  filtros,
  paginacao,
  setFiltros: useCallback((novosFiltros: FiltrosTransacao) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }))
  }, []),
  atualizarLista: useCallback(async () => {
    if (!workspace?.id) return
    setLoading(true)
    try {
      const resultado = await obterTransacoes(filtros, paginacao, workspace.id)
      setTransacoes(resultado.dados)
      setPaginacao(prev => ({ ...prev, total: resultado.total }))
    } finally {
      setLoading(false)
    }
  }, [filtros, paginacao, workspace?.id])
}), [transacoes, loading, error, filtros, paginacao, workspace?.id])

return (
  <TransacoesContext.Provider value={contextValue}>
    {children}
  </TransacoesContext.Provider>
)
```

#### ⏱️ Tempo Estimado: 2 horas

---

## 📊 Resultado Esperado FASE 1:
- **Dashboard:** 2-3s → **~1s** (3x mais rápido)
- **Queries reduzidas:** 25+ → **~15** (-40%)
- **Cards principais:** 4 queries → **1 query** (-75%)

---

# 🗄️ FASE 2: OTIMIZAÇÕES DATABASE (5-7 dias)

## 🎯 Meta: 4x mais rápido com índices e RLS otimizados

### TAREFA 2.1: Criar Índices Críticos (Prioridade CRÍTICA)
**Local:** Supabase Dashboard → SQL Editor  
**Problema:** 6 Foreign Keys sem índices causando Sequential Scans

#### ✏️ Script SQL para Executar:

```sql
-- Índices para Foreign Keys críticas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_centro_custo_id 
ON fp_transacoes(centro_custo_id) WHERE centro_custo_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_conta_destino_id 
ON fp_transacoes(conta_destino_id) WHERE conta_destino_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_forma_pagamento_id 
ON fp_transacoes(forma_pagamento_id) WHERE forma_pagamento_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_subcategoria_id 
ON fp_transacoes(subcategoria_id) WHERE subcategoria_id IS NOT NULL;

-- Índices compostos para queries frequentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_workspace_tipo_status_data 
ON fp_transacoes(workspace_id, tipo, status, data);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_workspace_conta_status 
ON fp_transacoes(workspace_id, conta_id, status);

-- Índice para transferências
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_workspace_transferencias 
ON fp_transacoes(workspace_id, tipo, conta_id, conta_destino_id) 
WHERE tipo = 'transferencia';
```

#### 📋 Validação dos Índices:
```sql
-- Verificar se índices foram criados
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename = 'fp_transacoes' AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Testar performance de query crítica
EXPLAIN ANALYZE 
SELECT valor, tipo FROM fp_transacoes 
WHERE workspace_id = 'uuid-aqui' 
  AND tipo = 'despesa' 
  AND status = 'realizado' 
  AND data >= '2025-01-01';
```

#### ⏱️ Tempo Estimado: 3-4 horas (incluindo validação)

---

### TAREFA 2.2: Otimizar Políticas RLS
**Local:** Supabase Dashboard → Authentication → Policies  
**Problema:** auth.uid() recalculado para cada linha (+20-30% overhead)

#### ✏️ Implementação Detalhada:

**ANTES (Ineficiente):**
```sql
-- Policy atual (lenta)
CREATE POLICY "Users can view own workspace transactions" ON fp_transacoes
FOR SELECT USING (
  workspace_id IN (
    SELECT workspace_id FROM fp_usuarios 
    WHERE id = auth.uid()
  )
);
```

**DEPOIS (Otimizada):**
```sql
-- 1. Criar função otimizada
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
  SELECT workspace_id FROM fp_usuarios WHERE id = (SELECT auth.uid())
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 2. Atualizar policies para usar função cached
DROP POLICY IF EXISTS "Users can view own workspace transactions" ON fp_transacoes;
CREATE POLICY "Users can view own workspace transactions" ON fp_transacoes
FOR SELECT USING (workspace_id = get_user_workspace_id());

-- 3. Repetir para outras tabelas críticas
DROP POLICY IF EXISTS "Users can view own workspace accounts" ON fp_contas;
CREATE POLICY "Users can view own workspace accounts" ON fp_contas
FOR SELECT USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Users can view own workspace categories" ON fp_categorias;
CREATE POLICY "Users can view own workspace categories" ON fp_categorias
FOR SELECT USING (workspace_id = get_user_workspace_id());
```

#### 📋 Script de Validação:
```sql
-- Testar performance da policy otimizada
EXPLAIN ANALYZE 
SELECT * FROM fp_transacoes 
WHERE data >= '2025-01-01' 
LIMIT 100;
```

#### ⏱️ Tempo Estimado: 4-5 horas

---

### TAREFA 2.3: Remover Índices Duplicados/Não Utilizados
**Local:** Supabase Dashboard → SQL Editor

#### ✏️ Script de Limpeza:

```sql
-- 1. Identificar índices não utilizados
SELECT 
  schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND idx_tup_read = 0 AND idx_tup_fetch = 0
ORDER BY tablename, indexname;

-- 2. Remover índices identificados como não utilizados
-- (CUIDADO: Executar apenas após análise)
DROP INDEX IF EXISTS idx_transacoes_workspace_tipo; -- Exemplo de índice não usado

-- 3. Identificar índices duplicados/redundantes
SELECT 
  a.indexname as index1, 
  b.indexname as index2,
  a.tablename
FROM pg_indexes a
JOIN pg_indexes b ON a.tablename = b.tablename 
  AND a.indexname != b.indexname
  AND a.indexdef LIKE '%' || b.indexname || '%'
WHERE a.schemaname = 'public';
```

#### ⏱️ Tempo Estimado: 2-3 horas

---

### TAREFA 2.4: Implementar Query Hints e Análise
**Arquivo:** `src/servicos/supabase/dashboard-queries.ts`

#### ✏️ Adicionar Logging de Performance:

```typescript
// Adicionar no início do arquivo
const ENABLE_QUERY_LOGGING = process.env.NODE_ENV === 'development'

function logQueryPerformance(queryName: string, startTime: number) {
  if (ENABLE_QUERY_LOGGING) {
    console.log(`⚡ ${queryName}: ${Date.now() - startTime}ms`)
  }
}

// Aplicar em todas as queries principais
export async function obterDadosCards(periodo: Periodo, workspaceId: string) {
  const startTime = Date.now()
  try {
    const result = await supabase.rpc('obter_dados_cards_otimizado', {
      // params...
    })
    logQueryPerformance('Dashboard Cards', startTime)
    return result
  } catch (error) {
    console.error('❌ Dashboard Cards Error:', error)
    throw error
  }
}
```

#### ⏱️ Tempo Estimado: 1-2 horas

---

## 📊 Resultado Esperado FASE 2:
- **Dashboard:** ~1s → **~600ms** (4x mais rápido total)
- **Sequential Scans:** Eliminados (100% index usage)
- **RLS Overhead:** Reduzido de 20-30% para 5-10%

---

# 🏗️ FASE 3: ARQUITETURA AVANÇADA (5-7 dias)

## 🎯 Meta: 5x mais rápido com cache e otimizações avançadas

### TAREFA 3.1: Implementar View Materializada para Dashboard
**Local:** Supabase Dashboard → SQL Editor

#### ✏️ Criar View Materializada:

```sql
-- 1. Criar view materializada para dashboard
CREATE MATERIALIZED VIEW mv_dashboard_summary AS
SELECT 
  workspace_id,
  DATE_TRUNC('day', data) as data_dia,
  tipo,
  status,
  SUM(valor) as total_valor,
  COUNT(*) as total_transacoes
FROM fp_transacoes
WHERE status = 'realizado'
GROUP BY workspace_id, DATE_TRUNC('day', data), tipo, status;

-- 2. Criar índice na view
CREATE INDEX idx_mv_dashboard_summary_workspace_data 
ON mv_dashboard_summary(workspace_id, data_dia, tipo);

-- 3. Função para refresh automático
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para refresh após mudanças
CREATE OR REPLACE FUNCTION trigger_refresh_dashboard()
RETURNS trigger AS $$
BEGIN
  -- Refresh assíncrono para não bloquear
  PERFORM pg_notify('dashboard_refresh', NEW.workspace_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_transacao_change
  AFTER INSERT OR UPDATE OR DELETE ON fp_transacoes
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_dashboard();
```

#### 📂 Atualizar TypeScript:

```typescript
// src/servicos/supabase/dashboard-queries.ts
export async function obterDadosCardsMaterialized(periodo: Periodo, workspaceId: string) {
  const { data, error } = await supabase
    .from('mv_dashboard_summary')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('data_dia', periodo.inicio)
    .lte('data_dia', periodo.fim)
  
  if (error) throw error
  
  // Processar dados agregados no cliente (mais rápido que múltiplas queries)
  return processarDadosCardsMaterialized(data, periodo)
}
```

#### ⏱️ Tempo Estimado: 6-8 horas

---

### TAREFA 3.2: Implementar Cache de Dados Auxiliares
**Arquivo:** `src/contextos/dados-auxiliares-contexto.tsx`

#### ✏️ Implementação de Cache Inteligente:

```typescript
import { useState, useCallback, useMemo } from 'react'

// Cache em memória para dados que mudam pouco
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
const dataCache = new Map<string, { data: any, timestamp: number }>()

function useDataCache<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  
  const fetchWithCache = useCallback(async () => {
    const cached = dataCache.get(key)
    
    // Usar cache se válido
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      setData(cached.data)
      return cached.data
    }
    
    // Buscar dados frescos
    setLoading(true)
    try {
      const freshData = await fetcher()
      dataCache.set(key, { data: freshData, timestamp: Date.now() })
      setData(freshData)
      return freshData
    } finally {
      setLoading(false)
    }
  }, [key, fetcher])
  
  return { data, loading, refetch: fetchWithCache }
}

// Aplicar em categorias, contas, formas de pagamento...
export function useCategoriasCached(workspaceId: string) {
  return useDataCache(
    `categorias-${workspaceId}`,
    () => obterCategorias(workspaceId)
  )
}
```

#### ⏱️ Tempo Estimado: 4-5 horas

---

### TAREFA 3.3: Implementar Lazy Loading para Listas Grandes
**Arquivo:** `src/componentes/transacoes/lista-transacoes.tsx`

#### ✏️ Implementação de Virtual Scrolling:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

export function ListaTransacoesVirtual({ transacoes }: { transacoes: Transacao[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: transacoes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // altura estimada de cada item
    overscan: 10, // itens extras para renderizar fora da tela
  })

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const transacao = transacoes[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <ItemTransacao transacao={transacao} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

#### 📦 Dependências:
```bash
npm install @tanstack/react-virtual
```

#### ⏱️ Tempo Estimado: 3-4 horas

---

### TAREFA 3.4: Otimizar Bundle e Code Splitting
**Arquivo:** `next.config.ts`

#### ✏️ Configurações Avançadas:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações de bundle
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      'recharts'
    ],
  },
  
  // Compressão
  compress: true,
  
  // Otimização de imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Webpack otimizações
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Chunk splitting otimizado
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        supabase: {
          test: /[\\/]node_modules[\\/]@supabase[\\/]/,
          name: 'supabase',
          chunks: 'all',
        },
      },
    }
    
    return config
  },
}

export default nextConfig
```

#### ✏️ Implementar Dynamic Imports:

```typescript
// src/app/(protected)/dashboard/page.tsx
import dynamic from 'next/dynamic'

// Componentes pesados com loading
const GraficoTendencia = dynamic(
  () => import('@/componentes/dashboard/grafico-tendencia'),
  { 
    loading: () => <GraficoSkeleton />,
    ssr: false // Não renderizar no servidor se usar canvas/charts
  }
)

const GraficoCategorias = dynamic(
  () => import('@/componentes/dashboard/grafico-categorias'),
  { loading: () => <GraficoSkeleton /> }
)
```

#### ⏱️ Tempo Estimado: 3-4 horas

---

## 📊 Resultado Esperado FASE 3:
- **Dashboard:** ~600ms → **<500ms** (5x mais rápido total)
- **Bundle size:** Reduzido em 20-30%
- **Cache hit rate:** >80% para dados auxiliares
- **Virtual scrolling:** Listas com 1000+ itens fluidas

---

# 📈 FASE 4: MONITORAMENTO (2-3 dias)

## 🎯 Meta: Prevenir regressões de performance

### TAREFA 4.1: Implementar Performance Monitoring
**Arquivo:** `src/utilitarios/performance-monitor.ts`

#### ✏️ Sistema de Monitoramento:

```typescript
interface PerformanceMetrics {
  queryName: string
  duration: number
  timestamp: number
  userId?: string
  workspaceId?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  
  startQuery(queryName: string, context?: Record<string, any>) {
    const startTime = performance.now()
    
    return {
      end: () => {
        const duration = performance.now() - startTime
        this.recordMetric({
          queryName,
          duration,
          timestamp: Date.now(),
          ...context
        })
        
        // Alert para queries lentas (>1s)
        if (duration > 1000) {
          console.warn(`🐌 Slow query: ${queryName} took ${duration}ms`)
        }
      }
    }
  }
  
  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric)
    
    // Manter apenas últimos 100 registros
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }
  }
  
  getSlowQueries(threshold = 500) {
    return this.metrics.filter(m => m.duration > threshold)
  }
  
  getAverageTime(queryName: string) {
    const queryMetrics = this.metrics.filter(m => m.queryName === queryName)
    if (queryMetrics.length === 0) return 0
    
    const total = queryMetrics.reduce((sum, m) => sum + m.duration, 0)
    return total / queryMetrics.length
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

#### 📂 Integrar no Dashboard:

```typescript
// src/hooks/usar-cards-dados.ts
import { performanceMonitor } from '@/utilitarios/performance-monitor'

export function useCardsData(periodo: Periodo) {
  const { workspace } = useAuth()
  
  return useSWR(
    workspace ? ['dashboard-cards', workspace.id, periodo.inicio, periodo.fim] : null,
    async () => {
      const timer = performanceMonitor.startQuery('dashboard-cards', {
        workspaceId: workspace!.id
      })
      
      try {
        const data = await obterDadosCards(periodo, workspace!.id)
        return data
      } finally {
        timer.end()
      }
    },
    // ... config SWR
  )
}
```

#### ⏱️ Tempo Estimado: 4-5 horas

---

### TAREFA 4.2: Dashboard de Performance (DEV)
**Arquivo:** `src/app/debug/performance/page.tsx`

#### ✏️ Interface de Debug:

```typescript
'use client'

import { performanceMonitor } from '@/utilitarios/performance-monitor'
import { useState, useEffect } from 'react'

export default function PerformanceDebugPage() {
  const [metrics, setMetrics] = useState(performanceMonitor.getSlowQueries())
  const [refresh, setRefresh] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics([...performanceMonitor.getSlowQueries()])
      setRefresh(r => r + 1)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Performance Monitor</h1>
      
      {/* Queries Lentas */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Queries Lentas (&gt;500ms)</h2>
        <div className="space-y-2">
          {metrics.map((metric, i) => (
            <div key={i} className="p-3 border rounded bg-red-50">
              <div className="flex justify-between">
                <span className="font-medium">{metric.queryName}</span>
                <span className="text-red-600 font-bold">{metric.duration.toFixed(0)}ms</span>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(metric.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Médias por Query */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Tempo Médio por Query</h2>
        <div className="grid gap-3">
          {['dashboard-cards', 'saldos-contas', 'transacoes-list'].map(queryName => (
            <div key={queryName} className="p-3 border rounded">
              <span className="font-medium">{queryName}</span>
              <span className="ml-2 text-blue-600">
                {performanceMonitor.getAverageTime(queryName).toFixed(0)}ms avg
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### ⏱️ Tempo Estimado: 3 horas

---

### TAREFA 4.3: Testes de Performance Automatizados
**Arquivo:** `src/__tests__/performance.test.ts`

#### ✏️ Testes Automatizados:

```typescript
import { describe, it, expect, beforeAll } from '@jest/jest'
import { obterDadosCards } from '@/servicos/supabase/dashboard-queries'

describe('Performance Tests', () => {
  beforeAll(async () => {
    // Setup de dados de teste
  })
  
  it('dashboard cards should load in <500ms', async () => {
    const startTime = performance.now()
    
    await obterDadosCards(
      { inicio: '2025-01-01', fim: '2025-01-31' },
      'test-workspace-id'
    )
    
    const duration = performance.now() - startTime
    expect(duration).toBeLessThan(500) // <500ms
  })
  
  it('saldos contas should load in <300ms', async () => {
    // Similar test for saldos...
  })
  
  it('should handle 100 concurrent requests', async () => {
    const promises = Array(100).fill(null).map(() =>
      obterDadosCards(
        { inicio: '2025-01-01', fim: '2025-01-31' },
        'test-workspace-id'
      )
    )
    
    const startTime = performance.now()
    await Promise.all(promises)
    const duration = performance.now() - startTime
    
    // 100 requests em <2s (20ms por request)
    expect(duration).toBeLessThan(2000)
  })
})
```

#### 📦 Configurar Jest:

```json
// package.json
{
  "scripts": {
    "test:perf": "jest --testMatch='**/*.perf.test.ts'"
  }
}
```

#### ⏱️ Tempo Estimado: 4 horas

---

## 📊 Resultado Final FASE 4:
- **Monitoramento ativo** de performance
- **Alertas automáticos** para queries lentas
- **Testes de regressão** para prevenir lentidão
- **Debug tools** para desenvolvimento

---

# 📋 CHECKLIST DE VALIDAÇÃO

## ✅ FASE 1 - Quick Wins
- [ ] Dashboard queries reduzidas de 4 para 1
- [ ] Saldos contas otimizados (1 query por conta → 1 query total)
- [ ] Cartões com batch loading
- [ ] Contexto memoizado
- [ ] **Resultado:** Dashboard em ~1s (3x melhoria)

## ✅ FASE 2 - Database
- [ ] 6 índices críticos criados
- [ ] Políticas RLS otimizadas
- [ ] Índices duplicados removidos
- [ ] Query logging implementado
- [ ] **Resultado:** Dashboard em ~600ms (4x melhoria)

## ✅ FASE 3 - Arquitetura
- [ ] View materializada do dashboard
- [ ] Cache inteligente de dados auxiliares
- [ ] Virtual scrolling nas listas
- [ ] Bundle otimizado e code splitting
- [ ] **Resultado:** Dashboard em <500ms (5x melhoria)

## ✅ FASE 4 - Monitoramento
- [ ] Performance monitor ativo
- [ ] Dashboard de debug criado
- [ ] Testes automatizados de performance
- [ ] **Resultado:** Prevenção de regressões

---

# 🚀 VALIDAÇÃO FINAL

## 📊 Métricas de Sucesso
- [ ] **Dashboard:** <500ms ✅
- [ ] **Lista transações:** <200ms ✅
- [ ] **Cards resumo:** <300ms ✅
- [ ] **Queries totais:** <10 por carregamento ✅
- [ ] **Capacidade:** 50+ usuários simultâneos ✅

## ⚡ Comandos de Teste
```bash
# Validar TypeScript
npx tsc --noEmit

# Testar build
npm run build

# Executar testes de performance
npm run test:perf

# Verificar bundle size
npm run build:analyze
```

## 📈 Resultados Esperados
- **5x mais rápido** que o sistema atual
- **50x mais usuários** suportados simultaneamente
- **Base sólida** para crescimento futuro
- **Experiência fluida** para o usuário final

---

**🎯 OBJETIVO FINAL ALCANÇADO:** Sistema 5x mais rápido mantendo qualidade de código e adicionando ferramentas de monitoramento para prevenir regressões futuras.