# 📋 IMPLEMENTAÇÃO: CADASTRO SEPARADO DE CLIENTES E FORNECEDORES

**Documento de Execução Completo**
**Data:** 2025-01-14
**Versão:** 2.4 (QUASE COMPLETO)
**Status:** 🟡 FASES 1, 2, 3 E 4 CONCLUÍDAS - FASE 5 PENDENTE
**Tempo Estimado:** 75 minutos (70 min concluídos)

---

## 🚦 STATUS DE IMPLEMENTAÇÃO

| Fase | Status | Data | Tempo | Descrição |
|------|--------|------|-------|-----------|
| **FASE 1** | ✅ **CONCLUÍDA** | 2025-01-14 | 15 min | Serviços, validações e controles de modais |
| **FASE 2** | ✅ **CONCLUÍDA** | 2025-01-14 | 25 min | Criar 2 modais (Cliente e Fornecedor) |
| **FASE 3** | ✅ **CONCLUÍDA** | 2025-01-14 | 25 min | Criar 2 páginas (Clientes e Fornecedores) |
| **FASE 4** | ✅ **CONCLUÍDA** | 2025-01-14 | 5 min | Adicionar seção Relacionamento na sidebar |
| **FASE 5** | 🔴 **PENDENTE** | - | 15 min | Testes e validação completa |

**Progresso:** 4/5 fases (80% concluído)

---

## 📌 CONTEXTO E OBJETIVO

### **O QUE SERÁ IMPLEMENTADO**
Sistema de cadastro **simplificado** com **DOIS CADASTROS SEPARADOS**:
1. **Clientes** - Página dedicada para cadastro de clientes
2. **Fornecedores** - Página dedicada para cadastro de fornecedores

Cada um terá sua própria página, tabela e controle independente.

### **POR QUÊ**
- Campo `contato_id` já existe em `fp_transacoes` (implementado em janeiro/2025)
- Tabela `r_contatos` já existe no banco com 26 registros
- Modal de transação já tem aba "Relacionamento" com selects de Cliente/Fornecedor
- **PROBLEMA:** Não existe forma de CADASTRAR novos contatos pelo sistema Financeiro
- **SOLUÇÃO:** Dois cadastros provisórios simplificados (apenas nome)

### **ONDE FICARÃO**
- **Sidebar:** Nova seção "Relacionamento" (separada de Cadastramento):
  - "Clientes" → `/clientes` (link direto)
  - "Fornecedores" → `/fornecedores` (link direto)
- **Modais:** 2 modais independentes:
  - `modal-cliente.tsx` (tipo fixo: 'cliente')
  - `modal-fornecedor.tsx` (tipo fixo: 'fornecedor')
- **Tabelas:** 2 páginas com listagens separadas

**Estrutura Visual da Sidebar:**
```
┌─────────────────────────┐
│ Dashboard               │
│ Transações              │
│ Relatórios              │
├─────────────────────────┤
│ Configurações           │
│   ⚙️ Configurações      │
│   👥 Usuários           │
│   🎯 Metas              │
│   📋 Cadastramento ▶    │
│   🛡️ Dashboard Admin    │
├─────────────────────────┤ ← NOVA DIVISÃO
│ Relacionamento          │ ← NOVA SEÇÃO
│   👤 Clientes           │ ← Link direto (NÃO expansível)
│   🏭 Fornecedores       │ ← Link direto (NÃO expansível)
└─────────────────────────┘
```

### **ESCOPO RESTRITO**
✅ **APENAS 1 CAMPO OBRIGATÓRIO POR CADASTRO:**
- `nome` (string, obrigatório)
- `tipo_pessoa` (fixo por contexto: 'cliente' OU 'fornecedor')

❌ **NÃO INCLUIR:**
- CPF/CNPJ, telefone, email, endereço
- Campos de IA (dados_brutos, confianca_ia, etc)
- Procedência, vendedor, loja
- Endereço de entrega

🎯 **OBJETIVO:** Cadastro mínimo para vincular transações. Cadastro completo virá do módulo Relacionamentos no futuro.

---

## 🗂️ ESTRUTURA DE ARQUIVOS

### **Arquivos a CRIAR:**
```
/src/app/(protected)/clientes/
  └─ page.tsx                          ← NOVA página de clientes

/src/app/(protected)/fornecedores/
  └─ page.tsx                          ← NOVA página de fornecedores

/src/componentes/modais/
  ├─ modal-cliente.tsx                 ← NOVO modal para clientes
  └─ modal-fornecedor.tsx              ← NOVO modal para fornecedores
```

### **Arquivos a MODIFICAR:**
```
/src/componentes/layout/sidebar.tsx    ← Criar seção "Relacionamento"
/src/servicos/supabase/contatos-queries.ts  ← Adicionar create/update/delete
/src/contextos/modais-contexto.tsx     ← Adicionar controle de 2 modais
/src/contextos/dados-auxiliares-contexto.tsx ← Recarregar após CRUD
/src/utilitarios/validacao.ts          ← Adicionar validarContato
```

### **Arquivos de REFERÊNCIA (não modificar, apenas consultar):**
```
/src/app/(protected)/contas/page.tsx   ← Padrão de página
/src/componentes/modais/modal-conta.tsx ← Padrão de modal
/src/componentes/modais/modal-categoria.tsx ← Padrão de modal
/src/tipos/database.ts                 ← Interface Contato já existe
```

---

## 📊 BANCO DE DADOS

### **Tabela: `r_contatos`**

**Schema Completo (42 campos):**
```sql
CREATE TABLE r_contatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR NOT NULL,
  cpf_cnpj VARCHAR,
  tipo_pessoa VARCHAR NOT NULL CHECK (tipo_pessoa IN ('cliente', 'fornecedor', 'parceiro', 'freelancer', 'lojista')),
  telefone VARCHAR,
  email VARCHAR,
  cep VARCHAR,
  logradouro VARCHAR,
  numero VARCHAR,
  complemento VARCHAR,
  bairro VARCHAR,
  cidade VARCHAR,
  estado VARCHAR,
  procedencia_id UUID,
  loja_id UUID,
  vendedor_id UUID,
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMPTZ DEFAULT now(),
  usuario_cadastro_id UUID,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  workspace_id UUID NOT NULL,
  dados_brutos TEXT,
  dados_brutos_processados BOOLEAN DEFAULT false,
  processamento_log JSONB,
  confianca_ia INTEGER,
  processado_em TIMESTAMPTZ,
  processado_por UUID,
  rg VARCHAR,
  deleted_at TIMESTAMPTZ,
  delete_reason TEXT,
  pdf_efinance TEXT,
  cep_entrega VARCHAR,
  logradouro_entrega VARCHAR,
  numero_entrega VARCHAR,
  complemento_entrega VARCHAR,
  bairro_entrega VARCHAR,
  cidade_entrega VARCHAR,
  estado_entrega VARCHAR,
  mesmo_endereco_entrega BOOLEAN DEFAULT false,
  apelido VARCHAR,
  telefone2 VARCHAR
);
```

**Dados Atuais:**
- 6 clientes
- 2 fornecedores
- 16 lojistas
- 1 freelancer
- 1 parceiro
- **Total:** 26 registros

**RLS (Row Level Security):** ✅ Habilitado com filtro por `workspace_id`

**Foreign Keys:**
- `fp_transacoes.contato_id → r_contatos.id`

---

## 🎯 REGRAS DE NEGÓCIO

### **Validações Obrigatórias:**
1. ✅ `nome` não pode ser vazio (trim, mínimo 3 caracteres)
2. ✅ `tipo_pessoa` fixo por contexto (cliente OU fornecedor)
3. ✅ `workspace_id` obrigatório (pega automaticamente do contexto Auth)
4. ✅ `ativo` sempre `true` na criação (pode desativar depois)
5. ✅ Nome duplicado permitido (não há unique constraint)

### **Filtros na Listagem:**
- ✅ **Página Clientes:** Mostra APENAS `tipo_pessoa = 'cliente'`
- ✅ **Página Fornecedores:** Mostra APENAS `tipo_pessoa = 'fornecedor'`
- ✅ Filtrar por `workspace_id` (isolamento multiusuário)
- ✅ Ordenar alfabeticamente por `nome`
- ✅ Mostrar inativos com badge visual diferente

### **Permissões:**
- ✅ Usuários com permissão `'configuracoes'` podem acessar
- ✅ Mesma lógica de permissões de Contas, Categorias, etc
- ✅ OWNER sempre tem acesso total

### **Integração com Transações:**
- ✅ Após criar/editar, cache é recarregado
- ✅ Novos contatos aparecem imediatamente nos selects do modal de transação
- ✅ Desativar contato não remove de transações existentes

---

## 📦 FASES DE IMPLEMENTAÇÃO

---

## **FASE 1: PREPARAÇÃO - SERVIÇOS E VALIDAÇÕES** ✅ **CONCLUÍDA**

**Objetivo:** Criar infraestrutura backend (serviços + validações)
**Tempo:** 15 minutos
**Status:** ✅ Implementado em 2025-01-14

**Resumo da Fase:**
- ✅ 6 funções CRUD criadas em `contatos-queries.ts` (169 linhas)
- ✅ Função `validarContato()` criada em `validacao.ts` (23 linhas)
- ✅ Controles de modais adicionados em `modais-contexto.tsx` (37 linhas)
- ✅ TypeScript validado: `npx tsc --noEmit` sem erros

---

### **Tarefa 1.1: Adicionar Funções CRUD em `contatos-queries.ts`** ✅ **CONCLUÍDA**

**Arquivo:** `/src/servicos/supabase/contatos-queries.ts`

**✅ STATUS:** Implementado com sucesso em 2025-01-14

**O que foi feito:**
1. ✅ Arquivo existente modificado (tinha `obterClientes` e `obterFornecedores`)
2. ✅ 6 novas funções adicionadas (169 linhas)
3. ✅ Imports mantidos sem alteração

**Código COMPLETO a adicionar:**

```typescript
/**
 * Cria novo cliente
 * @param nome - Nome do cliente
 * @param workspaceId - ID do workspace
 * @returns Cliente criado
 */
export async function criarCliente(
  nome: string,
  workspaceId: string
): Promise<Contato> {
  const { data, error } = await supabase
    .from('r_contatos')
    .insert({
      nome: nome.trim(),
      tipo_pessoa: 'cliente',
      ativo: true,
      workspace_id: workspaceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .single()

  if (error) {
    console.error('Erro ao criar cliente:', error)
    throw new Error(`Erro ao criar cliente: ${error.message}`)
  }

  return data
}

/**
 * Cria novo fornecedor
 * @param nome - Nome do fornecedor
 * @param workspaceId - ID do workspace
 * @returns Fornecedor criado
 */
export async function criarFornecedor(
  nome: string,
  workspaceId: string
): Promise<Contato> {
  const { data, error } = await supabase
    .from('r_contatos')
    .insert({
      nome: nome.trim(),
      tipo_pessoa: 'fornecedor',
      ativo: true,
      workspace_id: workspaceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .single()

  if (error) {
    console.error('Erro ao criar fornecedor:', error)
    throw new Error(`Erro ao criar fornecedor: ${error.message}`)
  }

  return data
}

/**
 * Atualiza contato existente (apenas nome)
 * @param id - ID do contato
 * @param nome - Novo nome
 * @param workspaceId - ID do workspace
 * @returns Contato atualizado
 */
export async function atualizarContato(
  id: string,
  nome: string,
  workspaceId: string
): Promise<Contato> {
  const { data, error } = await supabase
    .from('r_contatos')
    .update({
      nome: nome.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .single()

  if (error) {
    console.error('Erro ao atualizar contato:', error)
    throw new Error(`Erro ao atualizar contato: ${error.message}`)
  }

  return data
}

/**
 * Busca contato por ID
 * @param id - ID do contato
 * @returns Contato encontrado
 */
export async function obterContatoPorId(id: string): Promise<Contato | null> {
  const { data, error } = await supabase
    .from('r_contatos')
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erro ao buscar contato:', error)
    return null
  }

  return data
}

/**
 * Alterna status ativo/inativo de um contato
 * @param id - ID do contato
 * @param ativo - Novo status
 * @param workspaceId - ID do workspace
 */
export async function alternarStatusContato(
  id: string,
  ativo: boolean,
  workspaceId: string
): Promise<void> {
  const { error } = await supabase
    .from('r_contatos')
    .update({
      ativo,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('Erro ao alternar status do contato:', error)
    throw new Error(`Erro ao alternar status: ${error.message}`)
  }
}

/**
 * Exclui contato permanentemente (soft delete via campo ativo)
 * Apenas desativa ao invés de deletar fisicamente
 * @param id - ID do contato
 * @param workspaceId - ID do workspace
 */
export async function excluirContato(
  id: string,
  workspaceId: string
): Promise<void> {
  // Verificar se contato está vinculado a transações
  const { data: transacoes, error: errorCheck } = await supabase
    .from('fp_transacoes')
    .select('id')
    .eq('contato_id', id)
    .limit(1)

  if (errorCheck) {
    console.error('Erro ao verificar transações:', errorCheck)
    throw new Error('Erro ao verificar vínculos do contato')
  }

  if (transacoes && transacoes.length > 0) {
    throw new Error('Não é possível excluir contato vinculado a transações. Desative-o ao invés disso.')
  }

  // Se não tem transações, pode desativar
  await alternarStatusContato(id, false, workspaceId)
}
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript
- ✅ Imports corretos
- ✅ Funções exportadas

---

### **Tarefa 1.2: Criar Função de Validação** ✅ **CONCLUÍDA**

**Arquivo:** `/src/utilitarios/validacao.ts`

**✅ STATUS:** Implementado com sucesso em 2025-01-14

**O que foi feito:**
1. ✅ Localizado final do arquivo (após `validarCentroCusto`)
2. ✅ Função `validarContato()` adicionada (23 linhas)

**Código a adicionar:**

```typescript
/**
 * Valida dados de contato (apenas nome)
 */
export function validarContato(dados: {
  nome: string
}): { valido: boolean; erros: Record<string, string> } {
  const erros: Record<string, string> = {}

  // Validar nome
  if (!dados.nome || dados.nome.trim().length === 0) {
    erros.nome = 'Nome é obrigatório'
  } else if (dados.nome.trim().length < 3) {
    erros.nome = 'Nome deve ter pelo menos 3 caracteres'
  } else if (dados.nome.trim().length > 255) {
    erros.nome = 'Nome deve ter no máximo 255 caracteres'
  }

  return {
    valido: Object.keys(erros).length === 0,
    erros
  }
}
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript
- ✅ Função exportada corretamente

---

### **Tarefa 1.3: Adicionar Controle de Modais no Contexto** ✅ **CONCLUÍDA**

**Arquivo:** `/src/contextos/modais-contexto.tsx`

**✅ STATUS:** Implementado com sucesso em 2025-01-14

**O que foi feito:**
1. ✅ Interface `ModaisContextType` atualizada (+8 linhas)
2. ✅ Estados adicionados: `modalCliente`, `clienteId`, `modalFornecedor`, `fornecedorId`
3. ✅ Controles criados: `cliente.abrir/fechar`, `fornecedor.abrir/fechar`
4. ✅ Provider atualizado com novos valores
5. ✅ TypeScript validado sem erros

**Modificações necessárias:**

**1. Atualizar interface (linha ~20):**
```typescript
interface ModaisContextType {
  // ... outras propriedades existentes

  // ADICIONAR:
  modalCliente: boolean
  cliente: {
    abrir: (id?: string) => void
    fechar: () => void
    clienteId?: string
  }

  modalFornecedor: boolean
  fornecedor: {
    abrir: (id?: string) => void
    fechar: () => void
    fornecedorId?: string
  }
}
```

**2. Adicionar estados (linha ~60, após outros useState):**
```typescript
const [modalCliente, setModalCliente] = useState(false)
const [clienteId, setClienteId] = useState<string | undefined>()

const [modalFornecedor, setModalFornecedor] = useState(false)
const [fornecedorId, setFornecedorId] = useState<string | undefined>()
```

**3. Adicionar controles (linha ~100, após outras funções):**
```typescript
const cliente = {
  abrir: (id?: string) => {
    setClienteId(id)
    setModalCliente(true)
  },
  fechar: () => {
    setModalCliente(false)
    setClienteId(undefined)
  },
  clienteId
}

const fornecedor = {
  abrir: (id?: string) => {
    setFornecedorId(id)
    setModalFornecedor(true)
  },
  fechar: () => {
    setModalFornecedor(false)
    setFornecedorId(undefined)
  },
  fornecedorId
}
```

**4. Atualizar value do Provider (linha ~150):**
```typescript
const value: ModaisContextType = {
  // ... propriedades existentes

  // ADICIONAR:
  modalCliente,
  cliente,

  modalFornecedor,
  fornecedor
}
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript
- ✅ Interface atualizada
- ✅ Provider retornando novos valores

---

## **FASE 2: COMPONENTES MODAIS** ✅ **CONCLUÍDA**

**Objetivo:** Criar 2 modais independentes (Cliente e Fornecedor)
**Tempo:** 25 minutos
**Status:** ✅ Implementado em 2025-01-14

**Resumo da Fase:**
- ✅ Modal de Cliente criado (`modal-cliente.tsx`) - 185 linhas
- ✅ Modal de Fornecedor criado (`modal-fornecedor.tsx`) - 185 linhas
- ✅ Função `validarContato()` corrigida para retornar `string[]`
- ✅ TypeScript validado: `npx tsc --noEmit` sem erros

---

### **Tarefa 2.1: Criar Modal de Cliente** ✅ **CONCLUÍDA**

**Arquivo:** `/src/componentes/modais/modal-cliente.tsx` (CRIAR NOVO)

**O que fazer:**
1. Criar arquivo novo
2. Modal específico para CLIENTES

**Código COMPLETO:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { ModalBase } from './modal-base'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Skeleton, SkeletonInput, SkeletonLabel } from '@/componentes/ui/skeleton'
import { useModalForm } from '@/hooks/usar-modal-form'
import { useModais } from '@/contextos/modais-contexto'
import { useAuth } from '@/contextos/auth-contexto'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'
import {
  criarCliente,
  atualizarContato,
  obterContatoPorId
} from '@/servicos/supabase/contatos-queries'
import { validarContato } from '@/utilitarios/validacao'

/**
 * Props para o componente ModalCliente
 */
interface ModalClienteProps {
  /** Indica se o modal está aberto */
  isOpen: boolean
  /** Função chamada ao fechar o modal */
  onClose: () => void
  /** Função chamada após sucesso na operação */
  onSuccess?: () => void
  /** ID do cliente para edição (opcional) */
  clienteId?: string
}

// Estado inicial padrão
const ESTADO_INICIAL = {
  nome: ''
}

/**
 * Modal para criar e editar clientes de forma simplificada
 * Apenas campo: nome
 */
export function ModalCliente({
  isOpen,
  onClose,
  onSuccess,
  clienteId
}: ModalClienteProps) {
  const { workspace } = useAuth()
  const { cliente } = useModais()
  const { recarregarDados } = useDadosAuxiliares()

  // Hook personalizado para gerenciar formulário
  const {
    dados,
    erros,
    carregandoDados,
    salvando,
    editando,
    atualizarCampo,
    inicializarEdicao,
    limparFormulario,
    submeter,
    formularioValido
  } = useModalForm<typeof ESTADO_INICIAL>({
    estadoInicial: ESTADO_INICIAL,
    validar: validarContato,
    salvar: async (dadosCliente) => {
      if (editando && clienteId) {
        await atualizarContato(clienteId, dadosCliente.nome, workspace!.id)
      } else {
        await criarCliente(dadosCliente.nome, workspace!.id)
      }
    },
    carregar: clienteId && workspace ? async (id: string) => {
      const contato = await obterContatoPorId(id)
      if (contato) {
        return { nome: contato.nome }
      }
      return ESTADO_INICIAL
    } : undefined,
    onSucesso: async () => {
      await recarregarDados() // Recarregar cache de dados auxiliares
      onSuccess?.()
      cliente.fechar()
    },
    limparAposSucesso: true
  })

  // Inicializar edição quando modal abrir com ID
  useEffect(() => {
    if (isOpen && clienteId && !editando) {
      inicializarEdicao(clienteId)
    } else if (isOpen && !clienteId) {
      limparFormulario()
    }
  }, [isOpen, clienteId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submeter()
  }

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={editando ? "Editar Cliente" : "Novo Cliente"}
      fixedWidth="500px"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mensagem informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <div className="flex gap-2">
            <span>💡</span>
            <div>
              <strong>Cadastro Simplificado</strong>
              <p className="mt-1 text-blue-700">
                Este formulário permite cadastro rápido com apenas o nome.
                Para cadastro completo (telefone, endereço, documentos),
                use o módulo Relacionamentos.
              </p>
            </div>
          </div>
        </div>

        {carregandoDados ? (
          <div className="space-y-4">
            <div>
              <SkeletonLabel />
              <SkeletonInput />
            </div>
          </div>
        ) : (
          <>
            {/* Campo Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome do Cliente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                value={dados.nome}
                onChange={(e) => atualizarCampo('nome', e.target.value)}
                placeholder="Ex: João Silva, Empresa XYZ Ltda"
                disabled={salvando}
                autoFocus
                maxLength={255}
              />
              {erros.nome && (
                <p className="text-sm text-red-600">{erros.nome}</p>
              )}
            </div>
          </>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={salvando || carregandoDados || !formularioValido}
          >
            {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </ModalBase>
  )
}
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript
- ✅ Modal específico para clientes

---

### **Tarefa 2.2: Criar Modal de Fornecedor** ✅ **CONCLUÍDA**

**Arquivo:** `/src/componentes/modais/modal-fornecedor.tsx` (CRIAR NOVO)

**O que fazer:**
1. Criar arquivo novo
2. Modal específico para FORNECEDORES

**Código COMPLETO:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { ModalBase } from './modal-base'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Skeleton, SkeletonInput, SkeletonLabel } from '@/componentes/ui/skeleton'
import { useModalForm } from '@/hooks/usar-modal-form'
import { useModais } from '@/contextos/modais-contexto'
import { useAuth } from '@/contextos/auth-contexto'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'
import {
  criarFornecedor,
  atualizarContato,
  obterContatoPorId
} from '@/servicos/supabase/contatos-queries'
import { validarContato } from '@/utilitarios/validacao'

/**
 * Props para o componente ModalFornecedor
 */
interface ModalFornecedorProps {
  /** Indica se o modal está aberto */
  isOpen: boolean
  /** Função chamada ao fechar o modal */
  onClose: () => void
  /** Função chamada após sucesso na operação */
  onSuccess?: () => void
  /** ID do fornecedor para edição (opcional) */
  fornecedorId?: string
}

// Estado inicial padrão
const ESTADO_INICIAL = {
  nome: ''
}

/**
 * Modal para criar e editar fornecedores de forma simplificada
 * Apenas campo: nome
 */
export function ModalFornecedor({
  isOpen,
  onClose,
  onSuccess,
  fornecedorId
}: ModalFornecedorProps) {
  const { workspace } = useAuth()
  const { fornecedor } = useModais()
  const { recarregarDados } = useDadosAuxiliares()

  // Hook personalizado para gerenciar formulário
  const {
    dados,
    erros,
    carregandoDados,
    salvando,
    editando,
    atualizarCampo,
    inicializarEdicao,
    limparFormulario,
    submeter,
    formularioValido
  } = useModalForm<typeof ESTADO_INICIAL>({
    estadoInicial: ESTADO_INICIAL,
    validar: validarContato,
    salvar: async (dadosFornecedor) => {
      if (editando && fornecedorId) {
        await atualizarContato(fornecedorId, dadosFornecedor.nome, workspace!.id)
      } else {
        await criarFornecedor(dadosFornecedor.nome, workspace!.id)
      }
    },
    carregar: fornecedorId && workspace ? async (id: string) => {
      const contato = await obterContatoPorId(id)
      if (contato) {
        return { nome: contato.nome }
      }
      return ESTADO_INICIAL
    } : undefined,
    onSucesso: async () => {
      await recarregarDados() // Recarregar cache de dados auxiliares
      onSuccess?.()
      fornecedor.fechar()
    },
    limparAposSucesso: true
  })

  // Inicializar edição quando modal abrir com ID
  useEffect(() => {
    if (isOpen && fornecedorId && !editando) {
      inicializarEdicao(fornecedorId)
    } else if (isOpen && !fornecedorId) {
      limparFormulario()
    }
  }, [isOpen, fornecedorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submeter()
  }

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={editando ? "Editar Fornecedor" : "Novo Fornecedor"}
      fixedWidth="500px"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mensagem informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <div className="flex gap-2">
            <span>💡</span>
            <div>
              <strong>Cadastro Simplificado</strong>
              <p className="mt-1 text-blue-700">
                Este formulário permite cadastro rápido com apenas o nome.
                Para cadastro completo (telefone, endereço, documentos),
                use o módulo Relacionamentos.
              </p>
            </div>
          </div>
        </div>

        {carregandoDados ? (
          <div className="space-y-4">
            <div>
              <SkeletonLabel />
              <SkeletonInput />
            </div>
          </div>
        ) : (
          <>
            {/* Campo Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome do Fornecedor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                value={dados.nome}
                onChange={(e) => atualizarCampo('nome', e.target.value)}
                placeholder="Ex: Fornecedor ABC, Distribuidora XYZ"
                disabled={salvando}
                autoFocus
                maxLength={255}
              />
              {erros.nome && (
                <p className="text-sm text-red-600">{erros.nome}</p>
              )}
            </div>
          </>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={salvando || carregandoDados || !formularioValido}
          >
            {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </ModalBase>
  )
}
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript
- ✅ Modal específico para fornecedores

---

## **FASE 3: PÁGINAS DE LISTAGEM** ✅ **CONCLUÍDA**

**Objetivo:** Criar 2 páginas independentes (Clientes e Fornecedores)
**Tempo:** 25 minutos
**Status:** ✅ Implementado em 2025-01-14

**Resumo da Fase:**
- ✅ Página de Clientes criada (`/src/app/(protected)/clientes/page.tsx`) - 236 linhas
- ✅ Página de Fornecedores criada (`/src/app/(protected)/fornecedores/page.tsx`) - 236 linhas
- ✅ Lazy loading dos modais implementado
- ✅ Estados de loading e erro implementados
- ✅ Ícones corrigidos (check/user-x ao invés de eye/eye-off)
- ✅ TypeScript validado: `npx tsc --noEmit` sem erros

---

### **Tarefa 3.1: Criar Página de Clientes** ✅ **CONCLUÍDA**

**Arquivo:** `/src/app/(protected)/clientes/page.tsx` (CRIAR NOVO)

**O que fazer:**
1. Criar diretório `/src/app/(protected)/clientes/`
2. Criar arquivo `page.tsx` dentro do diretório
3. Página específica para CLIENTES

**Código COMPLETO:**

```typescript
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import NextDynamic from 'next/dynamic'
import { Card, CardContent } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { TableContainer } from '@/componentes/ui/table-container'
import {
  obterClientes,
  alternarStatusContato,
  excluirContato
} from '@/servicos/supabase/contatos-queries'
import { useAuth } from '@/contextos/auth-contexto'
import { useModais } from '@/contextos/modais-contexto'
import type { Contato } from '@/tipos/database'

// Lazy load do modal - só carrega quando necessário
const ModalCliente = NextDynamic(
  () => import('@/componentes/modais/modal-cliente').then(mod => ({ default: mod.ModalCliente })),
  { ssr: false }
)

/**
 * Página de gerenciamento de Clientes (simplificado)
 */
export default function ClientesPage() {
  const { workspace } = useAuth()
  const { modalCliente, cliente } = useModais()
  const [clientes, setClientes] = useState<Contato[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Função para recarregar clientes
  const recarregarClientes = async () => {
    if (!workspace) return

    try {
      setCarregando(true)
      setErro(null)
      const dadosClientes = await obterClientes(workspace.id)
      setClientes(dadosClientes)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar clientes')
    } finally {
      setCarregando(false)
    }
  }

  // Alternar status ativo/inativo
  const handleAlternarStatus = async (id: string, ativoAtual: boolean) => {
    try {
      if (!workspace) return

      const novoStatus = !ativoAtual
      await alternarStatusContato(id, novoStatus, workspace.id)

      // Atualizar estado local
      setClientes(prev =>
        prev.map(cliente =>
          cliente.id === id
            ? { ...cliente, ativo: novoStatus }
            : cliente
        )
      )
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao alterar status')
    }
  }

  // Excluir cliente
  const handleExcluir = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir "${nome}"?\n\nClientes vinculados a transações não podem ser excluídos.`)) {
      try {
        if (!workspace) return

        await excluirContato(id, workspace.id)
        await recarregarClientes() // Recarregar lista
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao excluir cliente')
      }
    }
  }

  useEffect(() => {
    recarregarClientes()
  }, [workspace])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            👤 Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro simplificado para vincular às transações
          </p>
        </div>

        <Button onClick={() => cliente.abrir()}>
          <Icone name="plus-circle" className="w-4 h-4 mr-1" aria-hidden="true" />
          Novo Cliente
        </Button>
      </div>

      {/* Loading State */}
      {carregando && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Carregando clientes...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {erro && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              ❌ {erro}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Clientes */}
      {!carregando && !erro && (
        <TableContainer>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b bg-gray-50/50">
                <TableHead className="w-[300px] font-semibold sticky left-0 bg-gray-50/50 z-20">
                  Nome
                </TableHead>
                <TableHead className="w-[100px] font-semibold text-center">
                  Status
                </TableHead>
                <TableHead className="w-[150px] font-semibold text-center">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-4xl">👤</div>
                      <div className="font-medium">Nenhum cliente cadastrado</div>
                      <div className="text-sm">
                        Clique em "Novo Cliente" para começar
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((clienteItem) => (
                  <TableRow key={clienteItem.id} className="border-b hover:bg-gray-50/50">
                    <TableCell className="font-medium sticky left-0 bg-white z-10">
                      {clienteItem.nome}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          clienteItem.ativo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {clienteItem.ativo ? '✓ Ativo' : '✗ Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Botão Editar */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cliente.abrir(clienteItem.id)}
                          title="Editar"
                        >
                          <Icone name="pencil" className="w-4 h-4" />
                        </Button>

                        {/* Botão Ativar/Desativar */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAlternarStatus(clienteItem.id, clienteItem.ativo)}
                          title={clienteItem.ativo ? 'Desativar' : 'Ativar'}
                        >
                          <Icone
                            name={clienteItem.ativo ? 'eye-off' : 'eye'}
                            className="w-4 h-4"
                          />
                        </Button>

                        {/* Botão Excluir */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExcluir(clienteItem.id, clienteItem.nome)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Icone name="trash-2" className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal */}
      {modalCliente && (
        <ModalCliente
          isOpen={modalCliente}
          onClose={cliente.fechar}
          onSuccess={recarregarClientes}
          clienteId={cliente.clienteId}
        />
      )}
    </div>
  )
}
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript
- ✅ Página específica para clientes

---

### **Tarefa 3.2: Criar Página de Fornecedores** ✅ **CONCLUÍDA**

**Arquivo:** `/src/app/(protected)/fornecedores/page.tsx` (CRIAR NOVO)

**O que fazer:**
1. Criar diretório `/src/app/(protected)/fornecedores/`
2. Criar arquivo `page.tsx` dentro do diretório
3. Página específica para FORNECEDORES

**Código COMPLETO:**

```typescript
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import NextDynamic from 'next/dynamic'
import { Card, CardContent } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { TableContainer } from '@/componentes/ui/table-container'
import {
  obterFornecedores,
  alternarStatusContato,
  excluirContato
} from '@/servicos/supabase/contatos-queries'
import { useAuth } from '@/contextos/auth-contexto'
import { useModais } from '@/contextos/modais-contexto'
import type { Contato } from '@/tipos/database'

// Lazy load do modal - só carrega quando necessário
const ModalFornecedor = NextDynamic(
  () => import('@/componentes/modais/modal-fornecedor').then(mod => ({ default: mod.ModalFornecedor })),
  { ssr: false }
)

/**
 * Página de gerenciamento de Fornecedores (simplificado)
 */
export default function FornecedoresPage() {
  const { workspace } = useAuth()
  const { modalFornecedor, fornecedor } = useModais()
  const [fornecedores, setFornecedores] = useState<Contato[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Função para recarregar fornecedores
  const recarregarFornecedores = async () => {
    if (!workspace) return

    try {
      setCarregando(true)
      setErro(null)
      const dadosFornecedores = await obterFornecedores(workspace.id)
      setFornecedores(dadosFornecedores)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar fornecedores')
    } finally {
      setCarregando(false)
    }
  }

  // Alternar status ativo/inativo
  const handleAlternarStatus = async (id: string, ativoAtual: boolean) => {
    try {
      if (!workspace) return

      const novoStatus = !ativoAtual
      await alternarStatusContato(id, novoStatus, workspace.id)

      // Atualizar estado local
      setFornecedores(prev =>
        prev.map(fornecedor =>
          fornecedor.id === id
            ? { ...fornecedor, ativo: novoStatus }
            : fornecedor
        )
      )
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao alterar status')
    }
  }

  // Excluir fornecedor
  const handleExcluir = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir "${nome}"?\n\nFornecedores vinculados a transações não podem ser excluídos.`)) {
      try {
        if (!workspace) return

        await excluirContato(id, workspace.id)
        await recarregarFornecedores() // Recarregar lista
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao excluir fornecedor')
      }
    }
  }

  useEffect(() => {
    recarregarFornecedores()
  }, [workspace])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            🏭 Fornecedores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro simplificado para vincular às transações
          </p>
        </div>

        <Button onClick={() => fornecedor.abrir()}>
          <Icone name="plus-circle" className="w-4 h-4 mr-1" aria-hidden="true" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Loading State */}
      {carregando && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Carregando fornecedores...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {erro && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              ❌ {erro}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Fornecedores */}
      {!carregando && !erro && (
        <TableContainer>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b bg-gray-50/50">
                <TableHead className="w-[300px] font-semibold sticky left-0 bg-gray-50/50 z-20">
                  Nome
                </TableHead>
                <TableHead className="w-[100px] font-semibold text-center">
                  Status
                </TableHead>
                <TableHead className="w-[150px] font-semibold text-center">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-4xl">🏭</div>
                      <div className="font-medium">Nenhum fornecedor cadastrado</div>
                      <div className="text-sm">
                        Clique em "Novo Fornecedor" para começar
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                fornecedores.map((fornecedorItem) => (
                  <TableRow key={fornecedorItem.id} className="border-b hover:bg-gray-50/50">
                    <TableCell className="font-medium sticky left-0 bg-white z-10">
                      {fornecedorItem.nome}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          fornecedorItem.ativo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {fornecedorItem.ativo ? '✓ Ativo' : '✗ Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Botão Editar */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fornecedor.abrir(fornecedorItem.id)}
                          title="Editar"
                        >
                          <Icone name="pencil" className="w-4 h-4" />
                        </Button>

                        {/* Botão Ativar/Desativar */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAlternarStatus(fornecedorItem.id, fornecedorItem.ativo)}
                          title={fornecedorItem.ativo ? 'Desativar' : 'Ativar'}
                        >
                          <Icone
                            name={fornecedorItem.ativo ? 'eye-off' : 'eye'}
                            className="w-4 h-4"
                          />
                        </Button>

                        {/* Botão Excluir */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExcluir(fornecedorItem.id, fornecedorItem.nome)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Icone name="trash-2" className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal */}
      {modalFornecedor && (
        <ModalFornecedor
          isOpen={modalFornecedor}
          onClose={fornecedor.fechar}
          onSuccess={recarregarFornecedores}
          fornecedorId={fornecedor.fornecedorId}
        />
      )}
    </div>
  )
}
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript
- ✅ Página específica para fornecedores

---

## **FASE 4: INTEGRAÇÃO COM SIDEBAR** ✅ **CONCLUÍDA**

**Objetivo:** Criar nova seção "Relacionamento" na sidebar
**Tempo:** 5 minutos
**Status:** ✅ Implementado em 2025-01-14

**Resumo da Fase:**
- ✅ Nova seção "Relacionamento" adicionada na sidebar (37 linhas)
- ✅ Link "Clientes" com ícone 'user'
- ✅ Link "Fornecedores" com ícone 'building'
- ✅ Borda divisória superior implementada
- ✅ Proteção por permissão 'configuracoes'
- ✅ TypeScript validado: `npx tsc --noEmit` sem erros

---

### **Tarefa 4.1: Criar Seção Relacionamento na Sidebar** ✅ **CONCLUÍDA**

**Arquivo:** `/src/componentes/layout/sidebar.tsx`

**O que fazer:**
1. Localizar fechamento da seção Configurações (linha ~254)
2. Adicionar NOVA SEÇÃO antes da Info do Workspace (linha ~257)
3. **NÃO adicionar** no array `cadastroItems` (isso está errado!)

**Estrutura Visual Esperada:**
```
┌─────────────────────────┐
│ Dashboard               │
│ Transações              │
│ Relatórios              │
├─────────────────────────┤
│ Configurações           │ ← Seção existente
│   ⚙️ Configurações      │
│   👥 Usuários           │
│   🎯 Metas              │
│   📋 Cadastramento ▶    │
│   🛡️ Dashboard Admin    │
├─────────────────────────┤ ← NOVA DIVISÃO
│ Relacionamento          │ ← NOVA SEÇÃO
│   👤 Clientes           │ ← Link direto
│   🏭 Fornecedores       │ ← Link direto
├─────────────────────────┤
│ Workspace Info          │
└─────────────────────────┘
```

**Código COMPLETO a adicionar (linha ~254, APÓS fechamento da seção Configurações):**

```typescript
{/* Seção Relacionamento - Nova divisão separada */}
<div className="mt-8 pt-4 border-t border-border">
  <div className="text-xs text-muted-foreground mb-2">Relacionamento</div>

  {/* Clientes */}
  <ProtectedNavItem permissaoNecessaria="configuracoes">
    <Link
      href="/clientes"
      onClick={onLinkClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        pathname.startsWith("/clientes")
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icone name="user" className="w-4 h-4" aria-hidden="true" />
      Clientes
    </Link>
  </ProtectedNavItem>

  {/* Fornecedores */}
  <ProtectedNavItem permissaoNecessaria="configuracoes">
    <Link
      href="/fornecedores"
      onClick={onLinkClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        pathname.startsWith("/fornecedores")
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icone name="truck" className="w-4 h-4" aria-hidden="true" />
      Fornecedores
    </Link>
  </ProtectedNavItem>
</div>
```

**Localização Exata:**
```typescript
// Linha ~254 - Final da seção Configurações
        )}
      </div>

// ADICIONAR AQUI O CÓDIGO ACIMA ↑↑↑

      {/* Info do Workspace */}
      {workspace && (
// Linha ~257
```

**Validação:**
```bash
npx tsc --noEmit
npm run dev
```
- ✅ Sem erros de TypeScript
- ✅ Nova seção "Relacionamento" aparece separada
- ✅ Linha divisória visível (border-top)
- ✅ Título "Relacionamento" em cinza pequeno
- ✅ 2 links diretos (Clientes e Fornecedores)
- ✅ **NÃO aparecem** dentro do menu Cadastramento expansível

---

## **FASE 5: TESTES E VALIDAÇÃO**

**Objetivo:** Validar implementação completa
**Tempo:** 15 minutos

---

### **Tarefa 5.1: Teste de Navegação - Clientes** ✅

**Como testar:**
1. Iniciar servidor: `npm run dev`
2. Login no sistema
3. Abrir sidebar
4. **Rolar até seção "Relacionamento"** (abaixo de Configurações)
5. Clicar em "Clientes"

**Checklist:**
- ✅ Seção "Relacionamento" aparece separada com borda superior
- ✅ Link "Clientes" visível (NÃO dentro de Cadastramento)
- ✅ Página carrega sem erros
- ✅ URL correta: `/clientes`
- ✅ Título aparece: "👤 Clientes"
- ✅ Botão "Novo Cliente" visível
- ✅ Tabela renderiza (mostra apenas clientes)

---

### **Tarefa 5.2: Teste de Navegação - Fornecedores** ✅

**Como testar:**
1. Na sidebar, seção "Relacionamento"
2. Clicar em "Fornecedores"

**Checklist:**
- ✅ Link "Fornecedores" visível na seção Relacionamento
- ✅ Página carrega sem erros
- ✅ URL correta: `/fornecedores`
- ✅ Título aparece: "🏭 Fornecedores"
- ✅ Botão "Novo Fornecedor" visível
- ✅ Tabela renderiza (mostra apenas fornecedores)

---

### **Tarefa 5.3: Teste de Criação - Cliente** ✅

**Como testar:**
1. Página `/clientes`
2. Clicar em "Novo Cliente"
3. Preencher campo "Nome": "Cliente Teste ABC"
4. Clicar em "Criar"

**Checklist:**
- ✅ Modal abre com título "Novo Cliente"
- ✅ Campo nome validado (obrigatório)
- ✅ Botão "Criar" habilitado quando válido
- ✅ Salva no banco com `tipo_pessoa = 'cliente'`
- ✅ Modal fecha automaticamente
- ✅ Novo cliente aparece na tabela

**SQL para verificar:**
```sql
SELECT id, nome, tipo_pessoa, ativo, workspace_id
FROM r_contatos
WHERE tipo_pessoa = 'cliente'
ORDER BY created_at DESC
LIMIT 5;
```

---

### **Tarefa 5.4: Teste de Criação - Fornecedor** ✅

**Como testar:**
1. Página `/fornecedores`
2. Clicar em "Novo Fornecedor"
3. Preencher campo "Nome": "Fornecedor Teste XYZ"
4. Clicar em "Criar"

**Checklist:**
- ✅ Modal abre com título "Novo Fornecedor"
- ✅ Campo nome validado (obrigatório)
- ✅ Botão "Criar" habilitado quando válido
- ✅ Salva no banco com `tipo_pessoa = 'fornecedor'`
- ✅ Modal fecha automaticamente
- ✅ Novo fornecedor aparece na tabela

**SQL para verificar:**
```sql
SELECT id, nome, tipo_pessoa, ativo, workspace_id
FROM r_contatos
WHERE tipo_pessoa = 'fornecedor'
ORDER BY created_at DESC
LIMIT 5;
```

---

### **Tarefa 5.5: Teste de Edição** ✅

**Como testar:**
1. Na tabela de clientes, clicar em "Editar" (lápis)
2. Alterar nome: "Cliente Teste ABC Editado"
3. Clicar em "Atualizar"

**Checklist:**
- ✅ Modal abre preenchido
- ✅ Título muda para "Editar Cliente"
- ✅ Salva alterações no banco
- ✅ Modal fecha
- ✅ Tabela atualiza
- ✅ `tipo_pessoa` NÃO muda (permanece 'cliente')

---

### **Tarefa 5.6: Teste de Integração com Transações** ✅

**Como testar:**
1. Criar novo cliente: "Cliente Integração"
2. Criar novo fornecedor: "Fornecedor Integração"
3. Ir para página Transações
4. Abrir modal "Lançar Transação"
5. Ir para aba "Relacionamento"

**Checklist:**
- ✅ "Cliente Integração" aparece no select Cliente
- ✅ "Fornecedor Integração" aparece no select Fornecedor
- ✅ Clientes não aparecem no select Fornecedor
- ✅ Fornecedores não aparecem no select Cliente
- ✅ Possível vincular à transação
- ✅ Salvamento funciona

**SQL para verificar vínculo:**
```sql
SELECT
  t.descricao,
  t.tipo,
  c.nome as contato_nome,
  c.tipo_pessoa
FROM fp_transacoes t
LEFT JOIN r_contatos c ON c.id = t.contato_id
WHERE t.contato_id IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 5;
```

---

### **Tarefa 5.7: Teste de Ativar/Desativar** ✅

**Como testar:**
1. Clicar no botão "olho" de um cliente
2. Verificar mudança de status
3. Ir para modal de transação
4. Verificar se cliente inativo NÃO aparece no select

**Checklist:**
- ✅ Badge muda de "✓ Ativo" para "✗ Inativo"
- ✅ Cor do badge muda (verde → cinza)
- ✅ Status persiste no banco
- ✅ Cliente inativo não aparece no select de transação
- ✅ Possível reativar

---

### **Tarefa 5.8: Teste de Exclusão** ✅

**Como testar:**

**Cenário 1: SEM transações vinculadas**
1. Criar novo fornecedor de teste
2. Clicar em "Excluir" (lixeira)
3. Confirmar exclusão

**Checklist:**
- ✅ Confirmação aparece
- ✅ Fornecedor é desativado
- ✅ Remove da listagem

**Cenário 2: COM transações vinculadas**
1. Vincular fornecedor a transação
2. Tentar excluir fornecedor
3. Verificar erro

**Checklist:**
- ✅ Erro: "Não é possível excluir contato vinculado a transações"
- ✅ Fornecedor não é removido
- ✅ Sugestão de desativar

---

### **Tarefa 5.9: Teste TypeScript e Build** ✅

**Comandos a executar:**

```bash
# 1. Validar TypeScript
npx tsc --noEmit

# 2. Build de produção
npm run build

# 3. Verificar tempo de build (deve ser ~43-50s)
```

**Checklist:**
- ✅ Zero erros de TypeScript
- ✅ Build completo sem warnings críticos
- ✅ Tempo de build < 60s
- ✅ Bundle size sem aumento significativo

---

## 🚨 TROUBLESHOOTING

### **Problema: Modal de Cliente abre mas salva como Fornecedor**
**Causa:** Função errada sendo chamada
**Solução:** Verificar se está usando `criarCliente()` no modal de cliente

---

### **Problema: Clientes aparecem na tabela de Fornecedores**
**Causa:** Filtro `tipo_pessoa` não aplicado
**Solução:** Verificar se está usando `obterClientes()` ou `obterFornecedores()` corretamente

---

### **Problema: "RLS policy violation"**
**Causa:** Row Level Security bloqueando acesso
**Solução:**
```sql
-- Verificar workspace_id do usuário
SELECT workspace_id FROM fp_usuarios WHERE id = auth.uid();
```

---

## 📊 CHECKLIST FINAL

### **Antes de Marcar como Concluído:**
- [ ] Todos os arquivos criados/modificados
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npm run build` concluído com sucesso
- [ ] Testado navegação para `/clientes`
- [ ] Testado navegação para `/fornecedores`
- [ ] Testado criação de cliente
- [ ] Testado criação de fornecedor
- [ ] Testado edição (cliente e fornecedor)
- [ ] Testado ativar/desativar
- [ ] Testado exclusão (com/sem transações)
- [ ] Testado integração com modal de transação
- [ ] Clientes aparecem APENAS no select Cliente
- [ ] Fornecedores aparecem APENAS no select Fornecedor
- [ ] Sem warnings críticos no console
- [ ] Performance aceitável

---

## 📚 ARQUIVOS MODIFICADOS/CRIADOS

### **Arquivos CRIADOS (6):**
```
✅ /src/app/(protected)/clientes/page.tsx
✅ /src/app/(protected)/fornecedores/page.tsx
✅ /src/componentes/modais/modal-cliente.tsx
✅ /src/componentes/modais/modal-fornecedor.tsx
✅ /docs/desenvolvimento/IMPLEMENTACAO-CADASTRO-CONTATOS-SEPARADOS.md (este arquivo)
```

### **Arquivos MODIFICADOS (4):**
```
✅ /src/servicos/supabase/contatos-queries.ts (+ 6 funções)
✅ /src/utilitarios/validacao.ts (+ validarContato)
✅ /src/contextos/modais-contexto.tsx (+ 2 controles modais)
✅ /src/componentes/layout/sidebar.tsx (+ 2 itens menu)
```

### **Total:** 10 arquivos

---

## 🎯 RESULTADO ESPERADO

Ao final da implementação:

1. ✅ **2 páginas independentes:**
   - `/clientes` → Lista APENAS clientes
   - `/fornecedores` → Lista APENAS fornecedores

2. ✅ **2 modais independentes:**
   - Modal Cliente → Cria com `tipo_pessoa = 'cliente'`
   - Modal Fornecedor → Cria com `tipo_pessoa = 'fornecedor'`

3. ✅ **Integração perfeita:**
   - Clientes aparecem no select Cliente do modal de transação
   - Fornecedores aparecem no select Fornecedor do modal de transação
   - Sem mistura entre tipos

4. ✅ **Sistema mantém:**
   - 🔒 Isolamento por workspace
   - 🎨 Design consistente
   - ⚡ Performance (cache SWR)
   - 🔐 Permissões
   - 📱 Responsivo

---

## 🚀 PRÓXIMOS PASSOS PARA CONTINUAR

**Para o próximo chat/sessão:**

### **CONTEXTO ATUAL (2025-01-14):**
- ✅ FASE 1 completa (backend pronto)
- 🟡 Continuar na FASE 2 (criar modais)

### **ARQUIVOS JÁ MODIFICADOS (NÃO TOCAR):**
```
✅ /src/servicos/supabase/contatos-queries.ts (6 funções CRUD)
✅ /src/utilitarios/validacao.ts (função validarContato)
✅ /src/contextos/modais-contexto.tsx (controles modalCliente/modalFornecedor)
```

### **PRÓXIMA AÇÃO:**
**Executar FASE 2 - Tarefa 2.1**
- Criar arquivo: `/src/componentes/modais/modal-cliente.tsx`
- Seguir código COMPLETO do documento (linhas ~650-800)

### **COMANDOS IMPORTANTES:**
```bash
# Antes de iniciar qualquer fase
npx tsc --noEmit

# Após concluir qualquer tarefa
npx tsc --noEmit

# Ao final de todas as fases
npm run build
```

### **LEMBRETE:**
- ⚠️ NÃO refaça FASE 1 (já está implementada)
- ⚠️ Siga EXATAMENTE o código do documento
- ⚠️ Use padrão existente (ver `modal-conta.tsx` como referência)
- ⚠️ Valide TypeScript após cada arquivo criado

---

**FIM DO DOCUMENTO DE IMPLEMENTAÇÃO (VERSÃO 2.1)**

**Versão:** 2.4 (QUASE COMPLETO - FASES 1, 2, 3 E 4 CONCLUÍDAS)
**Última Atualização:** 2025-01-15 00:22
**Próxima Revisão:** Após testes da FASE 5
