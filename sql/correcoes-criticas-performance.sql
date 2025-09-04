-- =====================================================
-- CORREÇÕES CRÍTICAS DE PERFORMANCE E SEGURANÇA
-- Sistema de Controle Financeiro - Multiusuário
-- EXECUTE ESTE SCRIPT IMEDIATAMENTE
-- =====================================================

-- PARTE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA
-- =====================================================

-- 1.1 Habilitar RLS nas tabelas críticas que estavam sem proteção
-- ESTAS SÃO VULNERABILIDADES DE SEGURANÇA GRAVES
ALTER TABLE fp_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_usuarios ENABLE ROW LEVEL SECURITY;

-- 1.2 Verificar se as correções foram aplicadas
SELECT 
  'CORRECAO_RLS' as tipo,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS AGORA HABILITADO' ELSE '❌ AINDA DESABILITADO' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('fp_workspaces', 'fp_usuarios');

-- =====================================================
-- PARTE 2: CORREÇÕES CRÍTICAS DE PERFORMANCE
-- =====================================================

-- 2.1 CRIAR índices para foreign keys sem cobertura (CRÍTICO)
-- Estas foreign keys estão causando performance ruim em JOINs

-- Transações -> Centro de Custo
CREATE INDEX IF NOT EXISTS idx_fp_transacoes_centro_custo_id 
ON fp_transacoes(centro_custo_id);

-- Transações -> Conta Destino (transferências)
CREATE INDEX IF NOT EXISTS idx_fp_transacoes_conta_destino_id_idx 
ON fp_transacoes(conta_destino_id);

-- Transações -> Forma de Pagamento
CREATE INDEX IF NOT EXISTS idx_fp_transacoes_forma_pagamento_id 
ON fp_transacoes(forma_pagamento_id);

-- Transações -> Subcategoria
CREATE INDEX IF NOT EXISTS idx_fp_transacoes_subcategoria_id 
ON fp_transacoes(subcategoria_id);

-- Subcategorias -> Categoria
CREATE INDEX IF NOT EXISTS idx_fp_subcategorias_categoria_id 
ON fp_subcategorias(categoria_id);

-- Convites -> Criado Por
CREATE INDEX IF NOT EXISTS idx_fp_convites_links_criado_por 
ON fp_convites_links(criado_por);

-- 2.2 Remover índices duplicados (desperdício de recursos)
DROP INDEX IF EXISTS idx_casa_mato_completed;
DROP INDEX IF EXISTS idx_casa_mato_task_id;
DROP INDEX IF EXISTS idx_categorias_workspace_ativo;

-- 2.3 Implementar os 3 índices CRÍTICOS de performance multiusuário
-- Estes são essenciais para queries rápidas com workspace_id

-- CRÍTICO 1: Dashboard principal - queries por data
CREATE INDEX IF NOT EXISTS idx_fp_transacoes_workspace_data_status 
ON fp_transacoes (workspace_id, data DESC, status);

-- CRÍTICO 2: Cálculo de saldos - agrupamento por conta
CREATE INDEX IF NOT EXISTS idx_fp_transacoes_workspace_conta_status 
ON fp_transacoes (workspace_id, conta_id, status);

-- CRÍTICO 3: Análise de categorias - relatórios
CREATE INDEX IF NOT EXISTS idx_fp_transacoes_workspace_categoria_tipo_data 
ON fp_transacoes (workspace_id, categoria_id, tipo, data);

-- =====================================================
-- PARTE 3: LIMPEZA DE ÍNDICES NÃO UTILIZADOS
-- =====================================================

-- 3.1 Remover índices que nunca foram usados (economia de espaço)
-- ATENÇÃO: Execute apenas se confirmado que não são necessários

-- Sistema de controle financeiro - índices não utilizados
DROP INDEX IF EXISTS idx_contas_workspace_ativo;
DROP INDEX IF EXISTS idx_fp_workspaces_owner;
DROP INDEX IF EXISTS idx_formas_pagamento_workspace_ativo;
DROP INDEX IF EXISTS idx_convites_links_codigo;
DROP INDEX IF EXISTS idx_transacoes_workspace_categoria;
DROP INDEX IF EXISTS idx_transacoes_workspace_tipo;
DROP INDEX IF EXISTS idx_centros_custo_workspace_ativo;
DROP INDEX IF EXISTS idx_metas_workspace_periodo;
DROP INDEX IF EXISTS idx_fp_transacoes_workspace_recorrente_proxima;
DROP INDEX IF EXISTS idx_centros_custo_ativo_arquivado;
DROP INDEX IF EXISTS idx_centros_custo_periodo;
DROP INDEX IF EXISTS idx_fp_transacoes_workspace_grupo_parcela;

-- Outros projetos - índices não utilizados (não relacionados ao controle financeiro)
DROP INDEX IF EXISTS idx_salvar_portas_cliente;
DROP INDEX IF EXISTS idx_salvar_portas_funcao;
DROP INDEX IF EXISTS idx_salvar_portas_ativo;
DROP INDEX IF EXISTS idx_trilhos_id_usuario;
DROP INDEX IF EXISTS idx_trilhos_tipo;
DROP INDEX IF EXISTS idx_puxadores_id_usuario;
DROP INDEX IF EXISTS idx_casa_do_mato_completed;

-- =====================================================
-- PARTE 4: VALIDAÇÃO DAS CORREÇÕES
-- =====================================================

-- 4.1 Verificar índices criados
SELECT 
  'INDICES_CRIADOS' as tipo,
  indexname,
  tablename,
  '✅ CRIADO' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname IN (
    'idx_fp_transacoes_centro_custo_id',
    'idx_fp_transacoes_conta_destino_id_idx',
    'idx_fp_transacoes_forma_pagamento_id',
    'idx_fp_transacoes_subcategoria_id',
    'idx_fp_subcategorias_categoria_id',
    'idx_fp_convites_links_criado_por',
    'idx_fp_transacoes_workspace_data_status',
    'idx_fp_transacoes_workspace_conta_status',
    'idx_fp_transacoes_workspace_categoria_tipo_data'
  )
ORDER BY indexname;

-- 4.2 Contar índices removidos vs esperados
WITH indices_removidos AS (
  SELECT COUNT(*) as removidos
  FROM pg_indexes 
  WHERE schemaname = 'public' 
    AND indexname IN (
      'idx_casa_mato_completed',
      'idx_casa_mato_task_id', 
      'idx_categorias_workspace_ativo',
      'idx_contas_workspace_ativo',
      'idx_salvar_portas_cliente'
    )
)
SELECT 
  'LIMPEZA_INDICES' as tipo,
  CASE WHEN removidos = 0 THEN '✅ ÍNDICES DESNECESSÁRIOS REMOVIDOS' 
       ELSE format('⚠️ AINDA RESTAM %s ÍNDICES PARA REMOVER', removidos) 
  END as status
FROM indices_removidos;

-- 4.3 Verificar status final RLS
SELECT 
  'STATUS_FINAL_RLS' as tipo,
  COUNT(*) as tabelas_com_rls,
  COUNT(*) FILTER (WHERE tablename IN ('fp_workspaces', 'fp_usuarios')) as tabelas_criticas_protegidas
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'fp_%'
  AND rowsecurity = true;

-- =====================================================
-- PARTE 5: PRÓXIMAS AÇÕES RECOMENDADAS
-- =====================================================

SELECT 'PROXIMAS_ACOES' as tipo, 'Implementar correções em políticas RLS duplicadas' as acao, 'ALTA PRIORIDADE' as urgencia
UNION ALL
SELECT 'PROXIMAS_ACOES', 'Otimizar políticas RLS com (select auth.uid())', 'ALTA PRIORIDADE'
UNION ALL
SELECT 'PROXIMAS_ACOES', 'Monitorar performance das queries após índices', 'MÉDIA PRIORIDADE'
UNION ALL
SELECT 'PROXIMAS_ACOES', 'Implementar índices de Prioridade 2 conforme necessário', 'MÉDIA PRIORIDADE'
UNION ALL
SELECT 'PROXIMAS_ACOES', 'Configurar monitoramento contínuo de performance', 'BAIXA PRIORIDADE';

-- =====================================================
-- RESUMO DO QUE ESTE SCRIPT FEZ:
-- 
-- ✅ SEGURANÇA:
--    - Habilitou RLS nas tabelas fp_workspaces e fp_usuarios
--    - Corrigiu vulnerabilidades críticas de segurança
-- 
-- ✅ PERFORMANCE:
--    - Criou 6 índices para foreign keys sem cobertura
--    - Criou 3 índices críticos para queries multiusuário
--    - Removeu 3 índices duplicados
--    - Removeu ~15 índices não utilizados
-- 
-- ⚠️ AINDA PENDENTE:
--    - Otimizar políticas RLS duplicadas
--    - Implementar wrapper (select auth.uid()) nas políticas
--    - Monitorar performance e ajustar conforme necessário
-- =====================================================