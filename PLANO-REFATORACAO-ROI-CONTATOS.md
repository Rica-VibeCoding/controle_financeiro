# 📋 PLANO DE REFATORAÇÃO - ROI POR CLIENTE (R_CONTATOS)

**Data:** 21/10/2025
**Responsável:** Claude + Ricardo
**Status:** ✅ FASE 3 CONCLUÍDA - SISTEMA FUNCIONANDO

## 📊 PROGRESSO

- ✅ **FASE 1 COMPLETA** - 4 funções SQL criadas e testadas
- ✅ **FASE 2 COMPLETA** - Código TypeScript atualizado
- ✅ **FASE 3 COMPLETA** - Interface testada e funcionando
- ⏳ **FASE 4 PENDENTE** - Limpeza (opcional)

## ✅ FASE 1 - EXECUTADA COM SUCESSO

### **4 Funções SQL Criadas:**
1. ✅ `calcular_roi_clientes_v2` - Lista clientes com ROI (receita, despesa, lucro, margem)
2. ✅ `calcular_kpis_roi_clientes_v2` - KPIs dos 3 cards superiores
3. ✅ `buscar_detalhes_roi_cliente_v2` - Detalhes por categoria (receitas + despesas)
4. ✅ `buscar_evolucao_roi_cliente_v2` - Série temporal mensal

### **Migrations Aplicadas:**
- `create_calcular_roi_clientes_v2`
- `create_calcular_kpis_roi_clientes_v2`
- `create_buscar_detalhes_roi_cliente_v2`
- `fix_buscar_detalhes_roi_cliente_v2` (correção de aggregate nested)
- `create_buscar_evolucao_roi_cliente_v2`

### **Testes Realizados:**
- ✅ Workspace "WoodPro+" (19 clientes com transações)
- ✅ Cliente "Luiz Carlos" - R$ 60.000 receita, 100% margem
- ✅ Cliente "Leandro Bergami" - R$ 76.335 receita, 66.7% margem
- ✅ KPIs calculando corretamente (margem mensal: 74.38%, lucro: R$ 79.092)
- ✅ Detalhes por categoria funcionando
- ✅ Evolução mensal retornando série temporal

### **Resultado:**
Todas as funções SQL estão operacionais e retornando dados corretos de `r_contatos`.

---

## ✅ FASE 2 - EXECUTADA COM SUCESSO

### **Arquivo Atualizado:**
- `src/servicos/supabase/roi-cliente-queries.ts`

### **Mudanças Realizadas:**
1. ✅ Linha 5: Comentário atualizado (Centro de Custo → Cliente r_contatos)
2. ✅ Linha 47: `calcular_roi_clientes` → `calcular_roi_clientes_v2`
3. ✅ Linha 85: `calcular_kpis_roi_clientes` → `calcular_kpis_roi_clientes_v2`
4. ✅ Linha 150: `buscar_detalhes_roi_cliente` → `buscar_detalhes_roi_cliente_v2`
5. ✅ Linha 221: `buscar_evolucao_roi_cliente` → `buscar_evolucao_roi_cliente_v2`

### **Validação:**
- ✅ TypeScript sem erros (`npx tsc --noEmit`)
- ✅ Tipos e interfaces mantidos (sem breaking changes)

### **Resultado:**
Código TypeScript atualizado para chamar funções _v2 que usam `r_contatos`.

---

## ✅ FASE 3 - VALIDADA PELO USUÁRIO

### **Testes Realizados:**
- ✅ Interface `/relatorios/roi-cliente` acessada
- ✅ Clientes de `r_contatos` aparecendo corretamente
- ✅ Dados reais sendo exibidos
- ✅ Filtros funcionando
- ✅ Expansão de clientes operacional
- ✅ Gráficos renderizando

### **Resultado:**
Sistema 100% funcional usando `r_contatos` ao invés de `fp_centros_custo`.

---

## 🎉 REFATORAÇÃO CONCLUÍDA COM SUCESSO

A tela de **ROI por Cliente** agora:
- ✅ Usa a tabela correta (`r_contatos`)
- ✅ Mostra clientes reais do sistema
- ✅ Dados batem com transações reais
- ✅ Sistema alinhado com modelo de negócio

---

## 🎯 OBJETIVO

Refatorar o relatório de ROI por Cliente para usar a tabela **`r_contatos`** (com `tipo_pessoa = 'cliente'`) ao invés de **`fp_centros_custo`**.

---

## ❌ PROBLEMA ATUAL

### **Implementação Incorreta:**
- Tela busca dados de **`fp_centros_custo`** (centros de custo/projetos)
- Deveria buscar de **`r_contatos`** onde `tipo_pessoa = 'cliente'`

### **Dados Reais:**
- ✅ **25 clientes ativos** na tabela `r_contatos` (2 workspaces)
- ✅ **Campo `contato_id`** já existe em `fp_transacoes` e está populado
- ✅ Clientes JÁ possuem transações vinculadas (exemplo: "Luiz Carlos" com R$ 60k)

### **Funções SQL Atuais (ERRADAS):**
```sql
calcular_roi_clientes          → usa centro_custo_id ❌
calcular_kpis_roi_clientes     → usa centro_custo_id ❌
buscar_detalhes_roi_cliente    → usa centro_custo_id ❌
buscar_evolucao_roi_cliente    → usa centro_custo_id ❌
```

### **Funções SQL Corretas (JÁ EXISTEM!):**
```sql
calcular_roi_contatos_otimizado → usa contato_id ✅
calcular_roi_contato            → usa contato_id ✅
ranking_vendedores_roi          → usa contato_id ✅
```

---

## ✅ SOLUÇÃO

### **Estratégia:**
1. Criar **4 novas funções SQL** usando `r_contatos`
2. Manter nomes similares mas com sufixo `_v2` para não quebrar nada
3. Atualizar código TypeScript para chamar as novas funções
4. Testar com dados reais
5. Depois de validar, remover funções antigas

---

## 📝 ETAPAS DA REFATORAÇÃO

### **FASE 1: Criar Funções SQL (4 migrations)** ⏱️ ~30min

#### **1.1 - Migration: `calcular_roi_clientes_v2`**
```sql
-- Substitui: calcular_roi_clientes (que usa centro_custo_id)
-- Nova versão: usa r_contatos.id (tipo_pessoa = 'cliente')

CREATE OR REPLACE FUNCTION calcular_roi_clientes_v2(
  p_workspace_id uuid,
  p_data_inicio date DEFAULT NULL,
  p_data_fim date DEFAULT NULL
)
RETURNS TABLE(
  cliente_id uuid,
  cliente_nome text,
  receita numeric,
  despesa numeric,
  lucro numeric,
  margem numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS cliente_id,
    c.nome::TEXT AS cliente_nome,
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
  FROM r_contatos c
  LEFT JOIN fp_transacoes t ON t.contato_id = c.id
    AND t.workspace_id = p_workspace_id
    AND t.contato_id IS NOT NULL
    AND (p_data_inicio IS NULL OR t.data::DATE >= p_data_inicio)
    AND (p_data_fim IS NULL OR t.data::DATE <= p_data_fim)
  WHERE c.workspace_id = p_workspace_id
    AND c.tipo_pessoa = 'cliente'
    AND c.ativo = true
  GROUP BY c.id, c.nome
  HAVING COUNT(t.id) > 0
  ORDER BY margem DESC NULLS LAST;
END;
$$;
```

#### **1.2 - Migration: `calcular_kpis_roi_clientes_v2`**
```sql
-- Substitui: calcular_kpis_roi_clientes
-- Calcula KPIs do mês atual usando r_contatos

CREATE OR REPLACE FUNCTION calcular_kpis_roi_clientes_v2(
  p_workspace_id uuid,
  p_mes text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_data_inicio DATE;
  v_data_fim DATE;
  v_result JSON;
BEGIN
  -- Calcular datas do mês
  v_data_inicio := (p_mes || '-01')::DATE;
  v_data_fim := (v_data_inicio + INTERVAL '1 month - 1 day')::DATE;

  -- Construir JSON com os 3 KPIs
  SELECT json_build_object(
    'melhorRoiPercentual', (
      SELECT json_build_object('cliente', cliente_nome, 'valor', margem)
      FROM calcular_roi_clientes_v2(p_workspace_id, v_data_inicio, v_data_fim)
      ORDER BY margem DESC LIMIT 1
    ),
    'melhorRoiValor', (
      SELECT json_build_object('cliente', cliente_nome, 'valor', lucro)
      FROM calcular_roi_clientes_v2(p_workspace_id, v_data_inicio, v_data_fim)
      ORDER BY lucro DESC LIMIT 1
    ),
    'margemMensal', (
      SELECT json_build_object(
        'percentual',
        CASE WHEN SUM(receita) > 0
          THEN (SUM(lucro) / SUM(receita) * 100)
          ELSE 0
        END,
        'lucroTotal', SUM(lucro)
      )
      FROM calcular_roi_clientes_v2(p_workspace_id, v_data_inicio, v_data_fim)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
```

#### **1.3 - Migration: `buscar_detalhes_roi_cliente_v2`**
```sql
-- Substitui: buscar_detalhes_roi_cliente
-- Busca detalhes por categoria usando r_contatos

CREATE OR REPLACE FUNCTION buscar_detalhes_roi_cliente_v2(
  p_workspace_id uuid,
  p_cliente_id uuid,
  p_data_inicio date DEFAULT NULL,
  p_data_fim date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'receitas', COALESCE((
      SELECT json_agg(json_build_object(
        'categoria', cat.nome,
        'subcategoria', COALESCE(sub.nome, 'Sem subcategoria'),
        'valor', SUM(t.valor),
        'quantidade', COUNT(t.id),
        'percentual', ROUND((SUM(t.valor) / NULLIF(total_receita.total, 0) * 100)::NUMERIC, 2)
      ))
      FROM fp_transacoes t
      INNER JOIN fp_categorias cat ON cat.id = t.categoria_id
      LEFT JOIN fp_subcategorias sub ON sub.id = t.subcategoria_id
      CROSS JOIN (
        SELECT SUM(valor) as total
        FROM fp_transacoes
        WHERE workspace_id = p_workspace_id
          AND contato_id = p_cliente_id
          AND tipo = 'receita'
          AND (p_data_inicio IS NULL OR data::DATE >= p_data_inicio)
          AND (p_data_fim IS NULL OR data::DATE <= p_data_fim)
      ) total_receita
      WHERE t.workspace_id = p_workspace_id
        AND t.contato_id = p_cliente_id
        AND t.tipo = 'receita'
        AND (p_data_inicio IS NULL OR t.data::DATE >= p_data_inicio)
        AND (p_data_fim IS NULL OR t.data::DATE <= p_data_fim)
      GROUP BY cat.nome, sub.nome, total_receita.total
    ), '[]'::json),
    'despesas', COALESCE((
      SELECT json_agg(json_build_object(
        'categoria', cat.nome,
        'subcategoria', COALESCE(sub.nome, 'Sem subcategoria'),
        'valor', SUM(t.valor),
        'quantidade', COUNT(t.id),
        'percentual', ROUND((SUM(t.valor) / NULLIF(total_despesa.total, 0) * 100)::NUMERIC, 2)
      ))
      FROM fp_transacoes t
      INNER JOIN fp_categorias cat ON cat.id = t.categoria_id
      LEFT JOIN fp_subcategorias sub ON sub.id = t.subcategoria_id
      CROSS JOIN (
        SELECT SUM(valor) as total
        FROM fp_transacoes
        WHERE workspace_id = p_workspace_id
          AND contato_id = p_cliente_id
          AND tipo = 'despesa'
          AND (p_data_inicio IS NULL OR data::DATE >= p_data_inicio)
          AND (p_data_fim IS NULL OR data::DATE <= p_data_fim)
      ) total_despesa
      WHERE t.workspace_id = p_workspace_id
        AND t.contato_id = p_cliente_id
        AND t.tipo = 'despesa'
        AND (p_data_inicio IS NULL OR t.data::DATE >= p_data_inicio)
        AND (p_data_fim IS NULL OR t.data::DATE <= p_data_fim)
      GROUP BY cat.nome, sub.nome, total_despesa.total
    ), '[]'::json),
    'totais', (
      SELECT json_build_object(
        'receita', COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0),
        'despesa', COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0)
      )
      FROM fp_transacoes
      WHERE workspace_id = p_workspace_id
        AND contato_id = p_cliente_id
        AND (p_data_inicio IS NULL OR data::DATE >= p_data_inicio)
        AND (p_data_fim IS NULL OR data::DATE <= p_data_fim)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
```

#### **1.4 - Migration: `buscar_evolucao_roi_cliente_v2`**
```sql
-- Substitui: buscar_evolucao_roi_cliente
-- Busca série temporal mensal usando r_contatos

CREATE OR REPLACE FUNCTION buscar_evolucao_roi_cliente_v2(
  p_workspace_id uuid,
  p_cliente_id uuid,
  p_data_inicio date DEFAULT NULL,
  p_data_fim date DEFAULT NULL
)
RETURNS TABLE(
  mes text,
  mes_numero integer,
  ano integer,
  receita numeric,
  despesa numeric,
  lucro numeric,
  margem numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH meses AS (
    SELECT
      TO_CHAR(mes_data, 'Mon/YYYY') as mes,
      EXTRACT(MONTH FROM mes_data)::INTEGER as mes_numero,
      EXTRACT(YEAR FROM mes_data)::INTEGER as ano,
      mes_data
    FROM generate_series(
      COALESCE(p_data_inicio, (SELECT MIN(data) FROM fp_transacoes WHERE workspace_id = p_workspace_id AND contato_id = p_cliente_id)),
      COALESCE(p_data_fim, (SELECT MAX(data) FROM fp_transacoes WHERE workspace_id = p_workspace_id AND contato_id = p_cliente_id)),
      '1 month'::interval
    ) mes_data
  )
  SELECT
    m.mes,
    m.mes_numero,
    m.ano,
    COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END), 0)::NUMERIC as receita,
    COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END), 0)::NUMERIC as despesa,
    (COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END), 0) -
     COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END), 0))::NUMERIC as lucro,
    CASE
      WHEN SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) > 0 THEN
        (((SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) -
           SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END)) /
          SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END)) * 100)::NUMERIC
      ELSE 0::NUMERIC
    END as margem
  FROM meses m
  LEFT JOIN fp_transacoes t ON
    t.workspace_id = p_workspace_id
    AND t.contato_id = p_cliente_id
    AND EXTRACT(YEAR FROM t.data) = m.ano
    AND EXTRACT(MONTH FROM t.data) = m.mes_numero
  GROUP BY m.mes, m.mes_numero, m.ano
  ORDER BY m.ano, m.mes_numero;
END;
$$;
```

---

### **FASE 2: Atualizar Código TypeScript** ⏱️ ~15min

#### **2.1 - Atualizar `roi-cliente-queries.ts`**

**Arquivo:** `src/servicos/supabase/roi-cliente-queries.ts`

**Mudanças:**
```typescript
// Linha 47: Trocar função
- const { data, error } = await supabase.rpc('calcular_roi_clientes', {
+ const { data, error } = await supabase.rpc('calcular_roi_clientes_v2', {

// Linha 85: Trocar função
- const { data, error } = await supabase.rpc('calcular_kpis_roi_clientes', {
+ const { data, error } = await supabase.rpc('calcular_kpis_roi_clientes_v2', {

// Linha 150: Trocar função
- const { data, error } = await supabase.rpc('buscar_detalhes_roi_cliente', {
+ const { data, error } = await supabase.rpc('buscar_detalhes_roi_cliente_v2', {

// Linha 221: Trocar função
- const { data, error } = await supabase.rpc('buscar_evolucao_roi_cliente', {
+ const { data, error } = await supabase.rpc('buscar_evolucao_roi_cliente_v2', {
```

**Total:** 4 linhas alteradas

---

### **FASE 3: Testar** ⏱️ ~20min

#### **3.1 - Testes no Banco**
```sql
-- Teste 1: Listar clientes com ROI
SELECT * FROM calcular_roi_clientes_v2(
  '<workspace_id>',
  NULL,
  NULL
);

-- Teste 2: KPIs do mês
SELECT * FROM calcular_kpis_roi_clientes_v2(
  '<workspace_id>',
  '2025-10'
);

-- Teste 3: Detalhes de um cliente específico
SELECT * FROM buscar_detalhes_roi_cliente_v2(
  '<workspace_id>',
  '<cliente_id>',
  NULL,
  NULL
);

-- Teste 4: Evolução mensal
SELECT * FROM buscar_evolucao_roi_cliente_v2(
  '<workspace_id>',
  '<cliente_id>',
  NULL,
  NULL
);
```

#### **3.2 - Testes na Interface**
1. Acessar: http://localhost:3003/relatorios/roi-cliente
2. Verificar se os 25 clientes aparecem
3. Testar filtros de período
4. Expandir um cliente e verificar detalhes
5. Verificar gráfico de evolução

---

### **FASE 4: Limpeza (Opcional)** ⏱️ ~10min

**Depois de validar:**
```sql
-- Remover funções antigas (se tudo estiver OK)
DROP FUNCTION IF EXISTS calcular_roi_clientes;
DROP FUNCTION IF EXISTS calcular_kpis_roi_clientes;
DROP FUNCTION IF EXISTS buscar_detalhes_roi_cliente;
DROP FUNCTION IF EXISTS buscar_evolucao_roi_cliente;

-- Renomear funções v2 para nomes originais (opcional)
ALTER FUNCTION calcular_roi_clientes_v2 RENAME TO calcular_roi_clientes;
-- ... (repetir para as outras 3)
```

---

## 📊 ARQUIVOS AFETADOS

### **SQL (Migrations):**
1. ✅ `create_calcular_roi_clientes_v2.sql`
2. ✅ `create_calcular_kpis_roi_clientes_v2.sql`
3. ✅ `create_buscar_detalhes_roi_cliente_v2.sql`
4. ✅ `create_buscar_evolucao_roi_cliente_v2.sql`

### **TypeScript:**
1. ✅ `src/servicos/supabase/roi-cliente-queries.ts` (4 linhas)

### **Componentes (SEM MUDANÇAS):**
- ❌ `src/app/(protected)/relatorios/roi-cliente/page.tsx`
- ❌ `src/componentes/relatorios/roi-cliente/*`
- ❌ `src/hooks/usar-roi-clientes.ts`
- ❌ `src/tipos/roi-cliente.ts`

**Motivo:** Tipos e interfaces permanecem iguais, apenas a fonte de dados muda.

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **Banco de Dados:**
- [ ] 4 funções SQL criadas com sucesso
- [ ] Funções retornam dados de `r_contatos`
- [ ] Isolamento por `workspace_id` funcionando
- [ ] Performance aceitável (<1s para 25 clientes)

### **Código TypeScript:**
- [ ] 4 chamadas RPC atualizadas
- [ ] Build sem erros (`npm run build`)
- [ ] TypeScript sem erros (`npx tsc --noEmit`)

### **Interface:**
- [ ] Tela carrega sem erros
- [ ] Lista mostra 25 clientes (dados reais)
- [ ] Cards KPI mostram valores corretos
- [ ] Filtros funcionam (período, ordenação)
- [ ] Expandir cliente mostra detalhes
- [ ] Gráfico de evolução aparece

### **Dados:**
- [ ] Receitas corretas por cliente
- [ ] Despesas corretas por cliente
- [ ] Cálculo de margem correto
- [ ] Totais batem com transações reais

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Funções SQL com erro | Baixa | Alto | Testar no Supabase antes de aplicar |
| Performance lenta | Baixa | Médio | Índices já existem em `contato_id` |
| Dados não aparecem | Média | Alto | Validar `workspace_id` correto |
| Cache não atualiza | Média | Baixo | Limpar cache localStorage/SWR |

---

## 📈 RESULTADO ESPERADO

### **Antes (ERRADO):**
- Mostra centros de custo (projetos)
- Dados não correspondem aos clientes reais
- Confusão entre "cliente" e "projeto"

### **Depois (CORRETO):**
- ✅ Mostra 25 clientes reais de `r_contatos`
- ✅ ROI baseado em transações com `contato_id`
- ✅ Dados batem com a realidade financeira
- ✅ Sistema alinhado com o modelo de negócio

---

## 🚀 PRÓXIMOS PASSOS

1. **Ricardo aprovar** este plano
2. **Executar FASE 1** - Criar 4 migrations SQL
3. **Executar FASE 2** - Atualizar TypeScript
4. **Executar FASE 3** - Testar tudo
5. **Validar com Ricardo** - Ver se faz sentido
6. **FASE 4 (opcional)** - Limpar funções antigas

---

## 💬 PERGUNTAS PARA RICARDO

1. ✅ **Aprovação:** Posso começar a implementar?
2. ✅ **Nomenclatura:** Manter sufixo `_v2` ou outro nome?
3. ✅ **Dados de teste:** Tem algum cliente específico para validar?
4. ✅ **Timing:** Fazer agora ou agendar para outro momento?

---

**Aguardando aprovação para iniciar implementação...**
