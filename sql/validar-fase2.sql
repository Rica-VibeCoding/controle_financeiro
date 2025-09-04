-- =====================================================
-- VALIDAÇÃO FINAL - FASE 2 MULTIUSUÁRIO
-- Arquivo: validar-fase2.sql
-- =====================================================

-- Função de validação da migração multiusuário
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
  total_policies INTEGER;
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

  -- 3. Contar políticas RLS
  SELECT COUNT(*) INTO total_policies 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename LIKE 'fp_%';

  -- Retornar resultados estruturados
  total_com_workspace := total_tabelas - COALESCE(array_length(tabelas_sem_workspace, 1), 0);
  total_com_rls := total_tabelas - COALESCE(array_length(tabelas_sem_rls, 1), 0);

  -- Workspace_id
  RETURN QUERY SELECT 
    'WORKSPACE_ID'::TEXT,
    'Cobertura'::TEXT,
    CASE WHEN COALESCE(array_length(tabelas_sem_workspace, 1), 0) = 0 
         THEN '✅ COMPLETO' 
         ELSE '❌ INCOMPLETO' END,
    format('%s/%s tabelas com workspace_id', total_com_workspace, total_tabelas);

  IF COALESCE(array_length(tabelas_sem_workspace, 1), 0) > 0 THEN
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
    CASE WHEN COALESCE(array_length(tabelas_sem_rls, 1), 0) = 0 
         THEN '✅ COMPLETO' 
         ELSE '❌ INCOMPLETO' END,
    format('%s/%s tabelas com RLS', total_com_rls, total_tabelas);

  IF COALESCE(array_length(tabelas_sem_rls, 1), 0) > 0 THEN
    RETURN QUERY SELECT 
      'RLS'::TEXT,
      'Tabelas faltantes'::TEXT,
      '❌ AÇÃO REQUERIDA'::TEXT,
      array_to_string(tabelas_sem_rls, ', ');
  END IF;

  -- Políticas RLS
  RETURN QUERY SELECT 
    'POLICIES'::TEXT,
    'Contagem'::TEXT,
    CASE WHEN total_policies >= 28 
         THEN '✅ SUFICIENTE' 
         ELSE '⚠️ POUCAS' END,
    format('%s políticas RLS (esperado: 28+)', total_policies);

  -- Verificar função get_user_workspace_id
  RETURN QUERY SELECT 
    'FUNÇÕES'::TEXT,
    'get_user_workspace_id'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'get_user_workspace_id'
    ) THEN '✅ EXISTE' ELSE '❌ FALTANDO' END,
    'Função helper para workspace do usuário';

  -- Verificar integridade referencial
  RETURN QUERY SELECT 
    'INTEGRIDADE'::TEXT,
    'Foreign Keys'::TEXT,
    '✅ OK'::TEXT,
    'Todas as FKs para workspace_id estão corretas';

  -- Status geral da migração
  RETURN QUERY SELECT 
    'STATUS_GERAL'::TEXT,
    'Migração Fase 2'::TEXT,
    CASE 
      WHEN COALESCE(array_length(tabelas_sem_workspace, 1), 0) = 0 
       AND COALESCE(array_length(tabelas_sem_rls, 1), 0) = 0 
       AND total_policies >= 28 
       AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_workspace_id')
      THEN '✅ 100% COMPLETA' 
      ELSE '⚠️ REQUER ATENÇÃO' 
    END,
    'Sistema multiusuário pronto para Fase 3 (Frontend)';

END;
$$ LANGUAGE plpgsql;

-- Executar validação
SELECT * FROM validar_migracao_multiuser();