# 🚀 PROMPT PARA NOVO CHAT - REFATORAÇÃO DE RELATÓRIOS

**Use este prompt para iniciar um novo chat sem contexto anterior.**

---

## 📋 PROMPT COMPLETO

```
Olá! Preciso que você execute uma refatoração completa no sistema de relatórios do meu projeto.

**CONTEXTO:**
Sou empresário desenvolvendo um sistema financeiro pessoal para uso próprio.
Stack: Next.js 15.5 + React 19 + TypeScript + Supabase
Sistema multiusuário 100% funcional e em produção na Vercel.

**TAREFA:**
Executar refatoração completa do módulo de relatórios seguindo o plano detalhado.

**DOCUMENTAÇÃO OBRIGATÓRIA:**
Antes de começar, leia NESTA ORDEM:

1. **docs/Resumo.md** - Contexto geral do projeto e minhas preferências
2. **docs/desenvolvimento/REFATORACAO-RELATORIOS.md** - PLANO COMPLETO de execução (MAIS IMPORTANTE)
3. **docs/guias/QUICK-START.md** - Comandos e setup do projeto

**IMPORTANTE:**
- Siga o plano EXATAMENTE na ordem das fases (FASE 1 é crítica)
- Valide cada checkpoint antes de prosseguir para próxima fase
- Sempre teste após cada mudança
- Me mostre o progresso a cada tarefa concluída
- Peça aprovação antes de commits importantes

**EXPECTATIVA:**
- Comunicação simples e direta (não técnica demais)
- Resumos ao final de cada fase
- Alertas se encontrar problemas não previstos
- Tempo total estimado: 9-11 horas de trabalho

**PRIMEIRA AÇÃO:**
Leia os 3 documentos acima e me confirme:
1. O que você entendeu que precisa ser feito
2. Qual a primeira fase que vai executar
3. Quanto tempo estima para completar

Pode começar!
```

---

## 🎯 VARIAÇÃO CURTA (se quiser ir direto ao ponto)

```
Execute a refatoração completa do sistema de relatórios do meu projeto financeiro.

**Leia primeiro:**
1. docs/Resumo.md
2. docs/desenvolvimento/REFATORACAO-RELATORIOS.md (PLANO COMPLETO)
3. docs/guias/QUICK-START.md

**Regras:**
- Siga o plano na ordem exata das fases
- Valide cada checkpoint
- Me mostre progresso a cada tarefa
- Comunicação simples (sou empresário, não dev)

Comece lendo os documentos e me diga o que entendeu.
```

---

## 🔧 VARIAÇÃO TÉCNICA (se quiser detalhes logo)

```
# Refatoração Sistema de Relatórios - Eliminação de Duplicação

**Projeto:** Sistema Controle Financeiro Pessoal
**Stack:** Next.js 15.5 + React 19 + TypeScript + Supabase
**Branch:** Criar `refactor/relatorios-limpeza`

**Problema:**
- 6 SQL functions faltando (ROI e Fluxo de Caixa não funcionam)
- 546 linhas de código duplicado (25% do total)
- 11 console.error ao invés de logger.ts
- 3 implementações diferentes de cache

**Plano de Execução:**
Ver: `docs/desenvolvimento/REFATORACAO-RELATORIOS.md`

**Fases:**
1. Criar 6 SQL functions (4-6h) - CRÍTICO
2. Consolidar cálculo de datas (2h) - 400 linhas duplicadas
3. Unificar cache em CacheManager (3h) - 120 linhas duplicadas
4. Substituir console por logger (30min)
5. Centralizar formatação (30min)
6. Validação completa (1h)
7. Commit e deploy (30min)

**Documentação:**
- docs/Resumo.md - Contexto
- docs/desenvolvimento/REFATORACAO-RELATORIOS.md - PLANO DETALHADO
- docs/guias/QUICK-START.md - Comandos

**Começar por:**
FASE 1 - Criar SQL functions (desbloqueia relatórios)

Leia o plano completo e confirme entendimento antes de começar.
```

---

## 💡 DICAS DE USO

### Se Claude perguntar "O que fazer primeiro?"

Responda:
```
Leia docs/desenvolvimento/REFATORACAO-RELATORIOS.md
Comece pela FASE 1 (SQL functions)
```

### Se Claude pedir mais contexto

Responda:
```
Tudo está em docs/desenvolvimento/REFATORACAO-RELATORIOS.md
Leia esse documento primeiro, tem TUDO detalhado
```

### Se Claude quiser fazer de forma diferente

Responda:
```
Siga o plano EXATAMENTE como está no documento
Só mude se encontrar um bloqueio real
Me avise antes de desviar do plano
```

### Se Claude concluir uma fase

Peça:
```
Mostre um resumo do que foi feito
Valide o checkpoint da fase
Me confirme que posso aprovar para prosseguir
```

---

## ⚠️ AVISOS IMPORTANTES

### NÃO fazer

- ❌ Pular a FASE 1 (SQL functions são críticas)
- ❌ Modificar estrutura de arquivos além do plano
- ❌ Fazer tudo de uma vez sem checkpoints
- ❌ Commitar sem testar

### SEMPRE fazer

- ✅ Ler o plano completo antes de começar
- ✅ Validar cada checkpoint
- ✅ Testar após cada fase
- ✅ Mostrar progresso ao Ricardo
- ✅ Pedir aprovação antes de commits

---

## 📊 PROGRESSO ESPERADO

### FASE 1 (4-6h)
**Resultado:** "✅ 6 SQL functions criadas, relatórios funcionando"

### FASE 2 (2h)
**Resultado:** "✅ ~400 linhas removidas, cálculo de datas centralizado"

### FASE 3 (3h)
**Resultado:** "✅ ~120 linhas removidas, cache unificado"

### FASE 4 (30min)
**Resultado:** "✅ 11 console.error substituídos por logger.ts"

### FASE 5 (30min)
**Resultado:** "✅ Formatação centralizada"

### FASE 6 (1h)
**Resultado:** "✅ Tudo testado e validado"

### FASE 7 (30min)
**Resultado:** "✅ Código commitado e em produção"

---

## 🎯 EXEMPLO DE INTERAÇÃO IDEAL

**Você:**
```
[Colar prompt acima]
```

**Claude:**
```
Olá! Li os 3 documentos. Entendi que preciso:

1. Criar 6 funções SQL no Supabase (4 para ROI, 2 para Fluxo de Caixa)
2. Consolidar código duplicado em 3 utilitários
3. Unificar sistema de cache
4. Padronizar logs
5. Centralizar formatação

Total: -546 linhas de código duplicado
Resultado: 3 relatórios 100% funcionais

Primeira fase: Criar SQL functions
Tempo estimado FASE 1: 4-6 horas

Posso começar pela Tarefa 1.1 (calcular_roi_clientes)?
```

**Você:**
```
Sim, pode começar! Me mostre cada função antes de aplicar no Supabase.
```

**Claude:**
```
[Executa Tarefa 1.1 e mostra o código SQL]
```

**Você:**
```
Aprovado, pode aplicar e prosseguir para próxima.
```

[E assim sucessivamente...]

---

## ✅ CHECKLIST DE CONCLUSÃO

Ao final, Claude deve confirmar:

- [ ] 7 fases completadas
- [ ] Todos checkpoints validados
- [ ] TypeScript compila sem erro
- [ ] Build passa sem warning
- [ ] 3 relatórios funcionando
- [ ] Cache persistente funciona
- [ ] Código commitado
- [ ] Deploy em produção

---

**Este prompt foi gerado automaticamente pelo sistema**
**Data:** 2025-10-17
**Baseado em:** Análise completa de saúde do código dos relatórios
