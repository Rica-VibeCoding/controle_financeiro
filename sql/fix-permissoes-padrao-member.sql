-- =====================================================
-- ATUALIZAÇÃO: Permissões Padrão para Novos Membros
-- Data: 24/10/2025
-- Objetivo: Garantir acesso mínimo funcional para membros
-- =====================================================

-- 1. VERIFICAR ESTRUTURA ATUAL
SELECT 'Verificando estrutura atual da coluna permissoes...' as status;

SELECT
  column_name,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_name = 'fp_usuarios'
  AND column_name = 'permissoes';

-- 2. ATUALIZAR PADRÃO DA COLUNA permissoes
SELECT 'Atualizando padrão da coluna permissoes...' as status;

ALTER TABLE fp_usuarios
ALTER COLUMN permissoes
SET DEFAULT '{
  "dashboard": false,
  "receitas": false,
  "despesas": true,
  "recorrentes": true,
  "previstas": true,
  "relatorios": false,
  "configuracoes": false,
  "cadastramentos": true,
  "backup": false
}'::jsonb;

-- 3. CRIAR FUNÇÃO PARA NORMALIZAR PERMISSÕES ANTIGAS
SELECT 'Criando função para normalizar permissões...' as status;

CREATE OR REPLACE FUNCTION normalizar_permissoes_usuario(
  permissoes_antigas jsonb
) RETURNS jsonb AS $$
DECLARE
  permissoes_normalizadas jsonb;
BEGIN
  -- Se vier null ou vazio, retorna padrão
  IF permissoes_antigas IS NULL THEN
    RETURN '{
      "dashboard": false,
      "receitas": false,
      "despesas": true,
      "recorrentes": true,
      "previstas": true,
      "relatorios": false,
      "configuracoes": false,
      "cadastramentos": true,
      "backup": false
    }'::jsonb;
  END IF;

  -- Criar objeto normalizado preservando valores existentes
  permissoes_normalizadas := jsonb_build_object(
    'dashboard', COALESCE((permissoes_antigas->>'dashboard')::boolean, false),
    'receitas', COALESCE((permissoes_antigas->>'receitas')::boolean, false),
    'despesas', COALESCE((permissoes_antigas->>'despesas')::boolean, true),
    'recorrentes', COALESCE((permissoes_antigas->>'recorrentes')::boolean, true),
    'previstas', COALESCE((permissoes_antigas->>'previstas')::boolean, true),
    'relatorios', COALESCE((permissoes_antigas->>'relatorios')::boolean, false),
    'configuracoes', COALESCE((permissoes_antigas->>'configuracoes')::boolean, false),
    'cadastramentos', COALESCE((permissoes_antigas->>'cadastramentos')::boolean, true),
    'backup', COALESCE((permissoes_antigas->>'backup')::boolean, false)
  );

  RETURN permissoes_normalizadas;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. NORMALIZAR PERMISSÕES DE MEMBROS EXISTENTES
SELECT 'Normalizando permissões de membros existentes...' as status;

UPDATE fp_usuarios
SET permissoes = normalizar_permissoes_usuario(permissoes)
WHERE role = 'member'
  AND ativo = true;

-- 5. ATUALIZAR TRIGGER handle_new_user (se existir) PARA USAR NOVO PADRÃO
-- OBS: Apenas atualizar se o trigger usar permissões (via convite)
SELECT 'Verificando trigger handle_new_user...' as status;

-- Este passo é informativo - o trigger será atualizado manualmente se necessário
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 6. VERIFICAÇÃO FINAL
SELECT 'Verificando resultado da migração...' as status;

-- Contar membros atualizados
SELECT
  'Membros ativos com permissões normalizadas' as descricao,
  COUNT(*) as total
FROM fp_usuarios
WHERE role = 'member'
  AND ativo = true
  AND permissoes IS NOT NULL;

-- Exemplo de permissões normalizadas
SELECT
  'Exemplo de permissões após normalização' as descricao,
  nome,
  role,
  permissoes
FROM fp_usuarios
WHERE role = 'member'
  AND ativo = true
LIMIT 1;

-- Verificar novo padrão da coluna
SELECT
  'Novo padrão da coluna' as descricao,
  column_default
FROM information_schema.columns
WHERE table_name = 'fp_usuarios'
  AND column_name = 'permissoes';

-- 7. LOG DE AUDITORIA
INSERT INTO fp_audit_logs (workspace_id, user_id, action, entity_type, metadata)
VALUES (
  null,
  null,
  'migration_executed',
  'system',
  jsonb_build_object(
    'migration_name', 'fix-permissoes-padrao-member',
    'description', 'Atualização de permissões padrão para membros',
    'changes', jsonb_build_array(
      'Padrão atualizado: despesas=true, recorrentes=true, previstas=true, cadastramentos=true',
      'Permissões de membros existentes normalizadas',
      'Função normalizar_permissoes_usuario() criada'
    ),
    'executed_at', NOW()
  )
);

-- =====================================================
-- RESULTADO ESPERADO:
-- ✅ Novos membros receberão 4 permissões ativas por padrão
-- ✅ Membros existentes terão permissões normalizadas
-- ✅ Estrutura antiga (recebidos) removida
-- ✅ Campos novos (previstas, cadastramentos) adicionados
-- =====================================================

SELECT '✅ MIGRAÇÃO CONCLUÍDA - Permissões padrão atualizadas!' as resultado;
