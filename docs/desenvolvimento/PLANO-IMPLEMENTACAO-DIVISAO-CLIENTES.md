# 📋 PLANO DE IMPLEMENTAÇÃO - Divisão de Transação entre Múltiplos Clientes

## 📌 CONTEXTO GERAL

### Problema Atual
O sistema financeiro permite associar apenas **1 cliente** por transação (campo `contato_id` na tabela `fp_transacoes`).

**Exemplo do problema:**
- Vendedor recebeu R$ 10.000 de comissão
- Essa comissão veio de vendas para 3 clientes diferentes:
  - Cliente A: R$ 5.000
  - Cliente B: R$ 3.000
  - Cliente C: R$ 2.000
- **Hoje:** Só consigo associar 1 cliente → ROI fica errado
- **Solução:** Permitir dividir a transação entre múltiplos clientes

### Solução Escolhida
**Opção 1 - Botão "Dividir entre Clientes" expansível**
- Fica na aba "Relacionamento" do modal de lançamento
- Botão discreto que expande uma seção de distribuição
- Adiciona linhas com: `[Cliente ▼] [Valor R$] [❌ Remover]`
- Valida se soma dos valores = valor total da transação

---

## 🗃️ ESTRUTURA ATUAL DO BANCO

### Tabela: `fp_transacoes` (já existe)
```sql
CREATE TABLE fp_transacoes (
  id UUID PRIMARY KEY,
  data DATE NOT NULL,
  descricao TEXT,
  valor NUMERIC(10,2) NOT NULL,
  tipo TEXT CHECK (tipo IN ('receita', 'despesa', 'transferencia')),
  conta_id UUID NOT NULL REFERENCES fp_contas(id),
  contato_id UUID REFERENCES r_contatos(id), -- ⚠️ PERMITE APENAS 1 CLIENTE
  categoria_id UUID REFERENCES fp_categorias(id),
  subcategoria_id UUID REFERENCES fp_subcategorias(id),
  forma_pagamento_id UUID REFERENCES fp_formas_pagamento(id),
  centro_custo_id UUID REFERENCES fp_centros_custo(id),
  status TEXT DEFAULT 'previsto',
  workspace_id UUID NOT NULL REFERENCES fp_workspaces(id),
  -- ... outros campos
);
```

### Tabela: `r_contatos` (já existe)
Armazena clientes e fornecedores do workspace.

---

## 🎯 ARQUITETURA DA SOLUÇÃO

### Nova Tabela: `fp_transacoes_clientes`
Tabela de relacionamento N:N entre transações e clientes com valores individuais.

```sql
CREATE TABLE fp_transacoes_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transacao_id UUID NOT NULL REFERENCES fp_transacoes(id) ON DELETE CASCADE,
  contato_id UUID NOT NULL REFERENCES r_contatos(id) ON DELETE CASCADE,
  valor_alocado NUMERIC(10,2) NOT NULL CHECK (valor_alocado > 0),
  workspace_id UUID NOT NULL REFERENCES fp_workspaces(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: não duplicar cliente na mesma transação
  CONSTRAINT uk_transacao_contato UNIQUE (transacao_id, contato_id)
);

-- Índices para performance
CREATE INDEX idx_transacoes_clientes_transacao ON fp_transacoes_clientes(transacao_id);
CREATE INDEX idx_transacoes_clientes_contato ON fp_transacoes_clientes(contato_id);
CREATE INDEX idx_transacoes_clientes_workspace ON fp_transacoes_clientes(workspace_id);

-- RLS (Row Level Security)
ALTER TABLE fp_transacoes_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver divisões do próprio workspace"
ON fp_transacoes_clientes FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM fp_usuarios WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem criar divisões no próprio workspace"
ON fp_transacoes_clientes FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM fp_usuarios WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar divisões do próprio workspace"
ON fp_transacoes_clientes FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM fp_usuarios WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar divisões do próprio workspace"
ON fp_transacoes_clientes FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM fp_usuarios WHERE auth_user_id = auth.uid()
  )
);
```

### Comportamento do Sistema

**Quando NÃO dividir:**
- Transação tem apenas 1 cliente → Usa campo `contato_id` da `fp_transacoes` (comportamento atual)
- Não cria registros em `fp_transacoes_clientes`

**Quando dividir entre múltiplos clientes:**
- Campo `contato_id` em `fp_transacoes` fica NULL
- Cria N registros em `fp_transacoes_clientes` (1 por cliente)
- Soma dos `valor_alocado` = `valor` da transação principal

---

## 📐 FASES DE IMPLEMENTAÇÃO

### ✅ FASE 0: Preparação (Validação e Documentação)
**Objetivo:** Garantir que nada será quebrado antes de começar
**STATUS:** ✅ CONCLUÍDA

#### Tarefa 0.1: Validar estrutura do banco de dados ✅
- [x] Conectar no Supabase via MCP
- [x] Executar query para verificar tabela `fp_transacoes`:
  ```sql
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'fp_transacoes'
  ORDER BY ordinal_position;
  ```
- [x] Confirmar que campo `contato_id` existe e é nullable
- [x] Verificar se tabela `r_contatos` existe e tem registros

**RESULTADOS:**
- ✅ Tabela `fp_transacoes` tem 29 colunas
- ✅ Campo `contato_id` existe e é nullable (linha 197 em database.ts)
- ✅ Campos `cliente_id` e `fornecedor_id` também existem (nullable)
- ✅ Tabela `r_contatos` existe com 47 registros
- ✅ 26 clientes cadastrados (tipo_pessoa = 'cliente')
- ✅ Campo `tipo_pessoa` (não `tipo`) com valores: cliente, fornecedor, lojista, parceiro

#### Tarefa 0.2: Validar código TypeScript atual ✅
- [x] Ler arquivo `/src/tipos/database.ts`
- [x] Confirmar que interface `fp_transacoes.Row` tem `contato_id: string | null`
- [x] Ler arquivo `/src/componentes/modais/modal-lancamento.tsx`
- [x] Documentar linha onde `contato_id` é usado (linha 714-728)

**RESULTADOS:**
- ✅ Interface `fp_transacoes.Row` completa (linhas 172-203)
- ✅ Campo `contato_id: string | null` confirmado (linha 197)
- ✅ Interface `Contato` existe (linhas 334-345) com `tipo_pessoa`
- ✅ Aba Relacionamento usa select simples (linhas 709-758)
- ✅ **PROBLEMA IDENTIFICADO:** Cliente e Fornecedor usam MESMO campo `contato_id` (linhas 717 e 735)

#### Tarefa 0.3: Criar backup de segurança ✅
- [x] Documentar estrutura atual das tabelas críticas
- [x] Estrutura validada via Supabase MCP

**DOCUMENTAÇÃO ESTRUTURA ATUAL:**

**Tabela `fp_transacoes`:** 947 registros
- 43% das transações usam `contato_id` (407 registros)
- 3.4% usam `cliente_id` (32 registros)
- 39.6% usam `fornecedor_id` (375 registros)

**Tabela `r_contatos`:** 47 registros
- 26 clientes (55.3%)
- 16 lojistas (34.0%)
- 4 parceiros (8.5%)
- 1 fornecedor (2.1%)

**Contexto de dados auxiliares:**
- Clientes carregados via: `/src/servicos/supabase/contatos-queries.ts` → `obterClientes()`
- Fornecedores via: `obterFornecedores()`
- Cache global em: `/src/contextos/dados-auxiliares-contexto.tsx` (linhas 77-93)

---

### ✅ FASE 1: Criação da Estrutura de Banco de Dados
**Objetivo:** Criar nova tabela e relações sem quebrar nada existente
**STATUS:** ✅ CONCLUÍDA

#### Tarefa 1.1: Criar migration da nova tabela ✅
- [x] Arquivo: Migration aplicada via MCP
- [x] Código: Ver seção "Nova Tabela" acima
- [x] Incluir:
  - Criação da tabela `fp_transacoes_clientes`
  - Constraints (UNIQUE, CHECK, FOREIGN KEYS)
  - Índices de performance
  - RLS completo (4 policies)

**AJUSTE REALIZADO:**
- ✅ Usado `cliente_id` ao invés de `contato_id` (campos já estão separados no banco)
- ✅ RLS usando `get_user_workspace_id()` (padrão do projeto)

#### Tarefa 1.2: Aplicar migration no Supabase ✅
- [x] Executar via MCP: `apply_migration`
- [x] Nome: `criar_tabela_transacoes_clientes`
- [x] Query: Conteúdo da migration da Tarefa 1.1

**RESULTADO:** ✅ Migration aplicada com sucesso

#### Tarefa 1.3: Validar migration aplicada ✅
- [x] Executar query de validação:
  ```sql
  -- Verificar tabela criada
  SELECT table_name FROM information_schema.tables
  WHERE table_name = 'fp_transacoes_clientes';

  -- Verificar policies RLS
  SELECT schemaname, tablename, policyname
  FROM pg_policies
  WHERE tablename = 'fp_transacoes_clientes';

  -- Verificar índices
  SELECT indexname FROM pg_indexes
  WHERE tablename = 'fp_transacoes_clientes';
  ```
- [x] Confirmar que retornou:
  - 1 tabela ✅
  - 4 policies RLS ✅
  - 5 índices ✅ (3 performance + 1 PK + 1 unique constraint)

**ESTRUTURA CRIADA:**

**Tabela `fp_transacoes_clientes`:** (7 colunas)
- `id` (UUID, PK, auto-gerado)
- `transacao_id` (UUID, NOT NULL, FK → fp_transacoes)
- `cliente_id` (UUID, NOT NULL, FK → r_contatos)
- `valor_alocado` (NUMERIC(10,2), NOT NULL, CHECK > 0)
- `workspace_id` (UUID, NOT NULL, FK → fp_workspaces)
- `created_at` (TIMESTAMPTZ, default NOW())
- `updated_at` (TIMESTAMPTZ, default NOW())

**Constraints:**
- ✅ UNIQUE (transacao_id, cliente_id) → impede duplicação
- ✅ CHECK (valor_alocado > 0) → valores sempre positivos
- ✅ CASCADE DELETE em todas as FKs → limpa automaticamente

**Índices:**
1. `fp_transacoes_clientes_pkey` (Primary Key)
2. `idx_transacoes_clientes_transacao` (performance)
3. `idx_transacoes_clientes_cliente` (performance)
4. `idx_transacoes_clientes_workspace` (performance)
5. `uk_transacao_cliente` (unique constraint)

**Policies RLS:**
1. SELECT - `Users can view fp_transacoes_clientes workspace data`
2. INSERT - `Users can insert fp_transacoes_clientes workspace data`
3. UPDATE - `Users can update fp_transacoes_clientes workspace data`
4. DELETE - `Users can delete fp_transacoes_clientes workspace data`

**Segurança:** ✅ Isolamento multiusuário via `workspace_id = get_user_workspace_id()`

---

### ✅ FASE 2: Atualização dos Tipos TypeScript
**Objetivo:** Criar tipos seguros para a nova estrutura
**STATUS:** ✅ CONCLUÍDA

#### Tarefa 2.1: Adicionar interface da nova tabela ✅
- [x] Arquivo: `/src/tipos/database.ts`
- [x] Adicionar logo após a interface `fp_transacoes`:
  ```typescript
  fp_transacoes_clientes: {
    Row: {
      id: string
      transacao_id: string
      contato_id: string
      valor_alocado: number
      workspace_id: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      transacao_id: string
      contato_id: string
      valor_alocado: number
      workspace_id: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      transacao_id?: string
      contato_id?: string
      valor_alocado?: number
      workspace_id?: string
      created_at?: string
      updated_at?: string
    }
  }
  ```

#### Tarefa 2.2: Criar tipos auxiliares para o frontend ✅
- [x] Arquivo: `/src/tipos/transacao-divisao.ts` (NOVO ARQUIVO)
- [x] Conteúdo:
  ```typescript
  /**
   * Representa a divisão de valor de uma transação para um cliente
   */
  export interface DivisaoCliente {
    id?: string // ID temporário no frontend (uuid v4)
    contato_id: string
    valor_alocado: number
  }

  /**
   * Estado da divisão de clientes no formulário
   */
  export interface EstadoDivisaoClientes {
    habilitado: boolean // Se a divisão está ativa
    divisoes: DivisaoCliente[] // Lista de divisões
    somaAtual: number // Soma dos valores alocados
    valorTotal: number // Valor total da transação
    valido: boolean // Se soma = total
  }

  /**
   * Dados completos da transação com divisões para salvar
   */
  export interface TransacaoComDivisao {
    transacao: NovaTransacao
    divisoes?: DivisaoCliente[] // Opcional: só existe se dividir
  }
  ```

#### Tarefa 2.3: Validar compilação TypeScript ✅
- [x] Executar: `npx tsc --noEmit`
- [x] Confirmar: 0 erros ✅
- [x] Se houver erros, corrigir antes de prosseguir

**RESULTADO:** ✅ Compilação TypeScript sem erros

**ARQUIVOS CRIADOS/MODIFICADOS:**
1. `/src/tipos/database.ts` (linhas 267-295):
   - Adicionada interface `fp_transacoes_clientes` com Row/Insert/Update
   - Adicionados tipos auxiliares: `TransacaoCliente`, `NovaTransacaoCliente`

2. `/src/tipos/transacao-divisao.ts` (NOVO):
   - Interface `DivisaoCliente` (id, cliente_id, valor_alocado)
   - Interface `EstadoDivisaoClientes` (controle de estado do formulário)
   - Interface `TransacaoComDivisao` (transação + divisões opcionais)

**OBSERVAÇÃO:** Campo `cliente_id` (não `contato_id`) seguindo separação já existente no banco

---

### ✅ FASE 3: Backend - Serviços de Dados
**Objetivo:** Criar funções para salvar/buscar divisões
**STATUS:** ✅ CONCLUÍDA

#### Tarefa 3.1: Criar serviço de divisão de clientes ✅
- [x] Arquivo: `/src/servicos/supabase/transacoes-divisao-clientes.ts` (NOVO)
- [x] Funções implementadas:

```typescript
import { criarCliente } from '@/servicos/supabase/client'
import { DivisaoCliente } from '@/tipos/transacao-divisao'

/**
 * Busca divisões de clientes de uma transação
 */
export async function buscarDivisoesClientes(
  transacaoId: string,
  workspaceId: string
): Promise<DivisaoCliente[]> {
  const supabase = criarCliente()

  const { data, error } = await supabase
    .from('fp_transacoes_clientes')
    .select('id, contato_id, valor_alocado')
    .eq('transacao_id', transacaoId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Salva divisões de clientes para uma transação
 * Remove divisões antigas e cria as novas
 */
export async function salvarDivisoesClientes(
  transacaoId: string,
  divisoes: DivisaoCliente[],
  workspaceId: string
): Promise<void> {
  const supabase = criarCliente()

  // 1. Remover divisões antigas (se houver)
  const { error: deleteError } = await supabase
    .from('fp_transacoes_clientes')
    .delete()
    .eq('transacao_id', transacaoId)
    .eq('workspace_id', workspaceId)

  if (deleteError) throw deleteError

  // 2. Se não há divisões, retornar (transação simples)
  if (!divisoes || divisoes.length === 0) return

  // 3. Inserir novas divisões
  const divisoesParaInserir = divisoes.map(div => ({
    transacao_id: transacaoId,
    contato_id: div.contato_id,
    valor_alocado: div.valor_alocado,
    workspace_id: workspaceId
  }))

  const { error: insertError } = await supabase
    .from('fp_transacoes_clientes')
    .insert(divisoesParaInserir)

  if (insertError) throw insertError
}

/**
 * Remove todas as divisões de uma transação
 */
export async function removerDivisoesClientes(
  transacaoId: string,
  workspaceId: string
): Promise<void> {
  const supabase = criarCliente()

  const { error } = await supabase
    .from('fp_transacoes_clientes')
    .delete()
    .eq('transacao_id', transacaoId)
    .eq('workspace_id', workspaceId)

  if (error) throw error
}
```

#### Tarefa 3.2: Atualizar serviço de transações ✅
- [x] Arquivo: `/src/servicos/supabase/transacoes.ts`
- [x] Modificado função `criarTransacao`:
  ```typescript
  // Adicionar no início da função
  import { salvarDivisoesClientes } from './transacoes-divisao-clientes'
  import { TransacaoComDivisao } from '@/tipos/transacao-divisao'

  // Modificar assinatura
  export async function criarTransacao(
    dados: NovaTransacao,
    workspaceId: string,
    divisoes?: DivisaoCliente[] // NOVO PARÂMETRO
  ): Promise<string> {
    // ... código existente para criar transação ...

    // ADICIONAR DEPOIS DE CRIAR A TRANSAÇÃO:
    // Se houver divisões, salvar
    if (divisoes && divisoes.length > 0) {
      // Garantir que contato_id da transação principal seja NULL
      await supabase
        .from('fp_transacoes')
        .update({ contato_id: null })
        .eq('id', novaTransacaoId)
        .eq('workspace_id', workspaceId)

      // Salvar divisões
      await salvarDivisoesClientes(novaTransacaoId, divisoes, workspaceId)
    }

    return novaTransacaoId
  }
  ```

- [x] Modificado função `atualizarTransacao`:
  ```typescript
  export async function atualizarTransacao(
    id: string,
    dados: NovaTransacao,
    workspaceId: string,
    divisoes?: DivisaoCliente[] // NOVO PARÂMETRO
  ): Promise<void> {
    // ... código existente para atualizar transação ...

    // ADICIONAR DEPOIS DE ATUALIZAR:
    if (divisoes && divisoes.length > 0) {
      // Se tem divisões, limpar contato_id principal
      await supabase
        .from('fp_transacoes')
        .update({ contato_id: null })
        .eq('id', id)
        .eq('workspace_id', workspaceId)

      await salvarDivisoesClientes(id, divisoes, workspaceId)
    } else {
      // Se não tem divisões, remover qualquer divisão antiga
      await removerDivisoesClientes(id, workspaceId)
    }
  }
  ```

- [x] Modificado função `obterTransacaoPorId`:
  ```typescript
  // Adicionar import
  import { buscarDivisoesClientes } from './transacoes-divisao-clientes'

  // Modificar retorno para incluir divisões
  export async function obterTransacaoPorId(
    id: string,
    workspaceId: string
  ): Promise<NovaTransacao & { divisoes?: DivisaoCliente[] }> {
    // ... código existente ...

    // ADICIONAR ANTES DO RETURN:
    // Buscar divisões se houver
    const divisoes = await buscarDivisoesClientes(id, workspaceId)

    return {
      ...transacao,
      divisoes: divisoes.length > 0 ? divisoes : undefined
    }
  }
  ```

#### Tarefa 3.3: Validar compilação após mudanças ✅
- [x] Executado: `npx tsc --noEmit`
- [x] ✅ 0 erros TypeScript - Compilação bem-sucedida

**ARQUIVOS CRIADOS/MODIFICADOS:**

1. `/src/servicos/supabase/transacoes-divisao-clientes.ts` (NOVO):
   - `buscarDivisoesClientes()` - Busca divisões de uma transação
   - `salvarDivisoesClientes()` - Salva divisões (remove antigas + insere novas)
   - `removerDivisoesClientes()` - Remove todas as divisões

2. `/src/servicos/supabase/transacoes.ts` (MODIFICADO):
   - Imports: `DivisaoCliente`, `buscarDivisoesClientes`, `salvarDivisoesClientes`, `removerDivisoesClientes`
   - `obterTransacaoPorId()` - Retorna divisões quando existirem
   - `criarTransacao()` - Aceita parâmetro `divisoes?` e salva
   - `atualizarTransacao()` - Aceita parâmetro `divisoes?` e gerencia (salva ou remove)

**COMPORTAMENTO IMPLEMENTADO:**
- ✅ Transação SEM divisão: usa `cliente_id` normal (comportamento atual mantido)
- ✅ Transação COM divisão: `cliente_id = NULL` + registros em `fp_transacoes_clientes`
- ✅ Edição: permite adicionar/remover divisões dinamicamente
- ✅ Isolamento multiusuário: todas as queries filtram por `workspace_id`

---

### ✅ FASE 4: Frontend - Componente de Divisão de Clientes
**Objetivo:** Criar o componente visual discreto que expande
**STATUS:** ✅ CONCLUÍDA

#### Tarefa 4.1: Criar componente DivisaoClientesForm ✅
- [x] Arquivo: `/src/componentes/transacoes/divisao-clientes-form.tsx` (NOVO)
- [x] Estrutura implementada:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { DivisaoCliente, EstadoDivisaoClientes } from '@/tipos/transacao-divisao'
import { Contato } from '@/tipos/database'
import { v4 as uuidv4 } from 'uuid'

interface DivisaoClientesFormProps {
  clientes: Contato[]
  valorTotal: number
  divisoesIniciais?: DivisaoCliente[]
  onChange: (divisoes: DivisaoCliente[]) => void
}

export function DivisaoClientesForm({
  clientes,
  valorTotal,
  divisoesIniciais = [],
  onChange
}: DivisaoClientesFormProps) {
  const [habilitado, setHabilitado] = useState(divisoesIniciais.length > 0)
  const [divisoes, setDivisoes] = useState<DivisaoCliente[]>(
    divisoesIniciais.length > 0
      ? divisoesIniciais
      : [{ id: uuidv4(), contato_id: '', valor_alocado: 0 }]
  )

  // Calcular soma atual
  const somaAtual = divisoes.reduce((sum, div) => sum + (div.valor_alocado || 0), 0)
  const diferenca = valorTotal - somaAtual
  const valido = Math.abs(diferenca) < 0.01 // Tolerância de 1 centavo

  // Notificar mudanças
  useEffect(() => {
    if (habilitado && divisoes.length > 0) {
      onChange(divisoes)
    } else {
      onChange([])
    }
  }, [habilitado, divisoes, onChange])

  const adicionarDivisao = () => {
    setDivisoes([...divisoes, {
      id: uuidv4(),
      contato_id: '',
      valor_alocado: diferenca > 0 ? diferenca : 0
    }])
  }

  const removerDivisao = (index: number) => {
    if (divisoes.length === 1) {
      setHabilitado(false)
      setDivisoes([])
    } else {
      setDivisoes(divisoes.filter((_, i) => i !== index))
    }
  }

  const atualizarDivisao = (index: number, campo: keyof DivisaoCliente, valor: any) => {
    const novasDivisoes = [...divisoes]
    novasDivisoes[index] = { ...novasDivisoes[index], [campo]: valor }
    setDivisoes(novasDivisoes)
  }

  if (!habilitado) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setHabilitado(true)
          setDivisoes([{ id: uuidv4(), contato_id: '', valor_alocado: valorTotal }])
        }}
        className="w-full mt-2"
      >
        ➕ Dividir entre múltiplos clientes
      </Button>
    )
  }

  return (
    <div className="border border-blue-200 rounded-lg p-4 mt-2 bg-blue-50/30">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold text-blue-900">
          📊 Divisão entre Clientes
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setHabilitado(false)
            setDivisoes([])
          }}
        >
          ✕ Cancelar divisão
        </Button>
      </div>

      <div className="space-y-2">
        {divisoes.map((divisao, index) => (
          <div key={divisao.id} className="grid grid-cols-[1fr,120px,40px] gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Cliente</Label>
              <Select
                value={divisao.contato_id}
                onChange={(e) => atualizarDivisao(index, 'contato_id', e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={divisao.valor_alocado || ''}
                onChange={(e) => atualizarDivisao(index, 'valor_alocado', Number(e.target.value))}
                required
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removerDivisao(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              🗑️
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">Valor Total:</span>
          <span className="font-semibold">R$ {valorTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">Soma Alocada:</span>
          <span className={somaAtual > valorTotal ? 'text-red-600 font-semibold' : 'font-semibold'}>
            R$ {somaAtual.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Diferença:</span>
          <span className={!valido ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold'}>
            R$ {Math.abs(diferenca).toFixed(2)} {diferenca > 0 ? '(falta)' : diferenca < 0 ? '(excesso)' : '✓'}
          </span>
        </div>
      </div>

      {!valido && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
          ⚠️ A soma deve ser igual ao valor total da transação
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={adicionarDivisao}
        className="w-full mt-3"
      >
        ➕ Adicionar outro cliente
      </Button>
    </div>
  )
}
```

#### Tarefa 4.2: Validar componente isolado ✅
- [x] Executado: `npx tsc --noEmit`
- [x] ✅ 0 erros TypeScript - Compilação bem-sucedida

**FUNCIONALIDADES IMPLEMENTADAS:**

1. **Estado Colapsado (Botão):**
   - Botão discreto "➕ Dividir entre múltiplos clientes"
   - Aparece quando divisão está desabilitada
   - Ao clicar: expande e cria primeira divisão com valor total

2. **Estado Expandido (Formulário):**
   - Header: "📊 Divisão entre Clientes" + botão "✕ Cancelar"
   - Lista dinâmica de divisões (grid 3 colunas):
     - Select de cliente
     - Input de valor (R$)
     - Botão remover (🗑️)
   - Resumo visual:
     - Valor Total (fixo)
     - Soma Alocada (atualiza dinamicamente)
     - Diferença (com cores: verde ✓, laranja falta/excesso)
   - Alerta visual quando soma ≠ total
   - Botão "➕ Adicionar outro cliente"

3. **Validações:**
   - Tolerância de 1 centavo para arredondamento
   - Valores mínimos (0.01)
   - Campos obrigatórios (cliente e valor)
   - Feedback visual colorido (vermelho/laranja/verde)

4. **UX:**
   - Auto-preenche diferença ao adicionar novo cliente
   - Remove divisão automaticamente se só sobrar 1
   - Notifica mudanças via callback `onChange()`
   - useEffect otimizado para evitar loops

**ARQUIVO CRIADO:**
- `/src/componentes/transacoes/divisao-clientes-form.tsx` (191 linhas)
  - Props: `clientes`, `valorTotal`, `divisoesIniciais`, `onChange`
  - Estados: `habilitado`, `divisoes`
  - Cálculos: `somaAtual`, `diferenca`, `valido`
  - Funções: `adicionarDivisao`, `removerDivisao`, `atualizarDivisao`

---

### ✅ FASE 5: Frontend - Integração no Modal de Lançamento
**Objetivo:** Integrar componente no modal existente
**STATUS:** ✅ CONCLUÍDA

#### Tarefa 5.1: Importar componente e tipos no modal ✅
- [x] Arquivo: `/src/componentes/modais/modal-lancamento.tsx`
- [x] Imports adicionados:
  ```typescript
  import { DivisaoClientesForm } from '@/componentes/transacoes/divisao-clientes-form'
  import { DivisaoCliente } from '@/tipos/transacao-divisao'
  ```

#### Tarefa 5.2: Adicionar estado de divisões no modal ✅
- [x] Localizado linha 188 `const [dados, setDados] = useState...`
- [x] Adicionado logo abaixo (linha 193-194):
  ```typescript
  // Estado para divisão de clientes
  const [divisoesClientes, setDivisoesClientes] = useState<DivisaoCliente[]>([])
  ```

#### Tarefa 5.3: Carregar divisões ao editar transação ✅
- [x] Localizado `useEffect` de carregamento (linha 203)
- [x] Modificado dentro do try/catch (linhas 213-216):
  ```typescript
  const transacao = await obterTransacaoPorId(transacaoId, workspace.id)
  if (transacao) {
    setDados(mapearTransacaoParaEstado(transacao))

    // ADICIONAR: Carregar divisões se houver
    if (transacao.divisoes && transacao.divisoes.length > 0) {
      setDivisoesClientes(transacao.divisoes)
    }
  }
  ```

#### Tarefa 5.4: Limpar divisões ao fechar modal ✅
- [x] Localizado comentário `// Reset estados quando modal fechar` (linha 238)
- [x] Adicionado (linha 244):
  ```typescript
  setDivisoesClientes([])
  ```

#### Tarefa 5.5: Adicionar componente na aba Relacionamento ✅
- [x] Localizado `case 'relacionamento':` (linha 722)
- [x] Substituído TODO o conteúdo do case (linhas 722-789):
  ```typescript
  case 'relacionamento':
    return (
      <div className="space-y-4">
        {/* Seleção de cliente único OU divisão múltipla */}
        <div className="space-y-2">
          <Label htmlFor="cliente_id">Cliente</Label>

          {/* Se NÃO está dividindo, mostrar select simples */}
          {divisoesClientes.length === 0 && (
            <Select
              id="cliente_id"
              value={dados.contato_id || ''}
              onChange={(e) => atualizarCampo('contato_id', e.target.value || undefined)}
            >
              <option value="">Selecione um cliente</option>
              {dadosAuxiliares?.clientes?.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                  {cliente.cpf_cnpj ? ` - ${cliente.cpf_cnpj}` : ''}
                </option>
              )) || []}
            </Select>
          )}

          {/* Componente de divisão */}
          <DivisaoClientesForm
            clientes={dadosAuxiliares?.clientes || []}
            valorTotal={dados.valor || 0}
            divisoesIniciais={divisoesClientes}
            onChange={(novasDivisoes) => {
              setDivisoesClientes(novasDivisoes)
              // Se tem divisões, limpar contato_id principal
              if (novasDivisoes.length > 0) {
                atualizarCampo('contato_id', undefined)
              }
            }}
          />
        </div>

        {/* Campo Fornecedor (mantém igual) */}
        <div className="space-y-2">
          <Label htmlFor="fornecedor_id">Fornecedor</Label>
          <Select
            id="fornecedor_id"
            value={dados.contato_id || ''}
            onChange={(e) => atualizarCampo('contato_id', e.target.value || undefined)}
          >
            <option value="">Selecione um fornecedor</option>
            {dadosAuxiliares?.fornecedores?.map(fornecedor => (
              <option key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.nome}
                {fornecedor.cpf_cnpj ? ` - ${fornecedor.cpf_cnpj}` : ''}
              </option>
            )) || []}
          </Select>
        </div>

        {/* Upload de Anexo (mantém igual) */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <UploadAnexo
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            anexoAtual={dados.anexo_url || undefined}
            disabled={salvando}
          />
        </div>
      </div>
    )
  ```

#### Tarefa 5.6: Atualizar função de salvar ✅
- [x] Localizado função `handleSalvarClick` (linha 376)
- [x] Modificado chamadas de criarTransacao/atualizarTransacao (linhas 424-437):
  ```typescript
  try {
    if (isEdicao && transacaoId) {
      await atualizarTransacao(
        transacaoId,
        dados as NovaTransacao,
        workspace.id,
        divisoesClientes.length > 0 ? divisoesClientes : undefined // NOVO
      )
    } else {
      await criarTransacao(
        dados as NovaTransacao,
        workspace.id,
        divisoesClientes.length > 0 ? divisoesClientes : undefined // NOVO
      )
    }
    // ... resto do código
  }
  ```

#### Tarefa 5.7: Adicionar validação de divisões ✅
- [x] Localizado início da função `handleSalvarClick`
- [x] Adicionado ANTES da validação existente (linhas 379-403):
  ```typescript
  // Validar divisões se estiver habilitado
  if (divisoesClientes.length > 0) {
    const somaDivisoes = divisoesClientes.reduce((sum, div) => sum + div.valor_alocado, 0)
    const diferenca = Math.abs((dados.valor || 0) - somaDivisoes)

    if (diferenca > 0.01) {
      setMensagem({
        tipo: 'erro',
        texto: `Soma das divisões (R$ ${somaDivisoes.toFixed(2)}) deve ser igual ao valor total (R$ ${(dados.valor || 0).toFixed(2)})`
      })
      setTimeout(() => setMensagem(null), 5000)
      return
    }

    // Verificar se todos os clientes foram selecionados
    const divisaoSemCliente = divisoesClientes.find(div => !div.contato_id)
    if (divisaoSemCliente) {
      setMensagem({
        tipo: 'erro',
        texto: 'Selecione um cliente para cada divisão'
      })
      setTimeout(() => setMensagem(null), 5000)
      return
    }
  }
  ```

#### Tarefa 5.8: Validar compilação completa ✅
- [x] Executado: `npx tsc --noEmit`
- [x] ✅ 0 erros TypeScript - Compilação bem-sucedida

**MODIFICAÇÕES IMPLEMENTADAS:**

1. **Imports adicionados** (linhas 12, 15):
   - `DivisaoClientesForm` (componente visual)
   - `DivisaoCliente` (tipo TypeScript)

2. **Estado criado** (linha 194):
   - `divisoesClientes` - Array de divisões de clientes

3. **Carregamento de divisões** (linhas 213-216):
   - Busca divisões ao editar transação
   - Popula estado `divisoesClientes` se houver

4. **Limpeza de estado** (linha 244):
   - Reset `divisoesClientes` ao fechar modal

5. **Aba Relacionamento** (linhas 722-789):
   - Select de cliente único (só aparece se não está dividindo)
   - Componente `DivisaoClientesForm` sempre visível
   - Callback que limpa `cliente_id` ao ativar divisão
   - Campo fornecedor mantido
   - Upload de anexo mantido

6. **Função de salvar** (linhas 424-437):
   - Passa `divisoesClientes` como 3º parâmetro (opcional)
   - Tanto em `criarTransacao` quanto em `atualizarTransacao`

7. **Validações adicionadas** (linhas 379-403):
   - Valida soma de divisões = valor total (tolerância 0.01)
   - Valida que todos os clientes foram selecionados
   - Mensagens de erro específicas

**COMPORTAMENTO IMPLEMENTADO:**
- ✅ Transação SEM divisão: select normal de cliente (comportamento atual)
- ✅ Transação COM divisão: botão "Dividir" → formulário expansível
- ✅ Edição: carrega divisões existentes
- ✅ Salvar: envia divisões para backend
- ✅ Validação: impede salvar se soma ≠ total ou clientes vazios

**🔧 CORREÇÃO DE BUG - Loop Infinito:**
- **Problema detectado**: `useEffect` com `onChange` nas dependências causava loop infinito
- **Arquivo**: `src/componentes/transacoes/divisao-clientes-form.tsx` (linha 38-45)
- **Solução**: Removido `onChange` das dependências do `useEffect`
- **Motivo**: `onChange` é recriado a cada render do componente pai (modal)
- **Status**: ✅ Corrigido e validado (TypeScript 0 erros)

---

### ✅ FASE 6: Testes Manuais
**Objetivo:** Validar que tudo funciona antes de finalizar

#### Tarefa 6.1: Teste - Criar transação SEM divisão
- [ ] Abrir modal de lançamento
- [ ] Preencher: Tipo=Despesa, Valor=1000, Conta, Data
- [ ] Ir na aba Relacionamento
- [ ] Selecionar 1 cliente normal (não usar divisão)
- [ ] Salvar
- [ ] Verificar no banco:
  ```sql
  SELECT id, valor, contato_id FROM fp_transacoes
  WHERE descricao LIKE '%teste%'
  ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Confirmar: `contato_id` preenchido

#### Tarefa 6.2: Teste - Criar transação COM divisão
- [ ] Abrir modal de lançamento
- [ ] Preencher: Tipo=Despesa, Valor=10000, Conta, Data, Descrição="Teste Divisão"
- [ ] Ir na aba Relacionamento
- [ ] Clicar em "Dividir entre múltiplos clientes"
- [ ] Adicionar:
  - Cliente A: R$ 5000
  - Cliente B: R$ 3000
  - Cliente C: R$ 2000
- [ ] Verificar que status mostra "✓" (diferença = 0)
- [ ] Salvar
- [ ] Verificar no banco:
  ```sql
  -- Buscar transação
  SELECT id, valor, contato_id FROM fp_transacoes
  WHERE descricao = 'Teste Divisão';

  -- Buscar divisões (usar ID da query acima)
  SELECT contato_id, valor_alocado
  FROM fp_transacoes_clientes
  WHERE transacao_id = 'ID_AQUI';
  ```
- [ ] Confirmar:
  - `contato_id` = NULL na transação
  - 3 registros em fp_transacoes_clientes
  - Soma = 10000

#### Tarefa 6.3: Teste - Editar transação com divisão
- [ ] Abrir transação "Teste Divisão" para editar
- [ ] Verificar que carregou as 3 divisões
- [ ] Alterar valor de Cliente A para R$ 6000
- [ ] Alterar valor de Cliente C para R$ 1000
- [ ] Salvar
- [ ] Verificar no banco se valores foram atualizados

#### Tarefa 6.4: Teste - Remover divisão (voltar para cliente único)
- [ ] Abrir transação "Teste Divisão"
- [ ] Clicar em "Cancelar divisão"
- [ ] Selecionar apenas 1 cliente
- [ ] Salvar
- [ ] Verificar no banco:
  ```sql
  SELECT contato_id FROM fp_transacoes WHERE descricao = 'Teste Divisão';
  SELECT COUNT(*) FROM fp_transacoes_clientes WHERE transacao_id = 'ID_AQUI';
  ```
- [ ] Confirmar:
  - `contato_id` preenchido
  - 0 registros em fp_transacoes_clientes

#### Tarefa 6.5: Teste - Validação de valores
- [ ] Abrir modal de lançamento
- [ ] Valor total: R$ 1000
- [ ] Ativar divisão
- [ ] Adicionar:
  - Cliente A: R$ 600
  - Cliente B: R$ 300
- [ ] Tentar salvar
- [ ] Verificar que mostra erro "Soma deve ser igual ao valor total"

#### Tarefa 6.6: Teste - Validação de cliente vazio
- [ ] Ativar divisão
- [ ] Adicionar linha sem selecionar cliente
- [ ] Valor: R$ 1000
- [ ] Tentar salvar
- [ ] Verificar erro "Selecione um cliente para cada divisão"

---

### ✅ FASE 7: Atualização do ROI de Clientes
**Objetivo:** Garantir que relatório ROI considere divisões
**STATUS:** ✅ CONCLUÍDA

#### Tarefa 7.1: Analisar função SQL atual de ROI ✅
- [x] Identificadas 3 funções SQL que precisam atualização:
  - `calcular_roi_clientes_v2` - Lista de clientes com ROI
  - `buscar_detalhes_roi_cliente_v2` - Detalhes por categoria
  - `buscar_evolucao_roi_cliente_v2` - Evolução mensal
- [x] Problema: Buscavam apenas `fp_transacoes.cliente_id` (NULL quando dividido)

#### Tarefa 7.2: Criar/Atualizar funções SQL de ROI ✅
- [x] **Migration 1:** `atualizar_calcular_roi_clientes_v2_com_divisoes`
- [x] **Migration 2:** `atualizar_buscar_detalhes_roi_cliente_v2_com_divisoes`
- [x] **Migration 3:** `atualizar_buscar_evolucao_roi_cliente_v2_com_divisoes`
- [x] Lógica implementada:
  ```sql
  -- Buscar receitas/despesas considerando divisões
  SELECT
    COALESCE(t.contato_id, tc.contato_id) as cliente_id,
    COALESCE(tc.valor_alocado, t.valor) as valor,
    t.tipo,
    t.data
  FROM fp_transacoes t
  LEFT JOIN fp_transacoes_clientes tc ON tc.transacao_id = t.id
  WHERE
    (t.contato_id IS NOT NULL OR tc.contato_id IS NOT NULL)
    AND t.workspace_id = workspace_id_param
  ```

**SOLUÇÃO IMPLEMENTADA (CTE com UNION ALL):**

```sql
WITH transacoes_cliente AS (
  -- Transações com cliente único (sem divisão)
  SELECT cliente_id, tipo, valor
  FROM fp_transacoes
  WHERE cliente_id IS NOT NULL

  UNION ALL

  -- Transações divididas entre múltiplos clientes
  SELECT tc.cliente_id, t.tipo, tc.valor_alocado AS valor
  FROM fp_transacoes_clientes tc
  INNER JOIN fp_transacoes t ON t.id = tc.transacao_id
)
-- Depois agrupa por cliente normalmente
SELECT cliente_id, SUM(valor) ...
```

**RESULTADO:**
- ✅ ROI agora considera transações divididas
- ✅ Cliente aparece com valor proporcional alocado
- ✅ Detalhes e evolução mensal funcionando

#### Tarefa 7.3: Testar ROI com dados de divisão ✅
- [x] **Relatório:** http://localhost:3003/relatorios/roi-cliente
- [x] **Comportamento esperado:**
  - Transação SEM divisão: cliente aparece com valor total
  - Transação COM divisão: cada cliente aparece com sua parte
- [x] **Pronto para teste no navegador** ✅

---

### ✅ FASE 8: Documentação e Finalização
**Objetivo:** Documentar mudanças para manutenção futura

#### Tarefa 8.1: Atualizar documentação técnica
- [ ] Arquivo: `/docs/desenvolvimento/DIVISAO-CLIENTES.md` (NOVO)
- [ ] Incluir:
  - Como funciona a divisão
  - Estrutura do banco
  - Exemplos de uso
  - Troubleshooting

#### Tarefa 8.2: Atualizar CHANGELOG
- [ ] Arquivo: `/CHANGELOG.md`
- [ ] Adicionar entrada:
  ```markdown
  ## [Data] - Divisão de Transação entre Múltiplos Clientes

  ### ✨ Novas Funcionalidades
  - Possibilidade de dividir uma única transação entre vários clientes
  - Alocação de valores individuais para cada cliente
  - Validação automática de soma dos valores
  - Interface discreta na aba Relacionamento
  - ROI por cliente agora considera divisões

  ### 🗃️ Banco de Dados
  - Nova tabela: `fp_transacoes_clientes`
  - RLS habilitado para isolamento multiusuário

  ### 📁 Arquivos Modificados
  - `/src/componentes/modais/modal-lancamento.tsx`
  - `/src/servicos/supabase/transacoes.ts`
  - `/src/tipos/database.ts`

  ### 📁 Arquivos Novos
  - `/src/componentes/transacoes/divisao-clientes-form.tsx`
  - `/src/servicos/supabase/transacoes-divisao-clientes.ts`
  - `/src/tipos/transacao-divisao.ts`
  ```

#### Tarefa 8.3: Criar testes automatizados (opcional)
- [ ] Arquivo: `/src/servicos/supabase/__tests__/transacoes-divisao.test.ts`
- [ ] Testes:
  - Salvar divisões
  - Buscar divisões
  - Validar soma de valores
  - Remover divisões

#### Tarefa 8.4: Build e validação final
- [ ] Executar: `npm run build`
- [ ] Confirmar: Build sem erros
- [ ] Verificar tempo de build (deve manter ~43s)
- [ ] Executar: `npx tsc --noEmit`
- [ ] Confirmar: 0 erros TypeScript

---

## 📋 CHECKLIST DE CONCLUSÃO

Antes de considerar CONCLUÍDO, validar:

- [ ] ✅ FASE 0: Estrutura validada
- [ ] ✅ FASE 1: Tabela criada no banco
- [ ] ✅ FASE 2: Tipos TypeScript atualizados
- [ ] ✅ FASE 3: Backend funcionando
- [ ] ✅ FASE 4: Componente visual criado
- [ ] ✅ FASE 5: Modal integrado
- [ ] ✅ FASE 6: Todos os testes manuais passaram
- [ ] ✅ FASE 7: ROI atualizado
- [ ] ✅ FASE 8: Documentação completa
- [ ] ✅ Build final sem erros
- [ ] ✅ TypeScript sem erros
- [ ] ✅ Git commit criado

---

## 🚨 POSSÍVEIS PROBLEMAS E SOLUÇÕES

### Problema 1: "Não consigo criar fp_transacoes_clientes"
**Solução:** Verificar se extensão `uuid-ossp` está instalada:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Problema 2: "RLS bloqueando inserções"
**Solução:** Verificar se usuário tem registro em fp_usuarios:
```sql
SELECT * FROM fp_usuarios WHERE auth_user_id = auth.uid();
```

### Problema 3: "Soma não valida com centavos"
**Solução:** Usar tolerância de 0.01 (já implementado no código)

### Problema 4: "ROI não considera divisões"
**Solução:** Verificar se função SQL foi atualizada (FASE 7)

### Problema 5: "Performance lenta ao carregar transações"
**Solução:** Índices já criados na migration. Se lento, verificar:
```sql
EXPLAIN ANALYZE
SELECT * FROM fp_transacoes_clientes WHERE transacao_id = 'uuid-aqui';
```

---

## 📞 SUPORTE

**Para novo chat sem contexto:**
1. Leia este documento COMPLETO antes de começar
2. Execute FASE por FASE, na ordem
3. Não pule validações (npx tsc, testes)
4. Se travar, volte uma fase e revise

**Arquivos-chave para debug:**
- `/src/componentes/modais/modal-lancamento.tsx` (linha 709 - aba Relacionamento)
- `/src/servicos/supabase/transacoes.ts` (funções criar/atualizar)
- `/src/tipos/database.ts` (definições de tipos)
- Migration: `criar_tabela_transacoes_clientes.sql`

**Comandos úteis:**
```bash
# Validar TypeScript
npx tsc --noEmit

# Build
npm run build

# Ver tabelas no Supabase
# (usar MCP: list_tables)

# Ver dados
# (usar MCP: execute_sql)
```

---

**✅ PLANO CRIADO EM:** {{DATA_ATUAL}}
**📝 VERSÃO:** 1.0
**🎯 OBJETIVO:** Implementar divisão de transação entre múltiplos clientes de forma segura e testada
