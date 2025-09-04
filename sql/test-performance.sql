-- =====================================================
-- TESTE DE PERFORMANCE DOS ÍNDICES MULTIUSUÁRIO
-- Validação dos 9 índices de workspace_id criados
-- =====================================================

-- 1. VERIFICAR ÍNDICES CRIADOS
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (indexname LIKE 'idx_fp_%workspace%' OR indexdef LIKE '%workspace_id%')
ORDER BY tablename, indexname;

-- 2. OBTER WORKSPACE_ID VÁLIDO PARA TESTES
WITH workspace_info AS (
  SELECT id as workspace_id FROM fp_workspaces LIMIT 1
)
SELECT 'workspace_id: ' || workspace_id FROM workspace_info;

-- =====================================================
-- 3. TESTES CRÍTICOS DE PERFORMANCE COM EXPLAIN ANALYZE
-- =====================================================

-- Teste 1: Query principal do dashboard (Index: idx_fp_transacoes_workspace_data_status)
-- Deve usar: Index Scan using idx_fp_transacoes_workspace_data_status
EXPLAIN ANALYZE
SELECT * FROM fp_transacoes 
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
AND data >= '2025-01-01'
AND status = 'realizado'
ORDER BY data DESC
LIMIT 100;

-- Teste 2: Cálculo de saldos por conta (Index: idx_fp_transacoes_workspace_conta_status)  
-- Deve usar: Index Scan using idx_fp_transacoes_workspace_conta_status
EXPLAIN ANALYZE
SELECT conta_id, SUM(valor) as saldo
FROM fp_transacoes 
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
AND status = 'realizado'
GROUP BY conta_id;

-- Teste 3: Análise por categoria (Index: idx_fp_transacoes_workspace_categoria_tipo_data)
-- Deve usar: Index Scan using idx_fp_transacoes_workspace_categoria_tipo_data  
EXPLAIN ANALYZE
SELECT c.nome, COUNT(t.id) as total_transacoes, SUM(t.valor) as total_valor
FROM fp_categorias c
LEFT JOIN fp_transacoes t ON c.id = t.categoria_id
WHERE c.workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
AND c.ativo = true
AND (t.tipo = 'despesa' OR t.tipo IS NULL)
GROUP BY c.id, c.nome
ORDER BY total_valor DESC;

-- Teste 4: Transferências (Index: idx_fp_transacoes_workspace_conta_destino_status)
-- Deve usar: Index Scan using idx_fp_transacoes_workspace_conta_destino_status
EXPLAIN ANALYZE
SELECT COUNT(*) as total_transferencias, SUM(valor) as valor_total
FROM fp_transacoes 
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
AND conta_destino_id IS NOT NULL
AND status = 'realizado';

-- Teste 5: Categorias ativas (Index: idx_fp_categorias_workspace_ativo)
-- Deve usar: Index Scan using idx_fp_categorias_workspace_ativo
EXPLAIN ANALYZE
SELECT * FROM fp_categorias 
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
AND ativo = true
ORDER BY nome;

-- Teste 6: Contas por tipo (Index: idx_fp_contas_workspace_tipo_ativo)
-- Deve usar: Index Scan using idx_fp_contas_workspace_tipo_ativo
EXPLAIN ANALYZE
SELECT tipo, COUNT(*) as total_contas
FROM fp_contas 
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
AND ativo = true
GROUP BY tipo;

-- Teste 7: Transações recorrentes (Index: idx_fp_transacoes_workspace_recorrente_proxima)
-- Deve usar: Index Scan using idx_fp_transacoes_workspace_recorrente_proxima
EXPLAIN ANALYZE
SELECT * FROM fp_transacoes 
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
AND recorrente = true
AND proxima_recorrencia <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY proxima_recorrencia;

-- Teste 8: Parcelas (Index: idx_fp_transacoes_workspace_grupo_parcela)
-- Deve usar: Index Scan using idx_fp_transacoes_workspace_grupo_parcela
EXPLAIN ANALYZE
SELECT grupo_parcelamento, COUNT(*) as total_parcelas
FROM fp_transacoes 
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
AND grupo_parcelamento IS NOT NULL
GROUP BY grupo_parcelamento
ORDER BY grupo_parcelamento;

-- Teste 9: Metas mensais (Index: idx_fp_metas_workspace_mes_categoria)
-- Deve usar: Index Scan using idx_fp_metas_workspace_mes_categoria
EXPLAIN ANALYZE
SELECT c.nome as categoria, m.valor_meta
FROM fp_metas_mensais m
JOIN fp_categorias c ON m.categoria_id = c.id
WHERE m.workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
AND m.mes_referencia = EXTRACT(YEAR FROM CURRENT_DATE) * 100 + EXTRACT(MONTH FROM CURRENT_DATE);

-- =====================================================
-- 4. ESTATÍSTICAS DE USO DOS ÍNDICES
-- =====================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans_realizados,
  idx_tup_read as tuplas_lidas,
  idx_tup_fetch as tuplas_buscadas,
  CASE 
    WHEN idx_scan = 0 THEN 'NUNCA USADO'
    WHEN idx_scan < 10 THEN 'POUCO USADO'
    WHEN idx_scan < 100 THEN 'USO MODERADO'
    ELSE 'MUITO USADO'
  END as status_uso
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_fp_%workspace%'
ORDER BY idx_scan DESC;

-- =====================================================
-- 5. TAMANHOS DOS ÍNDICES
-- =====================================================
SELECT 
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as tamanho_indice,
  pg_size_pretty(pg_relation_size(tablename::regclass)) as tamanho_tabela
FROM pg_indexes 
WHERE indexname LIKE 'idx_fp_%workspace%'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- =====================================================
-- 6. QUERIES LENTAS (se pg_stat_statements estiver habilitado)
-- =====================================================
SELECT 
  LEFT(query, 80) as query_resumo,
  calls as chamadas,
  ROUND(total_exec_time::numeric, 2) as tempo_total_ms,
  ROUND(mean_exec_time::numeric, 2) as tempo_medio_ms,
  ROUND(max_exec_time::numeric, 2) as tempo_max_ms
FROM pg_stat_statements
WHERE query LIKE '%workspace_id%'
AND mean_exec_time > 10
ORDER BY mean_exec_time DESC
LIMIT 10;

-- =====================================================
-- RELATÓRIO DE VALIDAÇÃO
-- =====================================================

-- Verificação final: contagem total dos índices criados
SELECT COUNT(*) as total_indices_workspace_criados 
FROM pg_indexes 
WHERE indexname LIKE 'idx_fp_%workspace%';

-- CRITÉRIOS DE APROVAÇÃO:
-- ✓ Todos os 9 índices devem estar presentes
-- ✓ Queries principais devem usar Index Scan
-- ✓ Tempo médio < 50ms para queries padrão
-- ✓ Índices devem estar sendo utilizados (idx_scan > 0)