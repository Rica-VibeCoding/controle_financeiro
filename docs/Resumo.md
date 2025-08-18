# 💰 Contexto Rápido - Sistema de Controle Financeiro

## 👤 Sobre o Desenvolvedor
- **Nome:** Ricardo
- **Perfil:** Empresário criando app para uso próprio
- **Método:** Desenvolvimento solo usando apenas prompts com IA
- **Comunicação:** Prefere relatórios simples, não técnicos
- **Autorização:** Sempre pedir permissão antes de refatorar ou implementar

### Comnu

## 🎯 Sobre o Projeto

**Nome:** Sistema de Controle Financeiro Pessoal  
**Objetivo:** App web para controlar finanças pessoais  
**Status:** Em desenvolvimento (documentação completa)

### Stack Principal
- **Frontend:** Next.js + TypeScript + Tailwind
- **Backend:** Supabase (PostgreSQL + Storage)
- **Deploy:** Vercel

### Funcionalidades Principais
- ✅ **Transações** (receitas, despesas, transferências)
- ✅ **Parcelamento** (compras divididas automaticamente)
- ✅ **Recorrência** (transações que se repetem)
- ✅ **Metas** (controle de orçamento)
- ✅ **Relatórios** (dashboard com gráficos)

## 📋 Padrões do Projeto

### Nomenclatura
- **Arquivos:** `kebab-case` em português (`formulario-transacao.tsx`)
- **Componentes:** `PascalCase` em português (`FormularioTransacao`)
- **Variáveis:** `camelCase` em português (`dadosTransacao`)
- **Tabelas:** Prefixo `fp_` (finanças pessoais)

### Estrutura
```
/src
  /app          → Páginas (dashboard, transacoes, relatorios)
  /componentes  → Organizados por funcionalidade
  /servicos     → Lógica de negócio (Supabase)
  /hooks        → Hooks customizados (usar-transacoes)
  /tipos        → Interfaces TypeScript
```

## 🗃️ Banco de Dados

**7 Tabelas principais:**
- `fp_transacoes` (principal)
- `fp_categorias` e `fp_subcategorias`
- `fp_contas` (bancos/cartões)
- `fp_formas_pagamento`
- `fp_centros_custo`
- `fp_metas`


## ⚙️ Configuração Atual

**Supabase:** Projeto `nzgifjdewdfibcopolof`  
**GitHub:** https://github.com/Rica-VibeCoding/controle_financeiro  
**Status:** Documentação completa, código em desenvolvimento

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

entendido isso, pergunte como pode ajuduar com o codigo.