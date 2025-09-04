-- =====================================================
-- DATABASE PERFORMANCE OPTIMIZATION INDEXES
-- Financial Control System - Multi-Workspace
-- =====================================================

-- DROP existing indexes if they exist (for clean re-creation)
DROP INDEX IF EXISTS idx_fp_transacoes_workspace_data_status;
DROP INDEX IF EXISTS idx_fp_transacoes_workspace_conta_status;
DROP INDEX IF EXISTS idx_fp_transacoes_workspace_categoria_tipo_data;
DROP INDEX IF EXISTS idx_fp_transacoes_workspace_conta_destino_status;
DROP INDEX IF EXISTS idx_fp_transacoes_workspace_recorrente_proxima;
DROP INDEX IF EXISTS idx_fp_transacoes_workspace_grupo_parcela;
DROP INDEX IF EXISTS idx_fp_transacoes_workspace_descricao_text;
DROP INDEX IF EXISTS idx_fp_categorias_workspace_ativo;
DROP INDEX IF EXISTS idx_fp_contas_workspace_tipo_ativo;
DROP INDEX IF EXISTS idx_fp_metas_workspace_mes_categoria;

-- =====================================================
-- PRIORITY 1: CRITICAL PERFORMANCE INDEXES
-- =====================================================

-- Index 1: Primary workspace + date filtering (MOST IMPORTANT)
-- Optimizes: Dashboard queries, transaction listing, date range filters
-- Pattern: workspace_id + data DESC + status
CREATE INDEX idx_fp_transacoes_workspace_data_status 
ON fp_transacoes (workspace_id, data DESC, status);

-- Index 2: Account balance calculations
-- Optimizes: calcularSaldoConta(), balance queries
-- Pattern: workspace_id + conta_id + status
CREATE INDEX idx_fp_transacoes_workspace_conta_status 
ON fp_transacoes (workspace_id, conta_id, status);

-- Index 3: Category analysis and filtering
-- Optimizes: Category spending, dashboard categorias, filtering
-- Pattern: workspace_id + categoria_id + tipo + data
CREATE INDEX idx_fp_transacoes_workspace_categoria_tipo_data 
ON fp_transacoes (workspace_id, categoria_id, tipo, data);

-- =====================================================
-- PRIORITY 2: DASHBOARD AND FILTERING INDEXES
-- =====================================================

-- Index 4: Transfer calculations (conta_destino_id queries)
-- Optimizes: Transfer balance calculations, money flow analysis
-- Pattern: workspace_id + conta_destino_id + status (only for transfers)
CREATE INDEX idx_fp_transacoes_workspace_conta_destino_status 
ON fp_transacoes (workspace_id, conta_destino_id, status) 
WHERE conta_destino_id IS NOT NULL;

-- Index 5: Supporting table - Categories
-- Optimizes: Category lookups in dashboard and forms
-- Pattern: workspace_id + ativo (active categories only)
CREATE INDEX idx_fp_categorias_workspace_ativo 
ON fp_categorias (workspace_id, ativo);

-- Index 6: Supporting table - Accounts
-- Optimizes: Account filtering by type (cards, bank accounts, etc.)
-- Pattern: workspace_id + tipo + ativo
CREATE INDEX idx_fp_contas_workspace_tipo_ativo 
ON fp_contas (workspace_id, tipo, ativo);

-- =====================================================
-- PRIORITY 3: ADVANCED FEATURES INDEXES
-- =====================================================

-- Index 7: Recurring transactions processing
-- Optimizes: Recurrence processing, upcoming transactions
-- Pattern: workspace_id + recorrente + proxima_recorrencia (only for recurring)
CREATE INDEX idx_fp_transacoes_workspace_recorrente_proxima 
ON fp_transacoes (workspace_id, recorrente, proxima_recorrencia) 
WHERE recorrente = true;

-- Index 8: Installment grouping
-- Optimizes: Installment queries, grouped operations
-- Pattern: workspace_id + grupo_parcelamento + parcela_atual (only for installments)
CREATE INDEX idx_fp_transacoes_workspace_grupo_parcela 
ON fp_transacoes (workspace_id, grupo_parcelamento, parcela_atual) 
WHERE grupo_parcelamento IS NOT NULL;

-- Index 9: Monthly goals/metas
-- Optimizes: Monthly goal queries and comparisons
-- Pattern: workspace_id + mes_referencia + categoria_id
CREATE INDEX idx_fp_metas_workspace_mes_categoria 
ON fp_metas_mensais (workspace_id, mes_referencia, categoria_id);

-- =====================================================
-- PRIORITY 4: TEXT SEARCH OPTIMIZATION (OPTIONAL)
-- =====================================================

-- Index 10: Description text search (for ILIKE queries)
-- Optimizes: Transaction search by description
-- Uses GIN index for full-text search in Portuguese
-- Uncomment if text search performance is needed:
-- CREATE INDEX idx_fp_transacoes_workspace_descricao_text 
-- ON fp_transacoes USING gin(workspace_id, to_tsvector('portuguese', descricao));

-- =====================================================
-- INDEX ANALYSIS AND MONITORING QUERIES
-- =====================================================

-- Query to check index usage after implementation:
/*
SELECT 
  schemaname,
  relname,
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE relname LIKE 'fp_%'
ORDER BY idx_scan DESC;
*/

-- Query to check index sizes:
/*
SELECT 
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE tablename LIKE 'fp_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;
*/

-- Query to identify slow queries (enable pg_stat_statements first):
/*
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  stddev_exec_time
FROM pg_stat_statements 
WHERE query ILIKE '%fp_%'
ORDER BY mean_exec_time DESC
LIMIT 10;
*/

-- =====================================================
-- MAINTENANCE NOTES
-- =====================================================

/*
MAINTENANCE RECOMMENDATIONS:

1. MONITOR INDEX USAGE:
   - Run index usage queries weekly
   - Remove unused indexes after 1 month
   - Check for missing indexes on new query patterns

2. VACUUM AND ANALYZE:
   - VACUUM ANALYZE fp_transacoes weekly
   - REINDEX if fragmentation > 20%
   - Monitor index bloat quarterly

3. PERFORMANCE BASELINES:
   - Measure query times before and after
   - Set up monitoring for queries > 100ms
   - Alert on index scan ratio < 95%

4. SCALING CONSIDERATIONS:
   - Plan for 10K+ transactions per workspace
   - Consider partitioning at 1M+ total records
   - Monitor connection pool under load
*/