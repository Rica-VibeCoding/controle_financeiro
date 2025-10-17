# 📋 Plano de Execução - Melhorias de Código

**Projeto:** Sistema de Controle Financeiro Pessoal
**Baseado em:** Relatório de Saúde do Código (Score: 82/100)
**Objetivo:** Alcançar Score 91/100 (Excelente)
**Esforço Total:** 15-20 horas
**Prioridade:** Alta (Segurança) + Média (Qualidade)

⚠️ **STATUS: PAUSADO - Build quebrado (erro Next.js)**
**Última atualização:** 17/01/2025

---

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. Build Quebrado (Next.js 15.x)
**Erro:** `Error: <Html> should not be imported outside of pages/_document`
**Impacto:** Deploy impossível
**Status:** NÃO resolvido
**Causa:** Bug interno do Next.js 15.4.3 e 15.5.2 com pre-rendering de páginas de erro

**Tentativas:**
- ✅ Downgrade Next.js 15.5.2 → 15.4.3
- ✅ Adicionado `'use client'` + `force-dynamic` em not-found.tsx
- ✅ Removido global-error.tsx
- ✅ Configurado `output: 'standalone'` em next.config.ts
- ❌ Problema persiste em todas as versões 15.x

**Próximos passos possíveis:**
1. Downgrade para Next.js 14.x (requer validação de compatibilidade React 19)
2. Aguardar patch Next.js 15.5.3+
3. Migrar para modo pages/ ao invés de app/ (não recomendado)

### 2. Análise de Código Desatualizada
**Problema:** Plano baseado em análise que não reflete estado real
**Descobertas:**
- ✅ workspace_id JÁ está 100% implementado em todas as queries críticas
- ⚠️ console.log (335 encontrados) - maioria são console.error legítimos em catch blocks
- ✅ TypeScript sem erros
- ❌ Build quebrado impede validação completa

---

## 📊 Contexto do Projeto

### Stack Tecnológica
- **Frontend:** Next.js 15.5.0 + React 19 + TypeScript 5.9
- **Backend:** Supabase (PostgreSQL + RLS)
- **Cache:** SWR com estratégia manual-first
- **Deploy:** Vercel (build: ~43s)
- **Nomenclatura:** 100% Português (servicos/, utilitarios/, componentes/, tipos/)

### Estrutura de Pastas
```
src/
├── app/                    # Next.js App Router
│   ├── (protected)/       # Rotas protegidas
│   └── auth/              # Autenticação
├── componentes/           # Componentes React (português)
├── contextos/             # React Contexts
├── hooks/                 # Hooks customizados (usar-*)
├── servicos/              # Serviços Supabase (português)
├── tipos/                 # TypeScript types (português)
└── utilitarios/           # Utilities (português)
```

### Conceitos Importantes
- **Workspace Isolation:** Todas as queries devem ter `workspace_id` para multi-usuário
- **Logger System:** Usar `utilitarios/logger.ts` (dev/prod) ao invés de console.log
- **Nomenclatura:** Sempre em português (usar-*, servicos/, utilitarios/)
- **Dashboard Dual:** Sistema separado (admin vs principal)

---

## 🎯 Objetivos por Fase

| Fase | Foco | Score Esperado | Tempo | Prioridade |
|------|------|----------------|-------|------------|
| **Fase 0** | Setup e Validação | 82/100 | 30min | 🔴 Crítica |
| **Fase 1** | Segurança Crítica | 87/100 | 3-4h | 🔴 Crítica |
| **Fase 2** | Qualidade de Código | 89/100 | 5-6h | 🟡 Alta |
| **Fase 3** | Testes e Validação | 91/100 | 6-8h | 🟡 Alta |
| **Fase 4** | Refinamentos Finais | 93/100 | 2-3h | 🟢 Média |

---

## 🚀 FASE 0: Setup e Validação Inicial

**Objetivo:** Garantir ambiente pronto e entender estado atual
**Tempo:** 30 minutos
**Prioridade:** 🔴 Crítica

### Tarefa 0.1: Validar Ambiente
**Tempo:** 5 minutos

```bash
# Verificar Node.js
node --version  # Deve ser 20.19.4

# Verificar dependências
npm install

# Validar TypeScript
npx tsc --noEmit

# Verificar build
npm run build
```

**✅ Critério de Sucesso:**
- Node.js 20.19.4 instalado
- Build sem erros TypeScript
- Build completa em <60s

---

### Tarefa 0.2: Ler Documentação Base
**Tempo:** 15 minutos

**Arquivos Obrigatórios:**
1. `docs/Resumo.md` - Contexto do projeto
2. `docs/RELATORIO-SAUDE-CODIGO.md` - Estado atual
3. `docs/REFATORACAO-AGENTE-LIMPADOR.md` - Padrões estabelecidos

**✅ Critério de Sucesso:**
- Entender estrutura do projeto
- Conhecer score atual (82/100)
- Saber pontos críticos

---

### Tarefa 0.3: Criar Branch de Trabalho
**Tempo:** 5 minutos

```bash
# Criar branch a partir da main
git checkout main
git pull origin main
git checkout -b feature/melhorias-codigo-fase-X

# Onde X = número da fase (1, 2, 3, 4)
```

**✅ Critério de Sucesso:**
- Branch criada
- Main branch atualizada

---

### Tarefa 0.4: Gerar Backup de Segurança
**Tempo:** 5 minutos

```bash
# Backup do código atual
git add .
git commit -m "chore: backup antes de iniciar melhorias fase X"

# Backup do banco de dados
# (Usar sistema interno de backup do app)
```

**✅ Critério de Sucesso:**
- Commit de backup criado
- Backup do banco confirmado

---

## 🔴 FASE 1: Segurança Crítica

**Objetivo:** Corrigir vulnerabilidades de segurança
**Tempo:** 3-4 horas
**Score Esperado:** 87/100 (+5 pontos)
**Prioridade:** 🔴 Crítica

---

### Tarefa 1.1: Remover console.log em Produção
**Tempo:** 2-3 horas
**Impacto:** +3 pontos no score

#### Contexto
Encontrados **117 console.log** em arquivos de produção. Isso causa:
- Vazamento de dados sensíveis em produção
- Performance degradada
- Logs desnecessários no console do usuário

#### Solução
Substituir todos os `console.log` por `logger.ts` que:
- Só loga em desenvolvimento (`NODE_ENV === 'development'`)
- Não vaza dados em produção
- Mantém performance otimizada

#### Passo a Passo

**1.1.1 - Identificar Todos os console.log (10min)**

```bash
# Listar todos os arquivos com console.log
grep -r "console.log" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "logger\|__tests__\|.disabled" \
  > console-log-list.txt

# Ver total
wc -l console-log-list.txt
```

**✅ Critério:** Lista gerada com ~117 ocorrências

**1.1.2 - Substituir em auth-contexto.tsx (30min)**

```bash
# Abrir arquivo
code src/contextos/auth-contexto.tsx
```

**Buscar e substituir:**
```typescript
// ❌ ANTES
console.log('⚠️ AuthProvider timeout')
console.log('📊 Carregando dashboard admin')
console.warn('Erro ao verificar acesso')

// ✅ DEPOIS
import { logger } from '@/utilitarios/logger'

logger.warn('AuthProvider timeout')
logger.log('Carregando dashboard admin')
logger.error('Erro ao verificar acesso')
```

**✅ Critério:** Zero console.log em auth-contexto.tsx

**1.1.3 - Substituir em servicos/supabase/* (1h)**

Arquivos principais:
- `servicos/supabase/dashboard-admin.ts`
- `servicos/supabase/dashboard-queries.ts`
- `servicos/supabase/convites-simples.ts`
- `servicos/supabase/transacoes.ts`

```typescript
// Pattern de substituição
import { logger } from '@/utilitarios/logger'

// console.log(...) → logger.log(...)
// console.error(...) → logger.error(...)
// console.warn(...) → logger.warn(...)
// console.info(...) → logger.info(...)
```

**✅ Critério:** Zero console.log em servicos/supabase/*

**1.1.4 - Substituir em componentes/dashboard/* (30min)**

Arquivos principais:
- `componentes/dashboard/card-cartoes-credito.tsx`
- `componentes/dashboard/grafico-*.tsx`
- Outros componentes dashboard

**✅ Critério:** Zero console.log em componentes/dashboard/*

**1.1.5 - Validar Substituição Completa (10min)**

```bash
# Deve retornar 0 (ou apenas em __tests__)
grep -r "console.log" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "logger\|__tests__\|.disabled" \
  | wc -l

# Validar build
npm run build

# Validar TypeScript
npx tsc --noEmit
```

**✅ Critério:**
- Zero console.log em produção
- Build sem erros
- TypeScript validado

**1.1.6 - Commit da Mudança (5min)**

```bash
git add .
git commit -m "fix(logs): substituir console.log por logger.ts em todo o código

- Removidos 117 console.log de produção
- Implementado logger.ts em todos os arquivos
- Logs agora só aparecem em desenvolvimento
- Melhora segurança e performance

Refs: RELATORIO-SAUDE-CODIGO.md
"
```

---

### Tarefa 1.2: Adicionar workspace_id no Backup
**Tempo:** 30 minutos
**Impacto:** +2 pontos no score

#### Contexto
No arquivo `src/servicos/backup/exportador-dados.ts`, 5 queries não têm `workspace_id` explícito:
- `fp_categorias`
- `fp_subcategorias`
- `fp_contas`
- `fp_formas_pagamento`
- `fp_centros_custo`

Embora o RLS possa proteger no backend, é mais seguro adicionar explicitamente.

#### Passo a Passo

**1.2.1 - Abrir Arquivo Exportador (5min)**

```bash
code src/servicos/backup/exportador-dados.ts
```

**1.2.2 - Localizar Queries Sem workspace_id (5min)**

Buscar por:
```typescript
.from('fp_categorias')
.from('fp_subcategorias')
.from('fp_contas')
.from('fp_formas_pagamento')
.from('fp_centros_custo')
```

**1.2.3 - Adicionar workspace_id em Cada Query (15min)**

```typescript
// ❌ ANTES
const { data: categorias } = await supabase
  .from('fp_categorias')
  .select('*')

// ✅ DEPOIS
const { data: categorias } = await supabase
  .from('fp_categorias')
  .select('*')
  .eq('workspace_id', workspaceId)
```

**Aplicar em todos os 5 casos.**

**✅ Critério:** Todas as 5 queries têm `.eq('workspace_id', workspaceId)`

**1.2.4 - Validar workspace_id Disponível (5min)**

Verificar que a função já recebe `workspaceId`:

```typescript
export async function exportarDados(workspaceId: string) {
  // workspaceId já disponível
}
```

Se não estiver, adicionar como parâmetro.

**✅ Critério:** `workspaceId` disponível na função

**1.2.5 - Testar Exportação (5min - Opcional)**

Se possível, testar:
```bash
# Rodar aplicação
npm run dev

# Testar exportação via interface
# Verificar que dados exportados pertencem ao workspace correto
```

**✅ Critério:** Exportação funciona corretamente

**1.2.6 - Commit da Mudança (5min)**

```bash
git add src/servicos/backup/exportador-dados.ts
git commit -m "fix(backup): adicionar workspace_id explícito em queries de exportação

- Adicionado .eq('workspace_id') em 5 queries
- Queries: categorias, subcategorias, contas, formas_pagamento, centros_custo
- Melhora segurança multi-usuário
- Previne vazamento de dados entre workspaces

Refs: RELATORIO-SAUDE-CODIGO.md - Tarefa 1.2
"
```

---

### Tarefa 1.3: Validar Cobertura workspace_id Geral
**Tempo:** 30 minutos
**Impacto:** Segurança preventiva

#### Passo a Passo

**1.3.1 - Buscar Queries sem workspace_id (10min)**

```bash
# Buscar queries .from('fp_') sem workspace_id
grep -r "\.from('fp_" src/servicos/ --include="*.ts" -A 5 \
  | grep -v "workspace_id" \
  > queries-sem-workspace.txt

# Revisar manualmente
cat queries-sem-workspace.txt
```

**1.3.2 - Validar False Positives (10min)**

Alguns casos podem ser OK:
- Queries em comentários
- Queries que vêm de RLS automático
- Queries de tabelas públicas (se houver)

**1.3.3 - Corrigir Queries Faltantes (10min)**

Se encontrar queries sem `workspace_id`, adicionar:

```typescript
.from('fp_tabela')
.select('*')
.eq('workspace_id', workspaceId)  // ← Adicionar
```

**✅ Critério:** Todas as queries críticas têm workspace_id

**1.3.4 - Commit Final da Fase 1 (5min)**

```bash
git add .
git commit -m "fix(security): validação completa de workspace_id em queries

- Verificadas todas as queries em src/servicos/
- Adicionado workspace_id onde faltava
- 100% de cobertura de isolamento multi-usuário

Fase 1 Completa - Score esperado: 87/100
"
```

---

## 🟡 FASE 2: Qualidade de Código

**Objetivo:** Reduzir duplicação e melhorar manutenibilidade
**Tempo:** 5-6 horas
**Score Esperado:** 89/100 (+2 pontos)
**Prioridade:** 🟡 Alta

---

### Tarefa 2.1: Consolidar Funções de Formatação
**Tempo:** 2 horas
**Impacto:** +1 ponto no score

#### Contexto
Encontradas **10+ funções** de formatação duplicadas:
- `formatarValor()` - em múltiplos componentes
- `formatarData()` - em múltiplos componentes
- `formatarTipoConta()` - em secao-preview.tsx
- `formatarCor()` - em campos-essenciais-genericos.tsx
- E outras...

Devem ser centralizadas em `utilitarios/formatacao.ts`

#### Passo a Passo

**2.1.1 - Criar/Expandir utilitarios/formatacao.ts (30min)**

```bash
# Verificar se já existe
ls -la src/utilitarios/formatacao.ts

# Se não existir, criar
touch src/utilitarios/formatacao.ts
```

**Adicionar funções centralizadas:**

```typescript
// src/utilitarios/formatacao.ts

/**
 * Formata valor monetário para display
 */
export function formatarValor(valor: number | string): string {
  const num = typeof valor === 'string' ? parseFloat(valor) : valor
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num)
}

/**
 * Formata nome de tabela para display
 */
export function formatarNomeTabela(nome: string): string {
  return nome
    .replace('fp_', '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Formata tamanho de arquivo para display
 */
export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Formata cor para padrão hex
 */
export function formatarCor(cor: string | undefined): string {
  if (!cor) return '#6B7280' // gray-500 padrão
  return cor.startsWith('#') ? cor : `#${cor}`
}

/**
 * Formata tipo de conta para display
 */
export function formatarTipoConta(tipo: string): string {
  const tipos: Record<string, string> = {
    'conta_corrente': 'Conta Corrente',
    'poupanca': 'Poupança',
    'investimento': 'Investimento',
    'cartao_credito': 'Cartão de Crédito'
  }
  return tipos[tipo] || tipo
}

/**
 * Formata tipo de categoria para display
 */
export function formatarTipoCategoria(tipo: string): string {
  const tipos: Record<string, string> = {
    'receita': 'Receita',
    'despesa': 'Despesa',
    'transferencia': 'Transferência'
  }
  return tipos[tipo] || tipo
}

/**
 * Formata tipo de forma de pagamento para display
 */
export function formatarTipoFormaPagamento(tipo: string): string {
  const tipos: Record<string, string> = {
    'dinheiro': 'Dinheiro',
    'debito': 'Débito',
    'credito': 'Crédito',
    'pix': 'PIX',
    'ted': 'TED',
    'doc': 'DOC'
  }
  return tipos[tipo] || tipo
}

/**
 * Formata tempo em milissegundos para string legível
 */
export function formatarTempo(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}
```

**✅ Critério:** Arquivo formatacao.ts criado com 8+ funções

**2.1.2 - Substituir em componentes/backup/* (20min)**

**Arquivos:**
- `componentes/backup/preview-importacao.tsx`
- `componentes/backup/uploader-arquivo.tsx`

```typescript
// ❌ ANTES (em cada arquivo)
const formatarValor = (valor: any): string => { ... }
const formatarNomeTabela = (nome: string): string => { ... }

// ✅ DEPOIS
import {
  formatarValor,
  formatarNomeTabela,
  formatarTamanhoArquivo
} from '@/utilitarios/formatacao'

// Usar diretamente
formatarValor(100)
```

**✅ Critério:** Funções locais removidas, imports adicionados

**2.1.3 - Substituir em componentes/comum/* (20min)**

**Arquivos:**
- `componentes/comum/campos-essenciais-genericos.tsx`
- `componentes/comum/secao-preview.tsx`

```typescript
// ❌ ANTES
const formatarCor = (cor: string | undefined): string => { ... }
const formatarTipoConta = (tipo: string): string => { ... }

// ✅ DEPOIS
import {
  formatarCor,
  formatarTipoConta,
  formatarTipoCategoria,
  formatarTipoFormaPagamento
} from '@/utilitarios/formatacao'
```

**✅ Critério:** Funções locais removidas, imports adicionados

**2.1.4 - Substituir em componentes/dashboard/* (20min)**

**Arquivo:**
- `componentes/dashboard/card-cartoes-credito.tsx`

```typescript
// ❌ ANTES
const formatarValor = (valor: number): string => { ... }
const formatarData = (data: string): string => { ... }

// ✅ DEPOIS
import { formatarValor } from '@/utilitarios/formatacao'
import { formatarData } from '@/utilitarios/formatacao-data' // Já existe!
```

**✅ Critério:** Funções locais removidas, imports adicionados

**2.1.5 - Substituir em app/auth/* (15min)**

**Arquivo:**
- `app/auth/login-seguro/page.tsx`

```typescript
// ❌ ANTES
const formatTime = (ms: number) => { ... }

// ✅ DEPOIS
import { formatarTempo } from '@/utilitarios/formatacao'
```

**✅ Critério:** Função local removida, import adicionado

**2.1.6 - Validar e Testar (15min)**

```bash
# Validar TypeScript
npx tsc --noEmit

# Rodar build
npm run build

# Testar navegando na interface
npm run dev
# Testar: backup, preview, dashboard, login
```

**✅ Critério:**
- Build sem erros
- Interface funcionando corretamente
- Formatação consistente

**2.1.7 - Commit da Mudança (5min)**

```bash
git add .
git commit -m "refactor(formatacao): consolidar funções de formatação em utilitarios/

- Criado/expandido utilitarios/formatacao.ts com 8+ funções
- Removidas 10+ funções duplicadas de componentes
- Aplicado em: backup/, comum/, dashboard/, auth/
- Redução de duplicação de ~15% para ~8%
- Melhora manutenibilidade

Refs: RELATORIO-SAUDE-CODIGO.md - Tarefa 2.1
"
```

---

### Tarefa 2.2: Reduzir Uso de "any" em Serviços
**Tempo:** 3 horas
**Impacto:** +1 ponto no score

#### Contexto
Encontradas **55 ocorrências** de `any` em `servicos/`. Meta: <10.

Estratégia:
1. Manter `catch (error: any)` - Aceitável
2. Substituir `any` em parâmetros e retornos por tipos específicos
3. Criar interfaces quando necessário

#### Passo a Passo

**2.2.1 - Identificar Ocorrências de "any" (15min)**

```bash
# Listar todos os "any" em servicos/
grep -rn " any" src/servicos/ --include="*.ts" \
  | grep -v "error: any\|catch.*any" \
  > any-list.txt

# Ver quantidade
wc -l any-list.txt
```

**✅ Critério:** Lista gerada (~30-40 ocorrências)

**2.2.2 - Categorizar por Tipo (15min)**

Revisar `any-list.txt` e categorizar:
- **Categoria A:** Parâmetros de função (`function foo(data: any)`)
- **Categoria B:** Retornos de função (`Promise<any>`)
- **Categoria C:** Variáveis (`const result: any`)
- **Categoria D:** Aceitável (`catch (error: any)`)

**✅ Critério:** Lista categorizada

**2.2.3 - Criar Interfaces para Categoria A (45min)**

Para cada `function foo(data: any)`, criar interface:

```typescript
// ❌ ANTES
export async function processar(data: any) {
  return data.campo
}

// ✅ DEPOIS
interface DadosProcessamento {
  campo: string
  valor: number
  // ... outros campos
}

export async function processar(data: DadosProcessamento) {
  return data.campo
}
```

**Local:** `src/tipos/` - criar arquivo específico se necessário

**✅ Critério:** Categoria A reduzida em 80%

**2.2.4 - Tipar Retornos da Categoria B (45min)**

```typescript
// ❌ ANTES
export async function buscar(): Promise<any> {
  const { data } = await supabase.from('fp_tabela').select()
  return data
}

// ✅ DEPOIS
export async function buscar(): Promise<Tabela[]> {
  const { data } = await supabase.from('fp_tabela').select()
  return data || []
}
```

**✅ Critério:** Categoria B reduzida em 80%

**2.2.5 - Tipar Variáveis da Categoria C (30min)**

```typescript
// ❌ ANTES
const resultado: any = await fetch()

// ✅ DEPOIS
const resultado: ResultadoFetch = await fetch()
```

**✅ Critério:** Categoria C reduzida em 70%

**2.2.6 - Validar Redução (15min)**

```bash
# Contar novamente (excluindo error: any)
grep -rn " any" src/servicos/ --include="*.ts" \
  | grep -v "error: any\|catch.*any" \
  | wc -l

# Meta: <15 ocorrências (redução de 55 para <15)
```

**✅ Critério:** <15 ocorrências de `any` em servicos/

**2.2.7 - Validar TypeScript e Build (15min)**

```bash
# Validar tipos
npx tsc --noEmit

# Build
npm run build
```

**✅ Critério:** Build sem erros de tipo

**2.2.8 - Commit da Mudança (5min)**

```bash
git add .
git commit -m "refactor(types): reduzir uso de 'any' em servicos/

- Reduzido de 55 para <15 ocorrências
- Criadas interfaces TypeScript específicas
- Aplicado em: backup/, supabase/, importacao/
- Melhora type safety
- Previne erros em runtime

Refs: RELATORIO-SAUDE-CODIGO.md - Tarefa 2.2
"
```

---

### Tarefa 2.3: Completar Fase 3 dos Modais
**Tempo:** Opcional (pode ser Fase 4)
**Impacto:** Consistência

#### Contexto
6/11 modais refatorados. Faltam 5 modais simples.

**Recomendação:** Mover para Fase 4 (baixa prioridade) ou fazer separadamente.

Documentação existente: `docs/PROXIMOS-PASSOS-FASE-3.md`

---

## 🧪 FASE 3: Testes e Validação

**Objetivo:** Aumentar cobertura de testes
**Tempo:** 6-8 horas
**Score Esperado:** 91/100 (+2 pontos)
**Prioridade:** 🟡 Alta

---

### Tarefa 3.1: Reativar Testes Desabilitados
**Tempo:** 4-6 horas
**Impacto:** +2 pontos no score

#### Contexto
**4 testes desabilitados** (*.disabled):
1. `auth-contexto.test.tsx.disabled`
2. `convites-simples.test.ts.disabled`
3. `modal-permissoes.test.tsx.disabled`
4. Mais 1 teste

Precisam ser reativados e corrigidos.

#### Passo a Passo

**3.1.1 - Listar Testes Desabilitados (5min)**

```bash
find src/ -name "*.disabled" -type f
```

**✅ Critério:** Lista de 4 arquivos

**3.1.2 - Reativar auth-contexto.test.tsx (1.5-2h)**

```bash
# Renomear arquivo
mv src/contextos/__tests__/auth-contexto.test.tsx.disabled \
   src/contextos/__tests__/auth-contexto.test.tsx
```

**Abrir e corrigir:**

```typescript
// Problemas comuns:
// 1. Imports desatualizados
// 2. Mocks antigos
// 3. API changes

// Verificar imports
import { AuthProvider, useAuth } from '../auth-contexto'
import { createClient } from '@/servicos/supabase/auth-client'

// Atualizar mocks se necessário
jest.mock('@/servicos/supabase/auth-client')
```

**Rodar teste:**
```bash
npm test -- auth-contexto.test.tsx
```

**Corrigir erros até passar.**

**✅ Critério:** Teste passa sem erros

**3.1.3 - Reativar convites-simples.test.ts (1-1.5h)**

```bash
# Renomear
mv src/servicos/supabase/__tests__/convites-simples.test.ts.disabled \
   src/servicos/supabase/__tests__/convites-simples.test.ts
```

**Corrigir conforme necessário:**
- Atualizar imports
- Verificar mocks do Supabase
- Ajustar asserções

```bash
npm test -- convites-simples.test.ts
```

**✅ Critério:** Teste passa sem erros

**3.1.4 - Reativar modal-permissoes.test.tsx (1-1.5h)**

```bash
# Renomear
mv src/componentes/usuarios/__tests__/modal-permissoes.test.tsx.disabled \
   src/componentes/usuarios/__tests__/modal-permissoes.test.tsx
```

**Corrigir:**
- Atualizar Testing Library imports
- Ajustar renderização
- Corrigir interações

```bash
npm test -- modal-permissoes.test.tsx
```

**✅ Critério:** Teste passa sem erros

**3.1.5 - Reativar Teste Restante (1h)**

Repetir processo para o 4º teste desabilitado.

**✅ Critério:** Todos os 4 testes reativados e passando

**3.1.6 - Rodar Todos os Testes (15min)**

```bash
# Rodar suite completa
npm test

# Verificar cobertura
npm run test:coverage
```

**✅ Critério:** Todos os testes passando

**3.1.7 - Commit da Mudança (5min)**

```bash
git add .
git commit -m "test: reativar e corrigir 4 testes desabilitados

- Reativado auth-contexto.test.tsx
- Reativado convites-simples.test.ts
- Reativado modal-permissoes.test.tsx
- Reativado [4º teste]
- Todos os testes passando
- Cobertura aumentada de ~20% para ~35%

Refs: RELATORIO-SAUDE-CODIGO.md - Tarefa 3.1
"
```

---

### Tarefa 3.2: Adicionar Testes para Dashboard Admin
**Tempo:** 2 horas
**Impacto:** Cobertura crítica

#### Contexto
Dashboard Admin é uma feature crítica sem testes.

#### Passo a Passo

**3.2.1 - Criar Arquivo de Teste (10min)**

```bash
touch src/hooks/__tests__/usar-dashboard-admin.test.ts
```

**3.2.2 - Estrutura Básica (20min)**

```typescript
// src/hooks/__tests__/usar-dashboard-admin.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { usarDashboardAdmin } from '../usar-dashboard-admin'
import * as dashboardService from '@/servicos/supabase/dashboard-admin'

jest.mock('@/servicos/supabase/dashboard-admin')

describe('usarDashboardAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve carregar dados do dashboard admin', async () => {
    // Mock dos dados
    const mockDados = {
      kpis: { totalUsuarios: 10, /* ... */ },
      crescimento: [],
      usuariosCompletos: [],
      workspacesCompletos: []
    }

    jest.spyOn(dashboardService, 'buscarDadosDashboardAdmin')
      .mockResolvedValue(mockDados)
    jest.spyOn(dashboardService, 'verificarAcessoSuperAdmin')
      .mockResolvedValue(true)

    // Renderizar hook
    const { result } = renderHook(() => usarDashboardAdmin())

    // Aguardar carregamento
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Asserções
    expect(result.current.dados).toEqual(mockDados)
    expect(result.current.temAcesso).toBe(true)
  })

  it('deve negar acesso quando não é super admin', async () => {
    jest.spyOn(dashboardService, 'verificarAcessoSuperAdmin')
      .mockResolvedValue(false)

    const { result } = renderHook(() => usarDashboardAdmin())

    await waitFor(() => {
      expect(result.current.verificandoAcesso).toBe(false)
    })

    expect(result.current.temAcesso).toBe(false)
  })

  // Adicionar mais testes...
})
```

**3.2.3 - Adicionar Mais Casos de Teste (1h)**

Cobrir:
- ✅ Carregamento com sucesso
- ✅ Erro ao carregar
- ✅ Acesso negado
- ✅ Recarregar dados
- ✅ Alterar status de usuário
- ✅ Deletar usuário

**3.2.4 - Rodar e Validar (15min)**

```bash
npm test -- usar-dashboard-admin.test.ts
```

**✅ Critério:** Testes passando com boa cobertura

**3.2.5 - Commit (5min)**

```bash
git add .
git commit -m "test: adicionar testes para dashboard admin

- Criado usar-dashboard-admin.test.ts
- Cobertura de 6 casos principais
- Mock de servicos/dashboard-admin
- Validação de acesso super admin

Refs: RELATORIO-SAUDE-CODIGO.md - Tarefa 3.2
"
```

---

### Tarefa 3.3: Validação Final dos Testes
**Tempo:** 30 minutos

```bash
# Rodar todos os testes
npm test

# Cobertura completa
npm run test:coverage

# Verificar meta: >40% cobertura
```

**✅ Critério:**
- Todos os testes passando
- Cobertura >40% (meta intermediária)

---

## 🎨 FASE 4: Refinamentos Finais

**Objetivo:** Otimizações e limpeza
**Tempo:** 2-3 horas
**Score Esperado:** 93/100 (+2 pontos)
**Prioridade:** 🟢 Média

---

### Tarefa 4.1: Adicionar React.memo em Componentes Pesados
**Tempo:** 1-2 horas

#### Contexto
Poucos componentes usam otimizações React (8 encontrados).

#### Passo a Passo

**4.1.1 - Identificar Componentes para Otimizar (15min)**

Candidatos principais:
- Listas de transações
- Cards de dashboard
- Tabelas grandes
- Modais complexos

**4.1.2 - Aplicar React.memo (1h)**

```typescript
// ❌ ANTES
export function CardTransacao({ transacao }: Props) {
  return <div>...</div>
}

// ✅ DEPOIS
import { memo } from 'react'

export const CardTransacao = memo(function CardTransacao({ transacao }: Props) {
  return <div>...</div>
})
```

**Aplicar em:**
- `componentes/transacoes/*`
- `componentes/dashboard/*`
- `componentes/modais/*` (se complexos)

**4.1.3 - Adicionar useMemo/useCallback (30min)**

```typescript
// Cálculos pesados
const total = useMemo(() => {
  return transacoes.reduce((sum, t) => sum + t.valor, 0)
}, [transacoes])

// Callbacks passados como props
const handleClick = useCallback(() => {
  console.log('clicked')
}, [])
```

**4.1.4 - Validar Performance (15min)**

```bash
npm run dev
# Abrir React DevTools
# Verificar re-renders reduzidos
```

**✅ Critério:** Menos re-renders desnecessários

**4.1.5 - Commit (5min)**

```bash
git add .
git commit -m "perf: adicionar React.memo e otimizações em componentes

- Aplicado React.memo em 10+ componentes
- Adicionado useMemo para cálculos pesados
- Adicionado useCallback para handlers
- Redução de re-renders em ~30%

Refs: RELATORIO-SAUDE-CODIGO.md - Tarefa 4.1
"
```

---

### Tarefa 4.2: Limpar TODOs e Criar Issues
**Tempo:** 1 hora

#### Contexto
17 TODOs/FIXMEs encontrados no código.

#### Passo a Passo

**4.2.1 - Listar Todos os TODOs (10min)**

```bash
grep -r "TODO\|FIXME\|XXX\|HACK" src/ --include="*.ts" --include="*.tsx" \
  -n > todos-list.txt

cat todos-list.txt
```

**4.2.2 - Categorizar (15min)**

Para cada TODO, decidir:
- **A:** Implementar agora (rápido, <30min)
- **B:** Criar issue no GitHub (complexo)
- **C:** Obsoleto (remover)

**4.2.3 - Implementar Categoria A (20min)**

TODOs rápidos, implementar diretamente.

**4.2.4 - Criar Issues para Categoria B (20min)**

Para cada TODO complexo:
```markdown
# Issue Template

**Título:** [TODO] Descrição do TODO

**Descrição:**
Encontrado em: `arquivo.ts:linha`

```typescript
// TODO: Descrição original
```

**Contexto:**
[Explicar contexto]

**Proposta:**
[Como resolver]

**Prioridade:** Baixa/Média/Alta
```

Criar issues no GitHub.

**4.2.5 - Remover/Atualizar TODOs no Código (10min)**

```typescript
// ❌ ANTES
// TODO: Implementar validação

// ✅ DEPOIS (se criou issue)
// Validação planejada - Issue #123

// ✅ DEPOIS (se implementou)
// [código implementado, sem TODO]

// ✅ DEPOIS (se obsoleto)
// [remover linha]
```

**4.2.6 - Commit (5min)**

```bash
git add .
git commit -m "chore: limpar TODOs e criar issues correspondentes

- Implementados 5 TODOs rápidos
- Criadas 8 issues no GitHub para TODOs complexos
- Removidos 4 TODOs obsoletos
- Código mais limpo e dívida técnica documentada

Issues: #123, #124, #125, #126, #127, #128, #129, #130

Refs: RELATORIO-SAUDE-CODIGO.md - Tarefa 4.2
"
```

---

### Tarefa 4.3: Limpezas Diversas
**Tempo:** 30 minutos

**4.3.1 - Remover Pasta src/types/ Vazia (5min)**

```bash
# Verificar se está vazia
ls -la src/types/

# Remover
rm -rf src/types/

git add .
git commit -m "chore: remover pasta src/types/ vazia

- Pasta vazia encontrada em análise
- Usar src/tipos/ (português) para tipos
"
```

**4.3.2 - Limpar Arquivos .disabled (5min)**

Se os testes foram reativados, remover backups:

```bash
find src/ -name "*.disabled" -type f
# Verificar manualmente se pode deletar
# rm arquivo.disabled se for backup desnecessário
```

**4.3.3 - Validar Build Final (15min)**

```bash
# Build completo
npm run build

# Verificar tamanho
npm run build:analyze

# Rodar testes
npm test

# Validar TypeScript
npx tsc --noEmit
```

**✅ Critério:** Tudo passando

**4.3.4 - Commit Final (5min)**

```bash
git add .
git commit -m "chore: limpezas finais e validação completa

- Removida pasta types/ vazia
- Limpeza de arquivos temporários
- Build validado (43s)
- Testes passando (8 ativos)
- TypeScript sem erros

Fase 4 Completa - Score esperado: 93/100
"
```

---

## 🎉 FASE 5: Finalização e Deploy

**Objetivo:** Merge, deploy e documentação
**Tempo:** 1 hora
**Prioridade:** 🔴 Crítica

---

### Tarefa 5.1: Merge e Pull Request
**Tempo:** 30 minutos

**5.1.1 - Atualizar Main Branch (5min)**

```bash
git checkout main
git pull origin main
```

**5.1.2 - Merge Branch de Trabalho (10min)**

```bash
# Voltar para branch de trabalho
git checkout feature/melhorias-codigo-fase-X

# Rebase com main (se necessário)
git rebase main

# Resolver conflitos se houver
```

**5.1.3 - Criar Pull Request (10min)**

```bash
# Push da branch
git push origin feature/melhorias-codigo-fase-X

# Criar PR no GitHub
gh pr create --title "Melhorias de Código - Fases 1-4" --body "$(cat <<'EOF'
## 📊 Resumo

Implementação completa do Plano de Melhorias de Código baseado no Relatório de Saúde.

### ✅ Melhorias Implementadas

**Fase 1 - Segurança Crítica:**
- ✅ Removidos 117 console.log (usando logger.ts)
- ✅ Adicionado workspace_id em queries de backup
- ✅ Validação completa de isolamento multi-usuário

**Fase 2 - Qualidade de Código:**
- ✅ Consolidadas 10+ funções de formatação
- ✅ Reduzido uso de "any" de 55 para <15

**Fase 3 - Testes:**
- ✅ Reativados 4 testes desabilitados
- ✅ Adicionados testes para dashboard admin
- ✅ Cobertura aumentada de 20% para 40%

**Fase 4 - Refinamentos:**
- ✅ Adicionado React.memo em 10+ componentes
- ✅ Limpeza de TODOs (17 → 0)
- ✅ Removida pasta types/ vazia

### 📈 Resultados

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Score Geral** | 82/100 | 93/100 | +11 pontos |
| **Segurança** | 90/100 | 98/100 | +8 pontos |
| **Qualidade** | 70/100 | 85/100 | +15 pontos |
| **Testes** | 60/100 | 85/100 | +25 pontos |
| **console.log** | 117 | 0 | -117 |
| **Duplicação** | ~15% | ~5% | -10% |
| **Uso de "any"** | 55 | <15 | -73% |
| **Cobertura Testes** | 20% | 40% | +100% |

### 🧪 Validações

- ✅ Build sem erros (43s)
- ✅ TypeScript sem erros
- ✅ Todos os testes passando (8 testes)
- ✅ Performance mantida

### 📚 Documentação

Baseado em:
- `docs/RELATORIO-SAUDE-CODIGO.md`
- `docs/PLANO-EXECUCAO-MELHORIAS-CODIGO.md`

### 🔄 Próximos Passos

Após merge:
1. Rodar em produção
2. Monitorar por 48h
3. Executar nova análise com agente limpador

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**5.1.4 - Code Review (5min)**

Se trabalhar em equipe, solicitar review.
Se solo, fazer self-review no GitHub.

**✅ Critério:** PR criado e revisado

---

### Tarefa 5.2: Atualizar Documentação
**Tempo:** 20 minutos

**5.2.1 - Atualizar Resumo.md (10min)**

```bash
code docs/Resumo.md
```

Adicionar seção:

```markdown
## 📋 **ÚLTIMAS ATUALIZAÇÕES (Janeiro 2025)**

### **✅ PROJETO MELHORIAS DE CÓDIGO - CONCLUÍDO**
- **Status**: ✅ Fases 1-4 concluídas (Score: 93/100)
- **Data**: [Data atual]
- **Melhorias**: Segurança, qualidade, testes, performance

**Principais Conquistas:**
- ✅ Zero console.log em produção
- ✅ Workspace isolation 100%
- ✅ Duplicação reduzida de 15% para 5%
- ✅ Cobertura de testes 20% → 40%
- ✅ 10+ componentes otimizados com React.memo
```

**5.2.2 - Criar Documento de Conclusão (10min)**

```bash
touch docs/MELHORIAS-CODIGO-CONCLUIDAS.md
```

Resumir todas as melhorias implementadas.

---

### Tarefa 5.3: Deploy em Produção
**Tempo:** 10 minutos

```bash
# Merge do PR
gh pr merge --squash

# Vercel fará deploy automático
# Monitorar em: https://vercel.com/seu-projeto

# Validar deploy bem-sucedido
# - Build time < 60s
# - Sem erros
# - Testes passando no CI
```

**✅ Critério:** Deploy em produção bem-sucedido

---

## 📊 CHECKLIST DE VALIDAÇÃO FINAL

Use este checklist ao final de cada fase:

### Fase 1 - Segurança ✅
- [ ] Zero console.log em produção
- [ ] workspace_id em todas as queries críticas
- [ ] Build sem erros
- [ ] TypeScript validado
- [ ] Commits criados

### Fase 2 - Qualidade ✅
- [ ] Funções de formatação consolidadas
- [ ] Uso de "any" reduzido para <15
- [ ] Duplicação <8%
- [ ] Build sem erros
- [ ] Commits criados

### Fase 3 - Testes ✅
- [ ] 4 testes reativados
- [ ] Testes de dashboard admin criados
- [ ] Todos os testes passando
- [ ] Cobertura >40%
- [ ] Commits criados

### Fase 4 - Refinamentos ✅
- [ ] React.memo em 10+ componentes
- [ ] TODOs limpos ou documentados
- [ ] Pasta types/ removida
- [ ] Build final validado
- [ ] Commits criados

### Fase 5 - Finalização ✅
- [ ] PR criado
- [ ] Documentação atualizada
- [ ] Deploy em produção
- [ ] Monitoramento ativo

---

## 🆘 TROUBLESHOOTING

### Problema: Build Falha com Erros TypeScript

**Solução:**
```bash
# Limpar cache
rm -rf .next
rm -rf node_modules
npm install

# Validar novamente
npx tsc --noEmit
```

### Problema: Testes Falhando Após Reativação

**Solução:**
1. Verificar mocks atualizados
2. Verificar imports corretos
3. Verificar versões de dependências
4. Rodar teste isolado para debug

```bash
npm test -- arquivo.test.ts --verbose
```

### Problema: console.log Ainda Aparecendo

**Solução:**
```bash
# Buscar novamente
grep -r "console\." src/ --include="*.ts" --include="*.tsx" \
  | grep -v "logger\|__tests__"

# Garantir que logger.ts está importado
```

### Problema: Performance Degradada

**Solução:**
1. Verificar React.memo aplicado corretamente
2. Verificar useMemo/useCallback com dependências corretas
3. Usar React DevTools Profiler
4. Verificar se SWR está configurado (manual-first)

### Problema: Workspace Isolation Quebrado

**Solução:**
```bash
# Validar workspace_id em todas as queries
grep -r "\.from('fp_" src/servicos/ -A 3 | grep -v "workspace_id"

# Adicionar onde faltar
```

---

## 📞 SUPORTE

### Recursos Disponíveis

1. **Documentação do Projeto:**
   - `docs/Resumo.md` - Contexto geral
   - `docs/RELATORIO-SAUDE-CODIGO.md` - Análise completa
   - `docs/REFATORACAO-AGENTE-LIMPADOR.md` - Padrões

2. **Agente Limpador:**
   - `.claude/agents/limpador-code.md` - Validações automáticas

3. **Issues do GitHub:**
   - Criar issue se encontrar problemas não documentados

### Comandos Úteis

```bash
# Validação rápida
npm run build && npx tsc --noEmit && npm test

# Análise de código
grep -r "console.log" src/ | wc -l
grep -r "workspace_id" src/ | wc -l
grep -r " any" src/servicos/ | wc -l

# Limpar ambiente
rm -rf .next node_modules
npm install
```

---

## 🎓 LIÇÕES APRENDIDAS

### Do's ✅
1. Sempre commitar após cada tarefa completa
2. Validar build após cada mudança significativa
3. Testar manualmente features críticas
4. Documentar decisões importantes
5. Usar branches separadas por fase

### Don'ts ❌
1. Não commitar código que não builda
2. Não pular validações de TypeScript
3. Não fazer múltiplas mudanças grandes em um commit
4. Não esquecer de testar em dev antes de commitar
5. Não ignorar warnings de build

---

## 📈 MÉTRICAS DE SUCESSO

Ao final da implementação completa, você deve ter:

| Métrica | Meta | Como Validar |
|---------|------|--------------|
| Score Geral | 91-93/100 | Rodar agente limpador novamente |
| console.log | 0 | `grep -r "console.log" src/ \| wc -l` |
| workspace_id | 100% | `grep -r "workspace_id" src/ \| wc -l` |
| Duplicação | <8% | Análise manual |
| Uso de "any" | <15 | `grep -r " any" src/servicos/ \| wc -l` |
| Cobertura Testes | >40% | `npm run test:coverage` |
| Build Time | <60s | `npm run build` |
| TODOs | 0 | `grep -r "TODO" src/ \| wc -l` |

---

## 🎉 CONCLUSÃO

Este plano fornece um roteiro completo e detalhado para melhorar a saúde do código do projeto de **82/100 para 93/100**.

**Tempo Total Estimado:** 15-20 horas divididas em 4-5 fases.

**Priorize sempre:**
1. 🔴 Segurança (Fase 1)
2. 🟡 Qualidade (Fase 2)
3. 🟡 Testes (Fase 3)
4. 🟢 Refinamentos (Fase 4)

**Boa sorte na implementação!** 🚀

---

**Criado por:** Claude Code
**Baseado em:** Relatório de Saúde do Código
**Versão:** 1.0.0
**Data:** Janeiro 2025
