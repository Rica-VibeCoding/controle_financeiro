-- =====================================================
-- VALIDAÇÃO COMPLETA DE POLÍTICAS RLS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Função para executar todos os testes RLS
CREATE OR REPLACE FUNCTION validar_rls_completo()
RETURNS TABLE (
  secao TEXT,
  item TEXT,
  status TEXT,
  detalhes TEXT,
  observacoes TEXT
) AS $$
DECLARE
  tabela TEXT;
  resultado RECORD;
  tabelas_esperadas TEXT[] := ARRAY['fp_categorias', 'fp_subcategorias', 'fp_contas', 'fp_cartoes', 'fp_transacoes', 'fp_parcelas_fixas', 'fp_projetos_pessoais'];
  tabelas_sem_rls TEXT[] := '{}';
  tabelas_sem_workspace TEXT[] := '{}';
  policies_count INTEGER;
  function_exists BOOLEAN;
BEGIN
  -- ================================================
  -- 1. VERIFICAR RLS HABILITADO
  -- ================================================
  
  RETURN QUERY SELECT 
    'RLS_STATUS'::TEXT,
    'Verificação Inicial'::TEXT,
    '🔍 ANALISANDO'::TEXT,
    'Verificando status RLS em todas as tabelas'::TEXT,
    'Tabelas que precisam ter RLS habilitado'::TEXT;

  FOR tabela IN 
    SELECT unnest(tabelas_esperadas)
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      WHERE c.relname = tabela
      AND c.relrowsecurity = true
    ) THEN
      RETURN QUERY SELECT 
        'RLS_STATUS'::TEXT,
        tabela::TEXT,
        '✅ HABILITADO'::TEXT,
        'RLS está ativo'::TEXT,
        'Políticas podem ser aplicadas'::TEXT;
    ELSE
      tabelas_sem_rls := array_append(tabelas_sem_rls, tabela);
      RETURN QUERY SELECT 
        'RLS_STATUS'::TEXT,
        tabela::TEXT,
        '❌ DESABILITADO'::TEXT,
        'RLS não está ativo'::TEXT,
        'CRÍTICO: Dados expostos sem proteção'::TEXT;
    END IF;
  END LOOP;

  -- ================================================
  -- 2. VERIFICAR WORKSPACE_ID
  -- ================================================
  
  RETURN QUERY SELECT 
    'WORKSPACE_ID'::TEXT,
    'Verificação Inicial'::TEXT,
    '🔍 ANALISANDO'::TEXT,
    'Verificando coluna workspace_id'::TEXT,
    'Todas as tabelas principais devem ter workspace_id'::TEXT;

  FOR tabela IN 
    SELECT unnest(tabelas_esperadas)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = tabela
      AND column_name = 'workspace_id'
    ) THEN
      RETURN QUERY SELECT 
        'WORKSPACE_ID'::TEXT,
        tabela::TEXT,
        '✅ PRESENTE'::TEXT,
        'Coluna workspace_id existe'::TEXT,
        'Tabela preparada para multiusuário'::TEXT;
    ELSE
      tabelas_sem_workspace := array_append(tabelas_sem_workspace, tabela);
      RETURN QUERY SELECT 
        'WORKSPACE_ID'::TEXT,
        tabela::TEXT,
        '❌ AUSENTE'::TEXT,
        'Coluna workspace_id não existe'::TEXT,
        'CRÍTICO: Tabela não suporta multiusuário'::TEXT;
    END IF;
  END LOOP;

  -- ================================================
  -- 3. CONTAR POLÍTICAS RLS
  -- ================================================
  
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = ANY(tabelas_esperadas);

  RETURN QUERY SELECT 
    'POLICIES_COUNT'::TEXT,
    'Total de Políticas'::TEXT,
    CASE 
      WHEN policies_count >= 28 THEN '✅ SUFICIENTE'
      WHEN policies_count >= 14 THEN '⚠️ PARCIAL'
      ELSE '❌ INSUFICIENTE'
    END,
    format('%s políticas encontradas', policies_count)::TEXT,
    CASE 
      WHEN policies_count >= 28 THEN 'Esperado: 28 políticas (4 × 7 tabelas)'
      ELSE format('Faltam %s políticas para completar', 28 - policies_count)
    END;

  -- ================================================
  -- 4. DETALHAR POLÍTICAS POR TABELA
  -- ================================================
  
  FOR tabela IN 
    SELECT unnest(tabelas_esperadas)
  LOOP
    DECLARE
      select_policy BOOLEAN := FALSE;
      insert_policy BOOLEAN := FALSE;
      update_policy BOOLEAN := FALSE;
      delete_policy BOOLEAN := FALSE;
      missing_ops TEXT[] := '{}';
    BEGIN
      -- Verificar cada tipo de operação
      SELECT EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = tabela 
          AND cmd = 'SELECT'
      ) INTO select_policy;
      
      SELECT EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = tabela 
          AND cmd = 'INSERT'
      ) INTO insert_policy;
      
      SELECT EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = tabela 
          AND cmd = 'UPDATE'
      ) INTO update_policy;
      
      SELECT EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = tabela 
          AND cmd = 'DELETE'
      ) INTO delete_policy;

      -- Identificar operações faltantes
      IF NOT select_policy THEN missing_ops := array_append(missing_ops, 'SELECT'); END IF;
      IF NOT insert_policy THEN missing_ops := array_append(missing_ops, 'INSERT'); END IF;
      IF NOT update_policy THEN missing_ops := array_append(missing_ops, 'UPDATE'); END IF;
      IF NOT delete_policy THEN missing_ops := array_append(missing_ops, 'DELETE'); END IF;

      RETURN QUERY SELECT 
        'POLICIES_DETAIL'::TEXT,
        tabela::TEXT,
        CASE 
          WHEN array_length(missing_ops, 1) IS NULL THEN '✅ COMPLETO'
          WHEN array_length(missing_ops, 1) <= 2 THEN '⚠️ PARCIAL'
          ELSE '❌ INCOMPLETO'
        END,
        CASE 
          WHEN array_length(missing_ops, 1) IS NULL THEN 'Todas as operações protegidas'
          ELSE format('Operações protegidas: %s/%s', 4 - COALESCE(array_length(missing_ops, 1), 0), 4)
        END,
        CASE 
          WHEN array_length(missing_ops, 1) IS NULL THEN 'SELECT, INSERT, UPDATE, DELETE'
          ELSE format('Faltam: %s', array_to_string(missing_ops, ', '))
        END;
    END;
  END LOOP;

  -- ================================================
  -- 5. VERIFICAR FUNÇÃO HELPER
  -- ================================================
  
  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_workspace_id'
  ) INTO function_exists;

  RETURN QUERY SELECT 
    'HELPER_FUNCTION'::TEXT,
    'get_user_workspace_id()'::TEXT,
    CASE 
      WHEN function_exists THEN '✅ EXISTE'
      ELSE '❌ AUSENTE'
    END,
    CASE 
      WHEN function_exists THEN 'Função helper disponível'
      ELSE 'Função helper não encontrada'
    END,
    CASE 
      WHEN function_exists THEN 'Políticas podem usar auth.uid() para workspace'
      ELSE 'CRÍTICO: Políticas não podem determinar workspace'
    END;

  -- ================================================
  -- 6. TESTE DE SIMULAÇÃO (usando auth.uid())
  -- ================================================
  
  RETURN QUERY SELECT 
    'SIMULATION_TEST'::TEXT,
    'Teste com auth.uid()'::TEXT,
    '🔄 SIMULAÇÃO'::TEXT,
    'Testando função auth.uid() nas políticas'::TEXT,
    'Verifica se as políticas podem acessar usuário atual'::TEXT;

  -- Tentar executar auth.uid() para verificar se está disponível
  BEGIN
    PERFORM auth.uid();
    RETURN QUERY SELECT 
      'SIMULATION_TEST'::TEXT,
      'auth.uid() funcional'::TEXT,
      '✅ DISPONÍVEL'::TEXT,
      'Função auth.uid() responde'::TEXT,
      'Políticas podem identificar usuário logado'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 
        'SIMULATION_TEST'::TEXT,
        'auth.uid() com erro'::TEXT,
        '⚠️ INDISPONÍVEL'::TEXT,
        'Função auth.uid() não responde no contexto atual'::TEXT,
        'Normal em execução SQL direta, funciona via API'::TEXT;
  END;

  -- ================================================
  -- 7. RESUMO FINAL
  -- ================================================
  
  RETURN QUERY SELECT 
    'RESUMO_FINAL'::TEXT,
    'Status Geral RLS'::TEXT,
    CASE 
      WHEN COALESCE(array_length(tabelas_sem_rls, 1), 0) = 0 
       AND COALESCE(array_length(tabelas_sem_workspace, 1), 0) = 0 
       AND policies_count >= 28 
       AND function_exists
      THEN '✅ SISTEMA SEGURO'
      WHEN COALESCE(array_length(tabelas_sem_rls, 1), 0) = 0 
       AND policies_count >= 14
      THEN '⚠️ PARCIALMENTE SEGURO'
      ELSE '❌ SISTEMA VULNERÁVEL'
    END,
    format('RLS: %s/%s | Policies: %s/28 | Helper: %s', 
           7 - COALESCE(array_length(tabelas_sem_rls, 1), 0), 
           7,
           policies_count,
           CASE WHEN function_exists THEN 'OK' ELSE 'FALTA' END
    )::TEXT,
    CASE 
      WHEN COALESCE(array_length(tabelas_sem_rls, 1), 0) = 0 
       AND COALESCE(array_length(tabelas_sem_workspace, 1), 0) = 0 
       AND policies_count >= 28 
       AND function_exists
      THEN 'Sistema pronto para produção multiusuário'
      ELSE 'Sistema requer configuração adicional de segurança'
    END;

  -- ================================================
  -- 8. PRÓXIMOS PASSOS (se houver problemas)
  -- ================================================
  
  IF COALESCE(array_length(tabelas_sem_rls, 1), 0) > 0 
   OR COALESCE(array_length(tabelas_sem_workspace, 1), 0) > 0 
   OR policies_count < 28 
   OR NOT function_exists THEN
    
    RETURN QUERY SELECT 
      'PROXIMOS_PASSOS'::TEXT,
      'Ações Requeridas'::TEXT,
      '🔧 CONFIGURAR'::TEXT,
      'Itens que precisam ser corrigidos'::TEXT,
      'Execute as migrações apropriadas para resolver'::TEXT;

    IF COALESCE(array_length(tabelas_sem_rls, 1), 0) > 0 THEN
      RETURN QUERY SELECT 
        'PROXIMOS_PASSOS'::TEXT,
        'Habilitar RLS'::TEXT,
        '❗ URGENTE'::TEXT,
        format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY;', array_to_string(tabelas_sem_rls, ', '))::TEXT,
        'Execute para cada tabela listada'::TEXT;
    END IF;

    IF NOT function_exists THEN
      RETURN QUERY SELECT 
        'PROXIMOS_PASSOS'::TEXT,
        'Criar função helper'::TEXT,
        '❗ NECESSÁRIO'::TEXT,
        'CREATE FUNCTION get_user_workspace_id()'::TEXT,
        'Função para mapear auth.uid() -> workspace_id'::TEXT;
    END IF;

    IF policies_count < 28 THEN
      RETURN QUERY SELECT 
        'PROXIMOS_PASSOS'::TEXT,
        'Criar políticas RLS'::TEXT,
        '❗ CRÍTICO'::TEXT,
        format('Criar %s políticas adicionais', 28 - policies_count)::TEXT,
        'Uma política para cada operação (SELECT/INSERT/UPDATE/DELETE)'::TEXT;
    END IF;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- Executar a validação completa
SELECT * FROM validar_rls_completo();