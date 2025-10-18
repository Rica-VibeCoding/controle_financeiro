# 🔧 REFATORAÇÃO DO SISTEMA DE RELATÓRIOS

**Data de criação:** 2025-10-17
**Última atualização:** 2025-10-17
**Status:** 🟢 Em andamento (FASE 2 concluída)
**Prioridade:** 🔴 CRÍTICA
**Tempo estimado:** 9-11 horas (FASE 1 não necessária - funções SQL já existem)

---

## 📋 CONTEXTO ATUALIZADO (2025-10-17)

### Situação Real Após Investigação

O sistema possui **1 relatório implementado e 2 planejados**:

1. ✅ **ROI por Cliente** (`/relatorios/roi-cliente`) - **IMPLEMENTADO e FUNCIONANDO**
   - Commit: `a8e1db3` (relatorio_roi cliente)
   - Status: ✅ Funções SQL corrigidas em 2025-10-17
   - Dados: 3 clientes com movimentações (Helio Martin, Fernando, Conecta)

2. ❌ **Fluxo de Caixa Projetado** (`/relatorios/fluxo-caixa`) - **NÃO IMPLEMENTADO**
   - Status: Planejado mas nunca criado
   - Arquivos: Não existem no git

3. ❌ **Contas a Pagar/Receber** (`/relatorios/contas`) - **NÃO IMPLEMENTADO**
   - Status: Planejado mas nunca criado
   - Arquivos: Não existem no git

### Problemas Identificados

**🔴 CRÍTICOS (Impedem funcionamento):**
- 6 funções SQL faltando no banco de dados (ROI e Fluxo de Caixa não funcionam)
- 546 linhas de código duplicado (25% do total)

**🟡 IMPORTANTES (Reduzem qualidade):**
- 11 ocorrências de `console.error` ao invés de `logger.ts`
- Arquivo órfão `cache-manager.ts` não utilizado

### Análise Detalhada

Ver: `docs/desenvolvimento/RELATORIO-SAUDE-CODIGO-RELATORIOS.md`

---

## 🎯 OBJETIVOS DA REFATORAÇÃO

### Metas Principais

1. **Funcionalidade Completa:** Criar 6 funções SQL para ROI e Fluxo de Caixa funcionarem
2. **Redução de Duplicação:** Eliminar 546 linhas de código duplicado
3. **Padronização:** Usar `logger.ts` e `cache-manager.ts` centralizados
4. **Manutenibilidade:** Consolidar lógica em utilitários reutilizáveis

### Ganhos Esperados

- ✅ 3 relatórios 100% funcionais em produção
- ✅ Código 25% menor (~546 linhas removidas)
- ✅ Manutenção em 1 único lugar (ao invés de 3-12 lugares)
- ✅ Logs estruturados via `logger.ts`
- ✅ Cache unificado via `CacheManager`
- ✅ Facilidade para criar novos relatórios

---

## 📂 ESTRUTURA DE ARQUIVOS

### Arquivos Existentes (Não Modificar Estrutura)

```
src/
├── app/(protected)/relatorios/
│   ├── page.tsx                    # Hub de seleção (3 cards)
│   ├── roi-cliente/
│   │   └── page.tsx               # Página ROI
│   ├── fluxo-caixa/
│   │   └── page.tsx               # Página Fluxo de Caixa
│   └── contas/
│       └── page.tsx               # Página Contas
│
├── componentes/relatorios/
│   ├── card-relatorio.tsx         # Card genérico de seleção
│   ├── roi-cliente/               # 5 componentes ROI
│   │   ├── cards-kpi.tsx
│   │   ├── filtros-roi.tsx
│   │   ├── grafico-evolucao.tsx
│   │   ├── linha-cliente-expandida.tsx
│   │   └── tabela-roi.tsx
│   ├── fluxo-caixa/               # 4 componentes Fluxo
│   │   ├── cards-kpi.tsx
│   │   ├── filtros-fluxo-caixa.tsx
│   │   ├── grafico-previsto-realizado.tsx
│   │   └── tabela-variacao.tsx
│   └── contas/                    # 4 componentes Contas
│       ├── cards-resumo.tsx
│       ├── filtros-contas.tsx
│       ├── linha-conta.tsx
│       └── tabela-contas.tsx
│
├── hooks/
│   ├── usar-roi-clientes.ts       # Hook ROI com SWR
│   ├── usar-fluxo-caixa.ts        # Hook Fluxo com SWR
│   └── usar-contas-pagar-receber.ts # Hook Contas com SWR
│
├── servicos/supabase/
│   ├── roi-cliente-queries.ts     # Queries ROI
│   ├── fluxo-caixa-queries.ts     # Queries Fluxo
│   └── contas-queries.ts          # Queries Contas
│
├── tipos/
│   ├── roi-cliente.ts             # Tipos ROI
│   ├── fluxo-caixa.ts             # Tipos Fluxo
│   └── contas.ts                  # Tipos Contas
│
├── app/api/
│   ├── roi-clientes/route.ts      # API ROI
│   ├── fluxo-caixa/route.ts       # API Fluxo
│   └── contas/route.ts            # API Contas
│
└── utilitarios/
    ├── cache-manager.ts           # ⚠️ Existe mas não usado
    ├── logger.ts                  # ✅ Deve ser usado
    └── formatacao.ts              # ✅ Deve ser usado
```

### Arquivos a Criar

```
sql/
└── relatorios/
    ├── functions-roi-cliente.sql       # 4 functions ROI
    └── functions-fluxo-caixa.sql       # 2 functions Fluxo

src/utilitarios/
└── periodo-helpers.ts                  # Novo: cálculo de datas
```

---

## 🔍 PROBLEMAS DETALHADOS

### 1. SQL Functions Faltando (BLOQUEADOR)

**Funções ROI não existem:**
```typescript
// src/servicos/supabase/roi-cliente-queries.ts
supabase.rpc('calcular_roi_clientes')           // ❌ NÃO EXISTE
supabase.rpc('calcular_kpis_roi_clientes')      // ❌ NÃO EXISTE
supabase.rpc('buscar_detalhes_roi_cliente')     // ❌ NÃO EXISTE
supabase.rpc('buscar_evolucao_roi_cliente')     // ❌ NÃO EXISTE
```

**Funções Fluxo de Caixa não existem:**
```typescript
// src/servicos/supabase/fluxo-caixa-queries.ts
supabase.rpc('calcular_fluxo_caixa')            // ❌ NÃO EXISTE
supabase.rpc('calcular_kpis_fluxo_caixa')       // ❌ NÃO EXISTE
```

**Contas:** ✅ Usa queries diretas (não precisa de functions)

**Impacto:** Relatórios ROI e Fluxo de Caixa retornam erro 500 em produção

---

### 2. Duplicação: Cálculo de Datas (12 ocorrências)

**Código duplicado em 3 arquivos:**

1. `src/servicos/supabase/roi-cliente-queries.ts` - **4 vezes** (linhas 13-45, 120-148, 187-219, 250-278)
2. `src/servicos/supabase/fluxo-caixa-queries.ts` - **2 vezes** (linhas 13-39, 78-101)
3. `src/servicos/supabase/contas-queries.ts` - **2 vezes** (linhas 28-44, 124-140)

**Total:** ~400 linhas duplicadas

**Exemplo do código repetido:**
```typescript
// REPETIDO 12 VEZES!
const hoje = new Date()
let dataInicio: string | null = null
let dataFim: string | null = null

switch (filtros.periodo) {
  case 'mes_atual':
    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString().split('T')[0]
    dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      .toISOString().split('T')[0]
    break
  case '3_meses':
    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1)
      .toISOString().split('T')[0]
    dataFim = hoje.toISOString().split('T')[0]
    break
  case '6_meses':
    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1)
      .toISOString().split('T')[0]
    dataFim = hoje.toISOString().split('T')[0]
    break
  case '1_ano':
    dataInicio = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1)
      .toISOString().split('T')[0]
    dataFim = hoje.toISOString().split('T')[0]
    break
  case '12_meses': // Para Fluxo de Caixa
    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1)
      .toISOString().split('T')[0]
    dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      .toISOString().split('T')[0]
    break
  case '30_dias': // Para Contas
    dataInicio = hoje.toISOString().split('T')[0]
    dataFim = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]
    break
  case 'personalizado':
    dataInicio = filtros.dataInicio || null
    dataFim = filtros.dataFim || null
    break
  default:
    dataInicio = null
    dataFim = null
}
```

---

### 3. Duplicação: Sistema de Cache (3 implementações)

**Cada hook tem seu próprio sistema de cache:**

**`usar-roi-clientes.ts` (linhas 8-72):**
```typescript
const CACHE_KEY_CLIENTES = 'fp_roi_clientes_cache'
const CACHE_KEY_KPIS = 'fp_roi_kpis_cache'
const CACHE_DURATION = 5 * 60 * 1000

function salvarROIClientesCache(data: ClienteROI[], workspaceId: string, filtros: FiltrosROI) {
  // ... 20 linhas
}

function carregarROIClientesCache(workspaceId: string, filtros: FiltrosROI): ClienteROI[] | undefined {
  // ... 25 linhas
}

function salvarKPIsCache(data: CardKPI, workspaceId: string) {
  // ... 15 linhas
}

function carregarKPIsCache(workspaceId: string): CardKPI | undefined {
  // ... 20 linhas
}
```

**`usar-fluxo-caixa.ts` (linhas 8-74):**
```typescript
// CÓDIGO QUASE IDÊNTICO
const CACHE_KEY_DADOS = 'fp_fluxo_caixa_dados_cache'
const CACHE_KEY_KPIS = 'fp_fluxo_caixa_kpis_cache'
const CACHE_DURATION = 5 * 60 * 1000

function salvarDadosCache(data: DadosFluxoCaixa[], workspaceId: string, filtros: FiltrosFluxoCaixa) {
  // ... 20 linhas (idênticas)
}
// ... etc
```

**`usar-contas-pagar-receber.ts` (linhas 8-101):**
```typescript
// CÓDIGO QUASE IDÊNTICO
const CACHE_KEY_RESUMO = 'fp_contas_resumo_cache'
const CACHE_KEY_A_PAGAR = 'fp_contas_a_pagar_cache'
const CACHE_KEY_A_RECEBER = 'fp_contas_a_receber_cache'
const CACHE_DURATION = 5 * 60 * 1000

function salvarResumoCache(data: ResumoContas, workspaceId: string) {
  // ... 15 linhas (idênticas)
}
// ... etc
```

**Total:** ~120 linhas duplicadas

---

### 4. Duplicação: Formatação de Valores (3 ocorrências)

**Função idêntica em 3 arquivos:**

```typescript
// src/componentes/relatorios/roi-cliente/cards-kpi.tsx (linhas 13-18)
const formatarValor = (valor: number): string => {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// src/componentes/relatorios/fluxo-caixa/cards-kpi.tsx (linhas 13-18)
// CÓDIGO IDÊNTICO

// src/componentes/relatorios/contas/cards-resumo.tsx (linhas 12-17)
// CÓDIGO IDÊNTICO
```

**Total:** ~15 linhas duplicadas

**Solução existente:** `src/utilitarios/formatacao.ts` já tem funções prontas!

---

### 5. console.error em Produção (11 ocorrências)

**Localização:**

```typescript
// src/servicos/supabase/roi-cliente-queries.ts
console.error('Erro ao buscar ROI clientes:', error)         // linha 54
console.error('Erro ao buscar KPIs:', error)                 // linha 91
console.error('Erro ao buscar detalhes do cliente:', error)  // linha 158
console.error('Erro ao buscar evolução do cliente:', error)  // linha 229

// src/servicos/supabase/fluxo-caixa-queries.ts
console.error('Erro ao buscar fluxo de caixa:', error)       // linha 49
console.error('Erro ao buscar KPIs:', error)                 // linha 110

// src/servicos/supabase/contas-queries.ts
console.error('Erro ao buscar contas a pagar:', error)       // linha 87
console.error('Erro ao buscar contas a receber:', error)     // linha 183
console.error('Erro ao buscar contas vencidas:', error)      // linha 258
console.error('Erro ao marcar como realizado:', error)       // linha 372

// src/app/(protected)/relatorios/contas/page.tsx
console.error(error)                                          // linha 40
```

**Solução:** Usar `src/utilitarios/logger.ts` que já existe

---

### 6. Arquivo Órfão: cache-manager.ts

**Situação:**
- Arquivo `src/utilitarios/cache-manager.ts` existe
- Git status mostra como "untracked" (não commitado)
- Nenhum import usa esse arquivo
- Poderia substituir as 3 implementações de cache

---

## 🎯 PLANO DE EXECUÇÃO

### FASE 0: Preparação (30min)

**Objetivo:** Garantir ambiente pronto e backups

#### Tarefa 0.1: Backup e Branch
```bash
# Criar branch de trabalho
git checkout -b refactor/relatorios-limpeza

# Commit atual como checkpoint
git add .
git commit -m "checkpoint: antes da refatoração de relatórios"
```

#### Tarefa 0.2: Validar Build Atual
```bash
# Garantir que está tudo compilando
npx tsc --noEmit
npm run build
```

#### Tarefa 0.3: Revisar cache-manager.ts
```bash
# Ler arquivo órfão
cat src/utilitarios/cache-manager.ts

# Decidir: USAR ou DELETAR
```

**Checkpoint:** ✅ Branch criada, build passando, cache-manager.ts revisado

---

### FASE 1: Corrigir Funções SQL do ROI (2h) ✅ CONCLUÍDA

**Objetivo:** Corrigir funções SQL para buscar dados corretos

**Status:** ✅ **CONCLUÍDA** em 2025-10-17 às 23:30

**Problema identificado:**
- As 4 funções SQL do ROI buscavam em `r_contatos.contato_id` (campo errado)
- Os dados reais estão em `fp_centros_custo.centro_custo_id`
- Resultado: ROI sempre retornava ZERO clientes

**Funções corrigidas:**
1. ✅ `calcular_roi_clientes` - Mudou de `contato_id` → `centro_custo_id`
2. ✅ `calcular_kpis_roi_clientes` - Atualizada
3. ✅ `buscar_detalhes_roi_cliente` - Mudou de `contato_id` → `centro_custo_id`
4. ✅ `buscar_evolucao_roi_cliente` - Mudou de `contato_id` → `centro_custo_id`

**Migrations aplicadas:**
- `fix_calcular_roi_clientes_centro_custo.sql`
- `fix_calcular_kpis_roi_clientes.sql`
- `fix_buscar_detalhes_roi_cliente.sql`
- `fix_buscar_evolucao_roi_cliente.sql`

**Resultado validado:**
- 3 clientes retornados com dados reais
- Helio Martin: R$ 30.000 receita (margem 100%)
- Fernando: R$ 31.740 receita, R$ 1.000 despesa (margem 96,85%)
- Conecta: R$ 3.512,75 despesa (prejuízo)

**ROI totalmente funcional:** http://localhost:3003/relatorios/roi-cliente

#### Tarefa 1.1: Função calcular_roi_clientes (1.5h)

**Arquivo:** `sql/relatorios/functions-roi-cliente.sql`

**Requisitos:**
- Recebe: `p_workspace_id UUID`, `p_data_inicio DATE`, `p_data_fim DATE`
- Retorna: Tabela com colunas:
  - `cliente_id UUID` (centro_custo_id)
  - `cliente_nome TEXT`
  - `receita NUMERIC`
  - `despesa NUMERIC`
  - `lucro NUMERIC` (receita - despesa)
  - `margem NUMERIC` (lucro / receita * 100)

**Lógica:**
1. Buscar transações do workspace no período
2. Agrupar por `centro_custo_id`
3. Somar receitas (tipo='RECEITA')
4. Somar despesas (tipo='DESPESA')
5. Calcular lucro e margem
6. Retornar ordenado por margem DESC

**Tabelas usadas:**
- `fp_transacoes` (WHERE workspace_id = p_workspace_id AND data BETWEEN p_data_inicio AND p_data_fim)
- `fp_centros_custo` (JOIN para pegar nome)

**Exemplo de assinatura:**
```sql
CREATE OR REPLACE FUNCTION calcular_roi_clientes(
  p_workspace_id UUID,
  p_data_inicio DATE,
  p_data_fim DATE
) RETURNS TABLE (
  cliente_id UUID,
  cliente_nome TEXT,
  receita NUMERIC,
  despesa NUMERIC,
  lucro NUMERIC,
  margem NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id as cliente_id,
    cc.nome as cliente_nome,
    COALESCE(SUM(CASE WHEN t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 0) as receita,
    COALESCE(SUM(CASE WHEN t.tipo = 'DESPESA' THEN t.valor ELSE 0 END), 0) as despesa,
    COALESCE(SUM(CASE WHEN t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN t.tipo = 'DESPESA' THEN t.valor ELSE 0 END), 0) as lucro,
    CASE
      WHEN COALESCE(SUM(CASE WHEN t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 0) > 0
      THEN (
        (COALESCE(SUM(CASE WHEN t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN t.tipo = 'DESPESA' THEN t.valor ELSE 0 END), 0)) /
        COALESCE(SUM(CASE WHEN t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 1) * 100
      )
      ELSE 0
    END as margem
  FROM fp_centros_custo cc
  LEFT JOIN fp_transacoes t ON t.centro_custo_id = cc.id
    AND t.workspace_id = p_workspace_id
    AND (p_data_inicio IS NULL OR t.data >= p_data_inicio)
    AND (p_data_fim IS NULL OR t.data <= p_data_fim)
  WHERE cc.workspace_id = p_workspace_id
  GROUP BY cc.id, cc.nome
  HAVING COALESCE(SUM(CASE WHEN t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 0) > 0
      OR COALESCE(SUM(CASE WHEN t.tipo = 'DESPESA' THEN t.valor ELSE 0 END), 0) > 0
  ORDER BY margem DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Teste:**
```sql
-- Testar com dados reais
SELECT * FROM calcular_roi_clientes(
  '00000000-0000-0000-0000-000000000000'::UUID, -- workspace_id
  '2025-01-01'::DATE,
  '2025-12-31'::DATE
);
```

**Validação:**
- [ ] Function criada sem erros
- [ ] Retorna dados para workspace válido
- [ ] Respeita filtro de datas
- [ ] Cálculo de margem correto (lucro/receita * 100)
- [ ] Ordenação por margem DESC funciona

---

#### Tarefa 1.2: Função calcular_kpis_roi_clientes (1h)

**Arquivo:** Mesmo `sql/relatorios/functions-roi-cliente.sql`

**Requisitos:**
- Recebe: `p_workspace_id UUID`, `p_mes TEXT` (formato 'YYYY-MM')
- Retorna: JSON com 3 KPIs:
  - `melhor_roi_percentual` → { cliente, valor }
  - `melhor_roi_valor` → { cliente, valor }
  - `margem_mensal` → { percentual, lucro_total }

**Lógica:**
1. Calcular ROI de todos clientes no mês
2. Identificar cliente com maior margem %
3. Identificar cliente com maior lucro R$
4. Calcular margem mensal total (soma de todos)

**Exemplo de assinatura:**
```sql
CREATE OR REPLACE FUNCTION calcular_kpis_roi_clientes(
  p_workspace_id UUID,
  p_mes TEXT
) RETURNS JSON AS $$
DECLARE
  v_data_inicio DATE;
  v_data_fim DATE;
  v_result JSON;
BEGIN
  -- Calcular datas do mês
  v_data_inicio := (p_mes || '-01')::DATE;
  v_data_fim := (v_data_inicio + INTERVAL '1 month - 1 day')::DATE;

  -- Construir JSON com os 3 KPIs
  SELECT json_build_object(
    'melhor_roi_percentual', (
      SELECT json_build_object('cliente', cliente_nome, 'valor', margem)
      FROM calcular_roi_clientes(p_workspace_id, v_data_inicio, v_data_fim)
      ORDER BY margem DESC LIMIT 1
    ),
    'melhor_roi_valor', (
      SELECT json_build_object('cliente', cliente_nome, 'valor', lucro)
      FROM calcular_roi_clientes(p_workspace_id, v_data_inicio, v_data_fim)
      ORDER BY lucro DESC LIMIT 1
    ),
    'margem_mensal', (
      SELECT json_build_object(
        'percentual',
        CASE WHEN SUM(receita) > 0
          THEN (SUM(lucro) / SUM(receita) * 100)
          ELSE 0
        END,
        'lucro_total', SUM(lucro)
      )
      FROM calcular_roi_clientes(p_workspace_id, v_data_inicio, v_data_fim)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Validação:**
- [ ] Retorna JSON válido
- [ ] Melhor ROI % identifica corretamente
- [ ] Melhor ROI R$ identifica corretamente
- [ ] Margem mensal calcula total correto

---

#### Tarefa 1.3: Função buscar_detalhes_roi_cliente (1.5h)

**Arquivo:** Mesmo `sql/relatorios/functions-roi-cliente.sql`

**Requisitos:**
- Recebe: `p_workspace_id UUID`, `p_cliente_id UUID`, `p_data_inicio DATE`, `p_data_fim DATE`
- Retorna: JSON com receitas e despesas detalhadas por categoria

**Estrutura do retorno:**
```json
{
  "receitas": [
    {
      "categoria": "Vendas",
      "subcategoria": "Produtos",
      "valor": 15000.00,
      "quantidade": 10,
      "percentual": 75.0
    }
  ],
  "despesas": [
    {
      "categoria": "Operacional",
      "subcategoria": "Pessoal",
      "valor": 5000.00,
      "quantidade": 3,
      "percentual": 50.0
    }
  ],
  "totais": {
    "receita": 20000.00,
    "despesa": 10000.00
  }
}
```

**Validação:**
- [ ] Retorna JSON bem estruturado
- [ ] Receitas agrupadas por categoria/subcategoria
- [ ] Despesas agrupadas por categoria/subcategoria
- [ ] Percentuais calculados corretamente
- [ ] Totais conferem

---

#### Tarefa 1.4: Função buscar_evolucao_roi_cliente (1h)

**Arquivo:** Mesmo `sql/relatorios/functions-roi-cliente.sql`

**Requisitos:**
- Recebe: `p_workspace_id UUID`, `p_cliente_id UUID`, `p_data_inicio DATE`, `p_data_fim DATE`
- Retorna: Tabela com evolução mensal

**Colunas retorno:**
- `mes TEXT` (formato 'Jan/2025')
- `mes_numero INTEGER` (1-12)
- `ano INTEGER`
- `receita NUMERIC`
- `despesa NUMERIC`
- `lucro NUMERIC`
- `margem NUMERIC`

**Lógica:**
1. Gerar série de meses entre data_inicio e data_fim
2. Para cada mês, somar receitas e despesas do cliente
3. Calcular lucro e margem
4. Retornar ordenado cronologicamente

**Validação:**
- [ ] Retorna série completa de meses
- [ ] Dados corretos por mês
- [ ] Meses sem transação retornam zero
- [ ] Formato de mês correto (Jan/2025)

---

#### Tarefa 1.5: Funções Fluxo de Caixa (2h)

**Arquivo:** `sql/relatorios/functions-fluxo-caixa.sql`

**Function 1: calcular_fluxo_caixa**
- Recebe: `p_workspace_id UUID`, `p_data_inicio DATE`, `p_data_fim DATE`, `p_tipo TEXT`
- Retorna: Tabela com dados mensais previsto vs realizado

**Function 2: calcular_kpis_fluxo_caixa**
- Recebe: `p_workspace_id UUID`, `p_mes TEXT`
- Retorna: JSON com KPIs do fluxo de caixa

**Detalhes:** Similar às funções ROI, mas focado em comparação previsto/realizado

**Validação:**
- [ ] Funções criadas sem erro
- [ ] Retornam dados corretos
- [ ] Comparação previsto/realizado funciona

---

#### Tarefa 1.6: Aplicar Migrations no Supabase (30min)

```bash
# Via Supabase CLI
supabase db push

# OU via SQL Editor do Supabase Dashboard
# Copiar e executar os 2 arquivos SQL
```

**Validação:**
- [ ] Functions aparecem no Supabase
- [ ] Permissões SECURITY DEFINER aplicadas
- [ ] Testes manuais passam

---

#### Tarefa 1.7: Testar Relatórios no Frontend (30min)

```bash
npm run dev
# Acessar http://localhost:3003/relatorios/roi-cliente
# Acessar http://localhost:3003/relatorios/fluxo-caixa
```

**Validação:**
- [ ] ROI carrega dados reais
- [ ] Fluxo de Caixa carrega dados reais
- [ ] KPIs aparecem corretamente
- [ ] Detalhes expandem sem erro
- [ ] Gráficos renderizam

**Checkpoint FASE 1:** ✅ 6 SQL functions criadas e testadas, relatórios funcionando

---

### FASE 2: Consolidar Cálculo de Datas (2h) ✅ CONCLUÍDA

**Objetivo:** Eliminar 400 linhas de código duplicado

**Status:** ✅ **CONCLUÍDA** em 2025-10-17

**Resultado:**
- ✅ Criado `src/utilitarios/periodo-helpers.ts` (130 linhas)
- ✅ Refatorado `roi-cliente-queries.ts` - 3 funções (~120 linhas removidas)
- ✅ Refatorado `fluxo-caixa-queries.ts` - 2 funções (~50 linhas removidas)
- ✅ Refatorado `contas-queries.ts` - 2 funções (~50 linhas removidas)
- ✅ TypeScript validado sem erros
- ✅ Build de produção OK

**Total removido:** ~220 linhas duplicadas

#### Tarefa 2.1: Criar utilitário periodo-helpers.ts (1h) ✅

**Arquivo:** `src/utilitarios/periodo-helpers.ts`

**Conteúdo:**
```typescript
/**
 * Calcula datas de início e fim baseado no período selecionado
 * Usado por todos os relatórios (ROI, Fluxo de Caixa, Contas)
 */

export type PeriodoRelatorio =
  | 'todo'
  | 'mes_atual'
  | '3_meses'
  | '6_meses'
  | '1_ano'
  | '12_meses'
  | '30_dias'
  | '60_dias'
  | '90_dias'
  | 'personalizado'

export interface FiltrosPeriodo {
  periodo: PeriodoRelatorio
  dataInicio?: string
  dataFim?: string
}

export interface DatasCalculadas {
  dataInicio: string | null
  dataFim: string | null
}

/**
 * Calcula as datas de início e fim baseado no período
 * @param filtros - Filtros com período e datas opcionais
 * @returns Objeto com dataInicio e dataFim formatadas (YYYY-MM-DD)
 */
export function calcularDatasPorPeriodo(filtros: FiltrosPeriodo): DatasCalculadas {
  const hoje = new Date()
  let dataInicio: string | null = null
  let dataFim: string | null = null

  switch (filtros.periodo) {
    case 'mes_atual':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        .toISOString().split('T')[0]
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        .toISOString().split('T')[0]
      break

    case '3_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1)
        .toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break

    case '6_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1)
        .toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break

    case '1_ano':
      dataInicio = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1)
        .toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break

    case '12_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1)
        .toISOString().split('T')[0]
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        .toISOString().split('T')[0]
      break

    case '30_dias':
      dataInicio = hoje.toISOString().split('T')[0]
      dataFim = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]
      break

    case '60_dias':
      dataInicio = hoje.toISOString().split('T')[0]
      dataFim = new Date(hoje.getTime() + 60 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]
      break

    case '90_dias':
      dataInicio = hoje.toISOString().split('T')[0]
      dataFim = new Date(hoje.getTime() + 90 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]
      break

    case 'personalizado':
      dataInicio = filtros.dataInicio || null
      dataFim = filtros.dataFim || null
      break

    case 'todo':
    default:
      dataInicio = null
      dataFim = null
  }

  return { dataInicio, dataFim }
}

/**
 * Formata período para exibição amigável
 * @param periodo - Tipo de período
 * @returns String formatada para exibir ao usuário
 */
export function formatarPeriodo(periodo: PeriodoRelatorio): string {
  const labels: Record<PeriodoRelatorio, string> = {
    'todo': 'Todo período',
    'mes_atual': 'Mês atual',
    '3_meses': 'Últimos 3 meses',
    '6_meses': 'Últimos 6 meses',
    '1_ano': 'Último ano',
    '12_meses': 'Últimos 12 meses',
    '30_dias': 'Próximos 30 dias',
    '60_dias': 'Próximos 60 dias',
    '90_dias': 'Próximos 90 dias',
    'personalizado': 'Período personalizado'
  }

  return labels[periodo] || periodo
}
```

**Validação:**
- [ ] Arquivo criado
- [ ] TypeScript compila sem erro
- [ ] Todos os períodos implementados
- [ ] Função auxiliar de formatação incluída

---

#### Tarefa 2.2: Refatorar roi-cliente-queries.ts (20min)

**Arquivo:** `src/servicos/supabase/roi-cliente-queries.ts`

**Mudanças:**

**ANTES:**
```typescript
export async function buscarDadosROIClientes(workspaceId: string, filtros: FiltrosROI) {
  const hoje = new Date()
  let dataInicio: string | null = null
  let dataFim: string | null = null

  switch (filtros.periodo) {
    case 'mes_atual':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        .toISOString().split('T')[0]
      // ... 30 linhas
  }

  const { data, error } = await supabase.rpc('calcular_roi_clientes', {
    p_workspace_id: workspaceId,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim
  })
  // ... resto
}
```

**DEPOIS:**
```typescript
import { calcularDatasPorPeriodo } from '@/utilitarios/periodo-helpers'

export async function buscarDadosROIClientes(workspaceId: string, filtros: FiltrosROI) {
  // Calcula datas usando utilitário centralizado
  const { dataInicio, dataFim } = calcularDatasPorPeriodo(filtros)

  const { data, error } = await supabase.rpc('calcular_roi_clientes', {
    p_workspace_id: workspaceId,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim
  })
  // ... resto
}
```

**Aplicar em 4 funções:**
1. `buscarDadosROIClientes()` - linha ~13
2. `buscarDetalhesCliente()` - linha ~120
3. `buscarEvolucaoCliente()` - linha ~187
4. (Se houver quarta função)

**Validação:**
- [ ] Import adicionado
- [ ] 4 switch cases removidos
- [ ] 4 usos de `calcularDatasPorPeriodo()` adicionados
- [ ] TypeScript compila
- [ ] ~100 linhas removidas

---

#### Tarefa 2.3: Refatorar fluxo-caixa-queries.ts (15min)

**Arquivo:** `src/servicos/supabase/fluxo-caixa-queries.ts`

**Mesmo padrão da Tarefa 2.2**

**Aplicar em 2 funções:**
1. `buscarDadosFluxoCaixa()`
2. `buscarKPIsFluxoCaixa()`

**Validação:**
- [ ] ~50 linhas removidas
- [ ] TypeScript compila

---

#### Tarefa 2.4: Refatorar contas-queries.ts (15min)

**Arquivo:** `src/servicos/supabase/contas-queries.ts`

**Mesmo padrão**

**Aplicar em funções que usam filtro de período**

**Validação:**
- [ ] ~50 linhas removidas
- [ ] TypeScript compila

---

#### Tarefa 2.5: Validar Refatoração (10min)

```bash
# TypeScript
npx tsc --noEmit

# Build
npm run build

# Testes manuais
npm run dev
# Testar cada relatório com diferentes períodos
```

**Validação:**
- [ ] Build passa
- [ ] Relatórios funcionam
- [ ] Filtros de período funcionam
- [ ] Datas corretas em cada período

**Checkpoint FASE 2:** ✅ ~400 linhas de código duplicado removidas

---

### FASE 3: Consolidar Sistema de Cache (3h) 🟡 IMPORTANTE

**Objetivo:** Unificar cache em CacheManager reutilizável

#### Tarefa 3.1: Revisar/Criar cache-manager.ts (1h)

**Arquivo:** `src/utilitarios/cache-manager.ts`

**Se arquivo existe e está bom, apenas commitá-lo. Se não, criar:**

```typescript
/**
 * Gerenciador de cache localStorage genérico
 * Usado por todos os relatórios e hooks com SWR
 */

export interface CacheData<T> {
  data: T
  timestamp: number
  workspaceId: string
  filtros?: any
}

export interface CacheOptions {
  duration?: number // milissegundos (padrão 5min)
  validateFiltros?: boolean // validar filtros ao carregar (padrão true)
}

export class CacheManager<T> {
  private key: string
  private duration: number
  private validateFiltros: boolean

  constructor(key: string, options: CacheOptions = {}) {
    this.key = key
    this.duration = options.duration || 5 * 60 * 1000 // 5 minutos padrão
    this.validateFiltros = options.validateFiltros !== false
  }

  /**
   * Salva dados no cache localStorage
   */
  save(data: T, workspaceId: string, filtros?: any): void {
    if (typeof window === 'undefined') return

    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
        workspaceId,
        filtros
      }
      localStorage.setItem(this.key, JSON.stringify(cacheData))
    } catch (error) {
      // Silenciar erro de storage (quota, etc)
      console.warn(`Cache save failed for ${this.key}:`, error)
    }
  }

  /**
   * Carrega dados do cache localStorage
   * Retorna undefined se cache inválido, expirado ou workspace diferente
   */
  load(workspaceId: string, filtros?: any): T | undefined {
    if (typeof window === 'undefined') return undefined

    try {
      const cached = localStorage.getItem(this.key)
      if (!cached) return undefined

      const cacheData: CacheData<T> = JSON.parse(cached)

      // Validar workspace
      if (cacheData.workspaceId !== workspaceId) {
        this.clear()
        return undefined
      }

      // Validar expiração
      const isExpired = Date.now() - cacheData.timestamp > this.duration
      if (isExpired) {
        this.clear()
        return undefined
      }

      // Validar filtros (se habilitado)
      if (this.validateFiltros && filtros) {
        const filtrosMatch = JSON.stringify(cacheData.filtros) === JSON.stringify(filtros)
        if (!filtrosMatch) {
          return undefined
        }
      }

      return cacheData.data
    } catch (error) {
      // Cache corrompido, limpar
      this.clear()
      return undefined
    }
  }

  /**
   * Limpa o cache
   */
  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.key)
  }

  /**
   * Verifica se cache existe e é válido (sem retornar dados)
   */
  isValid(workspaceId: string, filtros?: any): boolean {
    return this.load(workspaceId, filtros) !== undefined
  }
}
```

**Validação:**
- [ ] Classe genérica criada
- [ ] TypeScript compila
- [ ] JSDoc completo

---

#### Tarefa 3.2: Refatorar usar-roi-clientes.ts (40min)

**Arquivo:** `src/hooks/usar-roi-clientes.ts`

**ANTES (linhas 8-72):**
```typescript
const CACHE_KEY_CLIENTES = 'fp_roi_clientes_cache'
const CACHE_KEY_KPIS = 'fp_roi_kpis_cache'
const CACHE_DURATION = 5 * 60 * 1000

function salvarROIClientesCache(...) { /* 20 linhas */ }
function carregarROIClientesCache(...) { /* 25 linhas */ }
function salvarKPIsCache(...) { /* 15 linhas */ }
function carregarKPIsCache(...) { /* 20 linhas */ }

export function useROIClientes(filtros: FiltrosROI) {
  const { workspace } = useAuth()

  const dadosCache = carregarROIClientesCache(workspace.id, filtros)

  const { data: clientes, error, isLoading } = useSWR(
    workspace ? ['roi-clientes', workspace.id, filtros] : null,
    () => fetcherClientes(workspace.id, filtros),
    {
      ...obterConfigSWR('otimizada'),
      fallbackData: dadosCache,
      onSuccess: (data) => {
        salvarROIClientesCache(data, workspace.id, filtros)
      }
    }
  )

  // ... KPIs similar
}
```

**DEPOIS:**
```typescript
import { CacheManager } from '@/utilitarios/cache-manager'

// Instâncias de cache (fora do hook)
const cacheClientes = new CacheManager<ClienteROI[]>('fp_roi_clientes_cache')
const cacheKPIs = new CacheManager<CardKPI>('fp_roi_kpis_cache')

export function useROIClientes(filtros: FiltrosROI) {
  const { workspace } = useAuth()

  // Carregar cache
  const dadosCache = workspace ? cacheClientes.load(workspace.id, filtros) : undefined

  const { data: clientes, error, isLoading } = useSWR(
    workspace ? ['roi-clientes', workspace.id, filtros] : null,
    () => fetcherClientes(workspace.id, filtros),
    {
      ...obterConfigSWR('otimizada'),
      fallbackData: dadosCache,
      onSuccess: (data) => {
        if (workspace) {
          cacheClientes.save(data, workspace.id, filtros)
        }
      }
    }
  )

  // ... KPIs similar
}
```

**Validação:**
- [ ] ~80 linhas removidas
- [ ] 2 instâncias CacheManager criadas
- [ ] Cache funciona igual
- [ ] TypeScript compila

---

#### Tarefa 3.3: Refatorar usar-fluxo-caixa.ts (40min)

**Arquivo:** `src/hooks/usar-fluxo-caixa.ts`

**Mesmo padrão da Tarefa 3.2**

**Validação:**
- [ ] ~80 linhas removidas
- [ ] CacheManager usado

---

#### Tarefa 3.4: Refatorar usar-contas-pagar-receber.ts (40min)

**Arquivo:** `src/hooks/usar-contas-pagar-receber.ts`

**Mesmo padrão**

**Validação:**
- [ ] ~100 linhas removidas
- [ ] 3 instâncias CacheManager (resumo, a_pagar, a_receber)

---

**Checkpoint FASE 3:** ✅ ~260 linhas de código duplicado removidas, cache unificado

---

### FASE 4: Substituir console.error por logger (30min) 🟡 MÉDIA

**Objetivo:** Padronizar logs

#### Tarefa 4.1: Refatorar roi-cliente-queries.ts (10min)

**Arquivo:** `src/servicos/supabase/roi-cliente-queries.ts`

**ANTES:**
```typescript
} catch (error) {
  console.error('Erro ao buscar ROI clientes:', error)
  throw error
}
```

**DEPOIS:**
```typescript
import { logger } from '@/utilitarios/logger'

} catch (error) {
  logger.error('ROI Clientes', 'Erro ao buscar dados', {
    error: error instanceof Error ? error.message : 'Erro desconhecido'
  })
  throw error
}
```

**Aplicar em 4 lugares (linhas ~54, ~91, ~158, ~229)**

---

#### Tarefa 4.2: Refatorar fluxo-caixa-queries.ts (10min)

**Mesmo padrão, 2 lugares**

---

#### Tarefa 4.3: Refatorar contas-queries.ts e page.tsx (10min)

**Mesmo padrão, 5 lugares**

**Validação:**
- [ ] 11 console.error substituídos
- [ ] logger.ts usado consistentemente
- [ ] TypeScript compila

**Checkpoint FASE 4:** ✅ Logs padronizados

---

### FASE 5: Consolidar Formatação (30min) 🟢 BAIXA

**Objetivo:** Usar utilitário existente

#### Tarefa 5.1: Refatorar componentes de KPI (30min)

**Arquivos:**
- `src/componentes/relatorios/roi-cliente/cards-kpi.tsx`
- `src/componentes/relatorios/fluxo-caixa/cards-kpi.tsx`
- `src/componentes/relatorios/contas/cards-resumo.tsx`

**ANTES:**
```typescript
const formatarValor = (valor: number): string => {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Uso
<p>R$ {formatarValor(kpis.melhorRoiValor.valor)}</p>
```

**DEPOIS:**
```typescript
import { formatarNumero } from '@/utilitarios/formatacao'

// Removido formatarValor local

// Uso
<p>R$ {formatarNumero(kpis.melhorRoiValor.valor)}</p>
```

**Validação:**
- [ ] 3 funções locais removidas (~15 linhas)
- [ ] Import de formatacao.ts adicionado
- [ ] Formatação idêntica ao anterior
- [ ] TypeScript compila

**Checkpoint FASE 5:** ✅ Formatação centralizada

---

### FASE 6: Validação Final (1h) ✅ CRÍTICO

**Objetivo:** Garantir tudo funcionando

#### Tarefa 6.1: Validação TypeScript (5min)

```bash
npx tsc --noEmit
```

**Deve passar sem erros**

---

#### Tarefa 6.2: Build Produção (5min)

```bash
npm run build
```

**Deve compilar sem warnings**

---

#### Tarefa 6.3: Teste Manual Completo (30min)

**Checklist de testes:**

**ROI por Cliente:**
- [ ] Página carrega sem erro
- [ ] 3 KPIs aparecem com dados
- [ ] Filtro "Mês atual" funciona
- [ ] Filtro "3 meses" funciona
- [ ] Filtro "Todo período" funciona
- [ ] Ordenação por margem funciona
- [ ] Clicar em cliente expande detalhes
- [ ] Detalhes mostram receitas e despesas
- [ ] Botão "Ver Evolução" carrega gráfico
- [ ] Gráfico renderiza corretamente
- [ ] Cache funciona (recarregar página = dados instantâneos)

**Fluxo de Caixa:**
- [ ] Página carrega sem erro
- [ ] KPIs aparecem
- [ ] Filtros funcionam
- [ ] Gráfico previsto vs realizado renderiza
- [ ] Tabela de variação aparece
- [ ] Cache funciona

**Contas a Pagar/Receber:**
- [ ] Página carrega sem erro
- [ ] Cards de resumo aparecem
- [ ] Aba "A Pagar" funciona
- [ ] Aba "A Receber" funciona
- [ ] Marcar como realizado funciona
- [ ] Filtros funcionam
- [ ] Cache funciona

---

#### Tarefa 6.4: Teste de Performance (10min)

**Verificar:**
- [ ] Cache localStorage persiste entre reloads
- [ ] Dados aparecem instantaneamente do cache
- [ ] Revalidação em background funciona (SWR)
- [ ] Sem re-renders desnecessários
- [ ] Console do navegador sem erros

---

#### Tarefa 6.5: Teste Multi-user (10min)

**Verificar:**
- [ ] Trocar de workspace invalida cache
- [ ] Dados corretos para cada workspace
- [ ] Sem vazamento de dados entre workspaces

---

#### Tarefa 6.6: Code Review Final (10min)

```bash
# Verificar código duplicado restante
npx jscpd src/servicos/supabase --min-tokens 50

# Verificar console.log restante
grep -r "console\." src/servicos src/hooks src/componentes/relatorios | grep -v logger

# Verificar imports não usados
npx tsc --noEmit 2>&1 | grep "is declared but"
```

**Deve retornar zero ocorrências**

---

**Checkpoint FASE 6:** ✅ Tudo validado e funcionando

---

### FASE 7: Commit e Deploy (30min) ✅

#### Tarefa 7.1: Commit Final (10min)

```bash
git add .
git commit -m "refactor(relatorios): consolidação completa

- Criadas 6 SQL functions (ROI + Fluxo de Caixa)
- Consolidado cálculo de datas em periodo-helpers.ts
- Unificado cache em CacheManager
- Substituído console.error por logger.ts
- Centralizada formatação em formatacao.ts

REDUÇÃO: -546 linhas de código duplicado (-25%)
GANHO: Manutenção centralizada, código escalável"
```

---

#### Tarefa 7.2: Merge para Main (10min)

```bash
# Trocar para main
git checkout main

# Merge da branch de refatoração
git merge refactor/relatorios-limpeza

# Push
git push origin main
```

---

#### Tarefa 7.3: Deploy Vercel (10min)

- Deploy automático via push OU
- Deploy manual no dashboard Vercel

**Verificar:**
- [ ] Build Vercel passa
- [ ] Deploy completa
- [ ] Produção funciona
- [ ] SQL functions acessíveis

---

**Checkpoint FASE 7:** ✅ Refatoração completa e em produção

---

## ✅ CHECKLIST DE CONCLUSÃO

### Código

- [ ] 6 SQL functions criadas e testadas
- [ ] periodo-helpers.ts criado e usado
- [ ] CacheManager usado nos 3 hooks
- [ ] logger.ts usado em 11 lugares
- [ ] formatacao.ts usado nos componentes
- [ ] Zero console.log/error em produção
- [ ] Zero código duplicado crítico
- [ ] TypeScript compila sem erro
- [ ] Build passa sem warning

### Funcionalidade

- [ ] ROI por Cliente 100% funcional
- [ ] Fluxo de Caixa 100% funcional
- [ ] Contas a Pagar/Receber 100% funcional
- [ ] Cache persistente funciona
- [ ] Multi-user isolation funciona
- [ ] Performance mantida/melhorada

### Deploy

- [ ] Código commitado
- [ ] Branch merged
- [ ] Deploy em produção
- [ ] Produção testada

---

## 📊 RESULTADOS ESPERADOS

### Antes

- ❌ 6 SQL functions faltando
- ❌ 546 linhas duplicadas
- ❌ 29 duplicações críticas
- ❌ 11 console.log em produção
- ❌ 3 sistemas de cache diferentes
- ⚠️ Manutenção em 12 lugares diferentes

### Depois

- ✅ 6 SQL functions implementadas
- ✅ -546 linhas removidas (-25%)
- ✅ 1 utilitário de período (ao invés de 12)
- ✅ 1 CacheManager (ao invés de 3)
- ✅ 100% logs via logger.ts
- ✅ Manutenção em 1 único lugar

### Ganhos Mensuráveis

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Linhas de código | ~2.100 | ~1.554 | -25% |
| Código duplicado | 546 linhas | ~0 linhas | -100% |
| Lugares para mudar período | 12 | 1 | -92% |
| Sistemas de cache | 3 | 1 | -67% |
| console.log produção | 11 | 0 | -100% |
| Relatórios funcionais | 1/3 | 3/3 | +200% |

---

## 📝 NOTAS IMPORTANTES

### Para o Próximo Chat

1. **Contexto completo:** Este documento tem TUDO que precisa ser feito
2. **Ordem das fases:** Seguir EXATAMENTE na ordem (FASE 1 é crítica)
3. **Checkpoints:** Validar cada checkpoint antes de prosseguir
4. **SQL Functions:** FASE 1 é a mais importante (desbloqueia tudo)
5. **Testes:** Sempre testar após cada fase
6. **Commits:** Fazer commits incrementais (1 por fase)

### Arquivos de Referência

- **Este documento:** Plano completo de execução
- `docs/desenvolvimento/RELATORIO-SAUDE-CODIGO-RELATORIOS.md` - Análise detalhada
- `docs/Resumo.md` - Contexto geral do projeto
- `docs/specs/PLANO-IMPLEMENTACAO-ROI-CLIENTE.md` - Spec original ROI

### Pontos de Atenção

- **Não pular FASE 1:** Sem SQL functions, relatórios não funcionam
- **Testar cache:** Cache é crítico para UX (dados instantâneos)
- **Validar workspace_id:** Segurança multi-user deve ser mantida
- **TypeScript strict:** Não usar `any` desnecessariamente
- **SWR config:** Manter `obterConfigSWR('otimizada')`

---

**Documento criado em:** 2025-10-17
**Última atualização:** 2025-10-17
**Versão:** 1.0
**Autor:** Claude Code - Análise de Saúde do Código
