-- =====================================================
-- DADOS DEMO - WORKSPACE DE EXEMPLO
-- Arquivo: dados-demo.sql
-- =====================================================

-- IMPORTANTE: Executar apenas em desenvolvimento
-- Cria workspace com dados realistas para demonstração

-- 1. Criar workspace demo (com UUID dinâmico)
DO $$
DECLARE
  demo_workspace_id UUID;
  dev_user_id UUID;
BEGIN
  -- Obter ID do usuário de desenvolvimento
  SELECT id INTO dev_user_id FROM auth.users WHERE email = 'ricardo@dev.com';
  
  IF dev_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário ricardo@dev.com não encontrado. Execute fase-0-setup.sql primeiro.';
  END IF;
  
  -- Criar workspace demo
  INSERT INTO fp_workspaces (nome, owner_id, plano)
  VALUES (
    'Família Silva - Demo',
    dev_user_id,
    'free'
  )
  RETURNING id INTO demo_workspace_id;
  
  RAISE NOTICE 'Workspace demo criado com ID: %', demo_workspace_id;
  
  -- Atualizar usuário dev para usar o workspace demo
  INSERT INTO fp_usuarios (id, workspace_id, nome, role)
  VALUES (dev_user_id, demo_workspace_id, 'Ricardo (Dev)', 'owner')
  ON CONFLICT (id) DO UPDATE SET workspace_id = demo_workspace_id;
END
$$;

-- 2. Adicionar contas demo
DO $$
DECLARE
  demo_workspace_id UUID;
BEGIN
  -- Obter ID do workspace demo
  SELECT w.id INTO demo_workspace_id 
  FROM fp_workspaces w
  JOIN auth.users u ON w.owner_id = u.id
  WHERE u.email = 'ricardo@dev.com'
  AND w.nome = 'Família Silva - Demo';
  
  IF demo_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Workspace demo não encontrado. Execute a etapa anterior primeiro.';
  END IF;
  
  INSERT INTO fp_contas (workspace_id, nome, tipo, banco, saldo_inicial) VALUES
  (demo_workspace_id, 'Conta Corrente', 'conta_corrente', 'Nubank', 2500.00),
  (demo_workspace_id, 'Cartão Crédito', 'cartao_credito', 'Nubank', 0.00),
  (demo_workspace_id, 'Poupança', 'poupanca', 'Caixa Econômica', 5000.00),
  (demo_workspace_id, 'Carteira', 'dinheiro', 'Dinheiro', 200.00);
  
  RAISE NOTICE 'Contas demo criadas para workspace: %', demo_workspace_id;
END
$$;

-- 3. Adicionar transações demo dos últimos 3 meses
DO $$
DECLARE
  demo_workspace_id UUID;
  categoria_salario_id UUID;
  categoria_moradia_id UUID;
  categoria_alimentacao_id UUID;
  categoria_transporte_id UUID;
  categoria_lazer_id UUID;
  categoria_freelance_id UUID;
  categoria_saude_id UUID;
  conta_corrente_id UUID;
  conta_cartao_id UUID;
BEGIN
  -- Obter ID do workspace demo
  SELECT w.id INTO demo_workspace_id 
  FROM fp_workspaces w
  JOIN auth.users u ON w.owner_id = u.id
  WHERE u.email = 'ricardo@dev.com'
  AND w.nome = 'Família Silva - Demo';
  
  IF demo_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Workspace demo não encontrado.';
  END IF;
  
  -- Obter IDs das categorias
  SELECT id INTO categoria_salario_id FROM fp_categorias WHERE nome = 'Salário' AND workspace_id = demo_workspace_id;
  SELECT id INTO categoria_moradia_id FROM fp_categorias WHERE nome = 'Moradia' AND workspace_id = demo_workspace_id;
  SELECT id INTO categoria_alimentacao_id FROM fp_categorias WHERE nome = 'Alimentação' AND workspace_id = demo_workspace_id;
  SELECT id INTO categoria_transporte_id FROM fp_categorias WHERE nome = 'Transporte' AND workspace_id = demo_workspace_id;
  SELECT id INTO categoria_lazer_id FROM fp_categorias WHERE nome = 'Lazer' AND workspace_id = demo_workspace_id;
  SELECT id INTO categoria_freelance_id FROM fp_categorias WHERE nome = 'Freelance' AND workspace_id = demo_workspace_id;
  SELECT id INTO categoria_saude_id FROM fp_categorias WHERE nome = 'Saúde' AND workspace_id = demo_workspace_id;
  
  -- Obter IDs das contas
  SELECT id INTO conta_corrente_id FROM fp_contas WHERE nome = 'Conta Corrente' AND workspace_id = demo_workspace_id;
  SELECT id INTO conta_cartao_id FROM fp_contas WHERE nome = 'Cartão Crédito' AND workspace_id = demo_workspace_id;
  
  -- Inserir transações demo
  INSERT INTO fp_transacoes (
    workspace_id, tipo, valor, descricao, data, categoria_id, conta_id, status
  ) VALUES
  -- Janeiro 2025
  (demo_workspace_id, 'receita', 3500.00, 'Salário Janeiro', '2025-01-01', categoria_salario_id, conta_corrente_id, 'realizado'),

  (demo_workspace_id, 'despesa', 800.00, 'Aluguel', '2025-01-05', categoria_moradia_id, conta_corrente_id, 'realizado'),
  (demo_workspace_id, 'despesa', 350.00, 'Supermercado Pão de Açúcar', '2025-01-08', categoria_alimentacao_id, conta_cartao_id, 'realizado'),
  (demo_workspace_id, 'despesa', 120.00, 'Uber', '2025-01-10', categoria_transporte_id, conta_corrente_id, 'realizado'),
  (demo_workspace_id, 'despesa', 89.90, 'Netflix', '2025-01-15', categoria_lazer_id, conta_cartao_id, 'realizado'),
  
  -- Fevereiro 2025
  (demo_workspace_id, 'receita', 3500.00, 'Salário Fevereiro', '2025-02-01', categoria_salario_id, conta_corrente_id, 'realizado'),
  (demo_workspace_id, 'receita', 800.00, 'Freelance Website', '2025-02-10', categoria_freelance_id, conta_corrente_id, 'realizado'),
  (demo_workspace_id, 'despesa', 800.00, 'Aluguel', '2025-02-05', categoria_moradia_id, conta_corrente_id, 'realizado'),
  (demo_workspace_id, 'despesa', 420.00, 'Supermercado Extra', '2025-02-12', categoria_alimentacao_id, conta_cartao_id, 'realizado'),
  (demo_workspace_id, 'despesa', 250.00, 'Plano de Saúde', '2025-02-15', categoria_saude_id, conta_corrente_id, 'realizado'),
  
  -- Março 2025 (atual)
  (demo_workspace_id, 'receita', 3500.00, 'Salário Março', '2025-03-01', categoria_salario_id, conta_corrente_id, 'realizado'),
  (demo_workspace_id, 'despesa', 800.00, 'Aluguel', '2025-03-05', categoria_moradia_id, conta_corrente_id, 'realizado'),
  
  -- Transações futuras/planejadas
  (demo_workspace_id, 'despesa', 300.00, 'Supermercado (planejado)', '2025-03-20', categoria_alimentacao_id, conta_cartao_id, 'planejado'),
  (demo_workspace_id, 'receita', 600.00, 'Freelance (planejado)', '2025-03-25', categoria_freelance_id, conta_corrente_id, 'planejado');
  
  RAISE NOTICE 'Transações demo criadas: %', 14;
END
$$;

-- 4. Criar metas demo
DO $$
DECLARE
  demo_workspace_id UUID;
  categoria_alimentacao_id UUID;
  categoria_transporte_id UUID;
  categoria_lazer_id UUID;
BEGIN
  -- Obter IDs
  SELECT w.id INTO demo_workspace_id 
  FROM fp_workspaces w
  JOIN auth.users u ON w.owner_id = u.id
  WHERE u.email = 'ricardo@dev.com'
  AND w.nome = 'Família Silva - Demo';
  
  SELECT id INTO categoria_alimentacao_id FROM fp_categorias WHERE nome = 'Alimentação' AND workspace_id = demo_workspace_id;
  SELECT id INTO categoria_transporte_id FROM fp_categorias WHERE nome = 'Transporte' AND workspace_id = demo_workspace_id;
  SELECT id INTO categoria_lazer_id FROM fp_categorias WHERE nome = 'Lazer' AND workspace_id = demo_workspace_id;
  
  INSERT INTO fp_metas_mensais (workspace_id, categoria_id, mes, ano, valor_meta, valor_gasto) VALUES
  (demo_workspace_id, categoria_alimentacao_id, 3, 2025, 500.00, 300.00),
  (demo_workspace_id, categoria_transporte_id, 3, 2025, 200.00, 120.00),
  (demo_workspace_id, categoria_lazer_id, 3, 2025, 300.00, 89.90);
  
  RAISE NOTICE 'Metas demo criadas: %', 3;
END
$$;

-- 5. Criar projeto pessoal demo
DO $$
DECLARE
  demo_workspace_id UUID;
BEGIN
  -- Obter ID do workspace demo
  SELECT w.id INTO demo_workspace_id 
  FROM fp_workspaces w
  JOIN auth.users u ON w.owner_id = u.id
  WHERE u.email = 'ricardo@dev.com'
  AND w.nome = 'Família Silva - Demo';
  
  INSERT INTO fp_projetos_pessoais (workspace_id, nome, descricao, valor_objetivo, valor_atual, prazo_objetivo) VALUES
  (demo_workspace_id, 'Viagem Europa', 'Economizar para viagem de lua de mel', 15000.00, 5000.00, '2025-12-31'),
  (demo_workspace_id, 'Reserva Emergência', 'Fundo de emergência (6 meses)', 21000.00, 5000.00, '2025-06-30');
  
  RAISE NOTICE 'Projetos demo criados: %', 2;
END
$$;

-- 6. Relatório final
DO $$
DECLARE
  demo_workspace_id UUID;
  workspace_count INTEGER;
  transacoes_count INTEGER;
  contas_count INTEGER;
  categorias_count INTEGER;
  metas_count INTEGER;
  projetos_count INTEGER;
BEGIN
  -- Obter ID do workspace demo
  SELECT w.id INTO demo_workspace_id 
  FROM fp_workspaces w
  JOIN auth.users u ON w.owner_id = u.id
  WHERE u.email = 'ricardo@dev.com'
  AND w.nome = 'Família Silva - Demo';
  
  -- Contar registros criados
  SELECT COUNT(*) INTO workspace_count FROM fp_workspaces WHERE id = demo_workspace_id;
  SELECT COUNT(*) INTO transacoes_count FROM fp_transacoes WHERE workspace_id = demo_workspace_id;
  SELECT COUNT(*) INTO contas_count FROM fp_contas WHERE workspace_id = demo_workspace_id;
  SELECT COUNT(*) INTO categorias_count FROM fp_categorias WHERE workspace_id = demo_workspace_id;
  SELECT COUNT(*) INTO metas_count FROM fp_metas_mensais WHERE workspace_id = demo_workspace_id;
  SELECT COUNT(*) INTO projetos_count FROM fp_projetos_pessoais WHERE workspace_id = demo_workspace_id;
  
  -- Relatório
  RAISE NOTICE '=== DADOS DEMO CRIADOS =====';
  RAISE NOTICE 'Workspace ID: %', demo_workspace_id;
  RAISE NOTICE 'Workspaces: % (deve ser 1)', workspace_count;
  RAISE NOTICE 'Categorias: % (deve ser 11)', categorias_count;
  RAISE NOTICE 'Contas: % (deve ser 4)', contas_count;
  RAISE NOTICE 'Transações: % (deve ser 14)', transacoes_count;
  RAISE NOTICE 'Metas: % (deve ser 3)', metas_count;
  RAISE NOTICE 'Projetos: % (deve ser 2)', projetos_count;
  RAISE NOTICE '==========================';
  
  IF workspace_count = 1 AND categorias_count = 11 AND contas_count = 4 AND 
     transacoes_count = 14 AND metas_count = 3 AND projetos_count = 2 THEN
    RAISE NOTICE '✅ DADOS DEMO CRIADOS COM SUCESSO!';
  ELSE
    RAISE NOTICE '❌ ERRO: Alguns dados não foram criados corretamente.';
  END IF;
END
$$;

-- =====================================================
-- DADOS DEMO CRIADOS ✅
-- 
-- Para usar:
-- 1. Executar fase-0-setup.sql primeiro (para criar usuário de desenvolvimento)
-- 2. Executar este script em ambiente de desenvolvimento
-- 3. Login com ricardo@dev.com para ver dados demo
--
-- IMPORTANTE: Script agora usa UUIDs dinâmicos e validações
-- =====================================================