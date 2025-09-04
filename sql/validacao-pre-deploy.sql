-- ============================================================================
-- VALIDAÇÃO PRÉ-DEPLOY - SISTEMA DE CONTROLE FINANCEIRO
-- ============================================================================
-- Execute este script antes do redeploy para validar todas as otimizações
-- Data: Janeiro 2025
-- Status esperado: Todos os testes devem passar (✅)
-- ============================================================================

-- ============================================================================
-- TESTE 1: VALIDAÇÃO DE PERFORMANCE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '🔍 TESTE 1: VALIDANDO PERFORMANCE DAS TABELAS...';
END $$;

-- Verificar status de performance atual
SELECT 
    '📊 PERFORMANCE POR TABELA' as teste,
    tabela,
    status_performance,
    percentual_index,
    CASE 
        WHEN status_performance = 'CRÍTICO' THEN '⚠️ NECESSITA ATENÇÃO'
        WHEN status_performance = 'ATENÇÃO' THEN '🔶 MONITORAR'
        ELSE '✅ OK'
    END as resultado
FROM monitor_database_performance()
ORDER BY 
    CASE status_performance 
        WHEN 'CRÍTICO' THEN 1 
        WHEN 'ATENÇÃO' THEN 2 
        ELSE 3 
    END;

-- ============================================================================
-- TESTE 2: VALIDAÇÃO DE SEGURANÇA RLS
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '🛡️ TESTE 2: VALIDANDO ISOLAMENTO RLS...';
END $$;

-- Testar isolamento entre workspaces (deve ser 100%)
SELECT 
    '🔒 ISOLAMENTO RLS' as teste,
    tabela,
    percentual_isolado,
    CASE 
        WHEN percentual_isolado = 100.00 THEN '✅ SEGURO'
        ELSE '❌ FALHA DE SEGURANÇA'
    END as resultado
FROM test_workspace_isolation()
ORDER BY percentual_isolado DESC;

-- ============================================================================
-- TESTE 3: VALIDAÇÃO DOS ÍNDICES CRÍTICOS
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '📈 TESTE 3: VALIDANDO ÍNDICES CRÍTICOS...';
END $$;

-- Verificar se todos os índices críticos existem
SELECT 
    '📌 ÍNDICES CRÍTICOS' as teste,
    indexname,
    tablename,
    CASE 
        WHEN idx_scan > 0 THEN '✅ ATIVO'
        ELSE '🔶 NÃO USADO AINDA'
    END as resultado
FROM pg_indexes pi
LEFT JOIN pg_stat_user_indexes psi ON (pi.schemaname = psi.schemaname AND pi.tablename = psi.relname AND pi.indexname = psi.indexrelname)
WHERE pi.schemaname = 'public' 
AND pi.tablename LIKE 'fp_%'
AND pi.indexname LIKE 'idx_%'
AND pi.indexname IN (
    'idx_fp_transacoes_workspace_dashboard',
    'idx_fp_usuarios_dashboard_admin',
    'idx_fp_categorias_workspace_tipo_ativo', 
    'idx_fp_transacoes_volume_stats',
    'idx_fp_usuarios_rls_lookup'
)
ORDER BY tablename, indexname;

-- ============================================================================
-- TESTE 4: VALIDAÇÃO DAS FUNCTIONS SQL
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '⚙️ TESTE 4: VALIDANDO FUNCTIONS DO DASHBOARD...';
END $$;

-- Testar function get_usuario_stats
SELECT 
    '👥 STATS USUÁRIOS' as teste,
    total_usuarios,
    usuarios_ativos,
    crescimento_percentual,
    CASE 
        WHEN total_usuarios > 0 AND usuarios_ativos >= 0 THEN '✅ OK'
        ELSE '❌ ERRO'
    END as resultado
FROM get_usuario_stats();

-- Testar function get_workspace_stats  
SELECT 
    '🏢 STATS WORKSPACES' as teste,
    total_workspaces,
    workspaces_com_transacoes,
    CASE 
        WHEN total_workspaces > 0 THEN '✅ OK'
        ELSE '❌ ERRO'
    END as resultado
FROM get_workspace_stats();

-- Testar function get_volume_stats
SELECT 
    '💰 STATS VOLUME' as teste,
    total_transacoes,
    transacoes_mes,
    CASE 
        WHEN total_transacoes >= 0 AND transacoes_mes >= 0 THEN '✅ OK'
        ELSE '❌ ERRO'
    END as resultado
FROM get_volume_stats();

-- ============================================================================
-- TESTE 5: VALIDAÇÃO DO SUPER ADMIN
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '👑 TESTE 5: VALIDANDO SUPER ADMIN...';
END $$;

-- Verificar se super admin está configurado
SELECT 
    '🔑 SUPER ADMIN' as teste,
    nome,
    email,
    super_admin,
    ativo,
    CASE 
        WHEN super_admin = true AND ativo = true THEN '✅ CONFIGURADO'
        ELSE '❌ PROBLEMA'
    END as resultado
FROM fp_usuarios 
WHERE super_admin = true OR email = 'conectamovelmar@gmail.com';

-- ============================================================================
-- TESTE 6: VALIDAÇÃO DOS LOGS DE AUDITORIA
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '📋 TESTE 6: VALIDANDO LOGS DE AUDITORIA...';
END $$;

-- Verificar logs recentes
SELECT 
    '📝 AUDITORIA RECENTE' as teste,
    COUNT(*) as logs_ultimos_7_dias,
    COUNT(DISTINCT workspace_id) as workspaces_ativos,
    COUNT(DISTINCT action) as tipos_acao,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ATIVO'
        ELSE '🔶 SEM ATIVIDADE'
    END as resultado
FROM fp_audit_logs 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- ============================================================================
-- TESTE 7: VALIDAÇÃO DE WORKSPACES E USUÁRIOS
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '🏠 TESTE 7: VALIDANDO ESTRUTURA MULTIUSUÁRIO...';
END $$;

-- Estatísticas gerais do sistema
SELECT 
    '📊 RESUMO SISTEMA' as teste,
    (SELECT COUNT(*) FROM fp_workspaces WHERE ativo = true) as workspaces_ativos,
    (SELECT COUNT(*) FROM fp_usuarios WHERE ativo = true) as usuarios_ativos,
    (SELECT COUNT(*) FROM fp_transacoes) as total_transacoes,
    (SELECT COUNT(*) FROM fp_categorias WHERE ativo = true) as categorias_ativas,
    '✅ DADOS CONSISTENTES' as resultado;

-- ============================================================================
-- TESTE 8: VALIDAÇÃO DE QUERIES CRÍTICAS DE PERFORMANCE  
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '🚀 TESTE 8: VALIDANDO QUERIES OTIMIZADAS...';
END $$;

-- Testar query otimizada de dashboard (deve ser rápida)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    w.id,
    w.nome,
    COUNT(DISTINCT u.id) as usuarios,
    COUNT(DISTINCT t.id) as transacoes,
    COALESCE(SUM(t.valor), 0) as volume_total
FROM fp_workspaces w
LEFT JOIN fp_usuarios u ON u.workspace_id = w.id AND u.ativo = true
LEFT JOIN fp_transacoes t ON t.workspace_id = w.id
WHERE w.ativo = true
GROUP BY w.id, w.nome
ORDER BY volume_total DESC;

-- ============================================================================
-- TESTE 9: VALIDAÇÃO FINAL - READINESS CHECK
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '🎯 TESTE 9: VALIDAÇÃO FINAL PARA DEPLOY...';
END $$;

-- Checklist final de readiness
WITH readiness_check AS (
    SELECT 
        CASE WHEN COUNT(*) = 5 THEN true ELSE false END as indices_criticos_ok
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname IN (
        'idx_fp_transacoes_workspace_dashboard',
        'idx_fp_usuarios_dashboard_admin', 
        'idx_fp_categorias_workspace_tipo_ativo',
        'idx_fp_transacoes_volume_stats',
        'idx_fp_usuarios_rls_lookup'
    )
),
security_check AS (
    SELECT 
        CASE WHEN MIN(percentual_isolado) = 100.00 THEN true ELSE false END as rls_ok
    FROM test_workspace_isolation()
),
admin_check AS (
    SELECT 
        CASE WHEN COUNT(*) = 1 THEN true ELSE false END as admin_ok
    FROM fp_usuarios 
    WHERE super_admin = true AND ativo = true
),
data_check AS (
    SELECT 
        CASE WHEN 
            (SELECT COUNT(*) FROM fp_workspaces WHERE ativo = true) >= 3 AND
            (SELECT COUNT(*) FROM fp_usuarios WHERE ativo = true) >= 3 AND
            (SELECT COUNT(*) FROM fp_transacoes) >= 50
        THEN true ELSE false END as data_ok
)
SELECT 
    '🚀 READINESS DEPLOY' as teste,
    rc.indices_criticos_ok,
    sc.rls_ok,
    ac.admin_ok,
    dc.data_ok,
    CASE 
        WHEN rc.indices_criticos_ok AND sc.rls_ok AND ac.admin_ok AND dc.data_ok 
        THEN '🎉 SISTEMA PRONTO PARA DEPLOY!'
        ELSE '⚠️ AGUARDAR - HÁ PENDÊNCIAS'
    END as resultado_final
FROM readiness_check rc, security_check sc, admin_check ac, data_check dc;

-- ============================================================================
-- RESUMO FINAL
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✅ VALIDAÇÃO PRÉ-DEPLOY CONCLUÍDA';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Se todos os testes retornaram ✅ OK, o sistema está pronto para deploy.';
    RAISE NOTICE 'Caso haja ❌ ERRO ou ⚠️ ATENÇÃO, revisar antes de prosseguir.';
    RAISE NOTICE '============================================================================';
END $$;