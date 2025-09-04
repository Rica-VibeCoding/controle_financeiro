-- Teste de performance pós-migração
-- Query típica de dashboard (deve ser rápida)

-- 1. Resumo por categorias
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
  c.nome as categoria,
  COUNT(t.id) as total_transacoes,
  SUM(t.valor) as valor_total
FROM fp_categorias c
LEFT JOIN fp_transacoes t ON c.id = t.categoria_id 
WHERE c.workspace_id = (SELECT id FROM fp_workspaces WHERE nome = 'Workspace Desenvolvimento')
GROUP BY c.id, c.nome
ORDER BY valor_total DESC
LIMIT 5;

-- 2. Transações recentes
EXPLAIN (ANALYZE, BUFFERS)
SELECT t.data, t.descricao, t.valor, c.nome as categoria
FROM fp_transacoes t
LEFT JOIN fp_categorias c ON t.categoria_id = c.id
WHERE t.workspace_id = (SELECT id FROM fp_workspaces WHERE nome = 'Workspace Desenvolvimento')
ORDER BY t.data DESC
LIMIT 10;

-- 3. Saldo por contas
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  co.nome as conta,
  SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE -t.valor END) as saldo
FROM fp_contas co
LEFT JOIN fp_transacoes t ON co.id = t.conta_id
WHERE co.workspace_id = (SELECT id FROM fp_workspaces WHERE nome = 'Workspace Desenvolvimento')
GROUP BY co.id, co.nome;