-- =====================================================
-- TESTE RÁPIDO DE RLS - Execute no SQL Editor
-- =====================================================

-- 1. Verificar RLS habilitado
SELECT 
  '1. STATUS RLS' as secao,
  tablename,
  CASE WHEN rowsecurity THEN '✅ HABILITADO' ELSE '❌ DESABILITADO' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'fp_%'
  AND tablename NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
ORDER BY tablename;

-- 2. Contar políticas por tabela
SELECT 
  '2. CONTAGEM POLICIES' as secao,
  tablename,
  COUNT(*) as total_policies,
  string_agg(cmd::text, ', ' ORDER BY cmd) as operacoes
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'fp_%'
  AND tablename NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
GROUP BY tablename
ORDER BY tablename;

-- 3. Total geral de políticas
SELECT 
  '3. TOTAL GERAL' as secao,
  COUNT(*) as total_policies,
  COUNT(DISTINCT tablename) as tabelas_cobertas,
  CASE 
    WHEN COUNT(*) >= 28 THEN '✅ COMPLETO' 
    WHEN COUNT(*) >= 14 THEN '⚠️ PARCIAL'
    ELSE '❌ INSUFICIENTE' 
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'fp_%'
  AND tablename NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links');

-- 4. Verificar função helper
SELECT 
  '4. FUNÇÃO HELPER' as secao,
  routine_name,
  CASE 
    WHEN routine_name IS NOT NULL THEN '✅ EXISTE' 
    ELSE '❌ AUSENTE' 
  END as status
FROM information_schema.routines 
WHERE routine_name = 'get_user_workspace_id' 
  AND routine_schema = 'public'
UNION ALL
SELECT 
  '4. FUNÇÃO HELPER' as secao,
  'get_user_workspace_id' as routine_name,
  '❌ AUSENTE' as status
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name = 'get_user_workspace_id' 
    AND routine_schema = 'public'
);

-- 5. Verificar workspace_id em todas as tabelas
SELECT 
  '5. WORKSPACE_ID' as secao,
  t.table_name,
  CASE 
    WHEN c.column_name IS NOT NULL THEN '✅ PRESENTE' 
    ELSE '❌ AUSENTE' 
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

-- 6. Resumo executivo
WITH rls_summary AS (
  SELECT 
    COUNT(*) FILTER (WHERE rowsecurity = true) as tabelas_com_rls,
    COUNT(*) as total_tabelas
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename LIKE 'fp_%'
    AND tablename NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
),
policy_summary AS (
  SELECT COUNT(*) as total_policies
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename LIKE 'fp_%'
    AND tablename NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
),
function_summary AS (
  SELECT 
    CASE 
      WHEN EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_user_workspace_id' 
          AND routine_schema = 'public'
      ) THEN 1 ELSE 0 
    END as function_exists
),
workspace_summary AS (
  SELECT 
    COUNT(*) FILTER (WHERE c.column_name IS NOT NULL) as tabelas_com_workspace,
    COUNT(*) as total_tabelas
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND c.column_name = 'workspace_id'
    AND c.table_schema = 'public'
  WHERE t.table_schema = 'public' 
    AND t.table_name LIKE 'fp_%'
    AND t.table_name NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
)
SELECT 
  '6. RESUMO EXECUTIVO' as secao,
  format('RLS: %s/%s tabelas', r.tabelas_com_rls, r.total_tabelas) as rls_status,
  format('POLICIES: %s (esperado: 28)', p.total_policies) as policies_status,
  format('WORKSPACE_ID: %s/%s tabelas', w.tabelas_com_workspace, w.total_tabelas) as workspace_status,
  format('HELPER: %s', CASE WHEN f.function_exists = 1 THEN 'OK' ELSE 'FALTA' END) as function_status,
  CASE 
    WHEN r.tabelas_com_rls = r.total_tabelas 
     AND p.total_policies >= 28 
     AND w.tabelas_com_workspace = w.total_tabelas
     AND f.function_exists = 1
    THEN '✅ SISTEMA TOTALMENTE SEGURO'
    WHEN r.tabelas_com_rls = r.total_tabelas 
     AND p.total_policies >= 14
    THEN '⚠️ SISTEMA PARCIALMENTE SEGURO'
    ELSE '❌ SISTEMA REQUER CONFIGURAÇÃO'
  END as status_final
FROM rls_summary r, policy_summary p, function_summary f, workspace_summary w;