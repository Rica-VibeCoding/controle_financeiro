-- =====================================================
-- BATERIA COMPLETA DE TESTES DE PERFORMANCE MULTIUSUÁRIO
-- Sistema de Controle Financeiro
-- =====================================================

-- PARTE 1: VERIFICAÇÃO INICIAL DO SISTEMA
-- =====================================================

-- 1.1 Status das tabelas e RLS
SELECT 
  'ESTRUTURA' as secao,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS HABILITADO' ELSE '❌ RLS DESABILITADO' END as rls_status,
  (SELECT count(*) FROM information_schema.columns 
   WHERE table_name = t.tablename 
   AND column_name = 'workspace_id') as tem_workspace_id
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename LIKE 'fp_%'
ORDER BY tablename;

-- 1.2 Volume de dados por workspace
SELECT 
  'VOLUME_DADOS' as secao,
  w.nome as workspace,
  (SELECT count(*) FROM fp_transacoes WHERE workspace_id = w.id) as transacoes,
  (SELECT count(*) FROM fp_categorias WHERE workspace_id = w.id) as categorias,
  (SELECT count(*) FROM fp_contas WHERE workspace_id = w.id) as contas
FROM fp_workspaces w
ORDER BY w.nome;

-- =====================================================
-- PARTE 2: VERIFICAÇÃO DE ÍNDICES EXISTENTES
-- =====================================================

-- 2.1 Listar índices relacionados a workspace_id
SELECT 
  'INDICES_EXISTENTES' as secao,
  schemaname,
  tablename,
  indexname,
  CASE 
    WHEN indexdef LIKE '%workspace_id%' THEN '✅ OTIMIZADO'
    ELSE '⚠️ NÃO OTIMIZADO'
  END as status_workspace
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'fp_%'
  AND indexdef LIKE '%workspace_id%'
ORDER BY tablename, indexname;

-- 2.2 Estatísticas de uso de índices (se disponível)
SELECT 
  'USO_INDICES' as secao,
  schemaname,
  relname as tabela,
  indexrelname as indice,
  idx_scan as utilizacoes,
  idx_tup_read as tuplas_lidas,
  CASE 
    WHEN idx_scan = 0 THEN '❌ NUNCA USADO'
    WHEN idx_scan < 10 THEN '⚠️ POUCO USADO' 
    WHEN idx_scan < 100 THEN '✅ USO MODERADO'
    ELSE '✅ MUITO USADO'
  END as status_uso
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
  AND relname LIKE 'fp_%'
ORDER BY idx_scan DESC;

-- =====================================================
-- PARTE 3: TESTES DE PERFORMANCE - QUERIES CRÍTICAS
-- =====================================================

-- Obter workspace para testes
WITH workspace_teste AS (
  SELECT id as workspace_id FROM fp_workspaces LIMIT 1
)

-- 3.1 TESTE: Dashboard principal (listagem de transações)
SELECT 'TESTE_DASHBOARD' as secao, 'INICIANDO' as status, 'Query principal do dashboard' as descricao;

-- Esta query seria executada com EXPLAIN ANALYZE em produção
-- EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  'TESTE_DASHBOARD' as secao,
  count(*) as total_transacoes,
  'Query executada sem EXPLAIN para compatibilidade' as observacao
FROM fp_transacoes t
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
  AND data >= CURRENT_DATE - INTERVAL '30 days'
  AND status IN ('realizado', 'pendente');

-- 3.2 TESTE: Cálculo de saldos por conta
SELECT 'TESTE_SALDOS' as secao, 'INICIANDO' as status, 'Cálculo de saldos por conta' as descricao;

SELECT 
  'TESTE_SALDOS' as secao,
  co.nome as conta,
  COALESCE(SUM(
    CASE 
      WHEN t.tipo = 'receita' THEN t.valor
      WHEN t.tipo = 'despesa' THEN -t.valor
      WHEN t.tipo = 'transferencia' AND t.conta_id = co.id THEN -t.valor
      WHEN t.tipo = 'transferencia' AND t.conta_destino_id = co.id THEN t.valor
      ELSE 0
    END
  ), 0) as saldo_calculado
FROM fp_contas co
LEFT JOIN fp_transacoes t ON (co.id = t.conta_id OR co.id = t.conta_destino_id)
  AND t.workspace_id = co.workspace_id
  AND t.status = 'realizado'
WHERE co.workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
  AND co.ativo = true
GROUP BY co.id, co.nome
ORDER BY co.nome;

-- 3.3 TESTE: Análise por categorias (relatórios)
SELECT 'TESTE_CATEGORIAS' as secao, 'INICIANDO' as status, 'Análise de gastos por categoria' as descricao;

SELECT 
  'TESTE_CATEGORIAS' as secao,
  c.nome as categoria,
  COUNT(t.id) as total_transacoes,
  COALESCE(SUM(t.valor), 0) as valor_total,
  COALESCE(AVG(t.valor), 0) as valor_medio
FROM fp_categorias c
LEFT JOIN fp_transacoes t ON c.id = t.categoria_id 
  AND t.workspace_id = c.workspace_id
  AND t.tipo = 'despesa'
  AND t.status = 'realizado'
  AND t.data >= CURRENT_DATE - INTERVAL '30 days'
WHERE c.workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
  AND c.ativo = true
GROUP BY c.id, c.nome
ORDER BY valor_total DESC
LIMIT 10;

-- 3.4 TESTE: Transações recorrentes (se houver)
SELECT 'TESTE_RECORRENTES' as secao, 'INICIANDO' as status, 'Transações recorrentes próximas' as descricao;

SELECT 
  'TESTE_RECORRENTES' as secao,
  COUNT(*) as transacoes_recorrentes,
  COUNT(CASE WHEN proxima_recorrencia <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as proximas_7_dias
FROM fp_transacoes
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
  AND recorrente = true;

-- 3.5 TESTE: Parcelamentos ativos
SELECT 'TESTE_PARCELAMENTOS' as secao, 'INICIANDO' as status, 'Análise de parcelamentos' as descricao;

SELECT 
  'TESTE_PARCELAMENTOS' as secao,
  COUNT(DISTINCT grupo_parcelamento) as grupos_parcelamento,
  COUNT(*) as total_parcelas,
  COUNT(CASE WHEN status = 'realizado' THEN 1 END) as parcelas_pagas,
  COUNT(CASE WHEN status = 'pendente' THEN 1 END) as parcelas_pendentes
FROM fp_transacoes
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
  AND grupo_parcelamento IS NOT NULL;

-- =====================================================
-- PARTE 4: TESTE DE ISOLAMENTO ENTRE WORKSPACES
-- =====================================================

SELECT 'TESTE_ISOLAMENTO' as secao, 'INICIANDO' as status, 'Verificando isolamento entre workspaces' as descricao;

-- 4.1 Verificar se cada workspace só vê seus dados
SELECT 
  'TESTE_ISOLAMENTO' as secao,
  w.nome as workspace,
  (SELECT count(*) FROM fp_transacoes WHERE workspace_id = w.id) as transacoes_visiveis,
  (SELECT count(DISTINCT categoria_id) FROM fp_transacoes WHERE workspace_id = w.id) as categorias_usadas
FROM fp_workspaces w
WHERE w.ativo = true
ORDER BY w.nome;

-- 4.2 Verificar integridade referencial entre workspaces
SELECT 'TESTE_INTEGRIDADE' as secao, 'INICIANDO' as status, 'Verificando integridade referencial' as descricao;

-- Transações com categorias de workspace diferente (deve ser 0)
SELECT 
  'TESTE_INTEGRIDADE' as secao,
  'Transações com categoria de workspace diferente' as problema,
  COUNT(*) as ocorrencias,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERRO' END as status
FROM fp_transacoes t
JOIN fp_categorias c ON t.categoria_id = c.id
WHERE t.workspace_id != c.workspace_id;

-- Transações com contas de workspace diferente (deve ser 0)
SELECT 
  'TESTE_INTEGRIDADE' as secao,
  'Transações com conta de workspace diferente' as problema,
  COUNT(*) as ocorrencias,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERRO' END as status
FROM fp_transacoes t
JOIN fp_contas co ON t.conta_id = co.id
WHERE t.workspace_id != co.workspace_id;

-- =====================================================
-- PARTE 5: SIMULAÇÃO DE CARGA
-- =====================================================

SELECT 'SIMULACAO_CARGA' as secao, 'INICIANDO' as status, 'Simulando operações comuns' as descricao;

-- 5.1 Simular busca rápida de transação por descrição
SELECT 
  'SIMULACAO_BUSCA' as secao,
  COUNT(*) as transacoes_encontradas,
  'Busca por parte da descrição' as tipo_teste
FROM fp_transacoes
WHERE workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
  AND LOWER(descricao) LIKE '%test%';

-- 5.2 Simular filtro por período + categoria
SELECT 
  'SIMULACAO_FILTRO' as secao,
  COUNT(*) as transacoes_filtradas,
  'Filtro combinado: período + categoria' as tipo_teste
FROM fp_transacoes t
JOIN fp_categorias c ON t.categoria_id = c.id
WHERE t.workspace_id = (SELECT id FROM fp_workspaces LIMIT 1)
  AND t.data >= CURRENT_DATE - INTERVAL '90 days'
  AND c.tipo = 'despesa';

-- =====================================================
-- PARTE 6: RELATÓRIO FINAL
-- =====================================================

SELECT 'RELATORIO_FINAL' as secao, 'RESUMO' as status, 'Consolidação dos resultados' as descricao;

-- 6.1 Resumo geral do sistema
WITH stats_sistema AS (
  SELECT 
    COUNT(DISTINCT workspace_id) as total_workspaces,
    COUNT(*) as total_transacoes,
    MAX(data) as transacao_mais_recente,
    MIN(data) as transacao_mais_antiga
  FROM fp_transacoes
  WHERE workspace_id IS NOT NULL
)
SELECT 
  'RELATORIO_FINAL' as secao,
  'ESTATISTICAS_GERAIS' as item,
  format('%s workspaces, %s transações (período: %s a %s)', 
         total_workspaces, 
         total_transacoes, 
         transacao_mais_antiga,
         transacao_mais_recente) as resumo
FROM stats_sistema;

-- 6.2 Recomendações de índices
SELECT 
  'RELATORIO_FINAL' as secao,
  'RECOMENDACOES' as item,
  'Implementar índices de performance conforme sql/performance-indexes.sql' as resumo;

-- 6.3 Status final
SELECT 
  'RELATORIO_FINAL' as secao,
  'STATUS_SISTEMA' as item,
  CASE 
    WHEN (SELECT COUNT(*) FROM fp_workspaces WHERE ativo = true) > 0
     AND (SELECT COUNT(*) FROM fp_transacoes) > 0
    THEN '✅ SISTEMA FUNCIONAL - Pronto para otimização'
    ELSE '⚠️ SISTEMA REQUER CONFIGURAÇÃO'
  END as resumo;

-- =====================================================
-- NOTAS IMPORTANTES:
-- 
-- 1. Para usar EXPLAIN ANALYZE, execute as queries individuais
-- 2. Este script é compatível com execução direta no Supabase
-- 3. Monitore tempos de execução para identificar gargalos
-- 4. Aplique os índices de performance após validar necessidade
-- =====================================================