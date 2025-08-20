# 📋 Canvas de Implementação - Dashboard Financeiro

## 🎯 Visão Geral do Produto

### **Objetivo Principal**
Criar um dashboard financeiro moderno, limpo e intuitivo que apresente informações críticas de forma elegante e organizadas, proporcionando orgulho tanto para o desenvolvedor quanto para o usuário.

### **Princípios de Design**
- **Minimalismo Elegante:** Informações essenciais sem poluição visual
- **Hierarquia Visual Clara:** Informações mais importantes em destaque
- **Consistência:** Padrões uniformes em toda a interface
- **Responsividade:** Experiência fluida em qualquer dispositivo
- **Performance:** Carregamento rápido e transições suaves

---

## 🎨 Diretrizes Visuais

### **Paleta de Cores**
```
Primárias:
- Azul Principal: #3B82F6 (ações, links, destaques)
- Azul Escuro: #1E40AF (títulos, textos importantes)

Semânticas:
- Verde: #10B981 (receitas, positivo, sucesso)
- Vermelho: #EF4444 (despesas, negativo, alerta)
- Laranja: #F59E0B (metas, avisos)
- Roxo: #8B5CF6 (cartões, premium)

Neutros:
- Cinza 900: #111827 (textos principais)
- Cinza 600: #4B5563 (textos secundários)
- Cinza 200: #E5E7EB (bordas, divisores)
- Cinza 50: #F9FAFB (backgrounds)
- Branco: #FFFFFF (cards, fundos)
```

### **Tipografia**
```
- Font Family: Inter (clean, modern, legible)
- Títulos: 24px-32px, Font Weight 700
- Subtítulos: 18px-20px, Font Weight 600
- Corpo: 14px-16px, Font Weight 400
- Números: Font Weight 600 (destaque para valores)
```

### **Espaçamento**
```
- Gap Padrão: 24px (entre seções)
- Gap Cards: 16px
- Padding Cards: 24px
- Border Radius: 12px (cards), 8px (botões)
- Shadows: Suaves, 0-4px blur
```

---

## 📱 Layout e Estrutura

### **Grid System**
```
Desktop (>1024px):
- Container: max-width 1200px, centralizado
- Cards: Grid 4 colunas (1fr each)
- Gráficos: Grid 2 colunas (2fr + 1fr)

Tablet (768px-1024px):
- Cards: Grid 2x2
- Gráficos: Stack vertical

Mobile (<768px):
- Cards: Stack vertical
- Padding reduzido: 16px
```

### **Hierarquia Visual**
```
1. Header: Título + Filtro de Período
2. Cards Principais: 4 cards de métricas
3. Card Próxima Conta: Destaque visual
4. Gráficos Principais: 
   - Categorias vs Metas
   - Cartões (Usado vs Limite)
5. Gráficos Secundários:
   - Contas (Saldos)
   - Tendência (Últimos meses)
```

---

## 🏗️ Arquitetura Técnica

### **Stack Tecnológico**
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Charts:** Recharts (performance + customização)
- **Estado:** Context API + Custom Hooks
- **Backend:** Supabase (PostgreSQL)
- **Deploy:** Vercel

### **Estrutura de Arquivos Dashboard**
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
│   │   ├── card-metrica.tsx      # Card reutilizável
│   │   ├── card-proxima-conta.tsx # Card destacado
│   │   ├── filtro-periodo.tsx    # Navegação mês/ano
│   │   ├── grafico-categorias.tsx # Barras + metas
│   │   ├── grafico-cartoes.tsx   # Barras empilhadas
│   │   ├── grafico-contas.tsx    # Saldos horizontais
│   │   └── grafico-tendencia.tsx # Linha evolutiva
│   └── ui/                       # shadcn/ui components
│
├── contextos/
│   └── financeiro-contexto.tsx   # Estado global dashboard
│
├── hooks/
│   └── usar-financeiro-dados.ts  # Hook customizado
│
├── servicos/
│   └── supabase/
│       ├── cliente.ts            # Configuração Supabase
│       └── dashboard.ts          # Queries específicas
│
└── tipos/
    └── dashboard.ts              # Interfaces TypeScript
```

### **URL e Roteamento**
```
DESENVOLVIMENTO: http://localhost:3000/dashboard
PRODUÇÃO: https://seu-app.vercel.app/dashboard

Navegação:
- / → redirect para /dashboard
- /dashboard → página principal (componente alvo)
```

### **Estrutura de Dados**
```typescript
interface DashboardData {
  periodo: { inicio: string; fim: string }
  cards: {
    receitas: { atual: number; anterior: number; tendencia: number[] }
    despesas: { atual: number; anterior: number; tendencia: number[] }
    saldo: { atual: number; anterior: number; tendencia: number[] }
    gastosCartao: { atual: number; anterior: number; tendencia: number[] }
  }
  proximaConta: { nome: string; valor: number; dias: number }
  categorias: Array<{ nome: string; gasto: number; meta: number; cor: string }>
  cartoes: Array<{ nome: string; usado: number; limite: number; vencimento: string }>
  contas: Array<{ nome: string; saldo: number; tipo: string }>
  tendencia: Array<{ mes: string; saldo: number }>
}
```

### **Context Provider**
```typescript
const FinanceiroContexto = createContext<{
  dados: DashboardData
  carregando: boolean
  erro: string | null
  setPeriodo: (periodo: { inicio: string; fim: string }) => void
  recarregar: () => Promise<void>
}>()
```

---

## 📊 Componentes Detalhados

### **1. Cards de Métricas**
```
Estrutura:
- Ícone + Título (fonte pequena, cinza)
- Valor Principal (fonte grande, destaque)
- Comparativo vs mês anterior (% + ícone ↗️↘️)
- Sparkline (7 pontos, linha sutil)

Estados:
- Loading: Skeleton animation
- Erro: Ícone + mensagem discreta
- Sucesso: Dados + animação suave
```

### **2. Card Próxima Conta**
```
Design:
- Background sutil diferenciado
- Ícone de calendário
- Nome da conta + valor em destaque
- "Vence em X dias" como subtitle
- Borda esquerda colorida (urgência)
```

### **3. Gráficos**
```
Categorias vs Metas:
- Barras horizontais (melhor para nomes longos)
- Cor da barra: azul padrão
- Linha de meta: tracejada, cor laranja
- Tooltip: valor gasto + meta + percentual

Cartões (Top 5):
- Barras verticais empilhadas
- Usado (cor roxa) + Disponível (cinza claro)
- Labels: nome do cartão
- Tooltip: usado + limite + disponível

Contas (Saldos):
- Barras horizontais simples
- Cor verde (saldo positivo) / vermelha (negativo)
- Ordenação: maior saldo primeiro

Tendência:
- Linha suave, cor azul
- Pontos destacados
- Grid sutil
- Labels de meses abreviados
```

---

## 🔧 Implementação - Plano de Fases

### **FASE 1: Fundação (Semana 1)**
**Objetivo:** Setup base + estrutura de dados

**Tarefas:**
1. **Setup Projeto**
   ```bash
   - create-next-app com TypeScript + Tailwind
   - Instalar dependências: recharts, date-fns, lucide-react
   - Configurar shadcn/ui
   - Setup eslint + prettier
   ```

2. **Estrutura Base**
   ```
   ARQUIVOS PARA CRIAR:
   
   src/app/dashboard/page.tsx          # 🎯 PÁGINA PRINCIPAL DO DASHBOARD
   src/app/layout.tsx                  # Layout raiz da aplicação
   src/servicos/supabase/cliente.ts    # Cliente Supabase
   src/tipos/dashboard.ts              # Tipos TypeScript do dashboard
   src/contextos/financeiro-contexto.tsx # Context API para dados
   src/hooks/usar-financeiro-dados.ts  # Hook customizado
   src/componentes/ui/                 # Componentes shadcn/ui
   
   ROTA FINAL: http://localhost:3000/dashboard
   ```

3. **Redirect Configuração**
   ```typescript
   // src/app/page.tsx - Redirect para dashboard
   import { redirect } from 'next/navigation'
   export default function Home() {
     redirect('/dashboard')
   }
   ```

3. **Context API**
   ```typescript
   - Criar FinanceiroContexto
   - Hook useFinanceiroDados
   - Provider no layout principal
   - Estado inicial + loading states
   ```

4. **Schema Update**
   ```sql
   - Adicionar campo 'limite' em fp_contas
   - Adicionar campo 'data_fechamento' em fp_contas
   - Criar índices otimizados
   - Dados de teste para desenvolvimento
   ```

**Entregáveis:**
- Projeto configurado e rodando
- Context API funcionando
- Layout base responsivo
- Conexão Supabase validada

---

### **FASE 2: Cards Principais (Semana 2)**
**Objetivo:** Implementar os 4 cards de métricas + comparativo

**Tarefas:**
1. **Componente Card Base**
   ```typescript
   // ARQUIVO: src/componentes/dashboard/card-metrica.tsx
   - CardMetrica reutilizável
   - Props: titulo, valor, icone, tendencia, comparativo
   - Estados: loading (skeleton), erro, sucesso
   - Animações de entrada suaves
   ```

2. **Página Dashboard Principal**
   ```typescript
   // ARQUIVO: src/app/dashboard/page.tsx
   - Importar e usar CardMetrica
   - Layout em grid responsivo
   - Integração com Context API
   - Loading states globais
   ```

3. **Lógica de Cálculos**
   ```typescript
   // ARQUIVO: src/hooks/usar-financeiro-dados.ts
   - Hook useCalculosCards
   - Funções: calcularReceitas, calcularDespesas, calcularSaldo
   - Comparativo mês anterior
   - Formatação de moeda brasileira
   ```

4. **Service Layer**
   ```typescript
   // ARQUIVO: src/servicos/supabase/dashboard.ts
   - obterDadosCards(periodo)
   - obterDadosComparativo(periodoAnterior)
   - Cache de queries otimizado
   ```

**Entregáveis:**
- src/app/dashboard/page.tsx funcionando
- 4 cards com dados reais do Supabase
- Comparativo mês anterior
- Responsividade mobile/desktop

---

### **FASE 3: Filtro de Período (Semana 3)**
**Objetivo:** Filtro funcional que atualiza todo dashboard

**Tarefas:**
1. **Componente Filtro**
   ```typescript
   // ARQUIVO: src/componentes/dashboard/filtro-periodo.tsx
   - FiltroMeses navegável
   - Estados: mês/ano selecionado
   - Navegação: setas < > + dropdown anos
   - Visual: pills/tabs elegantes
   ```

2. **Integração Dashboard**
   ```typescript
   // ATUALIZAR: src/app/dashboard/page.tsx
   - Importar e posicionar FiltroMeses no header
   - Integração com Context API
   - Layout responsivo header + filtro
   ```

3. **Context Integration**
   ```typescript
   // ATUALIZAR: src/contextos/financeiro-contexto.tsx
   - setPeriodo atualiza estado global
   - Debounce 300ms para evitar múltiplas queries
   - Loading global quando filtro muda
   ```

**Entregáveis:**
- Filtro funcional no header do dashboard
- Dashboard reativo ao filtro
- Performance otimizada
- UX fluida nas mudanças

---

### **FASE 4: Card Próxima Conta (Semana 4)**
**Objetivo:** Card destacado com próxima conta a vencer

**Tarefas:**
1. **Lógica de Negócio**
   ```typescript
   - Buscar transações pendentes
   - Ordenar por data_vencimento
   - Filtrar maior valor se múltiplas no mesmo dia
   - Calcular dias restantes
   ```

2. **Componente Visual**
   ```typescript
   - Design diferenciado dos outros cards
   - Ícone de calendário + urgência visual
   - Cores baseadas em urgência (verde > amarelo > vermelho)
   - Animação sutil de pulse se crítico
   ```

3. **Estados Especiais**
   ```typescript
   - Sem contas pendentes: "Parabéns, tudo em dia!"
   - Conta vencida: visual de alerta
   - Múltiplas contas: mostrar quantidade
   ```

**Entregáveis:**
- Card próxima conta funcional
- Visual elegante e informativo
- Estados especiais tratados
- Integração com filtro de período

---

### **FASE 5: Gráfico Categorias vs Metas (Semana 5)**
**Objetivo:** Gráfico horizontal com linha de meta sobreposta

**Tarefas:**
1. **Componente Recharts**
   ```typescript
   - BarChart horizontal
   - ReferenceLine para metas
   - Tooltip customizado
   - Cores semânticas (azul + laranja)
   ```

2. **Processamento de Dados**
   ```typescript
   - Agrupar gastos por categoria no período
   - Buscar metas ativas para as categorias
   - Ordenar por valor gasto (maior primeiro)
   - Tratar categorias sem meta (linha em 0)
   ```

3. **Interatividade**
   ```typescript
   - Hover states elegantes
   - Tooltip: valor + meta + percentual usado
   - Responsive: ajustar height baseado em dados
   ```

**Entregáveis:**
- Gráfico categorias funcional
- Metas visíveis e claras
- Design responsivo
- Performance otimizada

---

### **FASE 6: Gráfico Cartões (Semana 6)**
**Objetivo:** Top 5 cartões com usado vs limite

**Tarefas:**
1. **Lógica Cartões**
   ```typescript
   - Filtrar contas tipo 'cartao_credito'
   - Calcular usado no período atual
   - Ordenar por valor usado (top 5)
   - Calcular disponível (limite - usado)
   ```

2. **Componente Barra Dupla**
   ```typescript
   - BarChart com barras empilhadas
   - Usado (roxo) + Disponível (cinza claro)
   - Labels com nome do cartão
   - Indicador visual quando próximo/acima do limite
   ```

3. **Estados Especiais**
   ```typescript
   - Cartão estourado: barra vermelha
   - Sem cartões: mensagem elegante
   - Cartão sem limite: barra simples
   ```

**Entregáveis:**
- Gráfico cartões top 5
- Visual de limite claro
- Estados especiais tratados
- Responsividade mobile

---

### **FASE 7: Gráficos Contas + Tendência (Semana 7)**
**Objetivo:** Complementar dashboard com visão de contas e evolução

**Tarefas:**
1. **Gráfico Saldos Contas**
   ```typescript
   - Barras horizontais simples
   - Excluir cartões de crédito
   - Cores: verde (positivo) / vermelho (negativo)
   - Ordenação por valor absoluto
   ```

2. **Gráfico Tendência**
   ```typescript
   - LineChart últimos 6 meses
   - Saldo final de cada mês
   - Linha suave com pontos destacados
   - Grid sutil + labels meses
   ```

3. **Layout Final**
   ```typescript
   - Grid responsivo para 4 gráficos
   - Spacing consistente
   - Performance: lazy load se necessário
   ```

**Entregáveis:**
- Gráfico contas funcional
- Tendência últimos meses
- Layout final responsivo
- Performance otimizada

---

### **FASE 8: Polimento + Deploy (Semana 8)**
**Objetivo:** Refinamentos finais + produção

**Tarefas:**
1. **UX/UI Refinements**
   ```typescript
   - Micro-animações nos hover states
   - Loading skeletons elegantes
   - Error boundaries com fallbacks
   - Empty states bem desenhados
   ```

2. **Performance**
   ```typescript
   - Code splitting por componente
   - Memoização onde necessário
   - Lazy loading de gráficos
   - Bundle size optimization
   ```

3. **Deploy**
   ```bash
   - Setup Vercel com variáveis ambiente
   - CI/CD pipeline
   - Error tracking (Sentry)
   - Analytics básico
   ```

4. **Documentação**
   ```markdown
   - README com setup
   - Comentários nos componentes
   - Guia de manutenção
   ```

**Entregáveis:**
- Dashboard completo e polido
- Deploy em produção
- Performance otimizada
- Documentação atualizada

---

## 🎯 Critérios de Sucesso

### **Performance**
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3s
- Cumulative Layout Shift < 0.1

### **UX/UI**
- Interface limpa e elegante
- Navegação intuitiva
- Feedback visual adequado
- Responsividade perfeita

### **Funcionalidade**
- Dados precisos e atualizados
- Filtros funcionando corretamente
- Gráficos informativos e claros
- Estados de erro bem tratados

### **Código**
- TypeScript 100% tipado
- Componentes reutilizáveis
- Performance otimizada
- Manutenibilidade alta

---

## 📋 Checklist de Validação

### **Cada Fase deve entregar:**
- [ ] Funcionalidade implementada conforme spec
- [ ] Testes visuais em mobile/desktop
- [ ] Performance adequada (< 100ms renders)
- [ ] TypeScript sem erros
- [ ] Responsividade validada
- [ ] Estados de loading/erro tratados
- [ ] Code review interno

### **Deploy Final:**
- [ ] Todos os gráficos funcionando
- [ ] Filtros integrados
- [ ] Performance otimizada
- [ ] Mobile perfeito
- [ ] Error handling completo
- [ ] SEO básico configurado
- [ ] Analytics implementado

---

**Este canvas serve como guia completo para implementação. Cada fase é independente e pode ser validada antes de prosseguir para a próxima.**