-- =====================================================
-- TESTE 4 - FUNÇÕES SQL ATUALIZADAS FASE 2
-- Validação completa das funções críticas
-- =====================================================

-- TESTE 1: Verificar se função get_user_workspace_id() existe
DO $$
BEGIN
  RAISE NOTICE '=== TESTE 1: FUNÇÃO get_user_workspace_id() ===';
  
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_user_workspace_id'
  ) THEN
    RAISE NOTICE '✅ Função get_user_workspace_id() existe';
  ELSE
    RAISE NOTICE '❌ Função get_user_workspace_id() NÃO existe';
  END IF;
END;
$$;

-- TESTE 2: Verificar se função calcular_saldos_contas() foi atualizada
DO $$
DECLARE
  func_exists BOOLEAN := false;
  func_params TEXT;
BEGIN
  RAISE NOTICE '=== TESTE 2: FUNÇÃO calcular_saldos_contas() ===';
  
  SELECT true, pg_get_function_arguments(p.oid)
  INTO func_exists, func_params
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
  AND p.proname = 'calcular_saldos_contas'
  LIMIT 1;
  
  IF func_exists THEN
    RAISE NOTICE '✅ Função calcular_saldos_contas() existe';
    RAISE NOTICE 'Parâmetros: %', func_params;
    
    -- Verificar se aceita workspace_id como primeiro parâmetro
    IF func_params LIKE 'p_workspace_id%' THEN
      RAISE NOTICE '✅ Função atualizada com workspace_id';
    ELSE
      RAISE NOTICE '❌ Função NÃO atualizada - sem workspace_id';
    END IF;
  ELSE
    RAISE NOTICE '❌ Função calcular_saldos_contas() NÃO existe';
  END IF;
END;
$$;

-- TESTE 3: Verificar se função get_workspace_stats() existe
DO $$
BEGIN
  RAISE NOTICE '=== TESTE 3: FUNÇÃO get_workspace_stats() ===';
  
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_workspace_stats'
  ) THEN
    RAISE NOTICE '✅ Função get_workspace_stats() existe';
  ELSE
    RAISE NOTICE '❌ Função get_workspace_stats() NÃO existe';
  END IF;
END;
$$;

-- TESTE 4: Verificar funções de dados padrão
DO $$
BEGIN
  RAISE NOTICE '=== TESTE 4: FUNÇÕES DE DADOS PADRÃO ===';
  
  -- Verificar criar_categorias_padrao
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'criar_categorias_padrao'
  ) THEN
    RAISE NOTICE '✅ Função criar_categorias_padrao() existe';
  ELSE
    RAISE NOTICE '❌ Função criar_categorias_padrao() NÃO existe';
  END IF;
  
  -- Verificar handle_new_user
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'handle_new_user'
  ) THEN
    RAISE NOTICE '✅ Função handle_new_user() existe';
  ELSE
    RAISE NOTICE '❌ Função handle_new_user() NÃO existe';
  END IF;
END;
$$;

-- TESTE 5: Verificar trigger on_auth_user_created
DO $$
DECLARE
  trigger_exists BOOLEAN := false;
  trigger_info RECORD;
BEGIN
  RAISE NOTICE '=== TESTE 5: TRIGGER on_auth_user_created ===';
  
  SELECT true, event_manipulation, event_object_table
  INTO trigger_exists, trigger_info
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created'
  LIMIT 1;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created existe';
    RAISE NOTICE 'Evento: % na tabela: %', trigger_info.event_manipulation, trigger_info.event_object_table;
  ELSE
    RAISE NOTICE '❌ Trigger on_auth_user_created NÃO existe';
  END IF;
END;
$$;

-- TESTE 6: Criar workspace teste para validar execução das funções
DO $$
DECLARE
  workspace_teste_id UUID;
  saldo_result RECORD;
  stats_result RECORD;
BEGIN
  RAISE NOTICE '=== TESTE 6: VALIDAÇÃO FUNCIONAL ===';
  
  -- Criar workspace teste
  INSERT INTO fp_workspaces (nome, plano) 
  VALUES ('Workspace Teste Funções', 'free') 
  RETURNING id INTO workspace_teste_id;
  
  RAISE NOTICE '✅ Workspace teste criado: %', workspace_teste_id;
  
  -- TESTE 6.1: Testar calcular_saldos_contas() se existe
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'calcular_saldos_contas'
  ) THEN
    BEGIN
      SELECT COUNT(*) as total_contas
      INTO saldo_result
      FROM calcular_saldos_contas(
        workspace_teste_id,
        '2025-01-01'::DATE,
        '2025-12-31'::DATE
      );
      
      RAISE NOTICE '✅ calcular_saldos_contas() executou com sucesso - % contas', saldo_result.total_contas;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Erro ao executar calcular_saldos_contas(): %', SQLERRM;
    END;
  END IF;
  
  -- TESTE 6.2: Testar get_workspace_stats() se existe
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_workspace_stats'
  ) THEN
    BEGIN
      SELECT *
      INTO stats_result
      FROM get_workspace_stats(workspace_teste_id)
      LIMIT 1;
      
      RAISE NOTICE '✅ get_workspace_stats() executou com sucesso';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Erro ao executar get_workspace_stats(): %', SQLERRM;
    END;
  END IF;
  
  -- Limpeza: remover workspace teste
  DELETE FROM fp_workspaces WHERE id = workspace_teste_id;
  RAISE NOTICE '✅ Workspace teste removido';
END;
$$;

-- TESTE 7: Verificar todas as tabelas têm workspace_id
DO $$
DECLARE
  tabela RECORD;
  tabelas_sem_workspace TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== TESTE 7: VALIDAÇÃO WORKSPACE_ID NAS TABELAS ===';
  
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
      AND table_name = tabela.table_name
      AND column_name = 'workspace_id'
    ) THEN
      tabelas_sem_workspace := array_append(tabelas_sem_workspace, tabela.table_name);
    END IF;
  END LOOP;
  
  IF array_length(tabelas_sem_workspace, 1) > 0 THEN
    RAISE NOTICE '❌ Tabelas SEM workspace_id: %', array_to_string(tabelas_sem_workspace, ', ');
  ELSE
    RAISE NOTICE '✅ Todas as tabelas financeiras têm workspace_id';
  END IF;
END;
$$;

-- TESTE 8: Verificar RLS habilitado
DO $$
DECLARE
  tabela RECORD;
  tabelas_sem_rls TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== TESTE 8: VALIDAÇÃO RLS NAS TABELAS ===';
  
  FOR tabela IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename LIKE 'fp_%'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      WHERE c.relname = tabela.tablename
      AND c.relrowsecurity = true
    ) THEN
      tabelas_sem_rls := array_append(tabelas_sem_rls, tabela.tablename);
    END IF;
  END LOOP;
  
  IF array_length(tabelas_sem_rls, 1) > 0 THEN
    RAISE NOTICE '❌ Tabelas SEM RLS: %', array_to_string(tabelas_sem_rls, ', ');
  ELSE
    RAISE NOTICE '✅ RLS habilitado em todas as tabelas fp_*';
  END IF;
END;
$$;

-- RESUMO FINAL
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '🏁 TESTE 4 - FUNÇÕES SQL FASE 2 CONCLUÍDO';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Verifique os resultados acima para:';
  RAISE NOTICE '1. Existência de todas as 5 funções críticas';
  RAISE NOTICE '2. Execução sem erros das funções';
  RAISE NOTICE '3. workspace_id em todas as tabelas';
  RAISE NOTICE '4. RLS habilitado em todas as tabelas';
  RAISE NOTICE '5. Triggers funcionando corretamente';
  RAISE NOTICE '=====================================================';
END;
$$;