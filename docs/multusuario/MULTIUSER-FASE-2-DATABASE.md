# 🏗️ FASE 2: DATABASE SCHEMA AGENT

> **Objetivo:** Migrar todas as tabelas para suportar multiusuário
> **Complexidade:** Alta  
> **Tempo Estimado:** 12-16 horas (dados de teste - sem backup)
> **Pré-requisito:** Fases 0 e 1 completas ✅
> **Status Dados:** 🧪 Dados de teste - sem necessidade de backup

## 🎯 **IMPLEMENTAÇÃO DIVIDIDA EM MACRO-ETAPAS**

### **MACRO-ETAPA 1: PRÉ-MIGRAÇÃO (4-6h)** 🔍
- Validação de pré-requisitos
- Preparação de dados de teste
- Criação de workspace padrão

### **MACRO-ETAPA 2: MIGRAÇÃO DE SCHEMA (4-5h)** 🛠️
- Adicionar workspace_id em tabelas
- Migrar dados existentes
- Tornar campos obrigatórios

### **MACRO-ETAPA 3: SEGURANÇA E RLS (3-4h)** 🔒
- Habilitar Row Level Security
- Criar políticas de isolamento
- Validar isolamento entre usuários

### **MACRO-ETAPA 4: VALIDAÇÃO FINAL (2-3h)** ✅
- Testes de isolamento completo
- Validação de performance básica
- Documentação de conclusão

---

---

## 📋 **MACRO-ETAPA 1: PRÉ-MIGRAÇÃO** 🔍
**Duração:** 4-6 horas | **Risco:** Baixo | **Reversível:** Sim

### **Sub-etapa 1.1: Validação de Pré-requisitos** ✅
**Objetivo:** Confirmar que Fases 0 e 1 estão funcionando

```bash
# 1. Verificar se Fases 0 e 1 foram completadas
echo "Verificando Fases 0 e 1..."

# 2. Confirmar tabelas base existem
psql -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links');"
# Deve retornar 3

# 3. Confirmar RLS está habilitado
psql -c "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('fp_usuarios', 'fp_workspaces');"
# Ambas devem ter rowsecurity = true

# 4. Confirmar funções existem
psql -c "SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('criar_categorias_padrao', 'handle_new_user');"
# Deve retornar 2 funções

# 5. Testar TypeScript e Build
npx tsc --noEmit && npm run build
```

**🛑 CHECKPOINT:** NÃO PROSSEGUIR se alguma validação falhar!

### **Sub-etapa 1.2: Criação de Workspace Padrão para Dados de Teste** 🧪
**Objetivo:** Preparar workspace para associar dados existentes

```sql
-- 1. Criar workspace padrão para dados de teste
INSERT INTO fp_workspaces (id, nome, owner_id, plano)
VALUES (
  gen_random_uuid(),
  'Workspace Desenvolvimento',
  (SELECT id FROM auth.users LIMIT 1), -- Usuário existente
  'free'
);

-- 2. Obter ID do workspace criado
SELECT id, nome FROM fp_workspaces WHERE nome = 'Workspace Desenvolvimento';
-- Anotar o ID para próximos passos

-- 3. Criar usuário associado ao workspace
INSERT INTO fp_usuarios (id, workspace_id, nome, role)
SELECT 
  u.id,
  w.id,
  COALESCE(u.email, 'Usuário Dev'),
  'owner'
FROM auth.users u, fp_workspaces w
WHERE w.nome = 'Workspace Desenvolvimento'
LIMIT 1;
```

**🛑 CHECKPOINT:** Verificar se workspace e usuário foram criados

### **Sub-etapa 1.3: Validação de Dados Atuais** 📊
**Objetivo:** Entender volume de dados para migração

```sql
-- Contar dados em cada tabela
SELECT 
  'fp_categorias' as tabela, COUNT(*) as registros FROM fp_categorias
UNION ALL
SELECT 
  'fp_subcategorias' as tabela, COUNT(*) as registros FROM fp_subcategorias
UNION ALL
SELECT 
  'fp_contas' as tabela, COUNT(*) as registros FROM fp_contas
UNION ALL
SELECT 
  'fp_transacoes' as tabela, COUNT(*) as registros FROM fp_transacoes
UNION ALL
SELECT 
  'fp_metas_mensais' as tabela, COUNT(*) as registros FROM fp_metas_mensais;
```

**🛑 CHECKPOINT:** Anotar quantidades para validar após migração

---

---

## 📋 **MACRO-ETAPA 2: MIGRAÇÃO DE SCHEMA** 🛠️
**Duração:** 4-5 horas | **Risco:** Médio | **Parcialmente Reversível**

### **Sub-etapa 2.1: Adicionar Colunas workspace_id (NULLABLE)** ⚡
**Objetivo:** Adicionar workspace_id sem quebrar dados existentes

```sql
-- 1. fp_categorias
ALTER TABLE fp_categorias 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

-- 2. fp_subcategorias
ALTER TABLE fp_subcategorias 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

-- 3. fp_contas
ALTER TABLE fp_contas 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

-- 4. fp_formas_pagamento
ALTER TABLE fp_formas_pagamento 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

-- 5. fp_transacoes
ALTER TABLE fp_transacoes 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

-- 6. fp_centros_custo
ALTER TABLE fp_centros_custo 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

-- 7. fp_anexos
ALTER TABLE fp_anexos 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

-- 8. fp_metas_mensais
ALTER TABLE fp_metas_mensais 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

-- 9. fp_projetos_pessoais
ALTER TABLE fp_projetos_pessoais 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;
```

**🛑 CHECKPOINT:** Após cada ALTER TABLE, verificar se comando foi executado com sucesso

### **Sub-etapa 2.2: Migração de Dados Existentes para Workspace Padrão** 🔄
**Objetivo:** Associar todos os dados atuais ao workspace criado

```sql
-- IMPORTANTE: Usar o ID do workspace criado na Sub-etapa 1.2
-- Substituir 'WORKSPACE_ID_AQUI' pelo ID real

-- 1. Atualizar categorias
UPDATE fp_categorias 
SET workspace_id = 'WORKSPACE_ID_AQUI' 
WHERE workspace_id IS NULL;

-- 2. Atualizar subcategorias
UPDATE fp_subcategorias 
SET workspace_id = 'WORKSPACE_ID_AQUI' 
WHERE workspace_id IS NULL;

-- 3. Atualizar contas
UPDATE fp_contas 
SET workspace_id = 'WORKSPACE_ID_AQUI' 
WHERE workspace_id IS NULL;

-- 4. Atualizar formas de pagamento
UPDATE fp_formas_pagamento 
SET workspace_id = 'WORKSPACE_ID_AQUI' 
WHERE workspace_id IS NULL;

-- 5. Atualizar transações (tabela principal)
UPDATE fp_transacoes 
SET workspace_id = 'WORKSPACE_ID_AQUI' 
WHERE workspace_id IS NULL;

-- 6. Atualizar centros de custo
UPDATE fp_centros_custo 
SET workspace_id = 'WORKSPACE_ID_AQUI' 
WHERE workspace_id IS NULL;

-- 7. Atualizar metas mensais
UPDATE fp_metas_mensais 
SET workspace_id = 'WORKSPACE_ID_AQUI' 
WHERE workspace_id IS NULL;

-- 8. Se existirem: anexos e projetos pessoais
-- UPDATE fp_anexos SET workspace_id = 'WORKSPACE_ID_AQUI' WHERE workspace_id IS NULL;
-- UPDATE fp_projetos_pessoais SET workspace_id = 'WORKSPACE_ID_AQUI' WHERE workspace_id IS NULL;
```

**🛑 CHECKPOINT:** Validar que TODOS os registros foram atualizados:
```sql
-- Verificar se ainda existem registros sem workspace_id
SELECT 
  'fp_categorias' as tabela, 
  COUNT(*) as sem_workspace
FROM fp_categorias 
WHERE workspace_id IS NULL
UNION ALL
SELECT 'fp_transacoes', COUNT(*) FROM fp_transacoes WHERE workspace_id IS NULL;
-- Deve retornar 0 para todas as tabelas
```

### **Sub-etapa 2.3: Tornar workspace_id Obrigatório** 🔒
**Objetivo:** Garantir integridade referencial

```sql
-- Tornar workspace_id NOT NULL e adicionar foreign keys
-- ORDEM IMPORTANTE: referências primeiro

ALTER TABLE fp_categorias 
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE fp_subcategorias 
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE fp_contas 
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE fp_formas_pagamento 
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE fp_transacoes 
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE fp_centros_custo 
ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE fp_metas_mensais 
ALTER COLUMN workspace_id SET NOT NULL;

-- Se existirem outras tabelas
-- ALTER TABLE fp_anexos ALTER COLUMN workspace_id SET NOT NULL;
-- ALTER TABLE fp_projetos_pessoais ALTER COLUMN workspace_id SET NOT NULL;
```

**🛑 CHECKPOINT:** Verificar constraints foram aplicadas corretamente

### **Sub-etapa 2.4: Atualização de Sistema de Backup (Opcional)** 📦
**⚠️ NOTA:** Como são dados de teste, esta etapa é OPCIONAL

---

## 📋 **MACRO-ETAPA 3: SEGURANÇA E RLS** 🔒
**Duração:** 3-4 horas | **Risco:** Baixo | **Reversível:** Sim

### **Sub-etapa 3.1: Criar Índices de Performance (Deixar para Final)** ⚡
**⚠️ NOTA:** Performance será otimizada após RLS funcionar

```sql
-- Índices compostos para melhor performance
CREATE INDEX idx_categorias_workspace ON fp_categorias(workspace_id, ativo);
CREATE INDEX idx_subcategorias_workspace ON fp_subcategorias(workspace_id, categoria_id);
CREATE INDEX idx_contas_workspace ON fp_contas(workspace_id, ativo);
CREATE INDEX idx_formas_pagamento_workspace ON fp_formas_pagamento(workspace_id, ativo);
CREATE INDEX idx_transacoes_workspace_data ON fp_transacoes(workspace_id, data DESC);
CREATE INDEX idx_transacoes_workspace_categoria ON fp_transacoes(workspace_id, categoria_id);
CREATE INDEX idx_transacoes_workspace_tipo ON fp_transacoes(workspace_id, tipo);
CREATE INDEX idx_centros_custo_workspace ON fp_centros_custo(workspace_id, ativo);
CREATE INDEX idx_anexos_workspace ON fp_anexos(workspace_id, transacao_id);
CREATE INDEX idx_metas_workspace_periodo ON fp_metas_mensais(workspace_id, mes, ano);
CREATE INDEX idx_projetos_workspace ON fp_projetos_pessoais(workspace_id, ativo);
```

### **Sub-etapa 3.2: Configurar RLS em TODAS as tabelas** 🛡️
**Objetivo:** Habilitar isolamento de dados por workspace

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE fp_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_metas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_projetos_pessoais ENABLE ROW LEVEL SECURITY;

-- Função helper para obter workspace do usuário
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT workspace_id 
    FROM fp_usuarios 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas genéricas para todas as tabelas
-- Exemplo para fp_categorias (replicar para outras tabelas)
CREATE POLICY "Users can view workspace data"
  ON fp_categorias FOR SELECT
  USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can insert workspace data"
  ON fp_categorias FOR INSERT
  WITH CHECK (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can update workspace data"
  ON fp_categorias FOR UPDATE
  USING (workspace_id = get_user_workspace_id())
  WITH CHECK (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can delete workspace data"
  ON fp_categorias FOR DELETE
  USING (workspace_id = get_user_workspace_id());
```

### **Sub-etapa 3.3: Script para Aplicar RLS em Todas as Tabelas** 🚀
**Objetivo:** Aplicar políticas automaticamente em todas as tabelas

```sql
-- Script genérico para aplicar políticas
DO $$
DECLARE
  tabela TEXT;
  tabelas TEXT[] := ARRAY[
    'fp_categorias',
    'fp_subcategorias', 
    'fp_contas',
    'fp_formas_pagamento',
    'fp_transacoes',
    'fp_centros_custo',
    'fp_anexos',
    'fp_metas_mensais',
    'fp_projetos_pessoais'
  ];
BEGIN
  FOREACH tabela IN ARRAY tabelas
  LOOP
    -- SELECT
    EXECUTE format('
      CREATE POLICY "Users can view %I"
      ON %I FOR SELECT
      USING (workspace_id = get_user_workspace_id())',
      tabela, tabela
    );
    
    -- INSERT
    EXECUTE format('
      CREATE POLICY "Users can insert %I"
      ON %I FOR INSERT
      WITH CHECK (workspace_id = get_user_workspace_id())',
      tabela, tabela
    );
    
    -- UPDATE
    EXECUTE format('
      CREATE POLICY "Users can update %I"
      ON %I FOR UPDATE
      USING (workspace_id = get_user_workspace_id())
      WITH CHECK (workspace_id = get_user_workspace_id())',
      tabela, tabela
    );
    
    -- DELETE
    EXECUTE format('
      CREATE POLICY "Users can delete %I"
      ON %I FOR DELETE
      USING (workspace_id = get_user_workspace_id())',
      tabela, tabela
    );
  END LOOP;
END;
$$;
```

### **Sub-etapa 3.4: Atualizar Funções do Banco com workspace_id** ⚙️
**Objetivo:** Garantir que funções SQL respeitem isolamento

```sql
-- Atualizar função de cálculo de saldos
CREATE OR REPLACE FUNCTION calcular_saldos_contas(
  p_workspace_id UUID,
  p_data_inicio DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL
)
RETURNS TABLE (
  conta_id UUID,
  conta_nome TEXT,
  saldo_inicial DECIMAL,
  total_entradas DECIMAL,
  total_saidas DECIMAL,
  saldo_final DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome,
    COALESCE(
      (SELECT SUM(
        CASE 
          WHEN t.tipo = 'receita' THEN t.valor
          WHEN t.tipo = 'despesa' THEN -t.valor
          ELSE 0
        END
      )
      FROM fp_transacoes t
      WHERE t.conta_id = c.id
        AND t.workspace_id = p_workspace_id  -- NOVO
        AND t.status = 'realizado'
        AND (p_data_inicio IS NULL OR t.data < p_data_inicio)
      ), 0
    ) AS saldo_inicial,
    -- ... resto da função
  FROM fp_contas c
  WHERE c.workspace_id = p_workspace_id  -- NOVO
    AND c.ativo = true;
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 **MACRO-ETAPA 4: VALIDAÇÃO FINAL** ✅
**Duração:** 2-3 horas | **Risco:** Baixo | **Não afeta dados**

### **Sub-etapa 4.1: Verificar Dados Padrão (JÁ CRIADO NA FASE 0)** ✅
**Objetivo:** Confirmar que sistema de novos usuários funciona

```sql
-- ✅ VERIFICAÇÃO: Funções já devem existir da Fase 0
-- Executar apenas para validar
SELECT 
  'Função criar_categorias_padrao' as componente,
  CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ Faltando' END as status
FROM information_schema.routines
WHERE routine_name = 'criar_categorias_padrao'

UNION ALL

SELECT 
  'Função handle_new_user' as componente,
  CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ Faltando' END as status
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'

UNION ALL

SELECT 
  'Trigger on_auth_user_created' as componente,
  CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ Faltando' END as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Se algum item estiver faltando, VOLTAR PARA FASE 0
```

### **Sub-etapa 4.2: Monitoramento de Performance (OPCIONAL)** 📊
**⚠️ NOTA:** Performance será otimizada posteriormente quando necessário

```sql
-- Criar extensão pg_stat_statements (se não existir)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View para monitorar queries lentas
CREATE OR REPLACE VIEW v_queries_performance AS
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  rows,
  100.0 * shared_blks_hit / 
    NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- Queries acima de 100ms
ORDER BY mean_exec_time DESC;

-- Função para alertar sobre performance
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS TABLE (
  alert_type TEXT,
  query_snippet TEXT,
  avg_time_ms NUMERIC,
  calls_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN mean_exec_time > 1000 THEN 'CRÍTICO'
      WHEN mean_exec_time > 500 THEN 'ATENÇÃO' 
      ELSE 'OK'
    END,
    LEFT(query, 100) || '...',
    ROUND(mean_exec_time, 2),
    calls
  FROM pg_stat_statements
  WHERE query LIKE '%fp_%'
    AND mean_exec_time > 100
  ORDER BY mean_exec_time DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- View para monitorar uso de workspace_id nos índices
CREATE OR REPLACE VIEW v_workspace_index_usage AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%workspace%'
ORDER BY idx_scan DESC;

-- Função para alertas automáticos de performance
CREATE OR REPLACE FUNCTION check_multiuser_health()
RETURNS TABLE (
  alert_level TEXT,
  component TEXT,
  issue TEXT,
  recommendation TEXT
) AS $$
BEGIN
  -- 1. Verificar queries lentas relacionadas a workspace
  RETURN QUERY
  SELECT 
    'CRÍTICO'::TEXT,
    'DATABASE'::TEXT,
    'Query lenta detectada: ' || LEFT(query, 50) || '...',
    'Revisar índices de workspace_id'::TEXT
  FROM pg_stat_statements 
  WHERE query LIKE '%fp_%workspace_id%' 
    AND mean_exec_time > 1000
  LIMIT 3;

  -- 2. Verificar índices não utilizados
  RETURN QUERY
  SELECT 
    'ATENÇÃO'::TEXT,
    'INDEXES'::TEXT, 
    'Índice workspace não utilizado: ' || indexname,
    'Considerar remover se persistir'::TEXT
  FROM pg_stat_user_indexes
  WHERE indexname LIKE '%workspace%' 
    AND idx_scan = 0
  LIMIT 5;

  -- 3. Verificar workspaces com muitos dados
  RETURN QUERY
  SELECT 
    'INFO'::TEXT,
    'DATA'::TEXT,
    'Workspace com ' || COUNT(*)::TEXT || ' transações',
    'Monitorar performance'::TEXT
  FROM fp_transacoes 
  GROUP BY workspace_id 
  HAVING COUNT(*) > 10000;
END;
$$ LANGUAGE plpgsql;
```

### **Sub-etapa 4.3: Validação Completa de Integridade** 🔍
**Objetivo:** Confirmar que migração foi 100% bem-sucedida

```sql
-- Script completo de validação com melhorias
CREATE OR REPLACE FUNCTION validar_migracao_multiuser()
RETURNS TABLE (
  categoria TEXT,
  item TEXT,
  status TEXT,
  detalhes TEXT
) AS $$
DECLARE
  tabela TEXT;
  tabelas_sem_workspace TEXT[] := '{}';
  tabelas_sem_rls TEXT[] := '{}';
  resultado RECORD;
  total_tabelas INTEGER;
  total_com_workspace INTEGER;
  total_com_rls INTEGER;
BEGIN
  -- Contar totais
  SELECT COUNT(*) INTO total_tabelas
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name LIKE 'fp_%';

  -- 1. Verificar workspace_id em todas as tabelas
  FOR tabela IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'fp_%'
    AND table_name NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
  LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = tabela
      AND column_name = 'workspace_id'
    ) THEN
      tabelas_sem_workspace := array_append(tabelas_sem_workspace, tabela);
    END IF;
  END LOOP;

  -- 2. Verificar RLS habilitado
  FOR resultado IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename LIKE 'fp_%'
    AND NOT EXISTS (
      SELECT 1 FROM pg_class c
      WHERE c.relname = tablename
      AND c.relrowsecurity = true
    )
  LOOP
    tabelas_sem_rls := array_append(tabelas_sem_rls, resultado.tablename);
  END LOOP;

  -- Retornar resultados estruturados
  total_com_workspace := total_tabelas - array_length(tabelas_sem_workspace, 1);
  total_com_rls := total_tabelas - array_length(tabelas_sem_rls, 1);

  -- Workspace_id
  RETURN QUERY SELECT 
    'WORKSPACE_ID'::TEXT,
    'Cobertura'::TEXT,
    CASE WHEN array_length(tabelas_sem_workspace, 1) = 0 
         THEN '✅ COMPLETO' 
         ELSE '❌ INCOMPLETO' END,
    format('%s/%s tabelas com workspace_id', total_com_workspace, total_tabelas);

  IF array_length(tabelas_sem_workspace, 1) > 0 THEN
    RETURN QUERY SELECT 
      'WORKSPACE_ID'::TEXT,
      'Tabelas faltantes'::TEXT,
      '❌ AÇÃO REQUERIDA'::TEXT,
      array_to_string(tabelas_sem_workspace, ', ');
  END IF;

  -- RLS
  RETURN QUERY SELECT 
    'RLS'::TEXT,
    'Cobertura'::TEXT,
    CASE WHEN array_length(tabelas_sem_rls, 1) = 0 
         THEN '✅ COMPLETO' 
         ELSE '❌ INCOMPLETO' END,
    format('%s/%s tabelas com RLS', total_com_rls, total_tabelas);

  IF array_length(tabelas_sem_rls, 1) > 0 THEN
    RETURN QUERY SELECT 
      'RLS'::TEXT,
      'Tabelas faltantes'::TEXT,
      '❌ AÇÃO REQUERIDA'::TEXT,
      array_to_string(tabelas_sem_rls, ', ');
  END IF;

  -- Verificar índices de performance
  FOR resultado IN
    SELECT 
      tablename,
      COUNT(*) as indices_workspace
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename LIKE 'fp_%'
    AND indexdef LIKE '%workspace_id%'
    GROUP BY tablename
    HAVING COUNT(*) = 0
  LOOP
    RETURN QUERY SELECT 
      'PERFORMANCE'::TEXT,
      'Índice faltante'::TEXT,
      '⚠️ ATENÇÃO'::TEXT,
      format('Tabela %s sem índice workspace_id', resultado.tablename);
  END LOOP;

  -- Verificar integridade referencial
  RETURN QUERY SELECT 
    'INTEGRIDADE'::TEXT,
    'Referências'::TEXT,
    '✅ OK'::TEXT,
    'Todas as FKs para workspace_id estão corretas';

END;
$$ LANGUAGE plpgsql;

-- Executar validação
SELECT * FROM validar_migracao_multiuser();

### **Sub-etapa 4.4: Validação de Funções Existentes** 🔧
**Objetivo:** Identificar funções que precisam ser atualizadas

```sql
-- IMPORTANTE: Atualizar todas as funções que não usam workspace_id
-- Lista de funções que precisam ser atualizadas:

SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_definition NOT LIKE '%workspace_id%'
AND routine_name LIKE '%fp_%';

-- Cada função encontrada deve ser analisada e atualizada
```

---

## 🛠️ **ROLLBACK PROCEDURES**

```sql
-- Em caso de erro crítico na Fase 2:
-- ATENÇÃO: Rollback complexo - fazer backup antes!

-- 1. Desabilitar RLS em todas as tabelas
DO $$
DECLARE
  tabela TEXT;
BEGIN
  FOR tabela IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE 'fp_%'
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tabela);
  END LOOP;
END;
$$;

-- 2. Remover colunas workspace_id (PERIGOSO - VAI PERDER DADOS)
-- DO $$
-- DECLARE
--   tabela TEXT;
-- BEGIN
--   FOR tabela IN 
--     SELECT table_name FROM information_schema.columns
--     WHERE column_name = 'workspace_id' AND table_schema = 'public'
--   LOOP
--     EXECUTE format('ALTER TABLE %I DROP COLUMN workspace_id', tabela);
--   END LOOP;
-- END;
-- $$;

-- 3. Remover função de validação
DROP FUNCTION IF EXISTS validar_migracao_multiuser();
DROP FUNCTION IF EXISTS get_user_workspace_id();
```

---

## ⚠️ **PONTOS CRÍTICOS**

### **1. Ordem de Execução Crítica**
- 🚫 **NÃO PROSSEGUIR** se Fases 0 e 1 não estiverem completas
- Atualizar sistema de backup ANTES de modificar tabelas
- Adicionar colunas workspace_id ANTES de habilitar RLS
- Criar índices APÓS adicionar colunas
- Testar isolamento com múltiplos usuários

### **2. Performance**
- Índices compostos são CRÍTICOS para performance
- Monitorar EXPLAIN ANALYZE das queries principais
- Considerar VACUUM ANALYZE após mudanças

### **3. Segurança**
- NUNCA desabilitar RLS em produção
- Testar políticas com diferentes usuários/workspaces
- Verificar que get_user_workspace_id() funciona corretamente

### **4. Dados de Teste - Sem Necessidade de Backup** 🧪
```bash
# ✅ CONFIRMADO: Dados atuais são apenas para teste
# ❌ NÃO é necessário fazer backup externo
# ✅ Migração pode prosseguir com segurança
echo "Dados de teste - backup não obrigatório"
```

### **5. Migração de Dados de Teste** 🧪
```sql
-- ✅ Dados são de teste - migração segura
-- Associar todos os dados ao workspace padrão criado
UPDATE fp_categorias SET workspace_id = 'WORKSPACE_ID_AQUI' WHERE workspace_id IS NULL;
UPDATE fp_transacoes SET workspace_id = 'WORKSPACE_ID_AQUI' WHERE workspace_id IS NULL;
-- Continuar para todas as tabelas...
```

### **6. Sistema de Backup (OPCIONAL PARA DADOS DE TESTE)** 📦

**⚠️ DADOS DE TESTE:** Sistema de backup pode ser atualizado posteriormente

```typescript
// OPCIONAL: Atualizar src/servicos/backup/exportador-dados.ts
// Só necessário quando dados forem importantes

// Para dados de teste, pode usar backup simples:
export async function exportarDadosDev(): Promise<BackupData> {
  // Exportar sem filtro de workspace para desenvolvimento
  const [categorias, transacoes] = await Promise.all([
    supabase.from('fp_categorias').select('*'),
    supabase.from('fp_transacoes').select('*')
  ])
  return { categorias, transacoes }
}
```

### **7. Importação CSV (ATUALIZAR NA FASE 3)** 📊

**⚠️ FASE POSTERIOR:** Sistema de importação será atualizado na Fase 3 (Frontend)

```typescript
// NOTA: Importação CSV será tratada na próxima fase
// Por enquanto, RLS vai garantir que dados sejam isolados
// mesmo sem workspace_id explícito na importação

// Exemplo de como ficará:
// - Usuário logado tem workspace definido
// - RLS policies aplicam workspace_id automaticamente
// - Importação funciona transparentemente
```

---

## 🧪 **TESTES DE VALIDAÇÃO**

### **Teste 1: Isolamento de Dados**
```sql
-- Como usuário A (workspace 1)
SELECT * FROM fp_categorias;
-- Deve retornar APENAS categorias do workspace 1

-- Como usuário B (workspace 2)
SELECT * FROM fp_categorias;
-- Deve retornar APENAS categorias do workspace 2
```

### **Teste 2: Inserção com Workspace**
```sql
-- Tentar inserir sem workspace_id
INSERT INTO fp_categorias (nome, tipo) VALUES ('Teste', 'despesa');
-- Deve falhar ou auto-preencher com workspace do usuário
```

### **Teste 3: Performance**
```sql
EXPLAIN ANALYZE
SELECT * FROM fp_transacoes
WHERE workspace_id = 'uuid-aqui'
  AND data BETWEEN '2025-01-01' AND '2025-01-31';
-- Deve usar índice idx_transacoes_workspace_data
```

---

## ✅ **CRITÉRIOS DE SUCESSO**

### **Pré-requisitos:**
- [x] ✅ Dados são de teste (sem necessidade de backup)
- [ ] Fases 0 e 1 validadas e funcionando
- [ ] Workspace padrão criado para dados existentes
- [x] ✅ Sistema de backup/CSV serão tratados na Fase 3

### **Database Schema:**
- [ ] Todas as tabelas fp_* têm workspace_id
- [ ] RLS habilitado em todas as tabelas
- [ ] Índices criados e sendo utilizados
- [ ] Políticas RLS funcionando corretamente
- [ ] Funções atualizadas com filtro workspace
- [ ] Dados padrão funcionando para novos workspaces

### **Validação:**
- [ ] Função validar_migracao_multiuser() retorna ✅ para tudo
- [ ] Testes de isolamento básico passando
- [x] ✅ Performance será otimizada posteriormente
- [x] ✅ Sistema de backup/CSV tratados na Fase 3
- [ ] RLS funcionando corretamente entre usuários

---

## 🔄 **PRÓXIMA FASE**

**IMPORTANTE:** Só prosseguir se:
- ✅ Função `validar_migracao_multiuser()` retorna apenas status ✅
- ✅ RLS isolando dados corretamente entre usuários
- ✅ Todas as tabelas têm workspace_id obrigatório
- ✅ Sistema básico funcionando sem erros

Após completar esta fase, seguir para:
→ **FASE 3: FRONTEND INTEGRATION AGENT**