-- =====================================================================
-- MIGRAÇÃO DE DADOS AUXILIARES
-- ORIGEM: ricardo@conectamoveis.net.br (d990492c-76bf-4008-bb07-504aaee1866b)
-- DESTINO: woodpromais@gmail.com (b4f7239a-8641-4802-b70c-e412cf033381)
-- =====================================================================
-- IMPORTANTE: Este script migra APENAS estruturas auxiliares.
-- TRANSAÇÕES NÃO SERÃO MIGRADAS (561 registros permanecem no workspace origem).
-- =====================================================================

-- Variáveis para facilitar manutenção
DO $$
DECLARE
  v_workspace_origem UUID := 'd990492c-76bf-4008-bb07-504aaee1866b';
  v_workspace_destino UUID := 'b4f7239a-8641-4802-b70c-e412cf033381';
  v_total_categorias INT;
  v_total_subcategorias INT;
  v_total_contas INT;
  v_total_formas INT;
  v_total_centros INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INICIANDO MIGRAÇÃO DE DADOS AUXILIARES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Origem: ricardo@conectamoveis.net.br';
  RAISE NOTICE 'Destino: woodpromais@gmail.com';
  RAISE NOTICE '';

  -- =====================================================================
  -- ETAPA 1: MIGRAR CONTAS (sem dependências)
  -- =====================================================================
  RAISE NOTICE '[1/5] Migrando CONTAS...';

  INSERT INTO fp_contas (
    workspace_id,
    nome,
    tipo,
    banco,
    ativo,
    limite,
    data_fechamento,
    created_at
  )
  SELECT
    v_workspace_destino,
    nome,
    tipo,
    banco,
    ativo,
    limite,
    data_fechamento,
    NOW()
  FROM fp_contas
  WHERE workspace_id = v_workspace_origem;

  GET DIAGNOSTICS v_total_contas = ROW_COUNT;
  RAISE NOTICE '  ✓ % contas migradas', v_total_contas;

  -- =====================================================================
  -- ETAPA 2: MIGRAR FORMAS DE PAGAMENTO (sem dependências)
  -- =====================================================================
  RAISE NOTICE '[2/5] Migrando FORMAS DE PAGAMENTO...';

  INSERT INTO fp_formas_pagamento (
    workspace_id,
    nome,
    tipo,
    permite_parcelamento,
    ativo,
    created_at
  )
  SELECT
    v_workspace_destino,
    nome,
    tipo,
    permite_parcelamento,
    ativo,
    NOW()
  FROM fp_formas_pagamento
  WHERE workspace_id = v_workspace_origem;

  GET DIAGNOSTICS v_total_formas = ROW_COUNT;
  RAISE NOTICE '  ✓ % formas de pagamento migradas', v_total_formas;

  -- =====================================================================
  -- ETAPA 3: MIGRAR CENTROS DE CUSTO (sem dependências)
  -- =====================================================================
  RAISE NOTICE '[3/5] Migrando CENTROS DE CUSTO...';

  INSERT INTO fp_centros_custo (
    workspace_id,
    nome,
    descricao,
    cor,
    ativo,
    valor_orcamento,
    data_inicio,
    data_fim,
    arquivado,
    created_at
  )
  SELECT
    v_workspace_destino,
    nome,
    descricao,
    cor,
    ativo,
    valor_orcamento,
    data_inicio,
    data_fim,
    arquivado,
    NOW()
  FROM fp_centros_custo
  WHERE workspace_id = v_workspace_origem;

  GET DIAGNOSTICS v_total_centros = ROW_COUNT;
  RAISE NOTICE '  ✓ % centros de custo migrados', v_total_centros;

  -- =====================================================================
  -- ETAPA 4: MIGRAR CATEGORIAS (antes das subcategorias)
  -- =====================================================================
  RAISE NOTICE '[4/5] Migrando CATEGORIAS...';

  -- Criar tabela temporária para mapear IDs antigos → novos
  CREATE TEMP TABLE temp_categorias_map (
    id_antigo UUID,
    id_novo UUID
  );

  -- Inserir categorias e capturar mapeamento
  WITH inserted AS (
    INSERT INTO fp_categorias (
      workspace_id,
      nome,
      tipo,
      icone,
      cor,
      ativo,
      created_at
    )
    SELECT
      v_workspace_destino,
      nome,
      tipo,
      icone,
      cor,
      ativo,
      NOW()
    FROM fp_categorias
    WHERE workspace_id = v_workspace_origem
    RETURNING id, nome
  )
  INSERT INTO temp_categorias_map (id_antigo, id_novo)
  SELECT
    c_old.id,
    i.id
  FROM fp_categorias c_old
  INNER JOIN inserted i ON c_old.nome = i.nome
  WHERE c_old.workspace_id = v_workspace_origem;

  GET DIAGNOSTICS v_total_categorias = ROW_COUNT;
  RAISE NOTICE '  ✓ % categorias migradas', v_total_categorias;

  -- =====================================================================
  -- ETAPA 5: MIGRAR SUBCATEGORIAS (com FK para categorias)
  -- =====================================================================
  RAISE NOTICE '[5/5] Migrando SUBCATEGORIAS (com relacionamentos)...';

  INSERT INTO fp_subcategorias (
    workspace_id,
    nome,
    categoria_id,
    ativo,
    created_at
  )
  SELECT
    v_workspace_destino,
    s.nome,
    COALESCE(m.id_novo, s.categoria_id), -- Usar novo ID ou manter original se não encontrado
    s.ativo,
    NOW()
  FROM fp_subcategorias s
  LEFT JOIN temp_categorias_map m ON s.categoria_id = m.id_antigo
  WHERE s.workspace_id = v_workspace_origem;

  GET DIAGNOSTICS v_total_subcategorias = ROW_COUNT;
  RAISE NOTICE '  ✓ % subcategorias migradas', v_total_subcategorias;

  -- Limpar tabela temporária
  DROP TABLE temp_categorias_map;

  -- =====================================================================
  -- RESUMO FINAL
  -- =====================================================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Contas: %', v_total_contas;
  RAISE NOTICE 'Formas de Pagamento: %', v_total_formas;
  RAISE NOTICE 'Centros de Custo: %', v_total_centros;
  RAISE NOTICE 'Categorias: %', v_total_categorias;
  RAISE NOTICE 'Subcategorias: %', v_total_subcategorias;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ATENÇÃO: 561 transações permanecem no workspace origem.';
  RAISE NOTICE '   Apenas estruturas auxiliares foram migradas.';
  RAISE NOTICE '========================================';

END $$;

-- =====================================================================
-- VALIDAÇÃO PÓS-MIGRAÇÃO
-- =====================================================================
DO $$
DECLARE
  v_workspace_destino UUID := 'b4f7239a-8641-4802-b70c-e412cf033381';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'VALIDAÇÃO PÓS-MIGRAÇÃO:';
  RAISE NOTICE '------------------------';

  -- Verificar totais no destino
  PERFORM
    'Contas: ' || COUNT(*)
  FROM fp_contas
  WHERE workspace_id = v_workspace_destino;

  RAISE NOTICE 'Workspace destino agora contém:';
  RAISE NOTICE '  Contas: % registros', (SELECT COUNT(*) FROM fp_contas WHERE workspace_id = v_workspace_destino);
  RAISE NOTICE '  Formas Pagamento: % registros', (SELECT COUNT(*) FROM fp_formas_pagamento WHERE workspace_id = v_workspace_destino);
  RAISE NOTICE '  Centros Custo: % registros', (SELECT COUNT(*) FROM fp_centros_custo WHERE workspace_id = v_workspace_destino);
  RAISE NOTICE '  Categorias: % registros', (SELECT COUNT(*) FROM fp_categorias WHERE workspace_id = v_workspace_destino);
  RAISE NOTICE '  Subcategorias: % registros', (SELECT COUNT(*) FROM fp_subcategorias WHERE workspace_id = v_workspace_destino);
  RAISE NOTICE '';
END $$;
