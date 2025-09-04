-- =====================================================
-- ANÁLISE DE PERFORMANCE - SISTEMA MULTIUSUÁRIO
-- Data: 29/08/2025
-- Objetivo: Analisar queries críticas das Prioridades 4
-- =====================================================

-- 1. VERIFICAÇÃO DE ÍNDICES EXISTENTES
-- =====================================================

-- Índices na tabela fp_convites_links
SELECT 
    schemaname,
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'fp_convites_links';

-- Índices nas tabelas principais (workspace_id)
SELECT 
    schemaname,
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename IN ('fp_usuarios', 'fp_workspaces', 'fp_transacoes', 'fp_categorias')
ORDER BY tablename, indexname;

-- =====================================================
-- 2. ANÁLISE DAS QUERIES DA PÁGINA /configuracoes/usuarios
-- =====================================================

-- 2.1. Query: Lista de usuários do workspace
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    id,
    workspace_id,
    nome,
    role,
    ativo,
    created_at,
    updated_at
FROM fp_usuarios 
WHERE workspace_id = '01234567-89ab-cdef-0123-456789abcdef'::uuid;

-- 2.2. Query: Lista de convites ativos
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM fp_convites_links
WHERE workspace_id = '01234567-89ab-cdef-0123-456789abcdef'::uuid
  AND ativo = true
  AND expires_at >= NOW()
ORDER BY created_at DESC;

-- 2.3. Query: Inserção de novo convite
EXPLAIN (ANALYZE, BUFFERS)
INSERT INTO fp_convites_links (
    workspace_id, 
    codigo, 
    criado_por, 
    expires_at
) VALUES (
    '01234567-89ab-cdef-0123-456789abcdef'::uuid,
    'ABC123',
    '01234567-89ab-cdef-0123-456789abcdef'::uuid,
    NOW() + INTERVAL '7 days'
)
RETURNING *;

-- 2.4. Query: Desativação de convite
EXPLAIN (ANALYZE, BUFFERS)
UPDATE fp_convites_links 
SET ativo = false 
WHERE codigo = 'ABC123';

-- =====================================================
-- 3. ANÁLISE DAS QUERIES DA PÁGINA /juntar/[codigo]
-- =====================================================

-- 3.1. Query: Validação de código de convite (com JOIN)
EXPLAIN (ANALYZE, BUFFERS)
SELECT c.*, w.*
FROM fp_convites_links c
JOIN fp_workspaces w ON c.workspace_id = w.id
WHERE c.codigo = 'ABC123'
  AND c.ativo = true
  AND c.expires_at >= NOW();

-- 3.2. Query: Inserção/Atualização de usuário no workspace
EXPLAIN (ANALYZE, BUFFERS)
INSERT INTO fp_usuarios (
    id, 
    workspace_id, 
    nome, 
    role, 
    ativo
) VALUES (
    '01234567-89ab-cdef-0123-456789abcdef'::uuid,
    '01234567-89ab-cdef-0123-456789abcdef'::uuid,
    'Novo Usuario',
    'member',
    true
) ON CONFLICT (id) DO UPDATE SET
    workspace_id = EXCLUDED.workspace_id,
    nome = EXCLUDED.nome,
    role = EXCLUDED.role,
    ativo = EXCLUDED.ativo,
    updated_at = NOW();

-- =====================================================
-- 4. ANÁLISE DE PERFORMANCE RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Verificar políticas RLS ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('fp_convites_links', 'fp_usuarios', 'fp_categorias', 'fp_transacoes')
ORDER BY tablename, policyname;

-- Test RLS overhead com SET ROLE
SET ROLE authenticated;

-- Query com RLS ativo
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM fp_transacoes 
WHERE workspace_id = get_user_workspace_id()
ORDER BY data DESC 
LIMIT 100;

RESET ROLE;

-- =====================================================
-- 5. QUERIES DE DASHBOARD COM MÚLTIPLOS USUÁRIOS
-- =====================================================

-- 5.1. Agregação por categoria (comum no dashboard)
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    c.nome as categoria,
    SUM(t.valor) as total
FROM fp_transacoes t
JOIN fp_categorias c ON t.categoria_id = c.id
WHERE t.workspace_id = '01234567-89ab-cdef-0123-456789abcdef'::uuid
  AND t.data >= DATE_TRUNC('month', CURRENT_DATE)
  AND t.tipo = 'despesa'
GROUP BY c.id, c.nome
ORDER BY total DESC;

-- 5.2. Saldo de contas por workspace
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    co.nome as conta,
    SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE -t.valor END) as saldo
FROM fp_transacoes t
JOIN fp_contas co ON t.conta_id = co.id
WHERE t.workspace_id = '01234567-89ab-cdef-0123-456789abcdef'::uuid
GROUP BY co.id, co.nome;

-- =====================================================
-- 6. ESTATÍSTICAS DE USO DAS TABELAS
-- =====================================================

-- Estatísticas gerais de uso das tabelas
SELECT 
    schemaname,
    relname as tabela,
    n_tup_ins as inserções,
    n_tup_upd as atualizações,
    n_tup_del as exclusões,
    n_live_tup as registros_ativos,
    n_dead_tup as registros_mortos,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE relname LIKE 'fp_%'
ORDER BY n_live_tup DESC;

-- =====================================================
-- 7. ÍNDICES RECOMENDADOS PARA OTIMIZAÇÃO
-- =====================================================

-- Índice composto para fp_convites_links (workspace + status + expiração)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_convites_links_workspace_active 
-- ON fp_convites_links (workspace_id, ativo, expires_at) 
-- WHERE ativo = true;

-- Índice para busca por código (único e mais usado)
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_convites_links_codigo_unique
-- ON fp_convites_links (codigo)
-- WHERE ativo = true;

-- Índice para fp_usuarios por workspace
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_usuarios_workspace_id
-- ON fp_usuarios (workspace_id, ativo);

-- =====================================================
-- 8. QUERIES DE MONITORAMENTO CONTÍNUO
-- =====================================================

-- Query para identificar queries lentas em tempo real
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '1 second'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;

-- Estatísticas de índices (hit ratio)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as usos_indice,
    idx_tup_read as tuplas_lidas,
    idx_tup_fetch as tuplas_obtidas,
    ROUND(
        CASE 
            WHEN idx_tup_read = 0 THEN 0
            ELSE (idx_tup_fetch::float / idx_tup_read::float) * 100
        END, 2
    ) as hit_ratio_pct
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
  AND tablename LIKE 'fp_%'
ORDER BY usos_indice DESC;

-- =====================================================
-- 9. TESTE DE CARGA SIMULADA
-- =====================================================

-- Simular múltiplas consultas simultâneas (executar em paralelo)
DO $$
DECLARE
    workspace_ids uuid[] := ARRAY[
        '01234567-89ab-cdef-0123-456789abcdef',
        '11111111-2222-3333-4444-555555555555',
        '22222222-3333-4444-5555-666666666666'
    ];
    ws_id uuid;
BEGIN
    FOREACH ws_id IN ARRAY workspace_ids
    LOOP
        PERFORM COUNT(*)
        FROM fp_transacoes 
        WHERE workspace_id = ws_id;
        
        PERFORM COUNT(*)
        FROM fp_usuarios 
        WHERE workspace_id = ws_id;
    END LOOP;
END $$;