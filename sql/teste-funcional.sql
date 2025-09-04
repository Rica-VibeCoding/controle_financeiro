-- Teste funcional: inserir e remover transação
-- 1. Obter workspace padrão
SELECT id as workspace_id FROM fp_workspaces WHERE nome = 'Workspace Desenvolvimento';

-- 2. Obter categoria e conta para teste
SELECT 'Categoria disponível:' as info, id, nome FROM fp_categorias LIMIT 1;
SELECT 'Conta disponível:' as info, id, nome FROM fp_contas LIMIT 1;

-- 3. Inserir transação teste
INSERT INTO fp_transacoes (
  workspace_id, 
  data, 
  descricao, 
  valor, 
  tipo,
  categoria_id,
  conta_id,
  status
) VALUES (
  (SELECT id FROM fp_workspaces WHERE nome = 'Workspace Desenvolvimento'),
  CURRENT_DATE,
  'TESTE MIGRAÇÃO FUNCIONAL - DELETAR',
  100.00,
  'despesa',
  (SELECT id FROM fp_categorias LIMIT 1),
  (SELECT id FROM fp_contas LIMIT 1),
  'realizado'
) RETURNING id, descricao, valor;

-- 4. Confirmar inserção
SELECT COUNT(*) as transacoes_teste FROM fp_transacoes WHERE descricao = 'TESTE MIGRAÇÃO FUNCIONAL - DELETAR';

-- 5. Limpar dados de teste
DELETE FROM fp_transacoes WHERE descricao = 'TESTE MIGRAÇÃO FUNCIONAL - DELETAR';

-- 6. Confirmar limpeza
SELECT COUNT(*) as deve_ser_zero FROM fp_transacoes WHERE descricao = 'TESTE MIGRAÇÃO FUNCIONAL - DELETAR';