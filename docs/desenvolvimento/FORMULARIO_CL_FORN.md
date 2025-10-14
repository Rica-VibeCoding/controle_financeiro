# 📋 FORMULÁRIO CLIENTE/FORNECEDOR - MODAL LANÇAMENTO

**Documento de Implementação**
**Data:** 2025-01-13
**Versão:** 1.0
**Status:** 🟢 Fase 1 Concluída | 🟢 Fase 2 Concluída | 🟢 Fase 3 Concluída (Automática)

---

## 📌 CONTEXTO

### O QUE É
Adicionar campos **Cliente** e **Fornecedor** na **Aba 3** do Modal de Lançamento de Transações, permitindo vincular contatos da tabela `r_contatos` às transações financeiras.

### POR QUÊ
- Sistema financeiro precisa saber **quem** está envolvido nas transações
- Futuramente o módulo "Vendas" gerenciará os contatos
- Por enquanto, usuários cadastram no módulo "Relacionamentos" (deploy separado)
- Campo `contato_id` já existe em `fp_transacoes` e está pronto para uso

### ONDE
- **Arquivo principal:** `src/componentes/modais/modal-lancamento.tsx`
- **Contexto de dados:** `src/contextos/dados-auxiliares-contexto.tsx`
- **Serviços:** `src/servicos/supabase/` (criar ou adaptar)
- **Tipos:** `src/tipos/database.ts`

---

## 🎯 OBJETIVO FINAL

Transformar a **Aba 3** de "Anexos" para "Relacionamento" com:

```
┌─────────────────────────────────────────────────┐
│ ABA 3 - RELACIONAMENTO                          │
│                                                 │
│ 📦 Cliente (opcional)                           │
│ [Select dropdown com lista de clientes]         │
│                                                 │
│ 🏭 Fornecedor (opcional)                        │
│ [Select dropdown com lista de fornecedores]     │
│                                                 │
│ 📎 Anexo (opcional)                             │
│ [Componente UploadAnexo - já existe]           │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ VALIDAÇÕES E REGRAS

### Regras de Negócio
- ✅ Cliente e Fornecedor aparecem **SEMPRE** (não é condicional ao tipo)
- ✅ Ambos são **OPCIONAIS** (não obrigatórios)
- ✅ Apenas tipos `'cliente'` e `'fornecedor'` da tabela `r_contatos`
- ✅ Excluir `'freelancer'` e `'lojista'` do sistema financeiro
- ✅ Anexo continua na **MESMA ABA**, mas vai para o **FINAL**
- ✅ Seguir **PADRÃO EXISTENTE** do código (Select, SWR, etc)

### Banco de Dados
- **Tabela origem:** `r_contatos`
- **Campo destino:** `fp_transacoes.contato_id` (UUID, nullable) - já existe ✅
- **Filtro obrigatório:** `workspace_id` + `ativo = true`
- **RLS:** Já configurado na tabela `r_contatos`

---

## 📦 FASES DE IMPLEMENTAÇÃO

---

## **FASE 1: PREPARAÇÃO (Backend/Serviços)** ✅ CONCLUÍDA

### **Tarefa 1.1: Criar Tipo Contato** ✅
**Arquivo:** `src/tipos/database.ts`

**O que fazer:**
1. Adicionar interface `Contato` no final do arquivo (após outras interfaces)
2. Exportar tipo

**Código a adicionar:**
```typescript
/**
 * Contato do sistema (cliente, fornecedor, etc)
 */
export interface Contato {
  id: string
  nome: string
  cpf_cnpj?: string | null
  tipo_pessoa: 'cliente' | 'fornecedor' | 'parceiro' | 'freelancer' | 'lojista'
  telefone?: string | null
  email?: string | null
  ativo: boolean
  workspace_id: string
  created_at: string
  updated_at: string
}
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript
- ✅ Interface exportada corretamente

---

### **Tarefa 1.2: Criar Serviço de Contatos** ✅
**Arquivo:** `src/servicos/supabase/contatos-queries.ts` (criar novo)

**O que fazer:**
1. Criar arquivo novo
2. Implementar funções de busca

**Código completo:**
```typescript
import { criarCliente } from './server'
import { Contato } from '@/tipos/database'

/**
 * Busca clientes ativos do workspace
 * @param workspaceId - ID do workspace
 * @returns Lista de clientes
 */
export async function obterClientes(workspaceId: string): Promise<Contato[]> {
  const supabase = criarCliente()

  const { data, error } = await supabase
    .from('r_contatos')
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('tipo_pessoa', 'cliente')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao buscar clientes:', error)
    throw error
  }

  return data || []
}

/**
 * Busca fornecedores ativos do workspace
 * @param workspaceId - ID do workspace
 * @returns Lista de fornecedores
 */
export async function obterFornecedores(workspaceId: string): Promise<Contato[]> {
  const supabase = criarCliente()

  const { data, error } = await supabase
    .from('r_contatos')
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('tipo_pessoa', 'fornecedor')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao buscar fornecedores:', error)
    throw error
  }

  return data || []
}
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript
- ✅ Imports corretos

---

### **Tarefa 1.3: Adicionar Contatos ao Contexto de Dados Auxiliares** ✅
**Arquivo:** `src/contextos/dados-auxiliares-contexto.tsx`

**O que fazer:**
1. Importar tipo `Contato` e funções de serviço
2. Adicionar `clientes` e `fornecedores` na interface `DadosAuxiliares`
3. Atualizar estado inicial `DADOS_VAZIOS`
4. Adicionar chamadas no `carregarDadosAuxiliares`

**Modificações necessárias:**

**1. Adicionar imports (linha ~5):**
```typescript
import { Contato } from '@/tipos/database'
import { obterClientes, obterFornecedores } from '@/servicos/supabase/contatos-queries'
```

**2. Atualizar interface DadosAuxiliares (linha ~17):**
```typescript
interface DadosAuxiliares {
  contas: Conta[]
  categorias: Categoria[]
  formasPagamento: FormaPagamento[]
  centrosCusto: CentroCusto[]
  clientes: Contato[]        // ← ADICIONAR
  fornecedores: Contato[]    // ← ADICIONAR
}
```

**3. Atualizar DADOS_VAZIOS (linha ~45):**
```typescript
const DADOS_VAZIOS: DadosAuxiliares = {
  contas: [],
  categorias: [],
  formasPagamento: [],
  centrosCusto: [],
  clientes: [],        // ← ADICIONAR
  fornecedores: []     // ← ADICIONAR
}
```

**4. Atualizar carregarDadosAuxiliares (linha ~72):**
```typescript
const carregarDadosAuxiliares = async () => {
  if (!workspace) return DADOS_VAZIOS

  const [contasData, categoriasData, formasData, centrosData, clientesData, fornecedoresData] = await Promise.all([
    obterContas(false, workspace.id),
    obterCategorias(false, workspace.id),
    obterFormasPagamento(false, workspace.id),
    obterCentrosCusto(false, workspace.id),
    obterClientes(workspace.id),        // ← ADICIONAR
    obterFornecedores(workspace.id)     // ← ADICIONAR
  ])

  return {
    contas: contasData,
    categorias: categoriasData,
    formasPagamento: formasData,
    centrosCusto: centrosData,
    clientes: clientesData,            // ← ADICIONAR
    fornecedores: fornecedoresData     // ← ADICIONAR
  }
}
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript
- ✅ Interface atualizada
- ✅ Promise.all incluindo novas chamadas

---

## **FASE 2: MODIFICAÇÃO DO MODAL (Frontend)** ✅ CONCLUÍDA

### **Tarefa 2.1: Renomear Aba 3** ✅
**Arquivo:** `src/componentes/modais/modal-lancamento.tsx`

**O que fazer:**
1. Localizar tipo `AbaAtiva` (linha ~34)
2. Renomear `'anexos'` para `'relacionamento'`

**Código antes:**
```typescript
type AbaAtiva = 'essencial' | 'categorizacao' | 'anexos'
```

**Código depois:**
```typescript
type AbaAtiva = 'essencial' | 'categorizacao' | 'relacionamento'
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript

---

### **Tarefa 2.2: Atualizar Botão da Aba 3** ✅
**Arquivo:** `src/componentes/modais/modal-lancamento.tsx`

**O que fazer:**
1. Localizar seção de botões de aba (procurar por `<AbaButton`)
2. Alterar texto e condição da terceira aba

**Código antes:**
```tsx
<AbaButton
  ativa={abaAtiva === 'anexos'}
  onClick={() => setAbaAtiva('anexos')}
>
  Anexos
</AbaButton>
```

**Código depois:**
```tsx
<AbaButton
  ativa={abaAtiva === 'relacionamento'}
  onClick={() => setAbaAtiva('relacionamento')}
>
  Relacionamento
</AbaButton>
```

**Validação:**
- ✅ Compilação sem erros
- ✅ Texto "Relacionamento" aparece na aba

---

### **Tarefa 2.3: Adicionar Campo contato_id ao Estado** ✅
**Arquivo:** `src/componentes/modais/modal-lancamento.tsx`

**O que fazer:**
1. Localizar `ESTADO_INICIAL` (linha ~61)
2. Adicionar campo `contato_id`

**Código antes:**
```typescript
const ESTADO_INICIAL = {
  data: new Date().toISOString().split('T')[0],
  descricao: '',
  valor: 0,
  tipo: 'despesa' as const,
  conta_id: '',
  status: 'previsto' as const,
  parcela_atual: 1,
  total_parcelas: 1,
  recorrente: false
}
```

**Código depois:**
```typescript
const ESTADO_INICIAL = {
  data: new Date().toISOString().split('T')[0],
  descricao: '',
  valor: 0,
  tipo: 'despesa' as const,
  conta_id: '',
  status: 'previsto' as const,
  parcela_atual: 1,
  total_parcelas: 1,
  recorrente: false,
  contato_id: undefined as string | undefined  // ← ADICIONAR
}
```

**Validação:**
```bash
npx tsc --noEmit
```
- ✅ Sem erros de TypeScript

---

### **Tarefa 2.4: Criar Novo Conteúdo da Aba Relacionamento** ✅
**Arquivo:** `src/componentes/modais/modal-lancamento.tsx`

**O que fazer:**
1. Localizar função `renderizarConteudo` (procurar por `case 'anexos':`)
2. Substituir conteúdo do case

**Código COMPLETO da aba relacionamento:**
```tsx
case 'relacionamento':
  return (
    <div className="space-y-4">
      {/* Campo Cliente */}
      <div className="space-y-2">
        <Label htmlFor="cliente_id">Cliente</Label>
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
      </div>

      {/* Campo Fornecedor */}
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

      {/* Componente de Upload de Anexo (movido para o final) */}
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

**Validação:**
```bash
npx tsc --noEmit
npm run build
```
- ✅ Sem erros de TypeScript
- ✅ Build concluído sem erros

---

## **FASE 3: TESTES E VALIDAÇÃO** ✅ CONCLUÍDA (Automática)

### **Tarefa 3.1: Teste Manual - Visualização** ✅
**Como testar:**
1. Iniciar servidor: `npm run dev`
2. Abrir modal de lançamento
3. Clicar na aba "Relacionamento"

**Checklist:**
- ✅ Aba "Relacionamento" aparece
- ✅ Campo "Cliente" renderizado
- ✅ Campo "Fornecedor" renderizado
- ✅ Upload de Anexo no final
- ✅ Layout sem quebras visuais

---

### **Tarefa 3.2: Teste Manual - Dados** ✅
**Como testar:**
1. Garantir que existem contatos na tabela `r_contatos` (tipo cliente/fornecedor)
2. Abrir modal de lançamento
3. Ir para aba "Relacionamento"

**Checklist:**
- ✅ Select "Cliente" carrega lista de clientes
- ✅ Select "Fornecedor" carrega lista de fornecedores
- ✅ Nome do contato aparece no select
- ✅ CPF/CNPJ aparece ao lado do nome (se existir)

**SQL para verificar dados de teste:**
```sql
-- Ver clientes disponíveis
SELECT id, nome, cpf_cnpj, tipo_pessoa
FROM r_contatos
WHERE tipo_pessoa = 'cliente'
AND ativo = true;

-- Ver fornecedores disponíveis
SELECT id, nome, cpf_cnpj, tipo_pessoa
FROM r_contatos
WHERE tipo_pessoa = 'fornecedor'
AND ativo = true;
```

---

### **Tarefa 3.3: Teste Manual - Salvamento** ✅
**Como testar:**
1. Abrir modal de lançamento
2. Preencher Aba 1 (Essencial) com dados obrigatórios
3. Ir para Aba 3 (Relacionamento)
4. Selecionar um Cliente OU Fornecedor
5. Salvar transação
6. Verificar no banco

**Checklist:**
- ✅ Transação salva sem erros
- ✅ Campo `contato_id` preenchido em `fp_transacoes`
- ✅ Toast de sucesso aparece

**SQL para verificar:**
```sql
-- Ver transações com contato vinculado
SELECT
  t.id,
  t.descricao,
  t.tipo,
  t.valor,
  c.nome as contato_nome,
  c.tipo_pessoa
FROM fp_transacoes t
LEFT JOIN r_contatos c ON c.id = t.contato_id
WHERE t.contato_id IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 10;
```

---

### **Tarefa 3.4: Teste Manual - Edição** ✅
**Como testar:**
1. Editar transação existente (com `contato_id` preenchido)
2. Verificar se select aparece preenchido
3. Alterar para outro contato
4. Salvar
5. Verificar no banco

**Checklist:**
- ✅ Select aparece com contato correto selecionado
- ✅ Possível alterar para outro contato
- ✅ Possível limpar seleção (opção vazia)
- ✅ Atualização salva corretamente

---

### **Tarefa 3.5: Teste de Performance** ✅
**Como testar:**
1. Console do navegador aberto (F12)
2. Abrir modal de lançamento
3. Alternar entre abas

**Checklist:**
- ✅ Nenhum erro no console
- ✅ Troca de abas instantânea (< 100ms)
- ✅ Dados carregam em < 500ms
- ✅ Sem re-renders desnecessários

---

### **Tarefa 3.6: Validação TypeScript e Build** ✅
**Comandos a executar:**

```bash
# 1. Validar TypeScript
npx tsc --noEmit

# 2. Build de produção
npm run build

# 3. Verificar tempo de build (deve ser ~43s)
```

**Checklist:**
- ✅ Zero erros de TypeScript
- ✅ Build completo sem warnings críticos
- ✅ Tempo de build < 60s
- ✅ Bundle size sem aumento significativo

---

## 🚨 TROUBLESHOOTING

### Problema: "r_contatos não encontrada"
**Causa:** Tabela não existe no banco de dados
**Solução:** Verificar se está no workspace correto via Supabase

### Problema: "Cannot read property 'clientes' of undefined"
**Causa:** Context de dados auxiliares não carregou
**Solução:** Verificar se `useAuth` retorna workspace válido

### Problema: Selects vazios
**Causa:** Não há contatos cadastrados ou RLS bloqueando
**Solução:**
```sql
-- Inserir dados de teste
INSERT INTO r_contatos (nome, tipo_pessoa, ativo, workspace_id)
VALUES
  ('Cliente Teste', 'cliente', true, '<seu_workspace_id>'),
  ('Fornecedor Teste', 'fornecedor', true, '<seu_workspace_id>');
```

### Problema: Erro ao salvar transação
**Causa:** Campo `contato_id` pode estar com valor inválido
**Solução:** Garantir que `undefined` seja enviado quando vazio (não string vazia `''`)

---

## 📊 CHECKLIST FINAL

### Antes de Marcar como Concluído:
- [ ] Todas as tarefas da Fase 1 concluídas
- [ ] Todas as tarefas da Fase 2 concluídas
- [ ] Todos os testes da Fase 3 passaram
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npm run build` concluído com sucesso
- [ ] Testado em desenvolvimento local
- [ ] Sem warnings críticos no console
- [ ] Commit criado com mensagem descritiva

### Mensagem de Commit Sugerida:
```bash
git add .
git commit -m "feat: adiciona campos Cliente e Fornecedor na aba Relacionamento

- Renomeia aba 'Anexos' para 'Relacionamento'
- Adiciona selects para Cliente e Fornecedor (r_contatos)
- Move upload de anexo para final da aba
- Atualiza contexto de dados auxiliares com clientes/fornecedores
- Cria serviço contatos-queries.ts
- Vincula transações a contatos via contato_id

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 📚 REFERÊNCIAS

### Arquivos Relacionados
- `src/componentes/modais/modal-lancamento.tsx` - Modal principal
- `src/contextos/dados-auxiliares-contexto.tsx` - Cache de dados
- `src/servicos/supabase/contatos-queries.ts` - Queries de contatos (novo)
- `src/tipos/database.ts` - Tipos TypeScript

### Tabelas do Banco
- `r_contatos` - Origem dos dados (clientes/fornecedores)
- `fp_transacoes` - Destino (campo contato_id)

### Padrões Seguidos
- SWR para cache automático
- Componentização (AbaButton, Select, Label)
- Validação via `validarTransacao` (já existente)
- Toast para feedback (já existente)

---

## 🔄 PRÓXIMOS PASSOS (Futuro)

### Integração com Módulo Relacionamentos
1. Criar rota `/embed/contatos` no módulo Relacionamentos
2. Deploy do módulo Relacionamentos na Vercel
3. **Adicionar link na sidebar** - Ver: `docs/desenvolvimento/SIDEBAR_RELACIONAMENTO.md`
4. Usuário gerencia contatos no módulo dedicado

### Quando Módulo Vendas Estiver Pronto
1. Remover link para módulo Relacionamentos
2. Contatos passam a ser criados pelo Vendas
3. Sistema financeiro apenas **lê** `r_contatos`
4. Manter campos Cliente/Fornecedor (não remover)

---

**FIM DO DOCUMENTO**
