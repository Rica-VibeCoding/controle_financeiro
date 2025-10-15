# 💰 PLANO DE IMPLEMENTAÇÃO - ROI POR CLIENTE

> **Status:** ✅ FASE 3 CONCLUÍDA (14/10/2025)
> **Implementado por:** Claude (Sonnet 4.5)
> **Concluído:** Gráfico de Evolução + Filtros de Período + Ordenação
> **Próxima fase:** Opcional - Exportação Excel/PDF

## 📋 ÍNDICE
1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Especificação Funcional](#especificação-funcional)
3. [Especificação Técnica](#especificação-técnica)
4. [Fases de Implementação](#fases-de-implementação)
5. [Estrutura de Componentes](#estrutura-de-componentes)
6. [Queries e Banco de Dados](#queries-e-banco-de-dados)
7. [Checklist Completo](#checklist-completo)
8. [Relatório de Implementação](#relatório-de-implementação)

---

## 🎯 VISÃO GERAL DO PROJETO

### Objetivo
Criar um relatório gerencial que mostre a **rentabilidade por cliente**, permitindo análise estratégica de ROI e margem de lucro.

**⚠️ ADAPTAÇÃO IMPORTANTE:** Sistema adaptado para usar **Centros de Custo** como "Clientes/Projetos", pois é assim que o Ricardo utiliza atualmente.

### Localização
- **Rota:** `/relatorios/roi-cliente`
- **Acesso:** Através da tela principal de relatórios

### Público-Alvo
Gestor/empresário que precisa tomar decisões estratégicas sobre:
- Onde investir mais recursos
- Quais clientes são mais lucrativos
- Identificar clientes com prejuízo

---

## 📊 RELATÓRIO DE IMPLEMENTAÇÃO

### ✅ FASE 1 - ESTRUTURA BASE (CONCLUÍDA)

**Data:** 14/10/2025
**Duração:** ~2 horas
**Status:** ✅ Funcionando e validado

#### Arquivos Criados:

**Backend (Supabase):**
- ✅ Migration: `criar_funcao_roi_centros_custo` - Function SQL para calcular ROI
- ✅ Migration: `criar_funcao_kpis_roi` - Function SQL para calcular KPIs dos cards

**TypeScript:**
- ✅ `src/tipos/roi-cliente.ts` - Interfaces TypeScript
- ✅ `src/servicos/supabase/roi-cliente-queries.ts` - Queries e lógica de negócio
- ✅ `src/hooks/usar-roi-clientes.ts` - Hook SWR para busca de dados

**Componentes:**
- ✅ `src/componentes/relatorios/card-relatorio.tsx` - Card de seleção de relatório
- ✅ `src/componentes/relatorios/roi-cliente/cards-kpi.tsx` - 3 Cards KPI superiores
- ✅ `src/componentes/relatorios/roi-cliente/tabela-roi.tsx` - Tabela principal

**Páginas:**
- ✅ `src/app/(protected)/relatorios/page.tsx` - Hub de seleção (3 cards)
- ✅ `src/app/(protected)/relatorios/roi-cliente/page.tsx` - Página do relatório ROI

#### Funcionalidades Implementadas:

1. **Tela de Seleção de Relatórios:**
   - 3 cards visuais (ROI, Fluxo Caixa, Contas)
   - Navegação com hover effects
   - Responsivo mobile/tablet/desktop

2. **Relatório ROI por Cliente:**
   - 3 Cards KPI: Melhor ROI %, Melhor ROI R$, Margem Mensal
   - Tabela com todos clientes/projetos (centros de custo)
   - Cores indicativas: Verde (>30%), Amarelo (10-30%), Vermelho (<10%)
   - Loading states e tratamento de erros
   - Dados acumulados desde primeira transação

#### Validações:
- ✅ TypeScript: `npx tsc --noEmit` - SEM ERROS
- ✅ Padrões do projeto: Seguido componentes existentes
- ✅ Dados reais: Integrado com Supabase
- ✅ Performance: Cache SWR otimizado

#### Observações Técnicas:

1. **Adaptação: Centros de Custo → Clientes**
   - Campo `contato_id` em transações não está sendo usado
   - Sistema usa `centro_custo_id` para vincular transações a projetos/clientes
   - Functions SQL criadas com base em `fp_centros_custo` e `fp_transacoes`

2. **Dados Testados:**
   - ✅ Encontrados 5 centros de custo com transações
   - ✅ Exemplos: "WoodPro+", "Hélio Tristão", "Suelen e Osmar"
   - ✅ Cálculos de receita, despesa, lucro e margem funcionando

3. **Pendências Originais FASE 2:** ✅ CONCLUÍDAS
   - [x] Expansão de linha (ver detalhes de receitas/despesas por categoria) ✅
   - [ ] Gráfico de evolução temporal (movido para FASE 3)
   - [ ] Filtros de período e ordenação (movido para FASE 3)
   - [ ] Exportação Excel/PDF (movido para FASE 3)

---

### ✅ FASE 2 - EXPANSÃO E DETALHES (CONCLUÍDA)

**Data:** 14/10/2025
**Duração:** ~1 hora
**Status:** ✅ Funcionando e validado

#### Arquivos Criados/Modificados:

**Backend (Supabase):**
- ✅ Migration: `buscar_detalhes_roi_centro_custo` - Function para detalhamento por categoria

**TypeScript:**
- ✅ `src/tipos/roi-cliente.ts` - Adicionadas interfaces `ItemDetalhado` e `DetalhesCliente`
- ✅ `src/servicos/supabase/roi-cliente-queries.ts` - Função `buscarDetalhesCliente()`

**Componentes:**
- ✅ `src/componentes/relatorios/roi-cliente/linha-cliente-expandida.tsx` - Novo componente de expansão
- ✅ `src/componentes/relatorios/roi-cliente/tabela-roi.tsx` - Modificado para integrar expansão

**Páginas:**
- ✅ `src/app/(protected)/relatorios/roi-cliente/page.tsx` - Atualizado para passar filtros

#### Funcionalidades Implementadas:

1. **Expansão de Linha na Tabela:**
   - Clique no ícone [>] expande a linha
   - Ícone muda para [v] quando expandido
   - Animação suave de transição

2. **Detalhamento de Receitas:**
   - Tabela interna com categoria, subcategoria, quantidade, valor e %
   - Agrupamento por categoria/subcategoria
   - Cores verde para valores de receita
   - Total de receitas no cabeçalho

3. **Detalhamento de Despesas:**
   - Tabela interna com categoria, subcategoria, quantidade, valor e %
   - Agrupamento por categoria/subcategoria
   - Cores vermelhas para valores de despesa
   - Total de despesas no cabeçalho

4. **Estados de Carregamento:**
   - Loading spinner enquanto busca detalhes
   - Tratamento de erros
   - Mensagem quando não há detalhes

#### Validações:
- ✅ TypeScript: `npx tsc --noEmit` - SEM ERROS
- ✅ Integração com Supabase: Funcionando
- ✅ Performance: Busca sob demanda (só ao expandir)
- ✅ UX: Transições suaves e feedback visual claro

#### Observações Técnicas:

1. **Busca Sob Demanda:**
   - Detalhes são buscados apenas quando usuário expande a linha
   - Evita sobrecarga de dados na listagem inicial
   - Cache via useEffect no componente

2. **Agrupamento por Categoria:**
   - SQL agrupa automaticamente por categoria + subcategoria
   - Calcula percentual de cada item no total
   - Inclui contagem de transações por grupo

3. **Correção de Bug Importante:**
   - ✅ Corrigido: Uso incorreto de `createClient` do `server.ts` (usa `next/headers`)
   - ✅ Solução: Trocado para `createClient` do `auth-client.ts` (usa `createBrowserClient`)
   - ✅ Motivo: Componentes client-side não podem usar `next/headers`
   - ✅ Arquivos corrigidos: `src/servicos/supabase/roi-cliente-queries.ts` (3 funções)

4. **Pendências para FASE 3:**
   - [x] Gráfico de evolução temporal ✅
   - [ ] Filtros de período (mês atual, 3 meses, 6 meses, ano)
   - [ ] Seletor de ordenação
   - [ ] Exportação Excel/PDF

---

### ✅ FASE 3 - GRÁFICO DE EVOLUÇÃO (PARCIALMENTE CONCLUÍDA)

**Data:** 14/10/2025
**Duração:** ~1.5 horas
**Status:** ✅ Gráfico funcionando | ⏳ Filtros pendentes

#### Arquivos Criados/Modificados:

**Backend (Supabase):**
- ✅ Migration: `buscar_evolucao_roi_centro_custo` - Function para evolução mensal

**TypeScript:**
- ✅ `src/tipos/roi-cliente.ts` - Adicionada interface `EvolucaoMensal`
- ✅ `src/servicos/supabase/roi-cliente-queries.ts` - Função `buscarEvolucaoCliente()`

**Componentes:**
- ✅ `src/componentes/relatorios/roi-cliente/grafico-evolucao.tsx` - Novo componente com Recharts
- ✅ `src/componentes/relatorios/roi-cliente/linha-cliente-expandida.tsx` - Integrado botão "Ver Evolução"
- ✅ `src/componentes/relatorios/roi-cliente/tabela-roi.tsx` - Atualizado para passar nome do cliente

#### Funcionalidades Implementadas:

1. **Gráfico de Evolução Temporal:**
   - Gráfico de linha (LineChart) com Recharts
   - 2 linhas: Receita (verde) e Despesa (vermelho)
   - Eixo X: Meses no formato "Mon/YYYY"
   - Eixo Y: Valores formatados em R$
   - Tooltip customizado com valores em moeda
   - Legend para identificar linhas
   - Gradientes sutis para melhor visualização

2. **Integração na Linha Expandida:**
   - Botão "Ver Evolução no Tempo" com ícone de tendência
   - Loading state durante busca de dados
   - Toggle para mostrar/ocultar gráfico
   - Busca sob demanda (só carrega ao clicar)
   - Cache de dados (não recarrega se já foi buscado)

3. **Function SQL:**
   - Agrupa transações por mês
   - Calcula receita, despesa, lucro e margem mensal
   - Retorna série temporal ordenada
   - Respeita filtros de período

#### Validações:
- ✅ TypeScript: `npx tsc --noEmit` - SEM ERROS
- ✅ Padrão Recharts do dashboard seguido
- ✅ Function SQL testada com dados reais
- ✅ UX consistente com o resto do sistema

#### Observações Técnicas:

1. **Padrão Recharts:**
   - Seguiu exatamente o estilo de `grafico-tendencia.tsx`
   - Mesmas cores: #10b981 (receita) e #ef4444 (despesa)
   - Mesmo tooltip customizado
   - Mesma responsividade

2. **Performance:**
   - Dados carregados apenas ao expandir gráfico
   - Cache local no componente (não refaz request)
   - Function SQL otimizada com CTEs

3. **Dados Testados:**
   - ✅ WoodPro+: 12 meses de evolução (Set/2024 a Ago/2025)
   - ✅ Valores corretos de receita/despesa por mês
   - ✅ Formato de data adequado para exibição

4. **Pendências para Continuação FASE 3:**
   - [x] Componente de filtros (período + ordenação) ✅
   - [x] Integrar filtros na página principal ✅
   - [x] Aplicar filtros na busca de dados ✅
   - [ ] (Opcional) Exportação Excel/PDF

---

### ✅ FASE 3 - FILTROS E ORDENAÇÃO (CONCLUÍDA)

**Data:** 14/10/2025
**Duração:** ~30 minutos
**Status:** ✅ Totalmente funcional

#### Arquivos Criados/Modificados:

**Componentes:**
- ✅ `src/componentes/relatorios/roi-cliente/filtros-roi.tsx` - Novo componente de filtros

**Páginas:**
- ✅ `src/app/(protected)/relatorios/roi-cliente/page.tsx` - Integrado filtros com estado

#### Funcionalidades Implementadas:

1. **Componente de Filtros:**
   - 2 dropdowns lado a lado (responsivo)
   - Filtro de período: Todo período, Mês atual, 3/6/12 meses
   - Filtro de ordenação: Margem %, Lucro R$, Receita, Nome A-Z
   - Ícones descritivos (Calendar, ArrowUpDown)
   - Estilo consistente com o sistema

2. **Integração com Estado:**
   - Estado local com `useState` na página
   - Callback `onFiltrosChange` para atualizar filtros
   - Reativa automaticamente quando filtros mudam
   - SWR refaz queries automaticamente

3. **Períodos Disponíveis:**
   - Todo período (padrão - desde primeira transação)
   - Mês atual (primeiro ao último dia do mês)
   - Últimos 3 meses
   - Últimos 6 meses
   - Último ano

4. **Ordenações Disponíveis:**
   - Maior Margem % (padrão)
   - Menor Margem %
   - Maior Lucro R$
   - Menor Lucro R$
   - Maior Receita
   - Nome A-Z

#### Validações:
- ✅ TypeScript: `npx tsc --noEmit` - SEM ERROS
- ✅ Filtros aplicam automaticamente via SWR
- ✅ UI responsiva (mobile/tablet/desktop)
- ✅ Lógica de datas já implementada nas queries

#### Observações Técnicas:

1. **Reatividade Automática:**
   - SWR detecta mudança no objeto `filtros`
   - Refaz request automaticamente
   - Mantém cache de requisições anteriores
   - Loading state gerenciado pelo hook

2. **Cálculo de Datas:**
   - Lógica já existia em `roi-cliente-queries.ts`
   - Switch case para cada tipo de período
   - Calcula primeiro e último dia automaticamente

3. **UX:**
   - Posicionado entre KPIs e tabela
   - Grid responsivo (1 col mobile, 2 cols desktop)
   - Labels descritivos com ícones
   - Foco visual (ring blue ao selecionar)

---

## 🚀 GUIA RÁPIDO PARA NOVO CHAT (FASE 3)

**IMPORTANTE:** Use este resumo para contexto rápido ao iniciar novo chat.

### O que está PRONTO:
✅ Tela principal `/relatorios` com 3 cards de seleção
✅ Relatório ROI completo em `/relatorios/roi-cliente`:
  - 3 Cards KPI (Melhor ROI %, Melhor ROI R$, Margem Mensal)
  - **Filtros de período e ordenação** ⭐ NOVO
  - Tabela de clientes com receita, despesa, lucro e margem
  - Expansão de linha mostrando detalhes por categoria
  - **Gráfico de evolução temporal (mês a mês)** ⭐
  - Cores indicativas (verde/amarelo/vermelho)
  - Loading states e tratamento de erros

### Estrutura de Arquivos Criados:
```
Backend (Supabase):
- Migration: criar_funcao_roi_centros_custo
- Migration: criar_funcao_kpis_roi
- Migration: buscar_detalhes_roi_centro_custo
- Migration: buscar_evolucao_roi_centro_custo

Frontend:
- src/tipos/roi-cliente.ts (+ EvolucaoMensal)
- src/servicos/supabase/roi-cliente-queries.ts (usa auth-client.ts!)
- src/hooks/usar-roi-clientes.ts
- src/componentes/relatorios/card-relatorio.tsx
- src/componentes/relatorios/roi-cliente/cards-kpi.tsx
- src/componentes/relatorios/roi-cliente/filtros-roi.tsx ⭐ NOVO
- src/componentes/relatorios/roi-cliente/tabela-roi.tsx
- src/componentes/relatorios/roi-cliente/linha-cliente-expandida.tsx
- src/componentes/relatorios/roi-cliente/grafico-evolucao.tsx
- src/app/(protected)/relatorios/page.tsx
- src/app/(protected)/relatorios/roi-cliente/page.tsx
```

### Decisões Técnicas Importantes:
1. **Usa Centros de Custo como "Clientes"** (campo `centro_custo_id` em transações)
2. **Queries usam `auth-client.ts`** (NÃO `server.ts`) - componentes client-side
3. **Busca sob demanda** - detalhes só carregam ao expandir linha
4. **SWR para cache** - configuração 'otimizada'

### O que fazer na FASE 4 (opcional):
- [x] Implementar gráfico de evolução temporal (mês a mês) ✅ CONCLUÍDO
- [x] Adicionar filtros de período no topo da tela ✅ CONCLUÍDO
- [x] Implementar seletor de ordenação ✅ CONCLUÍDO
- [ ] Exportação Excel/PDF (opcional para futuro)

### Comandos Importantes:
```bash
npx tsc --noEmit  # Validar TypeScript
npm run build     # Testar build completo
```

---

## 📊 ESPECIFICAÇÃO FUNCIONAL

### 1. Cards Superiores (KPIs)

#### Card 1: Melhor ROI em Percentual
```
┌─────────────────────────┐
│ 🏆 MELHOR ROI %         │
│                         │
│ João Silva              │
│ 45%                     │
│                         │
│ (nome + percentual)     │
└─────────────────────────┘
```
**Cálculo:** Cliente com maior `(Lucro / Receita) × 100`

#### Card 2: Melhor ROI em Valor Real
```
┌─────────────────────────┐
│ 💰 MELHOR ROI R$        │
│                         │
│ Maria Santos            │
│ R$ 35.000               │
│                         │
│ (nome + valor lucro)    │
└─────────────────────────┘
```
**Cálculo:** Cliente com maior `Receita - Despesa` em valor absoluto

#### Card 3: Margem e Lucro do Mês Atual
```
┌─────────────────────────┐
│ 💵 MARGEM MENSAL        │
│                         │
│ Margem: 32%             │
│ Lucro: R$ 85.400        │
│                         │
│ (média % + total R$)    │
└─────────────────────────┘
```
**Cálculo:**
- Margem = `(Σ Lucros / Σ Receitas) × 100` do mês atual
- Lucro = `Σ (Receita - Despesa)` do mês atual

---

### 2. Tabela Principal

#### Visão Compacta (padrão)
```
┌────────────────────────────────────────────────────────────────┐
│ Cliente ▼     │ Receita     │ Despesa     │ Lucro      │ Margem│
├────────────────────────────────────────────────────────────────┤
│ [+] João      │ R$ 120.000  │ R$ 66.000   │ R$ 54.000  │ 45% 🟢│
│ [+] Maria     │ R$ 85.000   │ R$ 50.000   │ R$ 35.000  │ 41% 🟢│
│ [+] Pedro     │ R$ 45.000   │ R$ 40.000   │ R$ 5.000   │ 11% 🟡│
│ [+] Ana       │ R$ 30.000   │ R$ 35.000   │ -R$ 5.000  │ -17%🔴│
└────────────────────────────────────────────────────────────────┘
```

**Regras:**
- Mostrar **apenas clientes com pelo menos 1 movimentação** (receita OU despesa)
- Dados **acumulados** (desde o primeiro lançamento)
- Ordenação padrão: **Maior Margem %** (decrescente)

**Cores de Indicação:**
- 🟢 Verde: Margem ≥ 30% (Cliente muito lucrativo)
- 🟡 Amarelo: Margem 10-29% (Cliente ok)
- 🔴 Vermelho: Margem < 10% ou negativa (Atenção/Prejuízo)

---

#### Visão Expandida (ao clicar [+])
```
┌────────────────────────────────────────────────────────────────┐
│ [-] João Silva │ R$ 120.000  │ R$ 66.000   │ R$ 54.000  │ 45% 🟢│
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 📈 RECEITAS (R$ 120.000)                                 │ │
│  │                                                           │ │
│  │  • Consultoria - R$ 70.000 (58%)                         │ │
│  │  • Projeto A   - R$ 30.000 (25%)                         │ │
│  │  • Serviços    - R$ 20.000 (17%)                         │ │
│  │                                                           │ │
│  │ 📉 DESPESAS (R$ 66.000)                                  │ │
│  │                                                           │ │
│  │  • Material    - R$ 40.000 (61%)                         │ │
│  │  • Mão de obra - R$ 20.000 (30%)                         │ │
│  │  • Transporte  - R$ 6.000  (9%)                          │ │
│  │                                                           │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │          📊 Ver Evolução no Tempo                   │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Detalhamento:**
- **Receitas:** Agrupadas por categoria/subcategoria
- **Despesas:** Agrupadas por categoria/subcategoria
- **Percentuais:** Mostrar participação de cada item no total
- **Botão:** "Ver Evolução no Tempo" → abre modal com gráfico

---

### 3. Gráfico de Evolução Temporal

**Quando exibir:** Ao clicar em "Ver Evolução no Tempo" na linha expandida

**Formato:** Modal ou seção expandida

**Conteúdo:**
```
┌────────────────────────────────────────────────────────────────┐
│  📊 Evolução - João Silva                          [X Fechar]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   R$                                                           │
│   ↑                                                            │
│ 40k│           ●───────●───────●  [Receita]                   │
│    │          ╱                  ╲                             │
│ 30k│         ●                    ●                            │
│    │        ╱                      ╲                           │
│ 20k│       ●───────●───────●───────●  [Despesa]               │
│    │      ╱                                                    │
│ 10k│     ●                                                     │
│    │                                                           │
│  0 └──────────────────────────────────────────────────→ Tempo │
│      Jan   Fev   Mar   Abr   Mai   Jun                        │
│                                                                │
│  • Linha Verde: Receita mensal                                │
│  • Linha Vermelha: Despesa mensal                             │
│  • Área sombreada: Lucro (diferença entre linhas)            │
└────────────────────────────────────────────────────────────────┘
```

**Dados:**
- Mostrar evolução **mês a mês** desde o primeiro lançamento
- 2 linhas: Receita (verde) e Despesa (vermelho)
- Tooltip ao hover: valores exatos de cada mês

---

### 4. Filtros e Controles

```
┌────────────────────────────────────────────────────────────────┐
│ [Período: Todo período ▼]  [Ordenar: Maior Margem % ▼]  [📥]  │
└────────────────────────────────────────────────────────────────┘
```

**Filtros disponíveis:**

1. **Período**
   - Todo período (padrão)
   - Mês atual
   - Últimos 3 meses
   - Últimos 6 meses
   - Último ano
   - Personalizado (data início/fim)

2. **Ordenação**
   - Maior Margem % (padrão)
   - Menor Margem %
   - Maior Lucro R$
   - Menor Lucro R$
   - Maior Receita
   - Nome A-Z

3. **Exportação**
   - Botão 📥 para exportar relatório em Excel/PDF

---

## 🔧 ESPECIFICAÇÃO TÉCNICA

### Stack Tecnológica

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Banco de Dados:** Supabase (PostgreSQL)
- **Gráficos:** Recharts
- **Estilização:** Tailwind CSS + Shadcn UI
- **State Management:** React hooks (useState, useMemo)
- **Data Fetching:** SWR

---

### Estrutura de Dados

#### Tabelas Envolvidas

```sql
-- Tabela principal
transacoes (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  tipo TEXT NOT NULL,              -- 'receita' | 'despesa'
  valor NUMERIC(15,2) NOT NULL,
  data DATE NOT NULL,
  categoria_id UUID,
  subcategoria_id UUID,
  cliente_id UUID,                 -- ⭐ Campo chave
  descricao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Tabela de clientes
clientes (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Tabelas auxiliares
categorias (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL              -- 'receita' | 'despesa'
)

subcategorias (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  categoria_id UUID NOT NULL,
  nome TEXT NOT NULL
)
```

---

### Tipos TypeScript

```typescript
// src/tipos/roi-cliente.ts

export interface ClienteROI {
  id: string
  nome: string
  receita: number
  despesa: number
  lucro: number
  margem: number
  receitasDetalhadas: ItemDetalhado[]
  despesasDetalhadas: ItemDetalhado[]
  evolucaoMensal: EvolucaoMensal[]
}

export interface ItemDetalhado {
  categoria: string
  subcategoria: string | null
  valor: number
  percentual: number
}

export interface EvolucaoMensal {
  mes: string          // 'Jan/2025'
  receita: number
  despesa: number
  lucro: number
}

export interface CardKPI {
  melhorRoiPercentual: {
    cliente: string
    valor: number
  }
  melhorRoiValor: {
    cliente: string
    valor: number
  }
  margemMensal: {
    percentual: number
    lucroTotal: number
  }
}

export interface FiltrosROI {
  periodo: 'todo' | 'mes_atual' | '3_meses' | '6_meses' | '1_ano' | 'personalizado'
  ordenacao: 'margem_desc' | 'margem_asc' | 'lucro_desc' | 'lucro_asc' | 'receita_desc' | 'nome_asc'
  dataInicio?: string
  dataFim?: string
}
```

---

### Query Principal (Supabase)

```typescript
// src/servicos/supabase/roi-cliente-queries.ts

export async function buscarDadosROIClientes(
  workspaceId: string,
  filtros: FiltrosROI
): Promise<ClienteROI[]> {
  const { data, error } = await supabase.rpc('calcular_roi_clientes', {
    p_workspace_id: workspaceId,
    p_data_inicio: filtros.dataInicio,
    p_data_fim: filtros.dataFim
  })

  if (error) throw error
  return data
}

export async function buscarKPIs(
  workspaceId: string
): Promise<CardKPI> {
  // Buscar mês atual
  const mesAtual = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  const { data, error } = await supabase.rpc('calcular_kpis_roi', {
    p_workspace_id: workspaceId,
    p_mes: mesAtual
  })

  if (error) throw error
  return data
}
```

---

### Function SQL (Supabase)

```sql
-- Criar função para calcular ROI por cliente
CREATE OR REPLACE FUNCTION calcular_roi_clientes(
  p_workspace_id UUID,
  p_data_inicio DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL
)
RETURNS TABLE (
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
    c.id AS cliente_id,
    c.nome AS cliente_nome,
    COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END), 0) AS receita,
    COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END), 0) AS despesa,
    COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END), 0) AS lucro,
    CASE
      WHEN SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) > 0 THEN
        ((SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) -
          SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END)) /
         SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END)) * 100
      ELSE 0
    END AS margem
  FROM clientes c
  LEFT JOIN transacoes t ON t.cliente_id = c.id
    AND t.workspace_id = p_workspace_id
    AND (p_data_inicio IS NULL OR t.data >= p_data_inicio)
    AND (p_data_fim IS NULL OR t.data <= p_data_fim)
  WHERE c.workspace_id = p_workspace_id
    AND c.ativo = true
  GROUP BY c.id, c.nome
  HAVING COUNT(t.id) > 0  -- Apenas clientes com movimentação
  ORDER BY margem DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📅 FASES DE IMPLEMENTAÇÃO

### 🚀 FASE 1 - ESTRUTURA BASE (Essencial)

**Objetivo:** Criar a estrutura básica funcional do relatório.

**Duração estimada:** 4-6 horas

#### Tarefas:

1. **Criar estrutura de arquivos**
   - [ ] `/app/(protected)/relatorios/roi-cliente/page.tsx`
   - [ ] `/componentes/relatorios/roi-cliente/cards-kpi.tsx`
   - [ ] `/componentes/relatorios/roi-cliente/tabela-roi.tsx`
   - [ ] `/componentes/relatorios/roi-cliente/linha-cliente.tsx`
   - [ ] `/servicos/supabase/roi-cliente-queries.ts`
   - [ ] `/tipos/roi-cliente.ts`

2. **Criar function SQL no Supabase**
   - [ ] Criar migration: `calcular_roi_clientes`
   - [ ] Criar migration: `calcular_kpis_roi`
   - [ ] Testar functions diretamente no SQL Editor

3. **Implementar busca de dados**
   - [ ] Criar query em `roi-cliente-queries.ts`
   - [ ] Criar hook `usar-roi-clientes.ts`
   - [ ] Testar retorno de dados no console

4. **Criar componentes básicos**
   - [ ] Componente `CardsKPI` (3 cards superiores)
   - [ ] Componente `TabelaROI` (tabela compacta)
   - [ ] Componente `LinhaCliente` (linha da tabela)

5. **Implementar página principal**
   - [ ] Layout da página
   - [ ] Integração com hooks
   - [ ] Loading states
   - [ ] Error handling

**Critério de sucesso:** Tabela básica funcionando com dados reais.

---

### 🎨 FASE 2 - EXPANSÃO E DETALHES

**Objetivo:** Adicionar funcionalidade de expansão com detalhes.

**Duração estimada:** 3-4 horas

#### Tarefas:

1. **Implementar estado de expansão**
   - [ ] Estado `expandido` na `LinhaCliente`
   - [ ] Ícone [+] / [-] com transição
   - [ ] Animação de abertura/fechamento

2. **Buscar dados detalhados**
   - [ ] Query para receitas por categoria
   - [ ] Query para despesas por categoria
   - [ ] Calcular percentuais de cada item

3. **Criar componente de detalhamento**
   - [ ] Seção de receitas agrupadas
   - [ ] Seção de despesas agrupadas
   - [ ] Formatação de valores e percentuais

4. **Estilização e UX**
   - [ ] Cores indicativas (verde/amarelo/vermelho)
   - [ ] Hover effects
   - [ ] Transições suaves

**Critério de sucesso:** Clicar em [+] mostra detalhes corretos.

---

### 📈 FASE 3 - GRÁFICO DE EVOLUÇÃO

**Objetivo:** Adicionar gráfico de evolução temporal.

**Duração estimada:** 3-4 horas

#### Tarefas:

1. **Criar query de evolução mensal**
   - [ ] SQL function para agrupar por mês
   - [ ] Query em TypeScript
   - [ ] Formatar dados para Recharts

2. **Criar componente de gráfico**
   - [ ] Instalar Recharts: `npm install recharts`
   - [ ] Componente `GraficoEvolucao.tsx`
   - [ ] Configurar LineChart com 2 linhas
   - [ ] Adicionar tooltip customizado

3. **Criar modal/seção expansível**
   - [ ] Componente `ModalEvolucao.tsx`
   - [ ] Botão "Ver Evolução" na linha expandida
   - [ ] Abrir/fechar modal
   - [ ] Passar dados do cliente

4. **Estilização do gráfico**
   - [ ] Cores: verde (receita), vermelho (despesa)
   - [ ] Área sombreada (lucro)
   - [ ] Responsividade

**Critério de sucesso:** Gráfico mostra evolução correta mês a mês.

---

### 🎛️ FASE 4 - FILTROS E ORDENAÇÃO

**Objetivo:** Adicionar controles de filtro e ordenação.

**Duração estimada:** 2-3 horas

#### Tarefas:

1. **Criar componente de filtros**
   - [ ] Componente `FiltrosROI.tsx`
   - [ ] Dropdown de período
   - [ ] Dropdown de ordenação
   - [ ] State management

2. **Implementar lógica de filtro**
   - [ ] Filtrar por período
   - [ ] Ordenar resultados
   - [ ] Invalidar cache (SWR)

3. **Integrar com queries**
   - [ ] Passar parâmetros para function SQL
   - [ ] Atualizar hook `usar-roi-clientes`

4. **UX dos filtros**
   - [ ] Loading ao trocar filtro
   - [ ] Manter estado na URL (query params)
   - [ ] Reset de filtros

**Critério de sucesso:** Filtros funcionam corretamente.

---

### 📥 FASE 5 - EXPORTAÇÃO (Opcional)

**Objetivo:** Permitir exportação de dados.

**Duração estimada:** 2-3 horas

#### Tarefas:

1. **Exportação Excel**
   - [ ] Instalar: `npm install xlsx`
   - [ ] Função para gerar planilha
   - [ ] Botão de exportação

2. **Exportação PDF** (opcional)
   - [ ] Instalar: `npm install jspdf jspdf-autotable`
   - [ ] Função para gerar PDF
   - [ ] Formatação profissional

**Critério de sucesso:** Download funciona corretamente.

---

### ✅ FASE 6 - TESTES E VALIDAÇÃO

**Objetivo:** Garantir qualidade e performance.

**Duração estimada:** 2-3 horas

#### Tarefas:

1. **Testes manuais**
   - [ ] Testar com 0 clientes
   - [ ] Testar com 1 cliente
   - [ ] Testar com 100+ clientes
   - [ ] Testar todos os filtros
   - [ ] Testar responsividade

2. **Performance**
   - [ ] Verificar tempo de carregamento
   - [ ] Otimizar queries se necessário
   - [ ] Adicionar paginação se > 50 clientes

3. **Validação com usuário**
   - [ ] Demonstrar para Ricardo
   - [ ] Coletar feedback
   - [ ] Ajustes finais

**Critério de sucesso:** Aprovação do Ricardo ✅

---

## 🏗️ ESTRUTURA DE COMPONENTES

### Hierarquia de Componentes

```
ROIClientePage
├── CardsKPI
│   ├── CardMelhorRoiPercentual
│   ├── CardMelhorRoiValor
│   └── CardMargemMensal
├── FiltrosROI
│   ├── SeletorPeriodo
│   └── SeletorOrdenacao
└── TabelaROI
    └── LinhaCliente (múltiplas)
        ├── DadosBasicos
        └── SecaoExpandida (condicional)
            ├── ReceitasDetalhadas
            ├── DespesasDetalhadas
            └── BotaoVerEvolucao
                └── ModalEvolucao
                    └── GraficoEvolucao
```

---

### Exemplo de Componente: LinhaCliente

```typescript
// src/componentes/relatorios/roi-cliente/linha-cliente.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ClienteROI } from '@/tipos/roi-cliente'
import { formatarMoeda } from '@/utilitarios/formatacao'

interface LinhaClienteProps {
  cliente: ClienteROI
}

export function LinhaCliente({ cliente }: LinhaClienteProps) {
  const [expandido, setExpandido] = useState(false)

  const corMargem =
    cliente.margem >= 30 ? 'text-green-600' :
    cliente.margem >= 10 ? 'text-yellow-600' :
    'text-red-600'

  const icone =
    cliente.margem >= 30 ? '🟢' :
    cliente.margem >= 10 ? '🟡' :
    '🔴'

  return (
    <>
      {/* Linha Principal */}
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpandido(!expandido)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expandido ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium">{cliente.nome}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-right">{formatarMoeda(cliente.receita)}</td>
        <td className="px-4 py-3 text-right">{formatarMoeda(cliente.despesa)}</td>
        <td className="px-4 py-3 text-right font-semibold">
          {formatarMoeda(cliente.lucro)}
        </td>
        <td className={`px-4 py-3 text-right font-bold ${corMargem}`}>
          {cliente.margem.toFixed(1)}% {icone}
        </td>
      </tr>

      {/* Linha Expandida */}
      {expandido && (
        <tr>
          <td colSpan={5} className="px-4 py-4 bg-gray-50">
            <SecaoExpandida cliente={cliente} />
          </td>
        </tr>
      )}
    </>
  )
}
```

---

## 🗄️ QUERIES E BANCO DE DADOS

### Migration 1: Function calcular_roi_clientes

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_criar_funcao_roi_clientes.sql

CREATE OR REPLACE FUNCTION calcular_roi_clientes(
  p_workspace_id UUID,
  p_data_inicio DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL
)
RETURNS TABLE (
  cliente_id UUID,
  cliente_nome TEXT,
  receita NUMERIC,
  despesa NUMERIC,
  lucro NUMERIC,
  margem NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS cliente_id,
    c.nome AS cliente_nome,
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
  FROM clientes c
  LEFT JOIN transacoes t ON t.cliente_id = c.id
    AND t.workspace_id = p_workspace_id
    AND (p_data_inicio IS NULL OR t.data >= p_data_inicio)
    AND (p_data_fim IS NULL OR t.data <= p_data_fim)
  WHERE c.workspace_id = p_workspace_id
    AND c.ativo = true
  GROUP BY c.id, c.nome
  HAVING COUNT(t.id) > 0
  ORDER BY margem DESC;
END;
$$;
```

---

### Migration 2: Function calcular_kpis_roi

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_criar_funcao_kpis_roi.sql

CREATE OR REPLACE FUNCTION calcular_kpis_roi(
  p_workspace_id UUID,
  p_mes TEXT -- Formato: 'YYYY-MM'
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
  v_data_inicio DATE;
  v_data_fim DATE;
BEGIN
  -- Calcular primeiro e último dia do mês
  v_data_inicio := (p_mes || '-01')::DATE;
  v_data_fim := (DATE_TRUNC('month', v_data_inicio) + INTERVAL '1 month - 1 day')::DATE;

  WITH dados_clientes AS (
    SELECT
      c.nome,
      SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) AS receita,
      SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END) AS despesa,
      (SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) -
       SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END)) AS lucro,
      CASE
        WHEN SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) > 0 THEN
          ((SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) -
            SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END)) /
           SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END)) * 100
        ELSE 0
      END AS margem
    FROM clientes c
    LEFT JOIN transacoes t ON t.cliente_id = c.id
      AND t.workspace_id = p_workspace_id
      AND t.data >= v_data_inicio
      AND t.data <= v_data_fim
    WHERE c.workspace_id = p_workspace_id
      AND c.ativo = true
    GROUP BY c.id, c.nome
    HAVING COUNT(t.id) > 0
  ),
  melhor_percentual AS (
    SELECT nome, margem
    FROM dados_clientes
    ORDER BY margem DESC
    LIMIT 1
  ),
  melhor_valor AS (
    SELECT nome, lucro
    FROM dados_clientes
    ORDER BY lucro DESC
    LIMIT 1
  ),
  totais AS (
    SELECT
      SUM(receita) AS receita_total,
      SUM(lucro) AS lucro_total
    FROM dados_clientes
  )
  SELECT json_build_object(
    'melhorRoiPercentual', json_build_object(
      'cliente', COALESCE((SELECT nome FROM melhor_percentual), 'N/A'),
      'valor', COALESCE((SELECT margem FROM melhor_percentual), 0)
    ),
    'melhorRoiValor', json_build_object(
      'cliente', COALESCE((SELECT nome FROM melhor_valor), 'N/A'),
      'valor', COALESCE((SELECT lucro FROM melhor_valor), 0)
    ),
    'margemMensal', json_build_object(
      'percentual', CASE
        WHEN (SELECT receita_total FROM totais) > 0 THEN
          ((SELECT lucro_total FROM totais) / (SELECT receita_total FROM totais)) * 100
        ELSE 0
      END,
      'lucroTotal', COALESCE((SELECT lucro_total FROM totais), 0)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
```

---

### Hook de Dados

```typescript
// src/hooks/usar-roi-clientes.ts

import useSWR from 'swr'
import { ClienteROI, CardKPI, FiltrosROI } from '@/tipos/roi-cliente'
import { buscarDadosROIClientes, buscarKPIs } from '@/servicos/supabase/roi-cliente-queries'
import { useAuthContext } from '@/contextos/auth-contexto'

export function useROIClientes(filtros: FiltrosROI) {
  const { workspaceAtivo } = useAuthContext()

  const { data: clientes, error: errorClientes, isLoading: loadingClientes } = useSWR<ClienteROI[]>(
    workspaceAtivo ? ['roi-clientes', workspaceAtivo.id, filtros] : null,
    () => buscarDadosROIClientes(workspaceAtivo!.id, filtros),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000 // 1 minuto
    }
  )

  const { data: kpis, error: errorKPIs, isLoading: loadingKPIs } = useSWR<CardKPI>(
    workspaceAtivo ? ['roi-kpis', workspaceAtivo.id] : null,
    () => buscarKPIs(workspaceAtivo!.id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  return {
    clientes: clientes || [],
    kpis,
    isLoading: loadingClientes || loadingKPIs,
    error: errorClientes || errorKPIs
  }
}
```

---

## ✅ CHECKLIST COMPLETO

### Preparação (antes de começar)

- [ ] Ler este documento completo
- [ ] Verificar se tabelas `clientes` e `transacoes` existem
- [ ] Verificar se campo `cliente_id` existe em `transacoes`
- [ ] Ter acesso ao Supabase SQL Editor

---

### FASE 1: Estrutura Base

**Backend:**
- [ ] Criar migration `calcular_roi_clientes.sql`
- [ ] Criar migration `calcular_kpis_roi.sql`
- [ ] Aplicar migrations: `npm run supabase:migration:up`
- [ ] Testar functions no SQL Editor

**Tipos:**
- [ ] Criar `/tipos/roi-cliente.ts`
- [ ] Definir interfaces: `ClienteROI`, `CardKPI`, `FiltrosROI`

**Services:**
- [ ] Criar `/servicos/supabase/roi-cliente-queries.ts`
- [ ] Implementar `buscarDadosROIClientes()`
- [ ] Implementar `buscarKPIs()`

**Hooks:**
- [ ] Criar `/hooks/usar-roi-clientes.ts`
- [ ] Configurar SWR com cache

**Componentes:**
- [ ] Criar `/componentes/relatorios/roi-cliente/cards-kpi.tsx`
- [ ] Criar `/componentes/relatorios/roi-cliente/tabela-roi.tsx`
- [ ] Criar `/componentes/relatorios/roi-cliente/linha-cliente.tsx`

**Página:**
- [ ] Criar `/app/(protected)/relatorios/roi-cliente/page.tsx`
- [ ] Integrar componentes
- [ ] Adicionar loading/error states
- [ ] Adicionar PageGuard

**Teste:**
- [ ] Acessar `/relatorios/roi-cliente`
- [ ] Verificar se dados aparecem corretamente
- [ ] Testar com workspace vazio
- [ ] Validar cálculos manualmente

---

### FASE 2: Expansão e Detalhes

**Backend:**
- [ ] Criar function para buscar receitas detalhadas
- [ ] Criar function para buscar despesas detalhadas

**Componentes:**
- [ ] Adicionar estado `expandido` em `LinhaCliente`
- [ ] Criar componente `SecaoExpandida`
- [ ] Criar componente `ReceitasDetalhadas`
- [ ] Criar componente `DespesasDetalhadas`

**Estilização:**
- [ ] Adicionar cores (verde/amarelo/vermelho)
- [ ] Animação de expansão
- [ ] Hover effects

**Teste:**
- [ ] Clicar em [+] expande corretamente
- [ ] Valores detalhados batem com totais
- [ ] Percentuais somam 100%

---

### FASE 3: Gráfico de Evolução

**Backend:**
- [ ] Criar function `buscar_evolucao_cliente()`

**Dependências:**
- [ ] Instalar: `npm install recharts`

**Componentes:**
- [ ] Criar `GraficoEvolucao.tsx`
- [ ] Criar `ModalEvolucao.tsx`
- [ ] Adicionar botão "Ver Evolução"

**Configuração:**
- [ ] Configurar LineChart
- [ ] Adicionar tooltip customizado
- [ ] Área sombreada de lucro

**Teste:**
- [ ] Gráfico renderiza corretamente
- [ ] Tooltip mostra valores corretos
- [ ] Responsivo em mobile

---

### FASE 4: Filtros e Ordenação

**Componentes:**
- [ ] Criar `FiltrosROI.tsx`
- [ ] Dropdown de período
- [ ] Dropdown de ordenação

**Lógica:**
- [ ] Implementar filtro por período
- [ ] Implementar ordenação
- [ ] Persistir filtros na URL

**Integração:**
- [ ] Passar filtros para hook
- [ ] Atualizar queries

**Teste:**
- [ ] Todos os filtros funcionam
- [ ] Loading ao trocar filtro
- [ ] URL reflete estado

---

### FASE 5: Exportação (Opcional)

**Excel:**
- [ ] Instalar: `npm install xlsx`
- [ ] Criar função `exportarExcel()`
- [ ] Botão de exportação

**PDF:**
- [ ] Instalar: `npm install jspdf jspdf-autotable`
- [ ] Criar função `exportarPDF()`

**Teste:**
- [ ] Download funciona
- [ ] Formatação correta

---

### FASE 6: Validação Final

**Testes:**
- [ ] 0 clientes
- [ ] 1 cliente
- [ ] 50+ clientes
- [ ] Cliente só com receita
- [ ] Cliente só com despesa
- [ ] Cliente com prejuízo
- [ ] Todos os filtros
- [ ] Mobile
- [ ] Tablet
- [ ] Desktop

**Performance:**
- [ ] Carrega em < 2s
- [ ] Expansão instantânea
- [ ] Sem lags

**Validação:**
- [ ] Demonstrar para Ricardo
- [ ] Coletar feedback
- [ ] Implementar ajustes

---

## 🎯 CRITÉRIOS DE SUCESSO

✅ **Funcional:**
- Todos os dados aparecem corretamente
- Cálculos de ROI/margem corretos
- Expansão funciona perfeitamente
- Gráfico mostra evolução real

✅ **Performance:**
- Carregamento < 2 segundos
- Sem travamentos
- Cache funcionando (SWR)

✅ **UX/UI:**
- Interface profissional
- Cores indicativas claras
- Responsivo em todos dispositivos
- Animações suaves

✅ **Aprovação:**
- Ricardo validou e aprovou ✅

---

## 📝 NOTAS IMPORTANTES

### Para o Desenvolvedor (próximo chat):

1. **Comece pela FASE 1** - não pule etapas
2. **Teste cada função SQL** no Supabase antes de integrar
3. **Use o hook existente de auth** para pegar workspace_id
4. **Siga os padrões do projeto** (veja outros componentes)
5. **Peça feedback** após cada fase
6. **NÃO crie variáveis não usadas** (Vercel falha no deploy)
7. **Valide TypeScript** antes de cada commit: `npx tsc --noEmit`

### Dependências do Projeto:

```json
{
  "recharts": "^2.10.0",  // Para gráficos (FASE 3)
  "xlsx": "^0.18.5",      // Para exportação Excel (FASE 5 - opcional)
  "jspdf": "^2.5.1",      // Para exportação PDF (FASE 5 - opcional)
  "jspdf-autotable": "^3.8.0"  // Tabelas em PDF (FASE 5 - opcional)
}
```

---

## 🔗 LINKS ÚTEIS

- **Recharts Docs:** https://recharts.org/
- **Supabase Functions:** https://supabase.com/docs/guides/database/functions
- **SWR Docs:** https://swr.vercel.app/
- **Shadcn UI:** https://ui.shadcn.com/

---

**Documento criado em:** 14/10/2025
**Versão:** 1.0
**Status:** Pronto para implementação
**Criado por:** Claude (Opus) para Ricardo
**Próximo passo:** Implementar FASE 1 - Estrutura Base
