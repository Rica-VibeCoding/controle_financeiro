-- TESTE 5 - INTEGRIDADE REFERENCIAL COMPLETA
-- Sistema Multiusuário - Validação de Foreign Keys e Dados Órfãos

-- 1. LISTAR TODAS AS FOREIGN KEYS DO SISTEMA
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE 'fp_%'
ORDER BY tc.table_name;

-- 2. VERIFICAR DADOS ÓRFÃOS - workspace_id
SELECT 
  'fp_categorias' as tabela,
  COUNT(*) as registros_orfaos
FROM fp_categorias c
LEFT JOIN fp_workspaces w ON c.workspace_id = w.id
WHERE w.id IS NULL

UNION ALL

SELECT 'fp_subcategorias', COUNT(*)
FROM fp_subcategorias s
LEFT JOIN fp_workspaces w ON s.workspace_id = w.id
WHERE w.id IS NULL

UNION ALL

SELECT 'fp_contas', COUNT(*)
FROM fp_contas c
LEFT JOIN fp_workspaces w ON c.workspace_id = w.id
WHERE w.id IS NULL

UNION ALL

SELECT 'fp_formas_pagamento', COUNT(*)
FROM fp_formas_pagamento f
LEFT JOIN fp_workspaces w ON f.workspace_id = w.id
WHERE w.id IS NULL

UNION ALL

SELECT 'fp_transacoes', COUNT(*)
FROM fp_transacoes t
LEFT JOIN fp_workspaces w ON t.workspace_id = w.id
WHERE w.id IS NULL

UNION ALL

SELECT 'fp_centros_custo', COUNT(*)
FROM fp_centros_custo cc
LEFT JOIN fp_workspaces w ON cc.workspace_id = w.id
WHERE w.id IS NULL

UNION ALL

SELECT 'fp_projetos_pessoais', COUNT(*)
FROM fp_projetos_pessoais p
LEFT JOIN fp_workspaces w ON p.workspace_id = w.id
WHERE w.id IS NULL

UNION ALL

SELECT 'fp_metas_mensais', COUNT(*)
FROM fp_metas_mensais m
LEFT JOIN fp_workspaces w ON m.workspace_id = w.id
WHERE w.id IS NULL;

-- 3. VERIFICAR OUTRAS RELAÇÕES ÓRFÃS
-- Subcategorias sem categoria_id válido
SELECT 'subcategorias_sem_categoria' as problema, COUNT(*) as total
FROM fp_subcategorias s
LEFT JOIN fp_categorias c ON s.categoria_id = c.id
WHERE c.id IS NULL

UNION ALL

-- Transações sem conta válida
SELECT 'transacoes_sem_conta', COUNT(*)
FROM fp_transacoes t
LEFT JOIN fp_contas c ON t.conta_id = c.id
WHERE c.id IS NULL

UNION ALL

-- Transações sem categoria válida
SELECT 'transacoes_sem_categoria', COUNT(*)
FROM fp_transacoes t
LEFT JOIN fp_categorias c ON t.categoria_id = c.id
WHERE c.id IS NULL AND t.categoria_id IS NOT NULL;

-- 4. TESTE CASCADE DELETE (Preparação)
-- Primeiro, vamos criar um workspace de teste
INSERT INTO fp_workspaces (nome, plano, usuario_proprietario) 
VALUES ('Workspace Teste Delete CASCADE', 'free', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Obter o ID do workspace teste
SELECT id as workspace_test_id FROM fp_workspaces 
WHERE nome = 'Workspace Teste Delete CASCADE'
LIMIT 1;

-- 5. VERIFICAR CONSTRAINTS NOT NULL
-- Esta query deve mostrar todas as colunas workspace_id que são NOT NULL
SELECT 
  table_name,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE column_name = 'workspace_id'
  AND table_name LIKE 'fp_%'
ORDER BY table_name;

-- 6. CONTAGEM GERAL DE REGISTROS POR TABELA
SELECT 
  'fp_workspaces' as tabela, COUNT(*) as total FROM fp_workspaces
UNION ALL
SELECT 'fp_categorias', COUNT(*) FROM fp_categorias
UNION ALL
SELECT 'fp_subcategorias', COUNT(*) FROM fp_subcategorias
UNION ALL
SELECT 'fp_contas', COUNT(*) FROM fp_contas
UNION ALL
SELECT 'fp_formas_pagamento', COUNT(*) FROM fp_formas_pagamento
UNION ALL
SELECT 'fp_transacoes', COUNT(*) FROM fp_transacoes
UNION ALL
SELECT 'fp_centros_custo', COUNT(*) FROM fp_centros_custo
UNION ALL
SELECT 'fp_projetos_pessoais', COUNT(*) FROM fp_projetos_pessoais
UNION ALL
SELECT 'fp_metas_mensais', COUNT(*) FROM fp_metas_mensais
ORDER BY tabela;