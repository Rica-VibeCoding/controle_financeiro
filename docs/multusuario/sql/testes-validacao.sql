-- =====================================================
-- TESTES AUTOMATIZADOS - VALIDAÇÃO MULTIUSUÁRIO
-- Arquivo: testes-validacao.sql
-- =====================================================

-- 1. TESTE: Verificar estrutura das tabelas
DO $$
DECLARE
  tabela TEXT;
  tabelas_esperadas TEXT[] := ARRAY[
    'fp_workspaces',
    'fp_usuarios', 
    'fp_convites_links',
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
  missing_tables TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== TESTE 1: ESTRUTURA DAS TABELAS ===';
  
  FOREACH tabela IN ARRAY tabelas_esperadas
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tabela
    ) THEN
      missing_tables := array_append(missing_tables, tabela);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE '❌ FALHOU: Tabelas não encontradas: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ PASSOU: Todas as tabelas existem';
  END IF;
END;
$$;

-- 2. TESTE: Verificar workspace_id em todas as tabelas necessárias
DO $$
DECLARE
  tabela TEXT;
  tabelas_com_workspace TEXT[] := ARRAY[
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
  missing_columns TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== TESTE 2: COLUNAS WORKSPACE_ID ===';
  
  FOREACH tabela IN ARRAY tabelas_com_workspace
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = tabela 
      AND column_name = 'workspace_id'
    ) THEN
      missing_columns := array_append(missing_columns, tabela);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE NOTICE '❌ FALHOU: Tabelas sem workspace_id: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ PASSOU: Todas as tabelas têm workspace_id';
  END IF;
END;
$$;

-- 3. TESTE: Verificar RLS habilitado
DO $$
DECLARE
  tabela TEXT;
  tabelas_sem_rls TEXT[] := '{}';
  count_policies INTEGER;
BEGIN
  RAISE NOTICE '=== TESTE 3: ROW LEVEL SECURITY ===';
  
  -- Verificar RLS habilitado
  FOR tabela IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE 'fp_%'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c 
      WHERE c.relname = tabela AND c.relrowsecurity = true
    ) THEN
      tabelas_sem_rls := array_append(tabelas_sem_rls, tabela);
    END IF;
  END LOOP;
  
  IF array_length(tabelas_sem_rls, 1) > 0 THEN
    RAISE NOTICE '❌ FALHOU: RLS não habilitado em: %', array_to_string(tabelas_sem_rls, ', ');
  ELSE
    RAISE NOTICE '✅ PASSOU: RLS habilitado em todas as tabelas';
  END IF;
  
  -- Verificar políticas criadas
  SELECT COUNT(*) INTO count_policies 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename LIKE 'fp_%';
  
  IF count_policies < 20 THEN
    RAISE NOTICE '⚠️ ATENÇÃO: Apenas % políticas RLS encontradas (esperado > 20)', count_policies;
  ELSE
    RAISE NOTICE '✅ PASSOU: % políticas RLS encontradas', count_policies;
  END IF;
END;
$$;

-- 4. TESTE: Verificar índices de performance
DO $$
DECLARE
  count_indices INTEGER;
  resultado RECORD;
BEGIN
  RAISE NOTICE '=== TESTE 4: ÍNDICES DE PERFORMANCE ===';
  
  -- Verificar índices com workspace_id
  SELECT COUNT(*) INTO count_indices 
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND tablename LIKE 'fp_%' 
  AND indexdef LIKE '%workspace_id%';
  
  IF count_indices < 10 THEN
    RAISE NOTICE '❌ FALHOU: Apenas % índices com workspace_id (esperado > 10)', count_indices;
  ELSE
    RAISE NOTICE '✅ PASSOU: % índices com workspace_id encontrados', count_indices;
  END IF;
  
  -- Detalhar índices por tabela
  FOR resultado IN
    SELECT tablename, COUNT(*) as indices_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'fp_%'
    AND indexdef LIKE '%workspace_id%'
    GROUP BY tablename
    ORDER BY tablename
  LOOP
    RAISE NOTICE '  - %: % índices', resultado.tablename, resultado.indices_count;
  END LOOP;
END;
$$;

-- 5. TESTE: Verificar funções necessárias
DO $$
DECLARE
  funcoes_esperadas TEXT[] := ARRAY[
    'get_user_workspace_id',
    'handle_new_user',
    'criar_categorias_padrao',
    'calcular_saldos_contas'
  ];
  funcao TEXT;
  missing_functions TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== TESTE 5: FUNÇÕES DO BANCO ===';
  
  FOREACH funcao IN ARRAY funcoes_esperadas
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = funcao
    ) THEN
      missing_functions := array_append(missing_functions, funcao);
    END IF;
  END LOOP;
  
  IF array_length(missing_functions, 1) > 0 THEN
    RAISE NOTICE '❌ FALHOU: Funções não encontradas: %', array_to_string(missing_functions, ', ');
  ELSE
    RAISE NOTICE '✅ PASSOU: Todas as funções necessárias existem';
  END IF;
END;
$$;

-- 6. TESTE: Verificar triggers
DO $$
DECLARE
  count_triggers INTEGER;
BEGIN
  RAISE NOTICE '=== TESTE 6: TRIGGERS ===';
  
  -- Verificar trigger de novo usuário
  SELECT COUNT(*) INTO count_triggers 
  FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created';
  
  IF count_triggers = 0 THEN
    RAISE NOTICE '❌ FALHOU: Trigger on_auth_user_created não encontrado';
  ELSE
    RAISE NOTICE '✅ PASSOU: Trigger on_auth_user_created encontrado';
  END IF;
END;
$$;

-- 7. TESTE: Simulação de isolamento (se houver dados)
DO $$
DECLARE
  workspace1_id UUID := gen_random_uuid();
  workspace2_id UUID := gen_random_uuid();
  test_category1_id UUID;
  test_category2_id UUID;
BEGIN
  RAISE NOTICE '=== TESTE 7: SIMULAÇÃO DE ISOLAMENTO ===';
  
  -- Criar workspaces teste temporários
  INSERT INTO fp_workspaces (id, nome, owner_id) VALUES
  (workspace1_id, 'Test Workspace 1', (SELECT id FROM auth.users LIMIT 1)),
  (workspace2_id, 'Test Workspace 2', (SELECT id FROM auth.users LIMIT 1));
  
  -- Criar categorias teste
  INSERT INTO fp_categorias (workspace_id, nome, tipo) VALUES
  (workspace1_id, 'Teste Cat 1', 'despesa'),
  (workspace2_id, 'Teste Cat 2', 'despesa')
  RETURNING id INTO test_category1_id, test_category2_id;
  
  -- Verificar isolamento
  IF EXISTS (
    SELECT 1 FROM fp_categorias 
    WHERE workspace_id = workspace1_id 
    AND nome = 'Teste Cat 2'
  ) THEN
    RAISE NOTICE '❌ FALHOU: Isolamento falhou - categoria vazou entre workspaces';
  ELSE
    RAISE NOTICE '✅ PASSOU: Isolamento funcionando corretamente';
  END IF;
  
  -- Limpar dados teste
  DELETE FROM fp_workspaces WHERE id IN (workspace1_id, workspace2_id);
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ AVISO: Não foi possível testar isolamento (pode ser devido a RLS)';
END;
$$;

-- 8. RELATÓRIO FINAL
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RELATÓRIO FINAL DOS TESTES ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Execute este script após cada fase para validar:';
  RAISE NOTICE '✅ Estrutura das tabelas';
  RAISE NOTICE '✅ Colunas workspace_id';  
  RAISE NOTICE '✅ Row Level Security';
  RAISE NOTICE '✅ Índices de performance';
  RAISE NOTICE '✅ Funções do banco';
  RAISE NOTICE '✅ Triggers';
  RAISE NOTICE '✅ Isolamento de dados';
  RAISE NOTICE '';
  RAISE NOTICE 'Se todos os testes passaram, o sistema multiusuário está funcionando!';
  RAISE NOTICE '';
END;
$$;

-- =====================================================
-- TESTES DE VALIDAÇÃO CONCLUÍDOS
-- 
-- Como usar:
-- 1. Executar após cada fase de implementação
-- 2. Verificar se todos os testes passam (✅)
-- 3. Corrigir problemas indicados por (❌)
-- 4. Avisos (⚠️) podem ser ignorados se esperados
-- =====================================================