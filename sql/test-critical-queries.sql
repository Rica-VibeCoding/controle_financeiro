-- =====================================================
-- TESTE DAS QUERIES CRÍTICAS - SISTEMA MULTIUSUÁRIO
-- Data: 29/08/2025
-- =====================================================

-- Primeiro, vamos obter um workspace_id real para testes
DO $$
DECLARE
    test_workspace_id uuid;
    test_user_id uuid;
BEGIN
    -- Pegar o primeiro workspace disponível
    SELECT id INTO test_workspace_id FROM fp_workspaces LIMIT 1;
    
    -- Pegar o primeiro usuário disponível
    SELECT id INTO test_user_id FROM fp_usuarios LIMIT 1;
    
    RAISE NOTICE 'Workspace ID para teste: %', test_workspace_id;
    RAISE NOTICE 'User ID para teste: %', test_user_id;
    
    -- Criar um convite de teste se necessário
    INSERT INTO fp_convites_links (
        workspace_id, 
        codigo, 
        criado_por, 
        expires_at
    ) VALUES (
        test_workspace_id,
        'TEST01',
        test_user_id,
        NOW() + INTERVAL '7 days'
    ) ON CONFLICT (codigo) DO NOTHING;
    
END $$;

-- =====================================================
-- QUERY 1: Lista de usuários do workspace (página /configuracoes/usuarios)
-- =====================================================
\echo '\n=== QUERY 1: Lista de usuários do workspace ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    id,
    workspace_id,
    nome,
    role,
    ativo,
    created_at,
    updated_at
FROM fp_usuarios 
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1);

-- =====================================================
-- QUERY 2: Lista de convites ativos (página /configuracoes/usuarios)
-- =====================================================
\echo '\n=== QUERY 2: Lista de convites ativos ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT *
FROM fp_convites_links
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
  AND ativo = true
  AND expires_at >= NOW()
ORDER BY created_at DESC;

-- =====================================================
-- QUERY 3: Validação de código de convite (página /juntar/[codigo])
-- =====================================================
\echo '\n=== QUERY 3: Validação de código de convite ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT c.*, w.*
FROM fp_convites_links c
JOIN fp_workspaces w ON c.workspace_id = w.id
WHERE c.codigo = 'TEST01'
  AND c.ativo = true
  AND c.expires_at >= NOW();

-- =====================================================
-- QUERY 4: Busca por workspace_id (comum em muitas operações)
-- =====================================================
\echo '\n=== QUERY 4: Busca por workspace_id ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT nome, owner_id, ativo
FROM fp_workspaces 
WHERE id = (SELECT id FROM fp_workspaces LIMIT 1);

-- =====================================================
-- QUERY 5: Inserção/Upsert de usuário (página /juntar/[codigo])
-- =====================================================
\echo '\n=== QUERY 5: Teste de Upsert de usuário ==='
-- Primeiro, explicar a query de inserção
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
INSERT INTO fp_usuarios (
    id, 
    workspace_id, 
    nome, 
    role, 
    ativo
) 
SELECT 
    gen_random_uuid(),
    (SELECT id FROM fp_workspaces LIMIT 1),
    'Usuario Teste Performance',
    'member',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM fp_usuarios WHERE nome = 'Usuario Teste Performance'
);

-- =====================================================
-- QUERY 6: Transações por workspace (query comum RLS)
-- =====================================================
\echo '\n=== QUERY 6: Transações por workspace (simulando RLS) ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    id,
    data,
    descricao,
    valor,
    tipo
FROM fp_transacoes 
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
ORDER BY data DESC 
LIMIT 20;

-- =====================================================
-- QUERY 7: Agregação por categoria (dashboard)
-- =====================================================
\echo '\n=== QUERY 7: Agregação por categoria ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    c.nome as categoria,
    COUNT(t.id) as quantidade_transacoes,
    SUM(t.valor) as total_valor
FROM fp_transacoes t
JOIN fp_categorias c ON t.categoria_id = c.id
WHERE t.workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
  AND t.data >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
GROUP BY c.id, c.nome
ORDER BY total_valor DESC;

-- =====================================================
-- VERIFICAÇÃO DE ÍNDICES EXISTENTES
-- =====================================================
\echo '\n=== ÍNDICES EXISTENTES NAS TABELAS CRÍTICAS ==='
SELECT 
    t.tablename,
    i.indexname,
    array_to_string(array_agg(a.attname), ', ') as colunas,
    i.indexdef
FROM pg_class c
JOIN pg_index ix ON c.oid = ix.indrelid
JOIN pg_class i ON ix.indexrelid = i.oid
JOIN pg_indexes i2 ON i2.indexname = i.relname
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(ix.indkey)
JOIN pg_tables t ON t.tablename = c.relname
WHERE t.tablename IN ('fp_convites_links', 'fp_usuarios', 'fp_workspaces', 'fp_transacoes', 'fp_categorias')
  AND t.schemaname = 'public'
GROUP BY t.tablename, i.relname, i2.indexdef
ORDER BY t.tablename, i.relname;

-- =====================================================
-- ESTATÍSTICAS DE PERFORMANCE DAS TABELAS
-- =====================================================
\echo '\n=== ESTATÍSTICAS DE USO DAS TABELAS ==='
SELECT 
    schemaname,
    relname as tabela,
    n_live_tup as registros_vivos,
    n_dead_tup as registros_mortos,
    n_tup_ins as total_inserções,
    n_tup_upd as total_atualizações,
    n_tup_del as total_exclusões,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE relname IN ('fp_convites_links', 'fp_usuarios', 'fp_workspaces', 'fp_transacoes', 'fp_categorias')
ORDER BY n_live_tup DESC;

-- =====================================================
-- ESTATÍSTICAS DE USO DOS ÍNDICES
-- =====================================================
\echo '\n=== ESTATÍSTICAS DE USO DOS ÍNDICES ==='
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as vezes_usado,
    idx_tup_read as tuplas_lidas,
    idx_tup_fetch as tuplas_obtidas
FROM pg_stat_user_indexes
WHERE tablename IN ('fp_convites_links', 'fp_usuarios', 'fp_workspaces', 'fp_transacoes', 'fp_categorias')
ORDER BY tablename, idx_scan DESC;

-- =====================================================
-- LIMPEZA (remover dados de teste)
-- =====================================================
\echo '\n=== LIMPEZA DE DADOS DE TESTE ==='
DELETE FROM fp_usuarios WHERE nome = 'Usuario Teste Performance';
DELETE FROM fp_convites_links WHERE codigo = 'TEST01';

\echo '\n=== ANÁLISE CONCLUÍDA ==='