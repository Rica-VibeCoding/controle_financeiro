# 📊 ESPECIFICAÇÃO - TELA PRINCIPAL DE RELATÓRIOS

## 📋 ÍNDICE
1. [Visão Geral](#visão-geral)
2. [Estrutura da Página](#estrutura-da-página)
3. [Cards de Seleção](#cards-de-seleção)
4. [Navegação e Rotas](#navegação-e-rotas)
5. [Design e UX](#design-e-ux)
6. [Responsividade](#responsividade)
7. [Checklist de Implementação](#checklist-de-implementação)

---

## 🎯 VISÃO GERAL

**Objetivo:** Criar uma tela profissional de seleção de relatórios gerenciais com UX exemplar.

**Localização:** `/relatorios` (página principal)

**Função:** Hub de navegação para 3 tipos de relatórios estratégicos:
1. ROI por Cliente
2. Fluxo de Caixa Projetado vs. Realizado
3. Contas a Pagar e Receber

---

## 🏗️ ESTRUTURA DA PÁGINA

### Layout Geral

```
┌────────────────────────────────────────────────────────────────┐
│  HEADER                                                        │
│  📊 Relatórios Gerenciais                                      │
│  Escolha o relatório que deseja visualizar                    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  CARDS DE SELEÇÃO (Grid 3 colunas - desktop / 1 coluna mobile)│
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   CARD 1    │  │   CARD 2    │  │   CARD 3    │           │
│  │ ROI Cliente │  │ Fluxo Caixa │  │   Contas    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Hierarquia Visual

```tsx
<div className="max-w-7xl mx-auto px-4 py-6">
  {/* Header */}
  <header className="mb-8">
    <h1>Relatórios Gerenciais</h1>
    <p>Escolha o relatório que deseja visualizar</p>
  </header>

  {/* Grid de Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <CardRelatorio {...card1} />
    <CardRelatorio {...card2} />
    <CardRelatorio {...card3} />
  </div>
</div>
```

---

## 🎴 CARDS DE SELEÇÃO

### Card 1: ROI por Cliente

**Conteúdo:**
```
┌───────────────────────────────────────┐
│  💰 Ícone Grande (centralizado)       │
│                                       │
│  ROI POR CLIENTE                      │
│  (título em negrito)                  │
│                                       │
│  Análise de rentabilidade e margem    │
│  de lucro por cliente. Identifique    │
│  quais clientes trazem maior retorno. │
│  (descrição)                          │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │     Acessar Relatório    →      │ │
│  └─────────────────────────────────┘ │
│                                       │
│  📊 Última atualização: Hoje 14:30   │
└───────────────────────────────────────┘
```

**Dados:**
- **Ícone:** 💰 (DollarSign)
- **Título:** "ROI por Cliente"
- **Descrição:** "Análise de rentabilidade e margem de lucro por cliente. Identifique quais clientes trazem maior retorno."
- **Rota:** `/relatorios/roi-cliente`
- **Cor de destaque:** Verde (#10B981)

---

### Card 2: Fluxo de Caixa Projetado

**Conteúdo:**
```
┌───────────────────────────────────────┐
│  📈 Ícone Grande (centralizado)       │
│                                       │
│  FLUXO DE CAIXA PROJETADO             │
│  (título em negrito)                  │
│                                       │
│  Compare valores previstos com        │
│  realizados. Identifique desvios e    │
│  mantenha controle orçamentário.      │
│  (descrição)                          │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │     Acessar Relatório    →      │ │
│  └─────────────────────────────────┘ │
│                                       │
│  📊 Última atualização: Hoje 14:30   │
└───────────────────────────────────────┘
```

**Dados:**
- **Ícone:** 📈 (TrendingUp)
- **Título:** "Fluxo de Caixa Projetado"
- **Descrição:** "Compare valores previstos com realizados. Identifique desvios e mantenha controle orçamentário."
- **Rota:** `/relatorios/fluxo-caixa`
- **Cor de destaque:** Azul (#3B82F6)

---

### Card 3: Contas a Pagar e Receber

**Conteúdo:**
```
┌───────────────────────────────────────┐
│  📋 Ícone Grande (centralizado)       │
│                                       │
│  CONTAS A PAGAR E RECEBER             │
│  (título em negrito)                  │
│                                       │
│  Gestão completa de obrigações        │
│  financeiras. Acompanhe vencimentos   │
│  e status de pagamentos.              │
│  (descrição)                          │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │     Acessar Relatório    →      │ │
│  └─────────────────────────────────┘ │
│                                       │
│  📊 Última atualização: Hoje 14:30   │
└───────────────────────────────────────┘
```

**Dados:**
- **Ícone:** 📋 (FileText)
- **Título:** "Contas a Pagar e Receber"
- **Descrição:** "Gestão completa de obrigações financeiras. Acompanhe vencimentos e status de pagamentos."
- **Rota:** `/relatorios/contas`
- **Cor de destaque:** Roxo (#8B5CF6)

---

## 🗺️ NAVEGAÇÃO E ROTAS

### Estrutura de Arquivos

```
src/app/(protected)/relatorios/
├── page.tsx                          # Tela principal (seleção)
├── roi-cliente/
│   └── page.tsx                      # ROI por Cliente
├── fluxo-caixa/
│   └── page.tsx                      # Fluxo de Caixa (futuro)
└── contas/
    └── page.tsx                      # Contas (futuro)
```

### Rotas

| URL | Descrição | Status |
|-----|-----------|--------|
| `/relatorios` | Página principal (hub) | ✅ Implementar |
| `/relatorios/roi-cliente` | ROI por Cliente | ✅ Implementar Fase 1 |
| `/relatorios/fluxo-caixa` | Fluxo de Caixa | 🔜 Fase 2 |
| `/relatorios/contas` | Contas a Pagar/Receber | 🔜 Fase 3 |

---

## 🎨 DESIGN E UX

### Componente CardRelatorio

**Props:**
```typescript
interface CardRelatorioProps {
  icone: React.ComponentType<{ className?: string }>
  titulo: string
  descricao: string
  rota: string
  cor: 'green' | 'blue' | 'purple'
  ultimaAtualizacao?: string
}
```

**Estados de Interação:**

1. **Normal (padrão)**
   - Fundo branco
   - Borda cinza clara
   - Sombra leve

2. **Hover**
   - Elevar card (transform: translateY(-4px))
   - Aumentar sombra
   - Destacar botão com cor do tema

3. **Focus (acessibilidade)**
   - Borda colorida (cor do tema)
   - Outline visível

**Exemplo de Estilo:**
```tsx
<Card className="
  group
  relative
  overflow-hidden
  transition-all
  duration-200
  hover:shadow-lg
  hover:-translate-y-1
  focus-within:ring-2
  focus-within:ring-offset-2
">
  {/* Barra de cor no topo */}
  <div className={`h-1 w-full bg-${cor}-500`} />

  {/* Conteúdo do card */}
  <CardContent>...</CardContent>
</Card>
```

### Paleta de Cores

| Relatório | Cor Principal | Hover | Código |
|-----------|---------------|-------|--------|
| ROI Cliente | Verde | Verde escuro | #10B981 → #059669 |
| Fluxo Caixa | Azul | Azul escuro | #3B82F6 → #2563EB |
| Contas | Roxo | Roxo escuro | #8B5CF6 → #7C3AED |

### Tipografia

- **Título da página:** text-3xl font-bold
- **Subtítulo:** text-lg text-gray-600
- **Título do card:** text-xl font-semibold
- **Descrição:** text-sm text-gray-600
- **Botão:** text-base font-medium

---

## 📱 RESPONSIVIDADE

### Breakpoints

| Tamanho | Layout | Colunas |
|---------|--------|---------|
| Mobile (< 768px) | Stack vertical | 1 |
| Tablet (768px - 1023px) | Grid 2 colunas | 2 |
| Desktop (≥ 1024px) | Grid 3 colunas | 3 |

### Ajustes Mobile

```tsx
<div className="
  grid
  grid-cols-1           // Mobile: 1 coluna
  md:grid-cols-2        // Tablet: 2 colunas
  lg:grid-cols-3        // Desktop: 3 colunas
  gap-4 md:gap-6        // Espaçamento responsivo
">
```

**Padding responsivo:**
- Mobile: px-4
- Tablet: px-6
- Desktop: px-8

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Estrutura Base
- [ ] Criar arquivo `/relatorios/page.tsx`
- [ ] Criar componente `CardRelatorio.tsx`
- [ ] Implementar layout responsivo (grid)
- [ ] Adicionar ícones (lucide-react)

### Fase 2: Conteúdo
- [ ] Adicionar textos e descrições dos 3 cards
- [ ] Configurar rotas de navegação
- [ ] Implementar última atualização (data/hora atual)

### Fase 3: Estilização
- [ ] Aplicar cores de destaque por card
- [ ] Implementar estados hover/focus
- [ ] Adicionar animações de transição
- [ ] Testar responsividade (mobile/tablet/desktop)

### Fase 4: Funcionalidade
- [ ] Integrar com `useRouter` do Next.js
- [ ] Adicionar PageGuard (permissão "relatorios")
- [ ] Testar navegação entre páginas
- [ ] Validar comportamento do botão

### Fase 5: Acessibilidade
- [ ] Adicionar aria-labels
- [ ] Testar navegação por teclado
- [ ] Garantir contraste adequado (WCAG AA)
- [ ] Adicionar tooltips se necessário

### Fase 6: Validação Final
- [ ] Revisar com Ricardo
- [ ] Testar em diferentes navegadores
- [ ] Verificar performance (loading)
- [ ] Documentar componentes

---

## 📝 EXEMPLO DE CÓDIGO COMPLETO

```tsx
// src/componentes/relatorios/card-relatorio.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

interface CardRelatorioProps {
  icone: React.ReactNode
  titulo: string
  descricao: string
  rota: string
  cor: 'green' | 'blue' | 'purple'
  ultimaAtualizacao?: string
}

const coresMap = {
  green: {
    barra: 'bg-green-500',
    hover: 'hover:border-green-500',
    botao: 'hover:bg-green-50 hover:text-green-700'
  },
  blue: {
    barra: 'bg-blue-500',
    hover: 'hover:border-blue-500',
    botao: 'hover:bg-blue-50 hover:text-blue-700'
  },
  purple: {
    barra: 'bg-purple-500',
    hover: 'hover:border-purple-500',
    botao: 'hover:bg-purple-50 hover:text-purple-700'
  }
}

export function CardRelatorio({
  icone,
  titulo,
  descricao,
  rota,
  cor,
  ultimaAtualizacao = new Date().toLocaleString('pt-BR')
}: CardRelatorioProps) {
  const router = useRouter()
  const cores = coresMap[cor]

  return (
    <Card className={`
      group
      relative
      overflow-hidden
      transition-all
      duration-200
      hover:shadow-lg
      hover:-translate-y-1
      ${cores.hover}
      cursor-pointer
    `}
    onClick={() => router.push(rota)}
    >
      {/* Barra de cor no topo */}
      <div className={`h-1 w-full ${cores.barra}`} />

      <CardHeader className="text-center pb-4">
        {/* Ícone */}
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
            {icone}
          </div>
        </div>

        {/* Título */}
        <CardTitle className="text-xl font-semibold mb-2">
          {titulo}
        </CardTitle>

        {/* Descrição */}
        <CardDescription className="text-sm text-gray-600 leading-relaxed">
          {descricao}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Botão de ação */}
        <Button
          variant="outline"
          className={`w-full ${cores.botao} transition-colors`}
          onClick={(e) => {
            e.stopPropagation()
            router.push(rota)
          }}
        >
          Acessar Relatório
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {/* Última atualização */}
        <p className="text-xs text-gray-500 text-center mt-4">
          📊 Última atualização: {ultimaAtualizacao}
        </p>
      </CardContent>
    </Card>
  )
}
```

```tsx
// src/app/(protected)/relatorios/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import { PageGuard } from '@/componentes/ui/page-guard'
import { CardRelatorio } from '@/componentes/relatorios/card-relatorio'
import { DollarSign, TrendingUp, FileText } from 'lucide-react'

export default function RelatoriosPage() {
  const relatorios = [
    {
      icone: <DollarSign className="h-8 w-8 text-green-600" />,
      titulo: 'ROI por Cliente',
      descricao: 'Análise de rentabilidade e margem de lucro por cliente. Identifique quais clientes trazem maior retorno.',
      rota: '/relatorios/roi-cliente',
      cor: 'green' as const
    },
    {
      icone: <TrendingUp className="h-8 w-8 text-blue-600" />,
      titulo: 'Fluxo de Caixa Projetado',
      descricao: 'Compare valores previstos com realizados. Identifique desvios e mantenha controle orçamentário.',
      rota: '/relatorios/fluxo-caixa',
      cor: 'blue' as const
    },
    {
      icone: <FileText className="h-8 w-8 text-purple-600" />,
      titulo: 'Contas a Pagar e Receber',
      descricao: 'Gestão completa de obrigações financeiras. Acompanhe vencimentos e status de pagamentos.',
      rota: '/relatorios/contas',
      cor: 'purple' as const
    }
  ]

  return (
    <PageGuard permissaoNecessaria="relatorios">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Relatórios Gerenciais
          </h1>
          <p className="text-lg text-gray-600">
            Escolha o relatório que deseja visualizar
          </p>
        </header>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatorios.map((relatorio, index) => (
            <CardRelatorio key={index} {...relatorio} />
          ))}
        </div>
      </div>
    </PageGuard>
  )
}
```

---

## 🎯 CRITÉRIOS DE SUCESSO

✅ Interface limpa e profissional
✅ Navegação intuitiva entre relatórios
✅ Responsividade perfeita (mobile/tablet/desktop)
✅ Feedback visual em hover/focus
✅ Carregamento rápido (< 1s)
✅ Acessibilidade (WCAG AA)

---

**Documento criado em:** 14/10/2025
**Versão:** 1.0
**Status:** Pronto para implementação
**Próximo passo:** Implementar Fase 1
