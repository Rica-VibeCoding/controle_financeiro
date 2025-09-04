-- =====================================================
-- OTIMIZAÇÃO DE ÍNDICES - SISTEMA MULTIUSUÁRIO
-- Data: 29/08/2025
-- Objetivo: Otimizar performance das queries multiusuário
-- =====================================================

-- =====================================================
-- 1. ÍNDICES OBRIGATÓRIOS PARA SISTEMA MULTIUSUÁRIO
-- =====================================================

-- Índice principal para fp_convites_links (busca por código)
-- CRÍTICO: Usado na validação de convites
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_convites_links_codigo_active
ON fp_convites_links (codigo) 
WHERE ativo = true;

-- Índice composto para listagem de convites ativos por workspace
-- Usado na página /configuracoes/usuarios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_convites_links_workspace_active_expires
ON fp_convites_links (workspace_id, ativo, expires_at DESC)
WHERE ativo = true;

-- Índice para fp_usuarios por workspace (listagem de usuários)
-- CRÍTICO: Usado em todas as operações de workspace
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_usuarios_workspace_active
ON fp_usuarios (workspace_id, ativo);

-- Índice para fp_usuarios por ID (lookup rápido)
-- Usado no sistema de autenticação
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_usuarios_id
ON fp_usuarios (id);

-- =====================================================
-- 2. ÍNDICES DE PERFORMANCE PARA TRANSAÇÕES
-- =====================================================

-- Índice composto principal para transações por workspace
-- CRÍTICO: Usado em dashboard e relatórios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_workspace_data_tipo
ON fp_transacoes (workspace_id, data DESC, tipo);

-- Índice para transações por categoria (relatórios)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_workspace_categoria
ON fp_transacoes (workspace_id, categoria_id, data DESC);

-- Índice para transações por conta (saldos)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_workspace_conta
ON fp_transacoes (workspace_id, conta_id);

-- =====================================================
-- 3. ÍNDICES PARA TABELAS AUXILIARES
-- =====================================================

-- Índice para categorias por workspace
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_categorias_workspace_ativo
ON fp_categorias (workspace_id, ativo)
WHERE ativo = true;

-- Índice para subcategorias por workspace e categoria
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_subcategorias_workspace_categoria
ON fp_subcategorias (workspace_id, categoria_id, ativo)
WHERE ativo = true;

-- Índice para contas por workspace
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_contas_workspace_ativo
ON fp_contas (workspace_id, ativo)
WHERE ativo = true;

-- Índice para formas de pagamento por workspace
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_formas_pagamento_workspace_ativo
ON fp_formas_pagamento (workspace_id, ativo)
WHERE ativo = true;

-- Índice para centros de custo por workspace
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_centros_custo_workspace_ativo
ON fp_centros_custo (workspace_id, ativo)
WHERE ativo = true;

-- =====================================================
-- 4. ÍNDICES ESPECIAIS PARA FUNCIONALIDADES AVANÇADAS
-- =====================================================

-- Índice para transações recorrentes (processamento de recorrência)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_recorrente_proxima
ON fp_transacoes (workspace_id, recorrente, proxima_recorrencia)
WHERE recorrente = true;

-- Índice para parcelamento (busca por grupo de parcelas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_grupo_parcelamento
ON fp_transacoes (workspace_id, grupo_parcelamento)
WHERE grupo_parcelamento IS NOT NULL;

-- Índice para transações por período (relatórios mensais/anuais)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_transacoes_workspace_data_month
ON fp_transacoes (workspace_id, EXTRACT(YEAR FROM data), EXTRACT(MONTH FROM data), tipo);

-- =====================================================
-- 5. VERIFICAÇÃO DOS ÍNDICES CRIADOS
-- =====================================================

-- Listar todos os índices criados para tabelas fp_
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename LIKE 'fp_%'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- 6. ANÁLISE DE TAMANHO DOS ÍNDICES
-- =====================================================

-- Verificar tamanho dos índices (para monitorar crescimento)
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as tamanho_indice
FROM pg_indexes 
WHERE tablename LIKE 'fp_%'
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- =====================================================
-- 7. CONSULTAS DE MONITORAMENTO DE PERFORMANCE
-- =====================================================

-- Query para monitorar uso dos índices em tempo real
-- Executar após implementar para verificar se estão sendo usados
CREATE OR REPLACE VIEW v_fp_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as usos,
    idx_tup_read as tuplas_lidas,
    idx_tup_fetch as tuplas_retornadas,
    CASE 
        WHEN idx_scan = 0 THEN 'NUNCA USADO'
        WHEN idx_scan < 10 THEN 'POUCO USADO'
        WHEN idx_scan < 100 THEN 'USO MODERADO' 
        ELSE 'MUITO USADO'
    END as status_uso
FROM pg_stat_user_indexes
WHERE tablename LIKE 'fp_%'
ORDER BY idx_scan DESC;

-- =====================================================
-- 8. COMANDOS DE MANUTENÇÃO RECOMENDADOS
-- =====================================================

-- Executar ANALYZE nas tabelas após criar índices
ANALYZE fp_convites_links;
ANALYZE fp_usuarios;
ANALYZE fp_workspaces;
ANALYZE fp_transacoes;
ANALYZE fp_categorias;
ANALYZE fp_subcategorias;
ANALYZE fp_contas;
ANALYZE fp_formas_pagamento;
ANALYZE fp_centros_custo;

-- =====================================================
-- 9. TESTES DE PERFORMANCE PÓS-OTIMIZAÇÃO
-- =====================================================

-- Testar query crítica 1: Validação de convite
EXPLAIN (ANALYZE, BUFFERS)
SELECT c.*, w.nome as workspace_nome
FROM fp_convites_links c
JOIN fp_workspaces w ON c.workspace_id = w.id
WHERE c.codigo = 'ABC123'
  AND c.ativo = true
  AND c.expires_at >= NOW();

-- Testar query crítica 2: Lista de usuários
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM fp_usuarios 
WHERE workspace_id = '01234567-89ab-cdef-0123-456789abcdef'::uuid
  AND ativo = true;

-- Testar query crítica 3: Transações por workspace
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM fp_transacoes 
WHERE workspace_id = '01234567-89ab-cdef-0123-456789abcdef'::uuid
ORDER BY data DESC 
LIMIT 50;

-- Testar query crítica 4: Agregação dashboard
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    c.nome,
    SUM(t.valor) as total
FROM fp_transacoes t
JOIN fp_categorias c ON t.categoria_id = c.id
WHERE t.workspace_id = '01234567-89ab-cdef-0123-456789abcdef'::uuid
  AND t.data >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY c.nome
ORDER BY total DESC;

-- =====================================================
-- 10. ALERTAS E RECOMENDAÇÕES
-- =====================================================

-- Query para identificar tabelas que podem precisar de VACUUM
SELECT 
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    ROUND(n_dead_tup * 100.0 / GREATEST(n_live_tup + n_dead_tup, 1), 2) as dead_tuple_percent,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE tablename LIKE 'fp_%'
  AND n_dead_tup > 100  -- Só mostrar se há tuplas mortas significativas
ORDER BY dead_tuple_percent DESC;

-- Query para identificar índices não utilizados (candidatos à remoção)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as vezes_usado,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as tamanho
FROM pg_stat_user_indexes
WHERE tablename LIKE 'fp_%'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey'  -- Excluir chaves primárias
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- =====================================================
-- RESUMO DAS OTIMIZAÇÕES IMPLEMENTADAS
-- =====================================================
/*
ÍNDICES CRÍTICOS CRIADOS:

1. SISTEMA DE CONVITES:
   - idx_fp_convites_links_codigo_active (busca por código)
   - idx_fp_convites_links_workspace_active_expires (listagem de convites)

2. SISTEMA DE USUÁRIOS:
   - idx_fp_usuarios_workspace_active (usuários por workspace)
   - idx_fp_usuarios_id (lookup por ID)

3. SISTEMA DE TRANSAÇÕES:
   - idx_fp_transacoes_workspace_data_tipo (queries principais)
   - idx_fp_transacoes_workspace_categoria (relatórios)
   - idx_fp_transacoes_workspace_conta (saldos)

4. TABELAS AUXILIARES:
   - Índices workspace + ativo para todas as tabelas fp_*

5. FUNCIONALIDADES AVANÇADAS:
   - Índices para recorrência e parcelamento
   - Índice para relatórios mensais

BENEFÍCIOS ESPERADOS:
- Queries de validação de convite: < 5ms
- Listagem de usuários: < 10ms  
- Dashboard principal: < 100ms
- Relatórios complexos: < 500ms
*/