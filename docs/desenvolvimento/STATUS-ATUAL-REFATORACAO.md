# 📊 STATUS ATUAL - REFATORAÇÃO RELATÓRIOS

**Última atualização:** 2025-10-17 23:30
**Sessão:** Chat encerrado por limite de contexto

---

## ✅ O QUE ESTÁ FUNCIONANDO

### ROI por Cliente - ✅ 100% FUNCIONAL

**URL:** http://localhost:3003/relatorios/roi-cliente

**Status:** Totalmente funcional após correção das funções SQL

**Arquivos principais:**
```
src/
├── app/(protected)/relatorios/roi-cliente/page.tsx
├── app/api/roi-clientes/route.ts
├── hooks/usar-roi-clientes.ts
├── servicos/supabase/roi-cliente-queries.ts
├── tipos/roi-cliente.ts
└── componentes/relatorios/roi-cliente/
    ├── cards-kpi.tsx
    ├── filtros-roi.tsx
    ├── grafico-evolucao.tsx
    ├── linha-cliente-expandida.tsx
    └── tabela-roi.tsx
```

**Funções SQL corrigidas (2025-10-17):**
- `calcular_roi_clientes(p_workspace_id, p_data_inicio, p_data_fim)`
- `calcular_kpis_roi_clientes(p_workspace_id, p_mes)`
- `buscar_detalhes_roi_cliente(p_workspace_id, p_cliente_id, p_data_inicio, p_data_fim)`
- `buscar_evolucao_roi_cliente(p_workspace_id, p_cliente_id, p_data_inicio, p_data_fim)`

**Mudança aplicada:** De `r_contatos.contato_id` → `fp_centros_custo.centro_custo_id`

**Dados validados:**
- 3 clientes com movimentações no workspace "Conecta"
- Totais: R$ 61.740 receita | R$ 4.512,75 despesa

---

## ❌ O QUE NÃO EXISTE (PLANEJADO MAS NÃO IMPLEMENTADO)

### 1. Fluxo de Caixa Projetado
- ❌ Nunca foi implementado
- ❌ Não há arquivos no git
- ❌ Planejado em `docs/PLANO-FLUXO-CAIXA-PROJETADO.md`

### 2. Contas a Pagar/Receber
- ❌ Nunca foi implementado
- ❌ Não há arquivos no git
- ❌ Planejado em `docs/specs/PLANO-IMPLEMENTACAO-CONTAS-PAGAR-RECEBER.md`

---

## 🔴 PROBLEMAS IDENTIFICADOS

### Código Duplicado em `roi-cliente-queries.ts`

**Arquivo:** `src/servicos/supabase/roi-cliente-queries.ts`

**Duplicação:** Cálculo de datas repetido **3 vezes** (linhas 13-45, 87-119, 126-158)

**Código duplicado:**
```typescript
// REPETIDO 3 VEZES!
const hoje = new Date()
switch (filtros.periodo) {
  case 'mes_atual':
    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString().split('T')[0]
    // ... mais 30 linhas
}
```

**Total:** ~100 linhas duplicadas no único arquivo existente

---

## 📝 PRÓXIMAS TAREFAS (PARA NOVO CHAT)

### FASE 3: Consolidar Cálculo de Datas no ROI (1h)

**Objetivo:** Eliminar ~100 linhas duplicadas em `roi-cliente-queries.ts`

**Passos:**
1. Criar `src/utilitarios/periodo-helpers.ts` com função `calcularDatasPorPeriodo()`
2. Refatorar apenas as 3 funções em `roi-cliente-queries.ts`:
   - `buscarDadosROIClientes()` (linha ~13)
   - `buscarDetalhesCliente()` (linha ~87)
   - `buscarEvolucaoCliente()` (linha ~126)
3. Validar TypeScript: `npx tsc --noEmit`
4. Testar no navegador: http://localhost:3003/relatorios/roi-cliente
5. Verificar se dados continuam aparecendo

**IMPORTANTE:**
- Só refatorar `roi-cliente-queries.ts` (único arquivo existente)
- NÃO criar `fluxo-caixa-queries.ts` nem `contas-queries.ts`
- Testar imediatamente após cada mudança

---

### FASE 4: Consolidar Cache no ROI (1h)

**Objetivo:** Usar `CacheManager` existente ao invés de cache manual

**Arquivo alvo:** `src/hooks/usar-roi-clientes.ts` (linhas 7-72)

**Código duplicado:**
- 4 funções manuais de cache (60+ linhas)
- `salvarROIClientesCache()`, `carregarROIClientesCache()`
- `salvarROIKPIsCache()`, `carregarROIKPIsCache()`

**Solução:** Usar `src/utilitarios/cache-manager.ts` (já existe e está completo)

---

### FASE 5: Substituir console.error por logger (15min)

**Arquivo:** `src/servicos/supabase/roi-cliente-queries.ts`

**Ocorrências:**
- Linha 54: `console.error('Erro ao buscar ROI clientes:', error)`
- Linha 91: `console.error('Erro ao buscar KPIs:', error)`
- Linha 158: `console.error('Erro ao buscar detalhes do cliente:', error)`
- Linha 229: `console.error('Erro ao buscar evolução do cliente:', error)`

**Solução:** Usar `logger` de `@/utilitarios/logger`

---

## 🎯 GANHOS ESPERADOS (APÓS FASES 3-5)

- ✅ ROI continua 100% funcional
- ✅ ~160 linhas de código duplicado removidas
- ✅ Código centralizado e mais fácil de manter
- ✅ Logs padronizados

**Tempo total:** ~2-3 horas

---

## 📚 DOCUMENTOS DE REFERÊNCIA

1. **Plano completo:** `docs/desenvolvimento/REFATORACAO-RELATORIOS.md`
2. **Especificação ROI:** `docs/specs/PLANO-IMPLEMENTACAO-ROI-CLIENTE.md`
3. **Resumo do projeto:** `docs/Resumo.md`
4. **Comandos:** `docs/guias/COMANDOS.md`

---

## ⚠️ AVISOS IMPORTANTES

### Para o Próximo Chat:

1. **ROI está funcionando** - não quebrar!
2. **Fluxo e Contas não existem** - não tentar refatorar
3. **Testar após cada mudança** - validar antes de prosseguir
4. **Só refatorar roi-cliente-queries.ts** - único arquivo real
5. **Usar TypeScript strict** - `npx tsc --noEmit` obrigatório

### Comandos Úteis:

```bash
# Validar TypeScript
npx tsc --noEmit

# Build de produção
npm run build

# Rodar em dev
npm run dev

# Ver funções SQL no Supabase
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE 'calcular_roi%';
```

---

## 🔗 URLs para Teste

- **ROI:** http://localhost:3003/relatorios/roi-cliente
- **Hub Relatórios:** http://localhost:3003/relatorios
- **Dashboard:** http://localhost:3003/dashboard

---

**FIM DO RESUMO**
