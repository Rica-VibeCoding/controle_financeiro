-- =====================================================
-- VALIDAÇÃO DAS OTIMIZAÇÕES DE PERFORMANCE
-- Data: 29/08/2025
-- Objetivo: Verificar se as otimizações foram aplicadas
-- =====================================================

-- =====================================================
-- 1. VERIFICAÇÃO DOS ÍNDICES CRIADOS
-- =====================================================

\echo '=== VERIFICANDO ÍNDICES CRÍTICOS ==='

-- Verificar se os índices críticos foram criados
DO $$
DECLARE
    indices_criados integer := 0;
    indices_esperados text[] := ARRAY[
        'idx_fp_convites_links_codigo_active',
        'idx_fp_usuarios_workspace_active',
        'idx_fp_convites_links_workspace_active_expires',
        'idx_fp_transacoes_workspace_data_tipo'
    ];
    indice_nome text;
BEGIN
    -- Verificar cada índice esperado
    FOREACH indice_nome IN ARRAY indices_esperados
    LOOP
        IF EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = indice_nome AND schemaname = 'public'
        ) THEN
            indices_criados := indices_criados + 1;
            RAISE NOTICE '✅ Índice encontrado: %', indice_nome;
        ELSE
            RAISE WARNING '❌ Índice FALTANDO: %', indice_nome;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'RESULTADO: % de % índices críticos criados', indices_criados, array_length(indices_esperados, 1);
    
    IF indices_criados = array_length(indices_esperados, 1) THEN
        RAISE NOTICE '🎉 TODOS OS ÍNDICES CRÍTICOS ESTÃO CRIADOS!';
    ELSE
        RAISE WARNING '⚠️  ALGUNS ÍNDICES CRÍTICOS ESTÃO FALTANDO!';
    END IF;
END $$;

-- =====================================================
-- 2. TESTE DE PERFORMANCE DAS QUERIES CRÍTICAS
-- =====================================================

\echo ''
\echo '=== TESTANDO PERFORMANCE DAS QUERIES CRÍTICAS ==='

-- Obter IDs reais para teste
DO $$
DECLARE
    test_workspace_id uuid;
    test_codigo text;
    execution_time_ms numeric;
BEGIN
    -- Obter um workspace real
    SELECT id INTO test_workspace_id FROM fp_workspaces LIMIT 1;
    
    -- Obter ou criar um código de convite para teste
    SELECT codigo INTO test_codigo FROM fp_convites_links WHERE ativo = true LIMIT 1;
    
    IF test_codigo IS NULL THEN
        test_codigo := 'PERF01';
        INSERT INTO fp_convites_links (workspace_id, codigo, criado_por, expires_at, ativo)
        VALUES (test_workspace_id, test_codigo, (SELECT owner_id FROM fp_workspaces WHERE id = test_workspace_id), NOW() + INTERVAL '7 days', true)
        ON CONFLICT (codigo) DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Usando Workspace ID: %', test_workspace_id;
    RAISE NOTICE 'Usando Código de Teste: %', test_codigo;
END $$;

-- Teste 1: Validação de código de convite (QUERY MAIS CRÍTICA)
\echo ''
\echo '--- TESTE 1: Validação de código de convite ---'
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT c.*, w.nome as workspace_nome
FROM fp_convites_links c
JOIN fp_workspaces w ON c.workspace_id = w.id
WHERE c.codigo = (SELECT codigo FROM fp_convites_links WHERE ativo = true LIMIT 1)
  AND c.ativo = true
  AND c.expires_at >= NOW();

-- Teste 2: Lista de usuários por workspace
\echo ''
\echo '--- TESTE 2: Lista de usuários por workspace ---'
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    id, workspace_id, nome, role, ativo, created_at, updated_at
FROM fp_usuarios 
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
  AND ativo = true;

-- Teste 3: Lista de convites ativos
\echo ''
\echo '--- TESTE 3: Lista de convites ativos ---'
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT *
FROM fp_convites_links
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
  AND ativo = true
  AND expires_at >= NOW()
ORDER BY created_at DESC;

-- =====================================================
-- 3. ANÁLISE DE USO DOS ÍNDICES
-- =====================================================

\echo ''
\echo '=== ANÁLISE DE USO DOS ÍNDICES ==='

-- Verificar quais índices estão sendo usados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as "Vezes Usado",
    CASE 
        WHEN idx_scan = 0 THEN '❌ Nunca usado'
        WHEN idx_scan < 10 THEN '⚠️ Pouco usado'
        WHEN idx_scan < 100 THEN '✅ Uso moderado'
        ELSE '🎉 Muito usado'
    END as "Status",
    pg_size_pretty(pg_relation_size(indexname::regclass)) as "Tamanho"
FROM pg_stat_user_indexes
WHERE tablename IN ('fp_convites_links', 'fp_usuarios', 'fp_workspaces', 'fp_transacoes')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, idx_scan DESC;

-- =====================================================
-- 4. VERIFICAÇÃO DE SAÚDE DAS TABELAS
-- =====================================================

\echo ''
\echo '=== VERIFICAÇÃO DE SAÚDE DAS TABELAS ==='

SELECT 
    schemaname,
    relname as "Tabela",
    n_live_tup as "Registros Vivos",
    n_dead_tup as "Registros Mortos",
    CASE 
        WHEN n_live_tup + n_dead_tup = 0 THEN 0
        ELSE ROUND((n_dead_tup * 100.0) / (n_live_tup + n_dead_tup), 2)
    END as "% Mortos",
    CASE 
        WHEN n_live_tup + n_dead_tup = 0 THEN '✅ Vazia'
        WHEN (n_dead_tup * 100.0) / (n_live_tup + n_dead_tup) < 10 THEN '✅ Saudável'
        WHEN (n_dead_tup * 100.0) / (n_live_tup + n_dead_tup) < 25 THEN '⚠️ Precisa VACUUM'
        ELSE '❌ Precisa VACUUM URGENTE'
    END as "Status Saúde",
    last_analyze as "Último ANALYZE"
FROM pg_stat_user_tables 
WHERE relname IN ('fp_convites_links', 'fp_usuarios', 'fp_workspaces', 'fp_transacoes', 'fp_categorias')
ORDER BY n_live_tup DESC;

-- =====================================================
-- 5. BENCHMARK DE PERFORMANCE COMPARATIVO
-- =====================================================

\echo ''
\echo '=== BENCHMARK DE PERFORMANCE ==='

-- Função para medir tempo de execução
CREATE OR REPLACE FUNCTION measure_query_time(query_text text) 
RETURNS numeric AS $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    execution_time_ms numeric;
BEGIN
    start_time := clock_timestamp();
    EXECUTE query_text;
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    RETURN execution_time_ms;
END;
$$ LANGUAGE plpgsql;

-- Benchmark das queries críticas
DO $$
DECLARE
    tempo_validacao numeric;
    tempo_usuarios numeric;
    tempo_convites numeric;
    test_workspace_id uuid;
    test_codigo text;
BEGIN
    -- Obter dados para teste
    SELECT id INTO test_workspace_id FROM fp_workspaces LIMIT 1;
    SELECT codigo INTO test_codigo FROM fp_convites_links WHERE ativo = true LIMIT 1;
    
    IF test_codigo IS NULL THEN
        test_codigo := 'BENCH01';
        INSERT INTO fp_convites_links (workspace_id, codigo, criado_por, expires_at)
        VALUES (test_workspace_id, test_codigo, (SELECT owner_id FROM fp_workspaces WHERE id = test_workspace_id), NOW() + INTERVAL '1 day')
        ON CONFLICT (codigo) DO NOTHING;
    END IF;
    
    -- Medir tempo das queries
    SELECT measure_query_time(format(
        'SELECT c.*, w.nome FROM fp_convites_links c JOIN fp_workspaces w ON c.workspace_id = w.id WHERE c.codigo = %L AND c.ativo = true AND c.expires_at >= NOW()',
        test_codigo
    )) INTO tempo_validacao;
    
    SELECT measure_query_time(format(
        'SELECT COUNT(*) FROM fp_usuarios WHERE workspace_id = %L AND ativo = true',
        test_workspace_id
    )) INTO tempo_usuarios;
    
    SELECT measure_query_time(format(
        'SELECT COUNT(*) FROM fp_convites_links WHERE workspace_id = %L AND ativo = true AND expires_at >= NOW()',
        test_workspace_id
    )) INTO tempo_convites;
    
    -- Relatório de performance
    RAISE NOTICE '';
    RAISE NOTICE '🚀 BENCHMARK DE PERFORMANCE:';
    RAISE NOTICE '';
    RAISE NOTICE 'Query de Validação de Convite: % ms %', 
        ROUND(tempo_validacao, 2), 
        CASE WHEN tempo_validacao < 10 THEN '✅' WHEN tempo_validacao < 50 THEN '⚠️' ELSE '❌' END;
    RAISE NOTICE 'Query de Lista de Usuários: % ms %', 
        ROUND(tempo_usuarios, 2),
        CASE WHEN tempo_usuarios < 20 THEN '✅' WHEN tempo_usuarios < 100 THEN '⚠️' ELSE '❌' END;
    RAISE NOTICE 'Query de Lista de Convites: % ms %', 
        ROUND(tempo_convites, 2),
        CASE WHEN tempo_convites < 10 THEN '✅' WHEN tempo_convites < 50 THEN '⚠️' ELSE '❌' END;
    RAISE NOTICE '';
    
    -- Avaliação geral
    IF tempo_validacao < 10 AND tempo_usuarios < 20 AND tempo_convites < 10 THEN
        RAISE NOTICE '🎉 PERFORMANCE EXCELENTE! Sistema otimizado com sucesso.';
    ELSIF tempo_validacao < 50 AND tempo_usuarios < 100 AND tempo_convites < 50 THEN
        RAISE NOTICE '✅ PERFORMANCE BOA. Sistema funcionando adequadamente.';
    ELSE
        RAISE WARNING '⚠️ PERFORMANCE PODE MELHORAR. Verificar se índices foram criados.';
    END IF;
END $$;

-- =====================================================
-- 6. RELATÓRIO FINAL DE VALIDAÇÃO
-- =====================================================

\echo ''
\echo '=== RELATÓRIO FINAL DE VALIDAÇÃO ==='

DO $$
DECLARE
    indices_count integer;
    tables_analyzed integer;
    performance_score integer := 0;
BEGIN
    -- Contar índices críticos
    SELECT COUNT(*) INTO indices_count
    FROM pg_indexes 
    WHERE indexname IN (
        'idx_fp_convites_links_codigo_active',
        'idx_fp_usuarios_workspace_active',
        'idx_fp_convites_links_workspace_active_expires',
        'idx_fp_transacoes_workspace_data_tipo'
    ) AND schemaname = 'public';
    
    -- Contar tabelas que foram analisadas recentemente
    SELECT COUNT(*) INTO tables_analyzed
    FROM pg_stat_user_tables 
    WHERE relname IN ('fp_convites_links', 'fp_usuarios', 'fp_workspaces', 'fp_transacoes')
      AND last_analyze > NOW() - INTERVAL '1 day';
    
    -- Calcular score de performance
    performance_score := (indices_count * 25); -- 25 pontos por índice crítico
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMO DA VALIDAÇÃO:';
    RAISE NOTICE '├─ Índices críticos criados: %/4 (% pontos)', indices_count, indices_count * 25;
    RAISE NOTICE '├─ Tabelas analisadas: %/4', tables_analyzed;
    RAISE NOTICE '└─ Score de Performance: %/100', performance_score;
    RAISE NOTICE '';
    
    IF performance_score >= 100 THEN
        RAISE NOTICE '🏆 OTIMIZAÇÃO COMPLETA! Sistema multiusuário totalmente otimizado.';
    ELSIF performance_score >= 75 THEN
        RAISE NOTICE '✅ OTIMIZAÇÃO BOA! Principais melhorias implementadas.';
    ELSIF performance_score >= 50 THEN
        RAISE NOTICE '⚠️ OTIMIZAÇÃO PARCIAL! Alguns índices ainda precisam ser criados.';
    ELSE
        RAISE NOTICE '❌ OTIMIZAÇÃO INCOMPLETA! Execute o script optimize-indexes-multiuser.sql';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📝 Para completar a otimização, execute:';
    RAISE NOTICE '   psql -f sql/optimize-indexes-multiuser.sql';
END $$;

-- Limpar função temporária
DROP FUNCTION IF EXISTS measure_query_time(text);

-- Limpar dados de teste
DELETE FROM fp_convites_links WHERE codigo IN ('PERF01', 'BENCH01');

\echo ''
\echo '✅ VALIDAÇÃO CONCLUÍDA!'
\echo ''