# 📋 PLANO DE EXECUÇÃO - SEPARAÇÃO CLIENTE E FORNECEDOR

**Data de Criação:** 22/10/2025
**Responsável:** Claude + Ricardo
**Status:** 🟡 EM ANDAMENTO - FASE 5 CONCLUÍDA
**Versão:** 1.6
**Tempo Estimado Total:** 90-120 minutos
**Última Atualização:** 22/10/2025 - 23:30

---

## 📊 PROGRESSO GERAL

| Fase | Status | Tempo Estimado | Descrição |
|------|--------|----------------|-----------|
| **FASE 0** | ✅ **CONCLUÍDA** | 5 min | Preparação e análise inicial |
| **FASE 1** | ✅ **CONCLUÍDA** | 20 min | Migrations do banco de dados (407 transações migradas) |
| **FASE 2** | ✅ **CONCLUÍDA** | 15 min | Atualizar tipos TypeScript (3 seções + relacionamentos) |
| **FASE 3** | ✅ **CONCLUÍDA** | 25 min | Atualizar queries e serviços (4 funções SELECT + 3 funções SQL ROI) |
| **FASE 4** | ✅ **CONCLUÍDA** | 30 min | Atualizar interface - modal-lancamento.tsx (4 correções) |
| **FASE 5** | ✅ **CONCLUÍDA** | 15 min | Validação e testes (407 transações validadas + ROI funcionando + build OK) |
| **FASE 6** | 🔴 Pendente | 10 min | Limpeza e documentação |

**Total:** 6 fases, 120 minutos (~2 horas)

---

## 🎯 CONTEXTO E OBJETIVO

### **O Problema Atual**

**Situação:** A tabela `fp_transacoes` tem apenas um campo genérico `contato_id` que aponta para `r_contatos`. Isso causa confusão porque:

1. ❌ Uma RECEITA pode ter um FORNECEDOR vinculado (errado!)
2. ❌ Uma DESPESA pode ter um CLIENTE vinculado (errado!)
3. ❌ Não há validação semântica (tipo da transação vs tipo do contato)
4. ❌ Relatórios ficam confusos (ROI mistura clientes com fornecedores)
5. ❌ **Dados atuais:** 375 despesas vinculadas a "clientes" ao invés de fornecedores

### **Dados Atuais no Banco**

```
fp_transacoes:
├─ 947 transações totais
│  ├─ 613 despesas (61% com contato vinculado)
│  └─ 334 receitas (10% com contato vinculado)
│
├─ 407 transações COM contato_id
│  ├─ 375 despesas → vinculadas a tipo_pessoa='cliente' ❌ ERRADO
│  └─ 32 receitas → vinculadas a tipo_pessoa='cliente' ✅ CORRETO
│
└─ 540 transações SEM contato_id (NULL)

r_contatos:
├─ 47 registros totais
│  ├─ 26 clientes
│  ├─ 1 fornecedor
│  └─ 20 outros tipos (lojista, freelancer, parceiro)
└─ 3 workspaces diferentes
```

### **A Solução Proposta**

**Criar dois campos separados:**

```typescript
fp_transacoes {
  // Campo ATUAL (vai ser removido depois)
  contato_id: UUID | null

  // Campos NOVOS (a serem criados)
  cliente_id: UUID | null    → referencia r_contatos WHERE tipo_pessoa='cliente'
  fornecedor_id: UUID | null → referencia r_contatos WHERE tipo_pessoa='fornecedor'
}
```

**Regras de negócio:**
- ✅ **RECEITA:** exige `cliente_id` preenchido
- ✅ **DESPESA:** exige `fornecedor_id` preenchido
- ✅ **TRANSFERÊNCIA:** nenhum dos dois (não tem contato)
- ✅ Pode ter AMBOS preenchidos (ex: compra de produto para revenda)

**Benefícios:**
- ✅ Clareza total: semântica correta
- ✅ Validação forte: tipo correto por campo
- ✅ Relatórios precisos: ROI usa `cliente_id`, Compras usa `fornecedor_id`
- ✅ Flexibilidade: transação pode ter cliente E fornecedor
- ✅ Mesma tabela `r_contatos`: sem duplicação de dados

---

## 🗂️ ARQUIVOS QUE SERÃO AFETADOS

### **Banco de Dados (Migrations):**
```
📁 supabase/migrations/
  └─ YYYYMMDDHHMMSS_separar_cliente_fornecedor_transacoes.sql  ← CRIAR NOVO
```

### **Tipos TypeScript:**
```
📁 src/tipos/
  ├─ database.ts                    ← MODIFICAR (interface Transacao)
  └─ index.ts                       ← VERIFICAR (exports)
```

### **Queries e Serviços:**
```
📁 src/servicos/supabase/
  ├─ transacoes-queries.ts          ← MODIFICAR (criar, atualizar, buscar)
  ├─ dashboard-queries.ts           ← MODIFICAR (usar cliente_id/fornecedor_id)
  ├─ roi-cliente-queries.ts         ← MODIFICAR (usar cliente_id)
  └─ relatorios-queries.ts          ← VERIFICAR (se usa contato_id)
```

### **Componentes UI:**
```
📁 src/componentes/modais/
  └─ modal-lancamento.tsx           ← MODIFICAR (Aba Relacionamento: 2 selects)

📁 src/componentes/transacoes/
  ├─ campos-essenciais.tsx          ← VERIFICAR (se mostra contato)
  ├─ lista-despesas.tsx             ← VERIFICAR (se exibe fornecedor)
  └─ lista-receitas.tsx             ← VERIFICAR (se exibe cliente)
```

### **Hooks:**
```
📁 src/hooks/
  ├─ usar-transacoes-optimized.ts   ← MODIFICAR (tipos)
  └─ usar-roi-clientes.ts           ← VERIFICAR (se usa cliente_id)
```

### **Validações:**
```
📁 src/utilitarios/
  └─ validacao.ts                   ← MODIFICAR (validar transação)
```

**Total:** ~12 arquivos afetados

---

## 📦 FASE 0: PREPARAÇÃO E ANÁLISE INICIAL

**Objetivo:** Garantir que tudo está pronto para iniciar
**Tempo:** 5 minutos
**Status:** 🔴 Pendente

### **Tarefa 0.1: Verificar Estado Atual do Banco**

**SQL a executar via MCP:**

```sql
-- 1. Verificar estrutura atual de fp_transacoes
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'fp_transacoes'
  AND column_name IN ('contato_id', 'cliente_id', 'fornecedor_id')
ORDER BY ordinal_position;

-- 2. Contar transações por tipo e vinculação
SELECT
  tipo,
  COUNT(*) as total,
  COUNT(contato_id) as com_contato,
  COUNT(*) - COUNT(contato_id) as sem_contato
FROM fp_transacoes
GROUP BY tipo
ORDER BY tipo;

-- 3. Verificar tipo_pessoa dos contatos vinculados
SELECT
  t.tipo as tipo_transacao,
  c.tipo_pessoa,
  COUNT(*) as quantidade
FROM fp_transacoes t
INNER JOIN r_contatos c ON t.contato_id = c.id
GROUP BY t.tipo, c.tipo_pessoa
ORDER BY t.tipo, c.tipo_pessoa;
```

**Checklist:**
- [ ] Campo `contato_id` existe em `fp_transacoes`
- [ ] Campos `cliente_id` e `fornecedor_id` NÃO existem ainda
- [ ] Identificadas quantas transações têm contato vinculado
- [ ] Identificados tipos de contato por tipo de transação

---

### **Tarefa 0.2: Backup de Segurança**

**SQL a executar:**

```sql
-- Criar tabela de backup temporária
CREATE TABLE IF NOT EXISTS fp_transacoes_backup_20251022 AS
SELECT * FROM fp_transacoes;

-- Verificar quantidade de registros
SELECT
  COUNT(*) as total_backup,
  (SELECT COUNT(*) FROM fp_transacoes) as total_original,
  COUNT(*) = (SELECT COUNT(*) FROM fp_transacoes) as backup_completo
FROM fp_transacoes_backup_20251022;
```

**Checklist:**
- [ ] Tabela de backup criada
- [ ] Quantidade de registros confere
- [ ] Backup completo confirmado

---

### **Tarefa 0.3: Validar TypeScript Antes de Começar**

**Comando a executar:**

```bash
npx tsc --noEmit
```

**Checklist:**
- [ ] Build TypeScript sem erros
- [ ] Pronto para iniciar modificações

---

## 📦 FASE 1: MIGRATIONS DO BANCO DE DADOS

**Objetivo:** Criar campos novos e migrar dados
**Tempo:** 20 minutos
**Status:** ✅ CONCLUÍDA

**Resultado:**
- ✅ Campo `fornecedor_id` criado (cliente_id já existia)
- ✅ Backup de 947 transações realizado
- ✅ 32 receitas migradas para `cliente_id`
- ✅ 375 despesas migradas para `fornecedor_id`
- ✅ Total: 407 transações migradas com sucesso
- ✅ Índices criados para performance
- ✅ Campo `contato_id` mantido como backup

### **Tarefa 1.1: Criar Migration - Adicionar Novos Campos**

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_separar_cliente_fornecedor_transacoes.sql`

**SQL COMPLETO da Migration:**

```sql
-- ============================================================================
-- MIGRATION: Separar cliente_id e fornecedor_id em fp_transacoes
-- Data: 2025-10-22
-- Objetivo: Substituir contato_id genérico por campos específicos
-- ============================================================================

-- ETAPA 1: Adicionar novos campos
-- ============================================================================

ALTER TABLE fp_transacoes
  ADD COLUMN cliente_id UUID REFERENCES r_contatos(id),
  ADD COLUMN fornecedor_id UUID REFERENCES r_contatos(id);

COMMENT ON COLUMN fp_transacoes.cliente_id IS 'Cliente vinculado (para receitas)';
COMMENT ON COLUMN fp_transacoes.fornecedor_id IS 'Fornecedor vinculado (para despesas)';

-- ETAPA 2: Migrar dados existentes
-- ============================================================================

-- 2.1: Migrar RECEITAS com contato_id → cliente_id
UPDATE fp_transacoes t
SET cliente_id = contato_id
FROM r_contatos c
WHERE t.contato_id = c.id
  AND t.tipo = 'receita'
  AND c.tipo_pessoa = 'cliente'
  AND t.cliente_id IS NULL; -- Evitar sobrescrever se já foi migrado

-- 2.2: Migrar DESPESAS com contato_id → fornecedor_id
-- ATENÇÃO: Dados atuais têm despesas vinculadas a "cliente" (erro histórico)
-- Esta query move para fornecedor_id mesmo assim (será ajustado manualmente depois)
UPDATE fp_transacoes t
SET fornecedor_id = contato_id
FROM r_contatos c
WHERE t.contato_id = c.id
  AND t.tipo = 'despesa'
  AND t.fornecedor_id IS NULL; -- Evitar sobrescrever

-- ETAPA 3: Criar índices para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_fp_transacoes_cliente_id
  ON fp_transacoes(cliente_id)
  WHERE cliente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fp_transacoes_fornecedor_id
  ON fp_transacoes(fornecedor_id)
  WHERE fornecedor_id IS NOT NULL;

-- ETAPA 4: Verificação pós-migração
-- ============================================================================

DO $$
DECLARE
  v_receitas_migradas INT;
  v_despesas_migradas INT;
  v_total_com_contato INT;
BEGIN
  -- Contar migrações
  SELECT COUNT(*) INTO v_receitas_migradas
  FROM fp_transacoes
  WHERE cliente_id IS NOT NULL;

  SELECT COUNT(*) INTO v_despesas_migradas
  FROM fp_transacoes
  WHERE fornecedor_id IS NOT NULL;

  SELECT COUNT(*) INTO v_total_com_contato
  FROM fp_transacoes
  WHERE contato_id IS NOT NULL;

  -- Log de verificação
  RAISE NOTICE '✅ Receitas migradas para cliente_id: %', v_receitas_migradas;
  RAISE NOTICE '✅ Despesas migradas para fornecedor_id: %', v_despesas_migradas;
  RAISE NOTICE 'ℹ️  Total com contato_id original: %', v_total_com_contato;

  -- Validação
  IF (v_receitas_migradas + v_despesas_migradas) != v_total_com_contato THEN
    RAISE WARNING '⚠️  ATENÇÃO: Quantidade migrada não confere!';
  END IF;
END $$;

-- ETAPA 5: Atualizar RLS Policies (se necessário)
-- ============================================================================

-- As policies existentes de fp_transacoes já cobrem todos os campos
-- porque usam workspace_id como filtro principal
-- Não é necessário criar policies específicas para cliente_id/fornecedor_id

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- NOTA IMPORTANTE:
-- O campo contato_id NÃO foi removido nesta migration por segurança.
-- Será removido em migration futura após validação completa.
```

**Como aplicar via MCP:**

```typescript
await mcp__supabase__apply_migration({
  name: "separar_cliente_fornecedor_transacoes",
  query: `[SQL COMPLETO ACIMA]`
})
```

**Checklist:**
- [ ] Migration criada com sucesso
- [ ] Campos `cliente_id` e `fornecedor_id` adicionados
- [ ] Dados migrados (receitas → cliente_id, despesas → fornecedor_id)
- [ ] Índices criados
- [ ] Log de verificação mostra quantidades corretas
- [ ] Sem erros de constraint violation

---

### **Tarefa 1.2: Validar Migration**

**SQL de validação:**

```sql
-- 1. Verificar estrutura atualizada
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'fp_transacoes'
  AND column_name IN ('contato_id', 'cliente_id', 'fornecedor_id')
ORDER BY ordinal_position;

-- 2. Verificar dados migrados
SELECT
  tipo,
  COUNT(*) as total,
  COUNT(contato_id) as com_contato_antigo,
  COUNT(cliente_id) as com_cliente,
  COUNT(fornecedor_id) as com_fornecedor
FROM fp_transacoes
GROUP BY tipo;

-- 3. Verificar consistência (receitas devem ter cliente, despesas fornecedor)
SELECT
  'Receitas com cliente' as metrica,
  COUNT(*) as quantidade
FROM fp_transacoes
WHERE tipo = 'receita' AND cliente_id IS NOT NULL
UNION ALL
SELECT
  'Despesas com fornecedor',
  COUNT(*)
FROM fp_transacoes
WHERE tipo = 'despesa' AND fornecedor_id IS NOT NULL
UNION ALL
SELECT
  'Total com contato_id original',
  COUNT(*)
FROM fp_transacoes
WHERE contato_id IS NOT NULL;

-- 4. Identificar possíveis problemas
SELECT
  id,
  tipo,
  descricao,
  contato_id,
  cliente_id,
  fornecedor_id
FROM fp_transacoes
WHERE (
  -- Receita sem cliente mas com contato
  (tipo = 'receita' AND contato_id IS NOT NULL AND cliente_id IS NULL)
  OR
  -- Despesa sem fornecedor mas com contato
  (tipo = 'despesa' AND contato_id IS NOT NULL AND fornecedor_id IS NULL)
)
LIMIT 10;
```

**Checklist:**
- [ ] 3 campos existem na tabela
- [ ] Receitas têm `cliente_id` preenchido
- [ ] Despesas têm `fornecedor_id` preenchido
- [ ] Quantidade migrada = quantidade com `contato_id`
- [ ] Sem registros problemáticos

---

## 📦 FASE 2: ATUALIZAR TIPOS TYPESCRIPT

**Objetivo:** Refletir mudanças do banco nos tipos
**Tempo:** 15 minutos
**Status:** ✅ CONCLUÍDA

**Resultado:**
- ✅ Campo `cliente_id` adicionado nas 3 seções (Row, Insert, Update)
- ✅ Campo `fornecedor_id` adicionado nas 3 seções (Row, Insert, Update)
- ✅ Interface `TransacaoComRelacionamentos` criada
- ✅ Relacionamentos `cliente?: Contato` e `fornecedor?: Contato` documentados
- ✅ TypeScript validado sem erros (npx tsc --noEmit)
- ✅ Campo `contato_id` mantido para compatibilidade

### **Tarefa 2.1: Atualizar Interface Transacao**

**Arquivo:** `src/tipos/database.ts`

**Localizar interface (linha ~200-300):**

```typescript
export interface Transacao {
  id: string
  descricao: string
  valor: number
  data: string
  tipo: 'receita' | 'despesa' | 'transferencia'
  categoria_id?: string
  subcategoria_id?: string
  conta_id: string
  forma_pagamento_id?: string
  centro_custo_id?: string

  // CAMPO ANTIGO (será removido depois)
  contato_id?: string

  // CAMPOS NOVOS - ADICIONAR AQUI:
  cliente_id?: string        // Cliente vinculado (para receitas)
  fornecedor_id?: string     // Fornecedor vinculado (para despesas)

  recorrente: boolean
  parcelado: boolean
  numero_parcela?: number
  total_parcelas?: number
  grupo_parcelamento_id?: string
  recorrencia_tipo?: 'mensal' | 'trimestral' | 'semestral' | 'anual'
  recorrencia_proxima?: string
  observacoes?: string
  anexos?: string[]
  tags?: string[]
  pago: boolean
  workspace_id: string
  created_at: string
  updated_at: string

  // Relacionamentos (joins)
  categoria?: Categoria
  subcategoria?: Subcategoria
  conta?: Conta
  forma_pagamento?: FormaPagamento
  centro_custo?: CentroCusto

  // RELACIONAMENTOS NOVOS - ADICIONAR AQUI:
  cliente?: Contato           // Join com r_contatos (tipo_pessoa='cliente')
  fornecedor?: Contato        // Join com r_contatos (tipo_pessoa='fornecedor')

  // Relacionamento antigo (manter por enquanto)
  contato?: Contato
}
```

**Checklist:**
- [ ] `cliente_id?: string` adicionado
- [ ] `fornecedor_id?: string` adicionado
- [ ] `cliente?: Contato` adicionado (relacionamento)
- [ ] `fornecedor?: Contato` adicionado (relacionamento)
- [ ] `contato_id` e `contato` mantidos (temporariamente)

---

### **Tarefa 2.2: Validar TypeScript**

**Comando:**

```bash
npx tsc --noEmit
```

**Checklist:**
- [ ] Build TypeScript sem erros
- [ ] Nenhum erro de tipo faltando
- [ ] Interfaces atualizadas corretamente

---

## 📦 FASE 3: ATUALIZAR QUERIES E SERVIÇOS

**Objetivo:** Modificar funções que criam/editam transações
**Tempo:** 25 minutos
**Status:** ✅ CONCLUÍDA

**Resultado:**
- ✅ 4 funções SELECT atualizadas em `transacoes.ts` (JOINs de cliente/fornecedor)
  - `obterTransacoes()`
  - `obterTransacaoPorId()`
  - `buscarParcelasPorGrupo()`
  - `buscarTransacoesRecorrentes()`
- ✅ 3 funções SQL ROI atualizadas via migration
  - `calcular_roi_clientes_v2` (cliente_id ao invés de contato_id)
  - `buscar_detalhes_roi_cliente_v2` (cliente_id ao invés de contato_id)
  - `buscar_evolucao_roi_cliente_v2` (cliente_id ao invés de contato_id)
- ✅ TypeScript validado sem erros (npx tsc --noEmit)
- ✅ Funções `criarTransacao()` e `atualizarTransacao()` já suportam cliente_id/fornecedor_id via tipos NovaTransacao
- ✅ `dashboard-queries.ts` não precisa de alteração (apenas agregações)

### **Tarefa 3.1: Atualizar `transacoes-queries.ts` - Criar Transação**

**Arquivo:** `src/servicos/supabase/transacoes-queries.ts`

**Localizar função `criarTransacao` (linha ~50-150):**

**ANTES:**
```typescript
export async function criarTransacao(dados: {
  descricao: string
  valor: number
  data: string
  tipo: 'receita' | 'despesa' | 'transferencia'
  conta_id: string
  categoria_id?: string
  subcategoria_id?: string
  forma_pagamento_id?: string
  centro_custo_id?: string
  contato_id?: string  // ← Campo antigo
  observacoes?: string
  pago: boolean
  workspace_id: string
}) {
  const { data, error } = await supabase
    .from('fp_transacoes')
    .insert({
      descricao: dados.descricao,
      valor: dados.valor,
      data: dados.data,
      tipo: dados.tipo,
      conta_id: dados.conta_id,
      categoria_id: dados.categoria_id,
      subcategoria_id: dados.subcategoria_id,
      forma_pagamento_id: dados.forma_pagamento_id,
      centro_custo_id: dados.centro_custo_id,
      contato_id: dados.contato_id,  // ← Campo antigo
      observacoes: dados.observacoes,
      pago: dados.pago,
      recorrente: false,
      parcelado: false,
      workspace_id: dados.workspace_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

**DEPOIS:**
```typescript
export async function criarTransacao(dados: {
  descricao: string
  valor: number
  data: string
  tipo: 'receita' | 'despesa' | 'transferencia'
  conta_id: string
  categoria_id?: string
  subcategoria_id?: string
  forma_pagamento_id?: string
  centro_custo_id?: string

  // CAMPOS NOVOS:
  cliente_id?: string        // Para receitas
  fornecedor_id?: string     // Para despesas

  // Campo antigo (manter compatibilidade temporária)
  contato_id?: string

  observacoes?: string
  pago: boolean
  workspace_id: string
}) {
  const { data, error } = await supabase
    .from('fp_transacoes')
    .insert({
      descricao: dados.descricao,
      valor: dados.valor,
      data: dados.data,
      tipo: dados.tipo,
      conta_id: dados.conta_id,
      categoria_id: dados.categoria_id,
      subcategoria_id: dados.subcategoria_id,
      forma_pagamento_id: dados.forma_pagamento_id,
      centro_custo_id: dados.centro_custo_id,

      // CAMPOS NOVOS:
      cliente_id: dados.cliente_id,
      fornecedor_id: dados.fornecedor_id,

      // Campo antigo (manter por enquanto)
      contato_id: dados.contato_id,

      observacoes: dados.observacoes,
      pago: dados.pago,
      recorrente: false,
      parcelado: false,
      workspace_id: dados.workspace_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

**Checklist:**
- [ ] Interface de parâmetros atualizada
- [ ] `cliente_id` adicionado no insert
- [ ] `fornecedor_id` adicionado no insert
- [ ] `contato_id` mantido temporariamente

---

### **Tarefa 3.2: Atualizar `transacoes-queries.ts` - Editar Transação**

**Localizar função `atualizarTransacao` (linha ~200-300):**

**ANTES:**
```typescript
export async function atualizarTransacao(
  id: string,
  dados: {
    descricao?: string
    valor?: number
    data?: string
    categoria_id?: string
    subcategoria_id?: string
    forma_pagamento_id?: string
    centro_custo_id?: string
    contato_id?: string  // ← Campo antigo
    observacoes?: string
    pago?: boolean
  },
  workspaceId: string
) {
  const { data, error } = await supabase
    .from('fp_transacoes')
    .update({
      ...dados,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) throw error
  return data
}
```

**DEPOIS:**
```typescript
export async function atualizarTransacao(
  id: string,
  dados: {
    descricao?: string
    valor?: number
    data?: string
    categoria_id?: string
    subcategoria_id?: string
    forma_pagamento_id?: string
    centro_custo_id?: string

    // CAMPOS NOVOS:
    cliente_id?: string
    fornecedor_id?: string

    // Campo antigo (manter)
    contato_id?: string

    observacoes?: string
    pago?: boolean
  },
  workspaceId: string
) {
  const { data, error } = await supabase
    .from('fp_transacoes')
    .update({
      ...dados,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) throw error
  return data
}
```

**Checklist:**
- [ ] Interface de parâmetros atualizada
- [ ] `cliente_id` e `fornecedor_id` podem ser atualizados
- [ ] Spread operator (`...dados`) mantém compatibilidade

---

### **Tarefa 3.3: Atualizar Queries de Listagem (SELECT com JOIN)**

**Localizar funções que buscam transações (várias no arquivo):**

**Exemplo: `obterTransacoes`, `obterTransacoesPorPeriodo`, etc.**

**ANTES:**
```typescript
.select(`
  *,
  categoria:fp_categorias(id, nome, cor),
  subcategoria:fp_subcategorias(id, nome),
  conta:fp_contas(id, nome, tipo),
  forma_pagamento:fp_formas_pagamento(id, nome),
  centro_custo:fp_centros_custo(id, nome, cor),
  contato:r_contatos(id, nome, tipo_pessoa)
`)
```

**DEPOIS:**
```typescript
.select(`
  *,
  categoria:fp_categorias(id, nome, cor),
  subcategoria:fp_subcategorias(id, nome),
  conta:fp_contas(id, nome, tipo),
  forma_pagamento:fp_formas_pagamento(id, nome),
  centro_custo:fp_centros_custo(id, nome, cor),

  /* JOINS NOVOS: */
  cliente:r_contatos!cliente_id(id, nome, tipo_pessoa, telefone, email),
  fornecedor:r_contatos!fornecedor_id(id, nome, tipo_pessoa, telefone, email),

  /* JOIN ANTIGO (manter temporariamente): */
  contato:r_contatos!contato_id(id, nome, tipo_pessoa)
`)
```

**Atenção:** O sufixo `!cliente_id` e `!fornecedor_id` é necessário para especificar qual foreign key usar.

**Arquivos a verificar:**
- `src/servicos/supabase/transacoes-queries.ts` (múltiplas funções)
- `src/servicos/supabase/dashboard-queries.ts` (se busca transações)
- `src/servicos/supabase/relatorios-queries.ts` (se busca transações)

**Checklist:**
- [ ] Todas as queries SELECT atualizadas
- [ ] JOINs de `cliente` e `fornecedor` adicionados
- [ ] JOIN de `contato` mantido temporariamente
- [ ] Syntax `!cliente_id` e `!fornecedor_id` correto

---

### **Tarefa 3.4: Atualizar ROI Cliente Queries**

**Arquivo:** `src/servicos/supabase/roi-cliente-queries.ts`

**Verificar se as funções SQL já usam `cliente_id` ou ainda usam `contato_id`:**

**Funções a verificar:**
- `calcular_roi_clientes_v2`
- `buscar_detalhes_roi_cliente_v2`
- `buscar_evolucao_roi_cliente_v2`

**Se ainda usam `contato_id`, criar migrations para atualizar:**

```sql
-- Exemplo de atualização de função SQL
CREATE OR REPLACE FUNCTION calcular_roi_clientes_v2(
  p_workspace_id uuid,
  p_data_inicio date DEFAULT NULL,
  p_data_fim date DEFAULT NULL
)
RETURNS TABLE(
  cliente_id uuid,
  cliente_nome text,
  receita numeric,
  despesa numeric,
  lucro numeric,
  margem numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS cliente_id,
    c.nome::TEXT AS cliente_nome,
    COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END), 0)::NUMERIC AS receita,
    COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END), 0)::NUMERIC AS despesa,
    (COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END), 0) -
     COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END), 0))::NUMERIC AS lucro,
    CASE
      WHEN SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) > 0 THEN
        (((SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) -
           SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END)) /
          SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END)) * 100)::NUMERIC
      ELSE 0::NUMERIC
    END AS margem
  FROM r_contatos c
  LEFT JOIN fp_transacoes t ON t.cliente_id = c.id  -- ← MUDOU: cliente_id ao invés de contato_id
    AND t.workspace_id = p_workspace_id
    AND t.cliente_id IS NOT NULL
    AND (p_data_inicio IS NULL OR t.data::DATE >= p_data_inicio)
    AND (p_data_fim IS NULL OR t.data::DATE <= p_data_fim)
  WHERE c.workspace_id = p_workspace_id
    AND c.tipo_pessoa = 'cliente'
    AND c.ativo = true
  GROUP BY c.id, c.nome
  HAVING COUNT(t.id) > 0
  ORDER BY margem DESC NULLS LAST;
END;
$$;
```

**Checklist:**
- [ ] Funções SQL de ROI atualizadas para usar `cliente_id`
- [ ] Migrations aplicadas
- [ ] Queries TypeScript chamam funções corretas

---

### **Tarefa 3.5: Validar TypeScript Após Mudanças**

**Comando:**

```bash
npx tsc --noEmit
```

**Checklist:**
- [ ] Build TypeScript sem erros
- [ ] Todas as queries compilam

---

## 📦 FASE 4: ATUALIZAR INTERFACE (MODAL DE LANÇAMENTO)

**Objetivo:** Criar 2 selects separados na aba Relacionamento
**Tempo:** 30 minutos
**Status:** ✅ CONCLUÍDA

**Resultado:**
- ✅ `ESTADO_INICIAL` atualizado com `cliente_id` e `fornecedor_id` (linha 71-73)
- ✅ `mapearTransacaoParaEstado` atualizado para incluir novos campos (linhas 145-146)
- ✅ Select Cliente corrigido para usar `dados.cliente_id` (linha 721)
- ✅ Select Fornecedor corrigido para usar `dados.fornecedor_id` (linha 739)
- ✅ TypeScript validado sem erros (npx tsc --noEmit)
- ✅ Campo `contato_id` mantido temporariamente para compatibilidade

### **Tarefa 4.1: Modificar Modal de Lançamento - Estado Inicial**

**Arquivo:** `src/componentes/modais/modal-lancamento.tsx`

**Localizar estado inicial (linha ~100-150):**

**ANTES:**
```typescript
const ESTADO_INICIAL = {
  descricao: '',
  valor: 0,
  data: formatarDataParaInput(new Date()),
  tipo: 'despesa' as const,
  conta_id: '',
  categoria_id: '',
  subcategoria_id: '',
  forma_pagamento_id: '',
  centro_custo_id: '',
  contato_id: '',  // ← Campo antigo
  observacoes: '',
  pago: false,
  // ... outros campos
}
```

**DEPOIS:**
```typescript
const ESTADO_INICIAL = {
  descricao: '',
  valor: 0,
  data: formatarDataParaInput(new Date()),
  tipo: 'despesa' as const,
  conta_id: '',
  categoria_id: '',
  subcategoria_id: '',
  forma_pagamento_id: '',
  centro_custo_id: '',

  // CAMPOS NOVOS:
  cliente_id: '',      // Para receitas
  fornecedor_id: '',   // Para despesas

  // Campo antigo (manter temporariamente)
  contato_id: '',

  observacoes: '',
  pago: false,
  // ... outros campos
}
```

**Checklist:**
- [ ] `cliente_id: ''` adicionado ao estado inicial
- [ ] `fornecedor_id: ''` adicionado ao estado inicial
- [ ] `contato_id` mantido

---

### **Tarefa 4.2: Modificar Aba Relacionamento - UI**

**Localizar aba "Relacionamento" (linha ~800-1000):**

**ANTES:**
```typescript
{/* Aba 3: Relacionamento */}
{abaAtiva === 3 && (
  <div className="space-y-4">
    {/* Campo único de Contato */}
    <div className="space-y-2">
      <Label htmlFor="contato_id">Contato (Cliente/Fornecedor)</Label>
      <Select
        id="contato_id"
        value={dados.contato_id || ''}
        onChange={(e) => atualizarCampo('contato_id', e.target.value || undefined)}
      >
        <option value="">Selecione um contato</option>
        {/* Lista TODOS os contatos misturados */}
        {dadosAuxiliares?.clientes?.map(cliente => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.nome}
          </option>
        ))}
        {dadosAuxiliares?.fornecedores?.map(fornecedor => (
          <option key={fornecedor.id} value={fornecedor.id}>
            {fornecedor.nome}
          </option>
        ))}
      </Select>
    </div>

    {/* Centro de Custo */}
    <div className="space-y-2">
      <Label htmlFor="centro_custo_id">Projeto/Centro de Custo</Label>
      <Select
        id="centro_custo_id"
        value={dados.centro_custo_id || ''}
        onChange={(e) => atualizarCampo('centro_custo_id', e.target.value || undefined)}
      >
        <option value="">Selecione um projeto</option>
        {dadosAuxiliares?.centrosCusto?.map(centro => (
          <option key={centro.id} value={centro.id}>
            {centro.nome}
          </option>
        ))}
      </Select>
    </div>
  </div>
)}
```

**DEPOIS:**
```typescript
{/* Aba 3: Relacionamento */}
{abaAtiva === 3 && (
  <div className="space-y-4">
    {/* Banner Informativo */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
      <div className="flex gap-2">
        <span>💡</span>
        <div>
          <strong>Vincule contatos às transações:</strong>
          <p className="mt-1 text-blue-700">
            • Receitas → preencha Cliente<br/>
            • Despesas → preencha Fornecedor<br/>
            • Pode preencher ambos (ex: compra para revenda)
          </p>
        </div>
      </div>
    </div>

    {/* CAMPO NOVO: Cliente (para receitas) */}
    <div className="space-y-2">
      <Label htmlFor="cliente_id">
        Cliente (para receitas)
        {dados.tipo === 'receita' && <span className="text-orange-500 ml-1">●</span>}
      </Label>
      <Select
        id="cliente_id"
        value={dados.cliente_id || ''}
        onChange={(e) => atualizarCampo('cliente_id', e.target.value || undefined)}
        disabled={dados.tipo === 'transferencia'}
      >
        <option value="">Nenhum cliente</option>
        {dadosAuxiliares?.clientes
          ?.filter(c => c.ativo) // Apenas clientes ativos
          ?.sort((a, b) => a.nome.localeCompare(b.nome))
          ?.map(cliente => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
      </Select>
      <p className="text-xs text-muted-foreground">
        Selecione o cliente desta receita para análise de ROI
      </p>
    </div>

    {/* CAMPO NOVO: Fornecedor (para despesas) */}
    <div className="space-y-2">
      <Label htmlFor="fornecedor_id">
        Fornecedor (para despesas)
        {dados.tipo === 'despesa' && <span className="text-orange-500 ml-1">●</span>}
      </Label>
      <Select
        id="fornecedor_id"
        value={dados.fornecedor_id || ''}
        onChange={(e) => atualizarCampo('fornecedor_id', e.target.value || undefined)}
        disabled={dados.tipo === 'transferencia'}
      >
        <option value="">Nenhum fornecedor</option>
        {dadosAuxiliares?.fornecedores
          ?.filter(f => f.ativo) // Apenas fornecedores ativos
          ?.sort((a, b) => a.nome.localeCompare(b.nome))
          ?.map(fornecedor => (
            <option key={fornecedor.id} value={fornecedor.id}>
              {fornecedor.nome}
            </option>
          ))}
      </Select>
      <p className="text-xs text-muted-foreground">
        Selecione o fornecedor desta despesa para controle de compras
      </p>
    </div>

    {/* Centro de Custo (mantém igual) */}
    <div className="space-y-2">
      <Label htmlFor="centro_custo_id">Projeto/Centro de Custo</Label>
      <Select
        id="centro_custo_id"
        value={dados.centro_custo_id || ''}
        onChange={(e) => atualizarCampo('centro_custo_id', e.target.value || undefined)}
      >
        <option value="">Nenhum projeto</option>
        {dadosAuxiliares?.centrosCusto
          ?.filter(c => c.ativo)
          ?.sort((a, b) => a.nome.localeCompare(b.nome))
          ?.map(centro => (
            <option key={centro.id} value={centro.id}>
              {centro.nome}
            </option>
          ))}
      </Select>
    </div>
  </div>
)}
```

**Checklist:**
- [ ] Banner informativo adicionado
- [ ] Select "Cliente" criado (apenas clientes ativos)
- [ ] Select "Fornecedor" criado (apenas fornecedores ativos)
- [ ] Indicadores visuais (● laranja) quando relevante
- [ ] Campos desabilitados para transferência
- [ ] Ordenação alfabética implementada
- [ ] Textos de ajuda adicionados

---

### **Tarefa 4.3: Adicionar Validação (Opcional mas Recomendado)**

**Arquivo:** `src/utilitarios/validacao.ts`

**Localizar função `validarTransacao` ou criar se não existir:**

```typescript
/**
 * Valida dados de transação
 */
export function validarTransacao(dados: {
  tipo: 'receita' | 'despesa' | 'transferencia'
  cliente_id?: string
  fornecedor_id?: string
  // ... outros campos
}): string[] {
  const erros: string[] = []

  // Validação: Receita deve ter cliente (recomendado)
  if (dados.tipo === 'receita' && !dados.cliente_id) {
    // Apenas warning, não erro crítico
    console.warn('⚠️ Receita sem cliente vinculado - ROI não será calculado')
  }

  // Validação: Despesa deve ter fornecedor (recomendado)
  if (dados.tipo === 'despesa' && !dados.fornecedor_id) {
    // Apenas warning, não erro crítico
    console.warn('⚠️ Despesa sem fornecedor vinculado - relatório de compras incompleto')
  }

  // Validação: Transferência não deve ter cliente nem fornecedor
  if (dados.tipo === 'transferencia') {
    if (dados.cliente_id || dados.fornecedor_id) {
      erros.push('Transferências não devem ter cliente ou fornecedor vinculado')
    }
  }

  return erros
}
```

**Checklist:**
- [ ] Validação criada
- [ ] Warnings para receita sem cliente
- [ ] Warnings para despesa sem fornecedor
- [ ] Erro para transferência com contato

---

### **Tarefa 4.4: Testar Interface Localmente**

**Comando:**

```bash
npm run dev
```

**Testar:**
1. Abrir modal de lançamento
2. Ir para aba "Relacionamento"
3. Verificar 2 selects separados
4. Trocar tipo da transação (receita ↔ despesa)
5. Verificar indicadores visuais (● laranja)

**Checklist:**
- [ ] Select Cliente aparece
- [ ] Select Fornecedor aparece
- [ ] Apenas clientes ativos no select Cliente
- [ ] Apenas fornecedores ativos no select Fornecedor
- [ ] Banner informativo visível
- [ ] Campos desabilitados para transferência
- [ ] Indicadores visuais funcionando

---

## 📦 FASE 5: VALIDAÇÃO E TESTES

**Objetivo:** Garantir que tudo funciona
**Tempo:** 15 minutos
**Status:** ✅ CONCLUÍDA

**Resultado:**
- ✅ Estrutura do banco validada (3 campos: contato_id, cliente_id, fornecedor_id)
- ✅ Dados migrados confirmados:
  - 32 receitas com cliente_id preenchido
  - 375 despesas com fornecedor_id preenchido
  - Total: 407 transações migradas corretamente
- ✅ Função ROI testada e funcionando (calcular_roi_clientes_v2)
  - Retorna dados corretos usando cliente_id
  - Exemplo: Cliente "MARIA CRISTINA POLO DA COSTA" - Receita: R$ 29.910,00, Margem: 100%
- ✅ Build de produção concluído sem erros (npm run build)
  - Tempo de compilação: 18.0s
  - 39 páginas estáticas geradas
  - Sem erros de TypeScript ou linting

### **Tarefa 5.1: Testes no Banco de Dados**

**SQL de testes:**

```sql
-- TESTE 1: Criar transação de teste (receita com cliente)
INSERT INTO fp_transacoes (
  descricao,
  valor,
  data,
  tipo,
  conta_id,
  categoria_id,
  cliente_id,
  pago,
  recorrente,
  parcelado,
  workspace_id
) VALUES (
  'TESTE - Venda para Cliente X',
  1000.00,
  CURRENT_DATE,
  'receita',
  (SELECT id FROM fp_contas WHERE workspace_id = '<SEU_WORKSPACE_ID>' LIMIT 1),
  (SELECT id FROM fp_categorias WHERE workspace_id = '<SEU_WORKSPACE_ID>' LIMIT 1),
  (SELECT id FROM r_contatos WHERE tipo_pessoa = 'cliente' AND workspace_id = '<SEU_WORKSPACE_ID>' LIMIT 1),
  true,
  false,
  false,
  '<SEU_WORKSPACE_ID>'
)
RETURNING id, descricao, tipo, cliente_id, fornecedor_id;

-- TESTE 2: Criar transação de teste (despesa com fornecedor)
INSERT INTO fp_transacoes (
  descricao,
  valor,
  data,
  tipo,
  conta_id,
  categoria_id,
  fornecedor_id,
  pago,
  recorrente,
  parcelado,
  workspace_id
) VALUES (
  'TESTE - Compra de Fornecedor Y',
  500.00,
  CURRENT_DATE,
  'despesa',
  (SELECT id FROM fp_contas WHERE workspace_id = '<SEU_WORKSPACE_ID>' LIMIT 1),
  (SELECT id FROM fp_categorias WHERE workspace_id = '<SEU_WORKSPACE_ID>' LIMIT 1),
  (SELECT id FROM r_contatos WHERE tipo_pessoa = 'fornecedor' AND workspace_id = '<SEU_WORKSPACE_ID>' LIMIT 1),
  true,
  false,
  false,
  '<SEU_WORKSPACE_ID>'
)
RETURNING id, descricao, tipo, cliente_id, fornecedor_id;

-- TESTE 3: Verificar JOINs
SELECT
  t.id,
  t.descricao,
  t.tipo,
  t.valor,
  cliente.nome as cliente_nome,
  fornecedor.nome as fornecedor_nome
FROM fp_transacoes t
LEFT JOIN r_contatos cliente ON cliente.id = t.cliente_id
LEFT JOIN r_contatos fornecedor ON fornecedor.id = t.fornecedor_id
WHERE t.descricao LIKE 'TESTE -%'
ORDER BY t.created_at DESC;

-- TESTE 4: Deletar transações de teste
DELETE FROM fp_transacoes WHERE descricao LIKE 'TESTE -%';
```

**Checklist:**
- [ ] Inserts funcionam sem erro
- [ ] JOINs retornam dados corretos
- [ ] Cliente aparece em receita
- [ ] Fornecedor aparece em despesa
- [ ] Transações de teste deletadas

---

### **Tarefa 5.2: Testes na Interface**

**Testar criação de receita:**
1. Abrir modal "Lançar Transação"
2. Tipo: "Receita"
3. Preencher dados essenciais
4. Ir para aba "Relacionamento"
5. Selecionar um cliente
6. Salvar

**Verificar no banco:**
```sql
SELECT
  descricao,
  tipo,
  cliente_id,
  fornecedor_id,
  (SELECT nome FROM r_contatos WHERE id = cliente_id) as cliente_nome
FROM fp_transacoes
ORDER BY created_at DESC
LIMIT 1;
```

**Checklist:**
- [ ] Receita criada com sucesso
- [ ] `cliente_id` preenchido
- [ ] `fornecedor_id` NULL
- [ ] Cliente correto vinculado

---

**Testar criação de despesa:**
1. Abrir modal "Lançar Transação"
2. Tipo: "Despesa"
3. Preencher dados essenciais
4. Ir para aba "Relacionamento"
5. Selecionar um fornecedor
6. Salvar

**Verificar no banco:**
```sql
SELECT
  descricao,
  tipo,
  cliente_id,
  fornecedor_id,
  (SELECT nome FROM r_contatos WHERE id = fornecedor_id) as fornecedor_nome
FROM fp_transacoes
ORDER BY created_at DESC
LIMIT 1;
```

**Checklist:**
- [ ] Despesa criada com sucesso
- [ ] `cliente_id` NULL
- [ ] `fornecedor_id` preenchido
- [ ] Fornecedor correto vinculado

---

### **Tarefa 5.3: Validar Build de Produção**

**Comandos:**

```bash
# 1. Validar TypeScript
npx tsc --noEmit

# 2. Build de produção
npm run build

# 3. Verificar tempo de build
# Tempo esperado: < 60s (meta: 43-50s)
```

**Checklist:**
- [ ] TypeScript sem erros
- [ ] Build completo sem erros
- [ ] Tempo de build aceitável
- [ ] Sem warnings críticos

---

### **Tarefa 5.4: Testar Relatório ROI**

**Testar se ROI ainda funciona:**

1. Acessar: `/relatorios/roi-cliente`
2. Verificar se clientes aparecem
3. Expandir um cliente
4. Verificar dados de receita/despesa

**SQL de verificação:**
```sql
-- Testar função SQL de ROI
SELECT * FROM calcular_roi_clientes_v2(
  '<SEU_WORKSPACE_ID>',
  NULL,
  NULL
);
```

**Checklist:**
- [ ] Relatório ROI carrega sem erro
- [ ] Clientes aparecem na lista
- [ ] Receitas calculadas corretamente
- [ ] Função SQL usa `cliente_id`

---

## 📦 FASE 6: LIMPEZA E DOCUMENTAÇÃO

**Objetivo:** Remover campo antigo e atualizar docs
**Tempo:** 10 minutos
**Status:** 🔴 Pendente

### **Tarefa 6.1: Remover Campo Antigo `contato_id` (OPCIONAL)**

**⚠️ ATENÇÃO:** Só execute esta tarefa APÓS validar que tudo funciona perfeitamente!

**Migration de limpeza:**

```sql
-- ============================================================================
-- MIGRATION: Remover campo contato_id antigo
-- Data: 2025-10-22
-- Pré-requisito: FASE 5 completa e validada
-- ============================================================================

-- ETAPA 1: Verificar se ainda há dependências
DO $$
DECLARE
  v_count INT;
BEGIN
  -- Contar quantos registros usam apenas contato_id
  SELECT COUNT(*) INTO v_count
  FROM fp_transacoes
  WHERE contato_id IS NOT NULL
    AND cliente_id IS NULL
    AND fornecedor_id IS NULL;

  IF v_count > 0 THEN
    RAISE EXCEPTION '⚠️ Ainda existem % transações usando apenas contato_id. Migre-as primeiro!', v_count;
  END IF;

  RAISE NOTICE '✅ Nenhuma transação depende exclusivamente de contato_id. Seguro remover.';
END $$;

-- ETAPA 2: Remover coluna
ALTER TABLE fp_transacoes DROP COLUMN contato_id;

RAISE NOTICE '✅ Campo contato_id removido com sucesso!';
```

**Checklist:**
- [ ] Validado que não há dependências
- [ ] Campo `contato_id` removido do banco
- [ ] Sistema continua funcionando

---

### **Tarefa 6.2: Remover Código TypeScript Antigo**

**Arquivos a limpar:**

1. **`src/tipos/database.ts`:**
```typescript
// REMOVER:
contato_id?: string
contato?: Contato
```

2. **`src/componentes/modais/modal-lancamento.tsx`:**
```typescript
// REMOVER do estado inicial:
contato_id: '',
```

3. **Queries que ainda mencionam `contato`:**
```typescript
// REMOVER joins antigos:
contato:r_contatos!contato_id(id, nome, tipo_pessoa)
```

**Checklist:**
- [ ] Tipos TypeScript limpos
- [ ] Estado inicial limpo
- [ ] Queries limpas
- [ ] `npx tsc --noEmit` sem erros

---

### **Tarefa 6.3: Atualizar Documentação**

**Atualizar este documento:**

Marcar TODAS as fases como ✅ CONCLUÍDAS no topo do documento.

**Atualizar `docs/Resumo.md`:**

Adicionar entrada nas "ÚLTIMAS ATUALIZAÇÕES":

```markdown
### **✅ SEPARAÇÃO CLIENTE/FORNECEDOR (22/10/2025)**
- **Status**: ✅ Campos separados implementados
- **Mudança**: `contato_id` → `cliente_id` + `fornecedor_id`
- **Benefício**: Semântica clara, relatórios precisos
- **Migrations**: `separar_cliente_fornecedor_transacoes`
- **Arquivos**: 12 arquivos modificados
```

**Checklist:**
- [ ] Este documento atualizado
- [ ] `docs/Resumo.md` atualizado
- [ ] Progresso marcado como concluído

---

## 📊 CHECKLIST FINAL DE VALIDAÇÃO

### **Banco de Dados:**
- [ ] Campos `cliente_id` e `fornecedor_id` existem
- [ ] Dados migrados corretamente
- [ ] Índices criados
- [ ] RLS funcionando
- [ ] Campo `contato_id` removido (ou mantido temporariamente)

### **Código TypeScript:**
- [ ] Tipos atualizados
- [ ] Queries de criação atualizadas
- [ ] Queries de edição atualizadas
- [ ] Queries de listagem (SELECT) atualizadas
- [ ] ROI queries usando `cliente_id`
- [ ] Build sem erros (`npx tsc --noEmit`)

### **Interface:**
- [ ] Modal de lançamento com 2 selects
- [ ] Select Cliente (apenas clientes ativos)
- [ ] Select Fornecedor (apenas fornecedores ativos)
- [ ] Banner informativo visível
- [ ] Indicadores visuais funcionando
- [ ] Campos desabilitados para transferência

### **Testes:**
- [ ] Receita criada com cliente vinculado
- [ ] Despesa criada com fornecedor vinculado
- [ ] Transferência sem contatos
- [ ] Edição de transação funciona
- [ ] Relatório ROI funciona
- [ ] Build de produção funciona (`npm run build`)

### **Documentação:**
- [ ] Este plano atualizado
- [ ] `docs/Resumo.md` atualizado
- [ ] Comentários em código importantes

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Perda de dados na migração** | Baixa | Crítico | Backup criado na FASE 0 |
| **Foreign key constraint violation** | Média | Alto | Migration verifica constraints antes |
| **Queries SQL quebram** | Média | Alto | Testar cada query após atualização |
| **Build TypeScript falha** | Baixa | Médio | Validar após cada fase |
| **ROI para de funcionar** | Média | Alto | Testar função SQL após migração |
| **Performance degrada** | Baixa | Médio | Índices criados em cliente_id e fornecedor_id |

---

## 🔄 ROLLBACK (Se necessário)

**Se algo der muito errado, execute:**

```sql
-- 1. Restaurar backup
DROP TABLE fp_transacoes;
ALTER TABLE fp_transacoes_backup_20251022 RENAME TO fp_transacoes;

-- 2. Recriar índices (se necessário)
CREATE INDEX idx_fp_transacoes_workspace ON fp_transacoes(workspace_id);
CREATE INDEX idx_fp_transacoes_conta ON fp_transacoes(conta_id);
-- ... outros índices conforme necessário

-- 3. Verificar integridade
SELECT COUNT(*) FROM fp_transacoes;
```

---

## 📚 ARQUIVOS DE REFERÊNCIA

**Para consultar durante implementação:**

1. **Migrations anteriores:**
   - `supabase/migrations/*_create_fp_transacoes.sql`
   - `supabase/migrations/*_roi_cliente_*.sql`

2. **Código existente:**
   - `src/componentes/modais/modal-lancamento.tsx` (padrão UI)
   - `src/servicos/supabase/transacoes-queries.ts` (padrão queries)
   - `src/tipos/database.ts` (padrão de tipos)

3. **Documentação:**
   - `docs/Resumo.md` (contexto geral)
   - `PLANO-REFATORACAO-ROI-CONTATOS.md` (refatoração similar)
   - `docs/desenvolvimento/IMPLEMENTACAO-CADASTRO-CONTATOS-SEPARADOS.md`

---

## 💡 DICAS IMPORTANTES

1. **Execute uma fase por vez** - Não pule etapas
2. **Valide TypeScript após cada mudança** - `npx tsc --noEmit`
3. **Teste no banco ANTES de modificar código** - SQL primeiro
4. **Mantenha `contato_id` temporariamente** - Remove só no final
5. **Faça backup SEMPRE** - Segurança em primeiro lugar
6. **Use MCP para queries** - Mais rápido que executar manualmente
7. **Commits frequentes** - Não solicitado pelo Ricardo, mas recomendado

---

## 🎯 RESULTADO ESPERADO FINAL

### **Banco de Dados:**
```sql
fp_transacoes {
  id: UUID
  tipo: 'receita' | 'despesa' | 'transferencia'

  cliente_id: UUID | NULL        -- Cliente (para receitas)
  fornecedor_id: UUID | NULL     -- Fornecedor (para despesas)

  -- contato_id REMOVIDO --

  ... outros campos
}
```

### **Interface:**
```
┌─────────────────────────────────────┐
│ 📊 Relacionamento                   │
├─────────────────────────────────────┤
│ 💡 Receitas → Cliente               │
│    Despesas → Fornecedor            │
├─────────────────────────────────────┤
│ Cliente (para receitas):            │
│ [Select: João Silva            ▼] ● │ ← Indicador laranja se receita
│                                     │
│ Fornecedor (para despesas):         │
│ [Select: Fornecedor ABC        ▼] ● │ ← Indicador laranja se despesa
│                                     │
│ Projeto/Centro de Custo:            │
│ [Select: Projeto X             ▼]   │
└─────────────────────────────────────┘
```

### **Dados:**
```
Receita R$ 1.000 → cliente_id=<João Silva>, fornecedor_id=NULL
Despesa R$ 500   → cliente_id=NULL, fornecedor_id=<Fornecedor ABC>
Transferência    → cliente_id=NULL, fornecedor_id=NULL
```

---

## 📞 SUPORTE

**Se encontrar problemas:**

1. Verifique checklist da fase atual
2. Execute SQL de validação da seção
3. Consulte seção de Troubleshooting (se houver erro específico)
4. Faça rollback se necessário
5. Consulte Ricardo para decisões de negócio

---

**FIM DO PLANO DE EXECUÇÃO**

**Versão:** 1.0
**Data:** 22/10/2025
**Próxima Atualização:** Após conclusão de cada fase
**Status:** 🔴 NÃO INICIADO - Aguardando aprovação de Ricardo
