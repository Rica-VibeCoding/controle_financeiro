# 💰 Contexto Rápido - Sistema de Controle Financeiro

## 👤 Sobre o Desenvolvedor
- **Nome:** Ricardo
- **Perfil:** Empresário criando app para uso próprio
- **Método:** Desenvolvimento solo usando apenas prompts com IA
- **Comunicação:** Prefere relatórios simples, não técnicos
- **Autorização:** Sempre pedir permissão antes de refatorar ou implementar


## 🎯 Sobre o Projeto

**Nome:** Sistema de Controle Financeiro Pessoal  
**Objetivo:** App web para controlar finanças pessoais  
**Status:** Em desenvolvimento (documentação completa)

### Stack Principal
- **Frontend:** Next.js 15.5.0 + React 19.1.1 + TypeScript + Tailwind
- **Backend:** Supabase (PostgreSQL + Storage + SSR)
- **Runtime:** Node.js 20.19.4 (otimizado via NVM)
- **Deploy:** Vercel (regras rigorosas - sem variáveis/imports não usados)
- **Testes:** Jest + Testing Library configurado

### Funcionalidades Principais
- ✅ **Transações** (receitas, despesas, transferências)
- ✅ **Parcelamento** (compras divididas automaticamente)
- ✅ **Recorrência** (transações que se repetem)
- ✅ **Metas** (controle de orçamento)
- ✅ **Relatórios** (dashboard com gráficos)
- ✅ **Sistema Multiusuário** (workspaces + convites por link) **100% FUNCIONANDO**
- ✅ **Backup/Restore** (exportação ZIP completa)
- ✅ **Importação CSV Inteligente** (classificação automática)

## 📋 Padrões do Projeto

### Nomenclatura
- **Arquivos:** `kebab-case` em português (`formulario-transacao.tsx`)
- **Componentes:** `PascalCase` em português (`FormularioTransacao`)
- **Variáveis:** `camelCase` em português (`dadosTransacao`)
- **Tabelas:** Prefixo `fp_` (finanças pessoais)

### Estrutura
```
/src
  /app
    /(protected)     → Páginas protegidas por auth
    /auth            → Login, registro, callback
    /juntar/[codigo] → Aceitar convites
  /componentes       → Organizados por funcionalidade
  /contextos         → Auth, período, dados auxiliares, toasts
  /servicos          → Lógica de negócio (Supabase + convites)
  /hooks             → Hooks customizados (usar-*)
  /tipos             → Interfaces TypeScript
```

## 🗃️ Banco de Dados

**10 Tabelas fp_ (multiusuário):**
- `fp_workspaces` ⭐ **NOVA** - Controla workspaces (3 registros)
- `fp_usuarios` ⭐ **NOVA** - Usuários do workspace (3 registros)  
- `fp_convites_links` ⭐ **NOVA** - Convites por link (4 registros ATIVOS)
- `fp_audit_logs` ⭐ **NOVA** - Logs de auditoria (6 registros)
- `fp_transacoes` (principal - agora com workspace_id)
- `fp_categorias` e `fp_subcategorias` 
- `fp_contas` (bancos/cartões - novos: limite, data_fechamento)
- `fp_formas_pagamento`
- `fp_centros_custo` (expandido - projetos)
- `fp_metas_mensais` (antiga fp_metas)

### ⚠️ ALERTA CRÍTICO - Sistema Multiusuário **100% FUNCIONANDO**
**TODAS as tabelas fp_ têm `workspace_id` + RLS habilitado**

**Funcionalidades que dependem do schema:**
- 🔄 **Backup/Restore** (`src/servicos/backup/`) - Validação workspace
- 📊 **Dashboard Admin** (gestão completa) - **REFATORADO** ✅ http://192.168.1.103:3001/admin/dashboard
- 📈 **Relatórios** (gráficos e métricas) - Isolamento dados
- 🎯 **Metas** (cálculos mensais) - Por workspace
- 📋 **Importação CSV** (mapeamento de campos) - Associação workspace
- 👥 **Sistema Convites** (`src/servicos/convites-simples.ts`) - **FUNCIONANDO**

**Arquivos críticos funcionais:**
- `src/tipos/backup.ts` + `src/tipos/auth.ts` - Tipos multiusuário
- `src/tipos/dashboard-admin.ts` - **NOVO** Tipos gestão administrativa ✅
- `src/servicos/backup/exportador-dados.ts` - Incluir workspace_id
- `src/servicos/backup/importador-dados.ts` - Validar workspace
- `src/servicos/supabase/dashboard-admin.ts` - **REFATORADO** Queries otimizadas ✅
- `src/hooks/usar-dashboard-admin.ts` - **EXPANDIDO** Controles administrativos ✅
- `src/componentes/dashboard-admin/tabela-gestao-*.tsx` - **NOVOS** Gestão completa ✅
- `src/contextos/auth-contexto.tsx` - **FUNCIONANDO** Gerencia autenticação
- `src/app/(protected)/admin/dashboard/page.tsx` - **REFATORADO** ✅
- `src/app/(protected)/configuracoes/usuarios/page.tsx` - **FUNCIONANDO**
- `src/app/juntar/[codigo]/page.tsx` - **FUNCIONANDO** Aceitar convites


## ⚙️ Configuração Atual

**Supabase:** Projeto `nzgifjdewdfibcopolof` + MCP configurado  
**GitHub:** https://github.com/Rica-VibeCoding/controle_financeiro  
**Status:** ✅ Sistema Multiusuário **100% FUNCIONANDO** em produção
**Deploy:** ✅ Vercel habilitado (build: 43s estável, Node.js 20, Service Worker)
**Testes:** ✅ Framework Jest configurado (unitários + integração)

### Dependências Importantes Adicionadas:
- **@supabase/ssr** - Autenticação server-side
- **jszip** - Backup/exportação ZIP
- **uuid** - Identificadores únicos  
- **swr** - Cache e data fetching
- **recharts** - Gráficos dashboard

## 📋 **ÚLTIMAS ATUALIZAÇÕES (Janeiro 2025)**

### **✅ CORREÇÃO ROI POR CLIENTE (17/10/2025 23:30)**
- **Status**: ✅ Funções SQL corrigidas - ROI exibindo dados reais
- **Problema**: Funções buscavam em `r_contatos.contato_id` (campo errado)
- **Solução**: Corrigidas 4 funções SQL para usar `fp_centros_custo.centro_custo_id`
- **Resultado**: 3 clientes com dados validados (Helio Martin, Fernando, Conecta)
- **Migrations**: `fix_calcular_roi_clientes_centro_custo`, `fix_calcular_kpis_roi_clientes`, `fix_buscar_detalhes_roi_cliente`, `fix_buscar_evolucao_roi_cliente`
- **URL**: http://localhost:3003/relatorios/roi-cliente
- **Documentação**: `docs/desenvolvimento/STATUS-ATUAL-REFATORACAO.md`

### **🐛 CORREÇÃO CRÍTICA - MODAL EDIÇÃO TRANSAÇÃO (17/10/2025)**
- **Status**: ✅ Erro de formatação de data em produção **CORRIGIDO**
- **Problema**: Input type="date" recebia data ISO completa (2025-09-17T00:00:00+00:00)
- **Solução**: Proteção extra nos inputs usando `formatarDataParaInput()`
- **Campos**: "Data" e "Próxima Recorrência" no modal de lançamento
- **Arquivo**: `src/componentes/modais/modal-lancamento.tsx`

### **🔥 CACHE PERSISTENTE - TODAS AS 3 FASES CONCLUÍDAS (17/10/2025)**
- **Status**: ✅ Sistema 100% atualizado + ferramentas avançadas
- **Baseado em**: Portal Representação (sistema que funciona perfeitamente)
- **Fase 1**: Infraestrutura base + Transações ✅
- **Fase 2**: 7 hooks principais (Dashboard, Contas, ROI, etc) ✅
- **Fase 3**: Cache Manager + Prefetch + Métricas ✅
- **Total**: 8 hooks + SWRProvider + 3 ferramentas avançadas
- **Resultado**: Dados não são mais perdidos + sistema otimizado
- **Documentação**: `docs/RELATORIO-ANALISE-PORTAL-REPRESENTACAO.md`

### **🎯 PROJETO SISTEMA TRANSAÇÕES - REFATORAÇÃO CONCLUÍDA**
- **Status**: ✅ Sistema de transações 100% refatorado para abas únicas
- **URL**: http://172.19.112.1:3003/transacoes **FUNCIONANDO**
- **Mudança**: URLs separadas → Sistema de abas interno único
- **Performance**: Navegação instantânea (sem recarregamento)

### **🚀 Funcionalidades Implementadas**:
- ✅ **Sistema de Abas Único** - Despesas, Receitas, Previstas, Recorrentes
- ✅ **Indicadores Visuais Ativos** - Background, shadow, transições suaves
- ✅ **Loading States Melhorados** - Skeleton loading específico para transações
- ✅ **Estados Vazios Informativos** - Mensagens contextuais + botões de ação

### **🎯 PROJETO DASHBOARD ADMINISTRATIVO - REFATORAÇÃO CONCLUÍDA**
- **Status**: ✅ Dashboard administrativo 100% refatorado e otimizado
- **Página**: http://192.168.1.103:3001/admin/dashboard **FUNCIONANDO**
- **Foco**: Gestão administrativa ao invés de só visualização
- **Performance**: 33% mais rápido (queries otimizadas)

### **🚀 Funcionalidades Dashboard Admin**:
- ✅ **Tabela Gestão Usuários COMPLETA** - Todos os usuários + controles ativar/desativar
- ✅ **Tabela Gestão Workspaces COMPLETA** - Todos os workspaces + métricas + filtros
- ✅ **Layout Compacto** - Cards KPI + gráfico reduzido + foco em ação
- ✅ **Queries SQL Expandidas** - `get_todos_usuarios()` + `get_todos_workspaces()` + `admin_toggle_usuario()`
- ✅ **Código Limpo** - Removido código morto, imports otimizados

### **🏗️ Infraestrutura Dashboard Admin**:
- ✅ **TabelaGestaoUsuarios** - Filtros, busca, botões administrativos
- ✅ **TabelaGestaoWorkspaces** - Métricas completas, status coloridos
- ✅ **Hook Expandido** - `usarDashboardAdmin` com controles administrativos
- ✅ **Tipos TypeScript** - `UsuarioCompleto`, `WorkspaceCompleto`, `AcaoAdministrativa`
- ✅ **Formatação Nativa** - Sem dependência date-fns, funções próprias

### **📊 Dados e Performance**:
- **4 usuários** carregando na gestão ✓
- **3 workspaces** com métricas completas ✓
- **1 super admin** identificado e protegido ✓
- **Queries otimizadas** - 4 ao invés de 6 (33% mais rápido)

---

### **✅ PROJETO REFATORAÇÃO MODAIS - FASE 2 CONCLUÍDA**
- **Status**: ✅ Infraestrutura base + 2 modais principais implementados
- **Progresso**: 6/11 modais (55% concluído)
- **Arquivos Criados**: 6 componentes + 1 hook + expansões em 5 arquivos existentes
- **Próxima Etapa**: FASE 3 - 3 modais simples restantes

### **📁 Documentação Atualizada**:
- **`docs/DASHBOARD-ADMIN-REFATORACAO.md`** - Relatório completo da refatoração
- **`docs/RELATORIO-FASE-2-MODAIS.md`** - Relatório completo do que foi feito
- **`docs/PROXIMOS-PASSOS-FASE-3.md`** - Templates e instruções para continuar
- **`docs/PLANO-MODAL-REFATORACAO.md`** - Plano geral atualizado

---

## 💡 Como Ajudar o Ricardo

### Comunicação Ideal
- **Relatórios simples** e diretos
- **Linguagem não técnica** quando possível
- **Resumos executivos** ao invés de detalhes extensos
- **Sempre perguntar** antes de fazer mudanças

### Perguntas Sempre Fazer
1. "Posso implementar essa mudança?"
2. "Devo refatorar esse código?"
3. "Quer que eu explique isso de forma mais simples?"
4. "Precisa de mais detalhes ou está bom assim?"

### O que Evitar
- ❌ Implementar sem permissão
- ❌ Relatórios muito técnicos
- ❌ Respostas muito longas
- ❌ Assumir que entende tudo

### O que Fazer
- ✅ Resumir primeiro, detalhar depois se pedido
- ✅ Focar em soluções práticas
- ✅ Explicar benefícios em linguagem simples
- ✅ Sempre confirmar antes de agir

---

**💡 Lembre-se:** Ricardo é empresário, não programador. Foque em resultados práticos e comunicação clara!

**📖 Para continuar o projeto modais, consulte:** `docs/PROXIMOS-PASSOS-FASE-3.md`