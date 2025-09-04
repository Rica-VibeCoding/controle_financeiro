-- =====================================================
-- TESTE FINAL: CONSTRAINTS E VALIDAÇÕES NOT NULL
-- Arquivo: test-constraints-not-null.sql
-- =====================================================

-- 1. Verificar que workspace_id é NOT NULL em todas as tabelas
SELECT 
  'VERIFICAÇÃO NOT NULL' as teste,
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'fp_%'
  AND column_name = 'workspace_id'
ORDER BY table_name;

-- 2. TESTE 1: Tentar inserir categoria sem workspace_id (deve falhar)
DO $$
BEGIN
  INSERT INTO fp_categorias (nome, tipo, cor) 
  VALUES ('Categoria Sem Workspace', 'despesa', '#FF0000');
  
  RAISE EXCEPTION 'FALHA CRITICA: Inserção sem workspace_id foi aceita!';
EXCEPTION
  WHEN not_null_violation THEN
    RAISE NOTICE 'SUCESSO: Inserção sem workspace_id foi rejeitada (NOT NULL constraint)';
  WHEN others THEN
    RAISE NOTICE 'AVISO: Inserção rejeitada por outro motivo: %', SQLERRM;
END
$$;

-- 3. TESTE 2: Tentar inserir workspace_id NULL explicitamente (deve falhar)
DO $$
BEGIN
  INSERT INTO fp_transacoes (workspace_id, data, descricao, valor, tipo, conta_id)
  VALUES (
    NULL, 
    CURRENT_DATE, 
    'Transação Inválida', 
    100, 
    'despesa',
    (SELECT id FROM fp_contas LIMIT 1)
  );
  
  RAISE EXCEPTION 'FALHA CRITICA: Inserção com workspace_id NULL foi aceita!';
EXCEPTION
  WHEN not_null_violation THEN
    RAISE NOTICE 'SUCESSO: Inserção com workspace_id NULL foi rejeitada';
  WHEN others THEN
    RAISE NOTICE 'AVISO: Inserção rejeitada por outro motivo: %', SQLERRM;
END
$$;

-- 4. TESTE 3: Tentar inserir workspace_id inexistente (deve falhar FK)
DO $$
BEGIN
  INSERT INTO fp_contas (workspace_id, nome, tipo)
  VALUES ('00000000-0000-0000-0000-000000000000', 'Conta Inválida', 'corrente');
  
  RAISE EXCEPTION 'FALHA CRITICA: Inserção com workspace_id inexistente foi aceita!';
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'SUCESSO: Inserção com workspace_id inexistente foi rejeitada (FK constraint)';
  WHEN others THEN
    RAISE NOTICE 'AVISO: Inserção rejeitada por outro motivo: %', SQLERRM;
END
$$;

-- 5. Verificar constraints ativas
SELECT 
  'CONSTRAINTS ATIVAS' as info,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name LIKE 'fp_%'
  AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY')
  AND tc.constraint_name LIKE '%workspace%'
ORDER BY tc.table_name, tc.constraint_type;

-- 6. TESTE POSITIVO: Inserção válida deve funcionar
DO $$
DECLARE
  workspace_teste UUID;
  categoria_id UUID;
BEGIN
  -- Pegar um workspace existente
  SELECT id INTO workspace_teste 
  FROM fp_workspaces 
  WHERE nome = 'Workspace Desenvolvimento' 
  LIMIT 1;
  
  IF workspace_teste IS NULL THEN
    SELECT id INTO workspace_teste FROM fp_workspaces LIMIT 1;
  END IF;
  
  -- Tentar inserir categoria válida
  INSERT INTO fp_categorias (
    workspace_id, 
    nome, 
    tipo, 
    cor
  ) VALUES (
    workspace_teste,
    'Categoria Teste Constraints ' || extract(epoch from now()),
    'despesa',
    '#00FF00'
  ) RETURNING id INTO categoria_id;
  
  RAISE NOTICE 'SUCESSO: Inserção válida funcionou - ID: %', categoria_id;
  
  -- Limpar teste
  DELETE FROM fp_categorias WHERE id = categoria_id;
  RAISE NOTICE 'SUCESSO: Teste limpo com sucesso';
  
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'ERRO no teste positivo: %', SQLERRM;
END
$$;

-- 7. TESTE UPDATE inválido
DO $$
DECLARE
  categoria_id UUID;
BEGIN
  SELECT id INTO categoria_id FROM fp_categorias LIMIT 1;
  
  IF categoria_id IS NULL THEN
    RAISE NOTICE 'AVISO: Nenhuma categoria encontrada para teste de UPDATE';
    RETURN;
  END IF;
  
  -- Tentar fazer UPDATE removendo workspace_id (deve falhar)
  UPDATE fp_categorias 
  SET workspace_id = NULL 
  WHERE id = categoria_id;
  
  RAISE EXCEPTION 'FALHA CRITICA: UPDATE workspace_id = NULL foi aceito!';
EXCEPTION
  WHEN not_null_violation THEN
    RAISE NOTICE 'SUCESSO: UPDATE workspace_id = NULL foi rejeitado';
  WHEN others THEN
    RAISE NOTICE 'AVISO: UPDATE rejeitado por outro motivo: %', SQLERRM;
END
$$;

-- 8. Verificar triggers ativos
SELECT 
  'TRIGGERS ATIVOS' as info,
  trigger_name,
  event_manipulation,
  event_object_table,
  trigger_schema,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table LIKE 'fp_%'
  AND trigger_name NOT LIKE '%audit%'
ORDER BY event_object_table;

-- 9. RELATÓRIO FINAL
SELECT 
  'RELATÓRIO FINAL' as secao,
  'Total de tabelas fp_* com workspace_id' as metrica,
  COUNT(*) as valor
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'fp_%'
  AND column_name = 'workspace_id';

SELECT 
  'RELATÓRIO FINAL' as secao,
  'Total de constraints FK workspace_id' as metrica,
  COUNT(*) as valor
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND constraint_name LIKE '%workspace_id_fkey%'
  AND constraint_type = 'FOREIGN KEY';

SELECT 
  'RELATÓRIO FINAL' as secao,
  'Total de políticas RLS ativas' as metrica,
  COUNT(*) as valor
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'fp_%';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'TESTE DE CONSTRAINTS NOT NULL CONCLUÍDO';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'VERIFICAR:';
  RAISE NOTICE '1. Todas as tabelas fp_* têm workspace_id NOT NULL';
  RAISE NOTICE '2. Inserções inválidas foram rejeitadas';
  RAISE NOTICE '3. Inserções válidas funcionaram';
  RAISE NOTICE '4. UPDATEs inválidos foram rejeitados';
  RAISE NOTICE '5. Constraints FK estão ativas';
  RAISE NOTICE '=================================================';
END
$$;