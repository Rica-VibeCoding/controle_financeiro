# 📊 Refatoração: Gráfico de Tendência - Dashboard

## 📅 Data: Outubro 2025

## 🎯 Objetivo
Refatorar o gráfico "Tendência - Últimos 6 meses" para exibir **ano vigente completo (12 meses)** com layout full width, seguindo padrão do Portal Representação.

---

## ✅ Mudanças Implementadas

### **FASE 1: Layout Dashboard - Gráfico Full Width**
**Arquivo:** `src/app/(protected)/dashboard/page.tsx`

**Mudança:**
- Gráfico Tendência agora ocupa **largura completa** (2 colunas)
- "Categorias vs Metas" movido para **linha abaixo**

```tsx
// ANTES: Grid 2 colunas lado a lado
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <GraficoTendencia />
  <GraficoCategorias />
</div>

// DEPOIS: Full width + linha separada
<div className="mb-4">
  <GraficoTendencia />
</div>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <GraficoCategorias />
</div>
```

---

### **FASE 4: Layout Dashboard - Reorganização Cards (Contas ao lado)**
**Arquivo:** `src/app/(protected)/dashboard/page.tsx`

**Mudança:**
- **CardSaldosContas** (Contas) movido para **lado direito de Categorias**
- Grid inferior ajustado de 4 para 3 colunas (`xl:grid-cols-3`)

```tsx
// ANTES: Categorias sozinha + 4 cards abaixo
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
  <GraficoCategorias />
</div>
<div className="grid ... xl:grid-cols-4 gap-4">
  <CardProximaConta />
  <CardSaldosContas />  // Era aqui
  <CardCartoesCredito />
  <CardProjetosPessoais />
</div>

// DEPOIS: Categorias + Contas lado a lado
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
  <GraficoCategorias />
  <CardSaldosContas />  // Movido aqui
</div>
<div className="grid ... xl:grid-cols-3 gap-4">
  <CardProximaConta />
  <CardCartoesCredito />
  <CardProjetosPessoais />
</div>
```

---

### **FASE 5: Layout Dashboard - Próximas Contas Empilhado**
**Arquivo:** `src/app/(protected)/dashboard/page.tsx`

**Mudança:**
- **CardProximaConta** movido para **embaixo de Contas** (coluna direita)
- Contas + Próximas agora **empilhados verticalmente** (`space-y-4`)
- Grid inferior reduzido para **2 colunas** (Cartões + Projetos)

```tsx
// ANTES: Contas ao lado + 3 cards abaixo
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
  <GraficoCategorias />
  <CardSaldosContas />
</div>
<div className="grid ... xl:grid-cols-3 gap-4">
  <CardProximaConta />  // Era aqui
  <CardCartoesCredito />
  <CardProjetosPessoais />
</div>

// DEPOIS: Contas + Próximas empilhados
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
  <GraficoCategorias />

  <div className="space-y-4">
    <CardSaldosContas />
    <CardProximaConta />  // Agora embaixo
  </div>
</div>
<div className="grid ... lg:grid-cols-2 gap-4">
  <CardCartoesCredito />
  <CardProjetosPessoais />
</div>
```

---

### **FASE 2: Query - Ano Vigente**
**Arquivo:** `src/servicos/supabase/dashboard-queries.ts`

**Função refatorada:** `obterTendencia(workspaceId: string)`

**Mudanças:**

1. **Período da query:**
   - ❌ ANTES: Últimos 6 meses retroativos
   - ✅ DEPOIS: 1º janeiro até hoje (ano vigente)

2. **Processamento:**
   - Array de **12 meses completos** (jan-dez)
   - Meses futuros preenchidos com `receitas: 0, despesas: 0`
   - Meses sem transações também aparecem com `0`

```typescript
// Query ano vigente
const anoAtual = new Date().getFullYear()
const dataInicio = new Date(anoAtual, 0, 1) // 1º janeiro
const dataFim = new Date() // Hoje

// Loop completa 12 meses
for (let mes = 1; mes <= 12; mes++) {
  const chave = `${anoAtual}-${String(mes).padStart(2, '0')}`
  const dadosMes = meses[chave] || { receitas: 0, despesas: 0 }
  // ...
}
```

**Retorno:**
```typescript
[
  { mes: 'Jan', receitas: 5000, despesas: 3000, saldo: 2000 },
  { mes: 'Fev', receitas: 0, despesas: 0, saldo: 0 }, // Sem dados
  { mes: 'Mar', receitas: 6000, despesas: 4500, saldo: 1500 },
  // ... até Dez (sempre 12 itens)
]
```

---

### **FASE 3: UI/UX - Melhorias Visuais**
**Arquivo:** `src/componentes/dashboard/grafico-tendencia.tsx`

**Mudanças:**

1. **Linha de Referência (Mês Atual):**
   - Importado `ReferenceLine` do recharts
   - Linha vertical laranja (`#f59e0b`) tracejada
   - Label "Hoje" no topo

```tsx
<ReferenceLine
  x={mesAtual}
  stroke="#f59e0b"
  strokeDasharray="3 3"
  strokeWidth={2}
  label={{
    value: 'Hoje',
    position: 'top',
    fill: '#f59e0b',
    fontSize: 12,
    fontWeight: 600
  }}
/>
```

2. **Título atualizado:**
   - "Tendência - Últimos 6 meses" → **"Tendência - Ano 2025"**
   - Ano dinâmico: `{anoAtual}`

3. **Altura otimizada:**
   - Container: `h-80` → `h-96` (mais espaço vertical)
   - Área do gráfico: `h-64` → `h-80`
   - Skeleton ajustado: `h-96`

---

## 📁 Arquivos Modificados

1. ✅ `src/app/(protected)/dashboard/page.tsx` - Layout dashboard (Fases 1, 4 e 5)
2. ✅ `src/servicos/supabase/dashboard-queries.ts` - Query ano vigente (Fase 2)
3. ✅ `src/componentes/dashboard/grafico-tendencia.tsx` - Melhorias visuais (Fase 3)

---

## 🔍 Validações Realizadas

- ✅ TypeScript: **SEM ERROS** (validado com `npx tsc --noEmit`)
- ✅ RLS mantido (isolamento por `workspace_id`)
- ✅ Interface `TendenciaData[]` sem breaking changes
- ✅ Compatibilidade com código existente
- ✅ Mobile responsivo mantido

---

## 📊 Resultado Visual

### ANTES:
```
┌──────────────┬──────────────┐
│ Tendência 6m │ Categorias   │
└──────────────┴──────────────┘
┌────────┬────────┬────────┬────────┐
│Próximas│ Contas │Cartões │Projetos│
└────────┴────────┴────────┴────────┘
```

### DEPOIS:
```
┌───────────────────────────────────┐
│ Tendência - Ano 2025              │
│ [12 meses com linha ref. "Hoje"]  │
└───────────────────────────────────┘

┌──────────────────┬────────────────┐
│                  │    Contas      │
│   Categorias     ├────────────────┤
│                  │   Próximas     │
└──────────────────┴────────────────┘

┌──────────────────┬────────────────┐
│    Cartões       │   Projetos     │
└──────────────────┴────────────────┘
```

---

## 🎨 Características Visuais

### Gráfico de Tendência:
- ✅ **12 meses completos** (Jan-Dez)
- ✅ **Linha de referência** no mês atual (laranja tracejada)
- ✅ **Label "Hoje"** indicando mês corrente
- ✅ **Meses futuros** exibidos com valor 0
- ✅ **Altura maior** para melhor visualização (h-96)
- ✅ **Full width** - aproveita espaço horizontal

### Layout Dashboard:
- ✅ **Tendência**: Full width (2 colunas)
- ✅ **Categorias**: Coluna esquerda
- ✅ **Contas + Próximas**: Coluna direita (empilhados com `space-y-4`)
- ✅ **Cards inferiores**: 2 colunas (Cartões + Projetos)
- ✅ **Responsivo**: Mobile empilha tudo verticalmente

---

## 🔗 Inspiração

Baseado no gráfico **"Evolução Faturamento"** do Portal Representação:
- Arquivo: `Portal Representação/src/components/dashboard/fase2-analise/GraficoTemporalMultiplo.tsx`
- Linha de referência no mês atual
- Ano vigente completo (12 meses)

---

## 📝 Notas Técnicas

### Cache SWR
- Configuração mantida: `refreshInterval: 300000` (5 min)
- Dados históricos com cache mais agressivo
- Hook: `usar-tendencia-dados.ts`

### Performance
- Query pode buscar mais dados (ano inteiro vs 6 meses)
- Impacto mínimo: processamento em memória eficiente
- Índice existente em `fp_transacoes.data` otimiza query

### Segurança
- RLS ativo em todas as queries
- Isolamento total por `workspace_id`
- Sem alteração de políticas de segurança

---

## ✅ Checklist Final

- [x] Gráfico ocupa 2 colunas (full width)
- [x] Exibe 12 meses (Jan-Dez do ano atual)
- [x] Meses futuros mostram valor 0
- [x] Linha de referência no mês atual
- [x] Tooltip funciona em todos os meses
- [x] Layout responsivo em mobile
- [x] TypeScript sem erros
- [x] Performance mantida
- [x] Segurança RLS mantida

---

**Status:** ✅ **CONCLUÍDO**
