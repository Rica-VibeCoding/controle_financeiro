-- =====================================================
-- MULTIUSUÁRIO FASE 2: DATABASE MIGRATION
-- Arquivo: fase-2-database.sql
-- =====================================================

-- 1. Adicionar workspace_id em TODAS as tabelas
ALTER TABLE fp_categorias 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

ALTER TABLE fp_subcategorias 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

ALTER TABLE fp_contas 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

ALTER TABLE fp_formas_pagamento 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

ALTER TABLE fp_transacoes 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

ALTER TABLE fp_centros_custo 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

ALTER TABLE fp_anexos 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

ALTER TABLE fp_metas_mensais 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

ALTER TABLE fp_projetos_pessoais 
ADD COLUMN workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE;

-- 2. Criar índices otimizados
CREATE INDEX idx_categorias_workspace ON fp_categorias(workspace_id, ativo);
CREATE INDEX idx_subcategorias_workspace ON fp_subcategorias(workspace_id, categoria_id);
CREATE INDEX idx_contas_workspace ON fp_contas(workspace_id, ativo);
CREATE INDEX idx_formas_pagamento_workspace ON fp_formas_pagamento(workspace_id, ativo);
CREATE INDEX idx_transacoes_workspace_data ON fp_transacoes(workspace_id, data DESC);
CREATE INDEX idx_transacoes_workspace_categoria ON fp_transacoes(workspace_id, categoria_id);
CREATE INDEX idx_transacoes_workspace_tipo ON fp_transacoes(workspace_id, tipo);
CREATE INDEX idx_centros_custo_workspace ON fp_centros_custo(workspace_id, ativo);
CREATE INDEX idx_anexos_workspace ON fp_anexos(workspace_id, transacao_id);
CREATE INDEX idx_metas_workspace_periodo ON fp_metas_mensais(workspace_id, mes, ano);
CREATE INDEX idx_projetos_workspace ON fp_projetos_pessoais(workspace_id, ativo);

-- 3. Habilitar RLS em todas as tabelas
ALTER TABLE fp_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_metas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_projetos_pessoais ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_usuarios ENABLE ROW LEVEL SECURITY;

-- 4. Função helper para obter workspace do usuário
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT workspace_id 
    FROM fp_usuarios 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Aplicar políticas RLS genéricas
DO $$
DECLARE
  tabela TEXT;
  tabelas TEXT[] := ARRAY[
    'fp_categorias',
    'fp_subcategorias', 
    'fp_contas',
    'fp_formas_pagamento',
    'fp_transacoes',
    'fp_centros_custo',
    'fp_anexos',
    'fp_metas_mensais',
    'fp_projetos_pessoais'
  ];
BEGIN
  FOREACH tabela IN ARRAY tabelas
  LOOP
    -- SELECT
    EXECUTE format('
      CREATE POLICY "Users can view %I"
      ON %I FOR SELECT
      USING (workspace_id = get_user_workspace_id())',
      tabela, tabela
    );
    
    -- INSERT
    EXECUTE format('
      CREATE POLICY "Users can insert %I"
      ON %I FOR INSERT
      WITH CHECK (workspace_id = get_user_workspace_id())',
      tabela, tabela
    );
    
    -- UPDATE
    EXECUTE format('
      CREATE POLICY "Users can update %I"
      ON %I FOR UPDATE
      USING (workspace_id = get_user_workspace_id())
      WITH CHECK (workspace_id = get_user_workspace_id())',
      tabela, tabela
    );
    
    -- DELETE
    EXECUTE format('
      CREATE POLICY "Users can delete %I"
      ON %I FOR DELETE
      USING (workspace_id = get_user_workspace_id())',
      tabela, tabela
    );
  END LOOP;
END;
$$;

-- 6. Políticas específicas para fp_usuarios
CREATE POLICY "Users can view their own profile"
  ON fp_usuarios FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view workspace members"
  ON fp_usuarios FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM fp_usuarios WHERE id = auth.uid()
    )
  );

-- 7. Políticas específicas para fp_workspaces
CREATE POLICY "Users can view their workspace"
  ON fp_workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM fp_usuarios WHERE id = auth.uid()
    )
  );

-- 8. Atualizar função de cálculo de saldos
CREATE OR REPLACE FUNCTION calcular_saldos_contas(
  p_workspace_id UUID,
  p_data_inicio DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL
)
RETURNS TABLE (
  conta_id UUID,
  conta_nome TEXT,
  saldo_inicial DECIMAL,
  total_entradas DECIMAL,
  total_saidas DECIMAL,
  saldo_final DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome,
    COALESCE(
      (SELECT SUM(
        CASE 
          WHEN t.tipo = 'receita' THEN t.valor
          WHEN t.tipo = 'despesa' THEN -t.valor
          ELSE 0
        END
      )
      FROM fp_transacoes t
      WHERE t.conta_id = c.id
        AND t.workspace_id = p_workspace_id
        AND t.status = 'realizado'
        AND (p_data_inicio IS NULL OR t.data < p_data_inicio)
      ), 0::DECIMAL
    ) AS saldo_inicial,
    COALESCE(
      (SELECT SUM(t.valor)
      FROM fp_transacoes t
      WHERE t.conta_id = c.id
        AND t.workspace_id = p_workspace_id
        AND t.tipo = 'receita'
        AND t.status = 'realizado'
        AND (p_data_inicio IS NULL OR t.data >= p_data_inicio)
        AND (p_data_fim IS NULL OR t.data <= p_data_fim)
      ), 0::DECIMAL
    ) AS total_entradas,
    COALESCE(
      (SELECT SUM(t.valor)
      FROM fp_transacoes t
      WHERE t.conta_id = c.id
        AND t.workspace_id = p_workspace_id
        AND t.tipo = 'despesa'
        AND t.status = 'realizado'
        AND (p_data_inicio IS NULL OR t.data >= p_data_inicio)
        AND (p_data_fim IS NULL OR t.data <= p_data_fim)
      ), 0::DECIMAL
    ) AS total_saidas,
    0::DECIMAL AS saldo_final
  FROM fp_contas c
  WHERE c.workspace_id = p_workspace_id
    AND c.ativo = true;
END;
$$ LANGUAGE plpgsql;

-- 9. Script de validação
DO $$
DECLARE
  tabela TEXT;
  tabelas_sem_workspace TEXT[] := '{}';
  tabelas_sem_rls TEXT[] := '{}';
  resultado RECORD;
BEGIN
  -- 1. Verificar workspace_id em todas as tabelas
  FOR tabela IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'fp_%'
    AND table_name NOT IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
  LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = tabela
      AND column_name = 'workspace_id'
    ) THEN
      tabelas_sem_workspace := array_append(tabelas_sem_workspace, tabela);
    END IF;
  END LOOP;

  -- 2. Verificar RLS habilitado
  FOR resultado IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename LIKE 'fp_%'
    AND NOT EXISTS (
      SELECT 1 FROM pg_class c
      WHERE c.relname = tablename
      AND c.relrowsecurity = true
    )
  LOOP
    tabelas_sem_rls := array_append(tabelas_sem_rls, resultado.tablename);
  END LOOP;

  -- 3. Relatório final
  RAISE NOTICE '=== RELATÓRIO DE VALIDAÇÃO ===';
  
  IF array_length(tabelas_sem_workspace, 1) > 0 THEN
    RAISE NOTICE '❌ Tabelas SEM workspace_id: %', array_to_string(tabelas_sem_workspace, ', ');
  ELSE
    RAISE NOTICE '✅ Todas as tabelas têm workspace_id';
  END IF;

  IF array_length(tabelas_sem_rls, 1) > 0 THEN
    RAISE NOTICE '❌ Tabelas SEM RLS: %', array_to_string(tabelas_sem_rls, ', ');
  ELSE
    RAISE NOTICE '✅ RLS habilitado em todas as tabelas';
  END IF;

  -- 4. Verificar índices de performance
  RAISE NOTICE '📊 Verificando índices de workspace_id...';
  FOR resultado IN
    SELECT 
      tablename,
      COUNT(*) as indices_workspace
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename LIKE 'fp_%'
    AND indexdef LIKE '%workspace_id%'
    GROUP BY tablename
  LOOP
    RAISE NOTICE 'Tabela %: % índices com workspace_id', resultado.tablename, resultado.indices_workspace;
  END LOOP;
END;
$$;

-- =====================================================
-- FASE 2 CONCLUÍDA ✅
-- Próximo: Implementar frontend (FASE 3)
-- =====================================================