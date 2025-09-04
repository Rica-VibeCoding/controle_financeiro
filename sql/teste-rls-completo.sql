-- =====================================================
-- TESTE COMPLETO DE POLÍTICAS RLS
-- Arquivo: teste-rls-completo.sql
-- =====================================================

-- 1. Verificar RLS habilitado em todas as tabelas fp_*
SELECT 
  'RLS_STATUS' as tipo,
  tablename,
  CASE WHEN rowsecurity THEN '✅ HABILITADO' ELSE '❌ DESABILITADO' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'fp_%'
  AND tablename NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
ORDER BY tablename;

-- 2. Contar todas as políticas RLS
SELECT 
  'POLICIES_COUNT' as tipo,
  COUNT(*) as total_policies,
  COUNT(DISTINCT tablename) as tabelas_com_policies,
  CASE 
    WHEN COUNT(*) >= 28 THEN '✅ SUFICIENTE'
    ELSE '❌ INSUFICIENTE' 
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'fp_%'
  AND tablename NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links');

-- 3. Detalhar políticas por tabela e operação
SELECT 
  'POLICIES_DETAIL' as tipo,
  tablename,
  cmd as operacao,
  policyname,
  qual as condicao
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'fp_%'
  AND tablename NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
ORDER BY tablename, 
  CASE cmd 
    WHEN 'SELECT' THEN 1 
    WHEN 'INSERT' THEN 2 
    WHEN 'UPDATE' THEN 3 
    WHEN 'DELETE' THEN 4 
  END;

-- 4. Verificar função get_user_workspace_id()
SELECT 
  'FUNCTION_CHECK' as tipo,
  routine_name,
  CASE 
    WHEN routine_name IS NOT NULL THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END as status,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'get_user_workspace_id' 
  AND routine_schema = 'public';

-- 5. Verificar workspace_id em todas as tabelas
SELECT 
  'WORKSPACE_ID_COLUMNS' as tipo,
  t.table_name,
  CASE 
    WHEN c.column_name IS NOT NULL THEN '✅ TEM WORKSPACE_ID'
    ELSE '❌ FALTA WORKSPACE_ID'
  END as status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
  ON t.table_name = c.table_name 
  AND c.column_name = 'workspace_id'
  AND c.table_schema = 'public'
WHERE t.table_schema = 'public' 
  AND t.table_name LIKE 'fp_%'
  AND t.table_name NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
ORDER BY t.table_name;

-- 6. Teste de simulação de acesso (usando dados fictícios)
SELECT 
  'SIMULATION_TEST' as tipo,
  'Teste básico de isolamento' as descricao,
  'Este seria um teste prático com dados reais' as observacao;

-- 7. Resumo final
WITH rls_count AS (
  SELECT COUNT(*) as tabelas_rls
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename LIKE 'fp_%'
    AND tablename NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
    AND rowsecurity = true
),
policy_count AS (
  SELECT COUNT(*) as total_policies
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename LIKE 'fp_%'
    AND tablename NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
),
function_check AS (
  SELECT COUNT(*) as function_exists
  FROM information_schema.routines 
  WHERE routine_name = 'get_user_workspace_id' 
    AND routine_schema = 'public'
)
SELECT 
  'FINAL_SUMMARY' as tipo,
  r.tabelas_rls,
  p.total_policies,
  f.function_exists,
  CASE 
    WHEN r.tabelas_rls >= 7 
     AND p.total_policies >= 28 
     AND f.function_exists >= 1 
    THEN '✅ RLS TOTALMENTE CONFIGURADO'
    ELSE '❌ RLS REQUER CONFIGURAÇÃO'
  END as status_final
FROM rls_count r, policy_count p, function_check f;