-- Validação simples da migração
-- 1. Contagem por tabela
SELECT 'fp_categorias' as tabela, COUNT(*) as registros FROM fp_categorias
UNION ALL SELECT 'fp_subcategorias', COUNT(*) FROM fp_subcategorias  
UNION ALL SELECT 'fp_contas', COUNT(*) FROM fp_contas
UNION ALL SELECT 'fp_formas_pagamento', COUNT(*) FROM fp_formas_pagamento
UNION ALL SELECT 'fp_centros_custo', COUNT(*) FROM fp_centros_custo
UNION ALL SELECT 'fp_transacoes', COUNT(*) FROM fp_transacoes
UNION ALL SELECT 'fp_metas_mensais', COUNT(*) FROM fp_metas_mensais
ORDER BY tabela;

-- 2. Verificar workspace_id nulos
SELECT 'sem_workspace_categorias' as validacao, COUNT(*) as count
FROM fp_categorias WHERE workspace_id IS NULL
UNION ALL SELECT 'sem_workspace_transacoes', COUNT(*) 
FROM fp_transacoes WHERE workspace_id IS NULL;

-- 3. Distribuição por workspace
SELECT w.nome as workspace, COUNT(t.id) as transacoes
FROM fp_workspaces w
LEFT JOIN fp_transacoes t ON w.id = t.workspace_id
GROUP BY w.id, w.nome;