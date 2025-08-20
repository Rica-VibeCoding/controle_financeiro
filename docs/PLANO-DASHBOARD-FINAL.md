# 🚀 PLANO DASHBOARD DEFINITIVO - GUIA COMPLETO

**Data:** 20/08/2025  
**Desenvolvedor:** Ricardo  
**Objetivo:** Dashboard financeiro moderno com dados reais do Supabase

---

## 🎯 DECISÕES TÉCNICAS FINAIS

### **Stack Tecnológico:**
- ✅ **Next.js + TypeScript + Tailwind CSS**
- ✅ **Recharts** (ao invés de Chart.js)
- ✅ **Lucide React** (ícones como componentes)
- ✅ **SWR** (data fetching otimizado para dashboards)
- ✅ **Supabase direto** (sem dados mockados)

### **Layout e Visual:**
- ✅ **Baseado 100% no dashboard.html** (referência visual)
- ✅ **Container 1440px** (max-w-[1440px])
- ✅ **Animações CSS customizadas** (slideUp, gradientes)
- ✅ **Glassmorphism** no header

### **Roteamento:**
- ✅ **Arquivo principal:** `src/app/dashboard/page.tsx`
- ✅ **Rota final:** `http://localhost:3000/dashboard`
- ✅ **Redirect:** `/` → `/dashboard`

---

## 📊 ESTRUTURA DE DADOS (do dashboard.html)

### **Interfaces TypeScript:**
```typescript
interface DashboardData {
  periodo: {
    mes: string
    ano: number
    inicio: string // '2025-08-01'
    fim: string    // '2025-08-31'
  }
  cards: {
    receitas: {
      atual: number
      anterior: number
      percentual: number
      tendencia: number[] // últimos 7 dias
    }
    despesas: {
      atual: number
      anterior: number
      percentual: number
      tendencia: number[] // últimos 7 dias
    }
    saldo: {
      atual: number
      anterior: number
      percentual: number
      tendencia: number[] // últimos 7 dias
    }
    gastosCartao: {
      atual: number      // total usado
      limite: number     // total limites
      percentual: number // (usado/limite)*100
      tendencia: number[] // últimos 7 dias
    }
  }
  proximasContas: Array<{
    nome: string
    valor: number
    dias: number
    urgencia: 'alta' | 'media' | 'baixa'
  }>
  categorias: Array<{
    nome: string
    gasto: number
    meta: number
    cor: string
    percentual: number // (gasto/meta)*100
  }>
  cartoes: Array<{
    nome: string
    usado: number
    limite: number
    vencimento: string // 'DD/MM'
    percentual: number // (usado/limite)*100
  }>
  contas: Array<{
    nome: string
    saldo: number
    tipo: string
  }>
  tendencia: Array<{
    mes: string // 'Mar', 'Abr'
    saldo: number
  }>
}
```

---

## 🏗️ ARQUITETURA TÉCNICA

### **Estrutura de Arquivos:**
```
src/
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # 🎯 COMPONENTE PRINCIPAL
│   ├── layout.tsx                # Layout global
│   └── page.tsx                  # Redirect para /dashboard
│
├── componentes/
│   ├── dashboard/
│   │   ├── card-metrica.tsx      # Card reutilizável (4 cards)
│   │   ├── card-proxima-conta.tsx # Card próximas contas
│   │   ├── filtro-periodo.tsx    # Navegação mês/ano
│   │   ├── grafico-categorias.tsx # Barras horizontais (Recharts)
│   │   ├── grafico-cartoes.tsx   # Barras verticais (Recharts)
│   │   ├── grafico-contas.tsx    # Saldos contas (Recharts)
│   │   └── grafico-tendencia.tsx # Linha evolutiva (Recharts)
│   └── ui/                       # shadcn/ui components
│
├── hooks/
│   ├── usar-cards-dados.ts       # Hook SWR para cards de métricas
│   ├── usar-categorias-dados.ts  # Hook SWR para categorias vs metas
│   ├── usar-cartoes-dados.ts     # Hook SWR para cartões de crédito
│   ├── usar-contas-dados.ts      # Hook SWR para saldos das contas
│   ├── usar-tendencia-dados.ts   # Hook SWR para gráfico tendência
│   └── usar-proximas-contas.ts   # Hook SWR para próximas contas
│
├── servicos/
│   └── supabase/
│       ├── cliente.ts            # Configuração Supabase existente
│       └── dashboard-queries.ts  # Queries específicas dashboard
│
└── tipos/
    └── dashboard.ts              # Interfaces TypeScript
```

### **Arquitetura SWR (Nova Abordagem):**
```typescript
// Cada componente usa seu próprio hook SWR
const { data: cards, error, isLoading } = useCardsData(periodo)
const { data: categorias } = useCategoriasData(periodo)
const { data: tendencia } = useTendenciaData() // não depende de período

// SWR Configuration global
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 60000, // 1 minuto para dados financeiros
  dedupingInterval: 10000 // evita requests duplicados
}
```

---

## 🔍 REGRAS DE NEGÓCIO DEFINITIVAS

### **Filtro de Período:**
- **Padrão:** Sempre abre no mês atual (Agosto 2025)
- **Navegação:** Setas < > para mudar mês/ano
- **Reatividade:** Todos os dados se atualizam quando muda período

### **Cards de Métricas (4):**
1. **Receitas:** Soma transações `tipo='receita'` no período
2. **Despesas:** Soma transações `tipo='despesa'` no período  
3. **Saldo:** `receitas - despesas` do período
4. **Cartões:** Soma `usado` de todos os cartões

**Comparativo:** vs mês anterior + percentual + sparkline 7 dias

### **Cartões de Crédito:**
- **Filtro:** `fp_contas.tipo = 'cartao_credito'`
- **Saldo cartão:** `limite - usado` (disponível)
- **Top 5:** Ordenar por valor usado (maior primeiro)
- **Fatura:** Transações do período filtrado

### **Contas Bancárias:**
- **Filtro:** `fp_contas.tipo != 'cartao_credito'`
- **Saldo:** Valor atual da conta
- **Top 3:** Ordenar por saldo (maior primeiro)

### **Próximas Contas:**
- **Fonte:** Transações pendentes (`status='pendente'`)
- **Ordenação:** Por data_vencimento (mais próxima primeiro)
- **Urgência:** 
  - Alta: ≤ 3 dias (vermelho)
  - Média: 4-7 dias (laranja)  
  - Baixa: > 7 dias (cinza)

### **Categorias vs Metas:**
- **Gastos:** Soma despesas por categoria no período
- **Metas:** `fp_metas_mensais` ativas do mês
- **Visual:** Barras horizontais ordenadas por gasto

### **Tendência:**
- **Período:** Últimos 6 meses fechados
- **Cálculo:** Saldo final de cada mês
- **Visual:** LineChart suave (Recharts)

---

## 🚀 FASES DE IMPLEMENTAÇÃO

### **FASE 1: Estrutura Base (1 hora) ✅ CONCLUÍDA**
**Objetivo:** Criar arquitetura + SWR configurado

**Tarefas:**
1. **✅ Instalar dependências:**
   ```bash
   npm install swr recharts lucide-react date-fns
   ```

2. **✅ Criar arquivos base:**
   - ✅ `src/tipos/dashboard.ts` - Interfaces TypeScript
   - ✅ `src/servicos/supabase/dashboard-queries.ts` - Queries
   - ✅ `src/hooks/usar-cards-dados.ts` - Hook SWR para cards
   - ✅ `src/hooks/usar-periodo.ts` - Hook para gerenciar período

3. **✅ CSS customizado:**
   - ✅ Adicionar classes do HTML no `globals.css`
   - ✅ `.glass`, `.gradient-*`, `@keyframes slideUp`

4. **✅ SWR Provider:**
   - ✅ Configurar `SWRConfig` no layout principal
   - ✅ Configurar cache e revalidation

5. **✅ Página Dashboard:**
   - ✅ `src/app/dashboard/page.tsx` - Página temporária
   - ✅ Redirect `/` → `/dashboard`

**✅ Entregável:** Estrutura funcionando + SWR configurado + Dashboard acessível

---

### **FASE 2: Cards de Métricas (1 hora) ✅ CONCLUÍDA**
**Objetivo:** 4 cards com dados reais + comparativo

**Tarefas:**
1. **✅ Componente reutilizável:**
   - ✅ `src/componentes/dashboard/card-metrica.tsx`
   - ✅ Props: título, valor, ícone, percentual, sparkline
   - ✅ Estados: loading (skeleton), dados

2. **✅ Dashboard principal:**
   - ✅ `src/app/dashboard/page.tsx`
   - ✅ Grid responsivo 4 cards
   - ✅ Integração com hooks SWR

3. **✅ Queries de dados:**
   - ✅ Receitas/despesas por período
   - ✅ Comparativo mês anterior
   - ✅ **REFATORAÇÃO:** Query cartões corrigida (limites únicos)
   - ⏳ Sparklines (últimos 7 dias) - TODO para próxima fase

4. **✅ Validações e correções:**
   - ✅ TypeScript sem erros
   - ✅ Query cartões otimizada (evita duplicação de limites)
   - ✅ Cálculo percentual correto (50% = R$ 4.000/R$ 8.000)

**✅ Entregável:** 4 cards funcionando com dados reais validados

---

### **FASE 3: Gráficos + Cards Secundários (1.5 horas)**
**Objetivo:** Todos os gráficos + cards menores

**Tarefas:**
1. **Gráfico Tendência:**
   - `src/componentes/dashboard/grafico-tendencia.tsx`
   - Recharts LineChart (últimos 6 meses)

2. **Gráfico Categorias:**
   - `src/componentes/dashboard/grafico-categorias.tsx` 
   - Barras horizontais simples (sem meta inicialmente)

3. **Cards secundários:**
   - `src/componentes/dashboard/card-proxima-conta.tsx`
   - Cards saldos contas + cartões (visual do HTML)

**Entregável:** Dashboard visual completo

---

### **FASE 4: Filtro + Polimento (30 min)**
**Objetivo:** Filtro funcional + refinamentos

**Tarefas:**
1. **Filtro período:**
   - `src/componentes/dashboard/filtro-periodo.tsx`
   - Navegação < Agosto 2025 >

2. **Performance:**
   - Loading states elegantes
   - Error boundaries
   - Otimização queries

**Entregável:** Dashboard completo e polido

---

## 💾 CACHE E PERFORMANCE (Arquitetura SWR)

### **SWR - Melhores Práticas para Dashboards:**
```typescript
// Hooks especializados por feature
const useCardsData = (periodo) => {
  return useSWR(
    ['cards', periodo.inicio, periodo.fim], 
    () => obterDadosCards(periodo),
    {
      refreshInterval: 60000, // 1 minuto
      revalidateOnFocus: false, // não refetch ao focar
      dedupingInterval: 10000 // evita requests duplicados
    }
  )
}

const useTendenciaData = () => {
  return useSWR(
    'tendencia-6-meses',
    obterTendencia,
    {
      refreshInterval: 300000, // 5 minutos (dados históricos)
      revalidateOnMount: false // cache mais agressivo
    }
  )
}
```

### **Vantagens do SWR:**
✅ **Performance otimizada** - cache inteligente por query  
✅ **Background revalidation** - dados sempre atualizados  
✅ **Deduplicação automática** - evita requests duplicados  
✅ **Error boundaries** - tratamento individual de erros  
✅ **Granularidade** - cada componente controla seu loading  
✅ **Recomendado para dashboards** - padrão de mercado 2025

---

## 🎨 VISUAL FINAL (do dashboard.html)

### **Layout Exato:**
- Header sticky com glassmorphism
- 4 cards em grid responsivo
- 2ª linha: Tendência (2 cols) + Categorias (2 cols, alta)
- 3ª linha: Saldos Contas (1 col) + Próximas (1 col) + Cartões (2 cols)

### **Cores e Estilo:**
- Verde: receitas, saldos positivos
- Vermelho: despesas, saldos negativos  
- Azul: saldo geral, tendência
- Roxo: cartões
- Animações slideUp com delays

---

## 📋 QUERIES SUPABASE NECESSÁRIAS

### **Cards Principais:**
```sql
-- Receitas do período
SELECT SUM(valor) FROM fp_transacoes 
WHERE tipo='receita' AND data BETWEEN ? AND ? AND status='realizado'

-- Despesas do período  
SELECT SUM(valor) FROM fp_transacoes
WHERE tipo='despesa' AND data BETWEEN ? AND ? AND status='realizado'

-- Cartões: usado no período
SELECT c.nome, c.limite, SUM(t.valor) as usado
FROM fp_contas c
LEFT JOIN fp_transacoes t ON t.conta_id = c.id
WHERE c.tipo = 'cartao_credito' AND t.data BETWEEN ? AND ?
GROUP BY c.id, c.nome, c.limite
```

### **Próximas Contas:**
```sql
-- Transações pendentes
SELECT descricao, valor, data_vencimento
FROM fp_transacoes
WHERE status='pendente' AND data_vencimento >= CURRENT_DATE
ORDER BY data_vencimento ASC
LIMIT 10
```

### **Categorias vs Metas:**
```sql
-- Gastos por categoria
SELECT c.nome, SUM(t.valor) as gasto, m.valor as meta
FROM fp_categorias c
LEFT JOIN fp_transacoes t ON t.categoria_id = c.id
LEFT JOIN fp_metas_mensais m ON m.categoria_id = c.id
WHERE t.tipo='despesa' AND t.data BETWEEN ? AND ?
GROUP BY c.id, c.nome, m.valor
```

### **Tendência (6 meses):**
```sql
-- Saldo por mês (últimos 6)
SELECT 
  DATE_TRUNC('month', data) as mes,
  SUM(CASE WHEN tipo='receita' THEN valor ELSE -valor END) as saldo
FROM fp_transacoes
WHERE data >= (CURRENT_DATE - INTERVAL '6 months')
GROUP BY DATE_TRUNC('month', data)
ORDER BY mes
```

---

## 🎨 EXEMPLO DE COMPONENTES (baseado dashboard.html)

### **Card Métrica:**
```typescript
interface CardMetricaProps {
  titulo: string
  valor: number
  icone: string
  percentual: number
  cor: 'green' | 'red' | 'blue' | 'purple'
  loading?: boolean
}

export function CardMetrica({ titulo, valor, icone, percentual, cor, loading }: CardMetricaProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-3"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    )
  }

  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 card-hover animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-10 h-10 ${colorClasses[cor]} rounded-lg flex items-center justify-center`}>
            {/* Ícone Lucide React aqui */}
          </div>
          <span className="text-sm font-medium text-gray-600">{titulo}</span>
        </div>
        <span className={`text-xs px-2 py-1 ${colorClasses[cor]} rounded-full font-medium`}>
          {percentual > 0 ? '+' : ''}{percentual}%
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">
          {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>
    </div>
  )
}
```

---

## 🚀 IMPLEMENTAÇÃO - 4 FASES

### **FASE 1: Base (1h)**
- Estrutura de arquivos
- Context API + hooks
- CSS customizado

### **FASE 2: Cards (1h)**  
- 4 cards de métricas
- Dados reais Supabase
- Comparativo mês anterior

### **FASE 3: Gráficos (1.5h)**
- Recharts LineChart (tendência)
- Cards secundários (contas, cartões)
- Gráfico categorias

### **FASE 4: Filtro (30min)**
- Filtro período funcional
- Loading states
- Error handling

---

## ✅ CHECKLIST DE COMPATIBILIDADE

### **Com o Código Existente:**
- [x] Usa `src/servicos/supabase/cliente.ts` existente
- [x] Integra com `fp_transacoes`, `fp_contas`, `fp_metas_mensais`
- [x] Segue padrões de nomenclatura do projeto
- [x] Usa LayoutPrincipal existente

### **Com dashboard.html:**
- [x] Layout idêntico (grid, posições, tamanhos)
- [x] Cores exatas (gradientes, classes CSS)
- [x] Animações slideUp preservadas
- [x] Container 1440px mantido

### **Performance e Qualidade:**
- [x] SWR otimizado para dashboards (padrão 2025)
- [x] Cache inteligente por feature
- [x] Background revalidation automática
- [x] TypeScript 100% tipado
- [x] Loading states granulares
- [x] Error handling individual por componente

---

## 🎯 EXEMPLO DE HOOKS SWR

### **Hook para Cards de Métricas:**
```typescript
// src/hooks/usar-cards-dados.ts
import useSWR from 'swr'
import { obterDadosCards } from '@/servicos/supabase/dashboard-queries'

export function useCardsData(periodo: { inicio: string; fim: string }) {
  return useSWR(
    ['dashboard-cards', periodo.inicio, periodo.fim],
    () => obterDadosCards(periodo),
    {
      refreshInterval: 60000, // 1 minuto
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}
```

### **Hook para Período (Estado Global):**
```typescript
// src/hooks/usar-periodo.ts
import { useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export function usePeriodo() {
  const [data, setData] = useState(new Date()) // Mês atual
  
  const periodo = {
    inicio: format(startOfMonth(data), 'yyyy-MM-dd'),
    fim: format(endOfMonth(data), 'yyyy-MM-dd'),
    mes: format(data, 'MMMM'),
    ano: format(data, 'yyyy')
  }
  
  const mudarMes = (direcao: 'anterior' | 'proximo') => {
    setData(prev => {
      const novaData = new Date(prev)
      if (direcao === 'anterior') {
        novaData.setMonth(prev.getMonth() - 1)
      } else {
        novaData.setMonth(prev.getMonth() + 1)
      }
      return novaData
    })
  }
  
  return { periodo, mudarMes }
}
```

### **Uso no Dashboard:**
```typescript
// src/app/dashboard/page.tsx
'use client'
import { useCardsData } from '@/hooks/usar-cards-dados'
import { usePeriodo } from '@/hooks/usar-periodo'

export default function DashboardPage() {
  const { periodo, mudarMes } = usePeriodo()
  const { data: cards, error, isLoading } = useCardsData(periodo)
  
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8">
      {/* Filtro de período */}
      <FiltroPeriodo periodo={periodo} onMudarMes={mudarMes} />
      
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardMetrica 
          titulo="Receitas"
          valor={cards?.receitas.atual}
          loading={isLoading}
          error={error}
        />
        {/* outros cards... */}
      </div>
    </div>
  )
}
```

---

**🎯 ARQUITETURA ATUALIZADA! SWR + Performance otimizada + Padrões 2025**