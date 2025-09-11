-- =====================================================
-- SISTEMA DE PERMISSÕES GRANULARES
-- Adiciona controle detalhado de funcionalidades para MEMBERs
-- =====================================================

-- 1. ADICIONAR COLUNA PERMISSÕES NA fp_usuarios
-- =====================================================
ALTER TABLE fp_usuarios ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '{
  "dashboard": false,
  "receitas": false,
  "despesas": false,
  "recorrentes": false,
  "recebidos": false,
  "relatorios": false,
  "configuracoes": false,
  "backup": false
}';

-- 2. CRIAR ÍNDICE GIN PARA CONSULTAS JSON EFICIENTES
-- =====================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fp_usuarios_permissoes 
ON fp_usuarios USING GIN (permissoes);

-- 3. ADICIONAR CONSTRAINT DE VALIDAÇÃO JSON
-- =====================================================
ALTER TABLE fp_usuarios 
ADD CONSTRAINT IF NOT EXISTS check_permissoes_valid 
CHECK (permissoes IS NULL OR jsonb_typeof(permissoes) = 'object');

-- 4. APLICAR PERMISSÕES PADRÃO PARA USUÁRIOS EXISTENTES
-- =====================================================

-- OWNERs: Todas as permissões liberadas (true)
UPDATE fp_usuarios 
SET permissoes = '{
  "dashboard": true,
  "receitas": true,
  "despesas": true,
  "recorrentes": true,
  "recebidos": true,
  "relatorios": true,
  "configuracoes": true,
  "backup": true
}'
WHERE role = 'owner' AND permissoes IS NULL;

-- MEMBERs: Todas as permissões bloqueadas (false) - já é o DEFAULT
-- Não precisa UPDATE pois o DEFAULT já é false para tudo

-- 5. FUNÇÃO PARA ATUALIZAR PERMISSÕES DE USUÁRIO
-- =====================================================
CREATE OR REPLACE FUNCTION atualizar_permissoes_usuario(
  p_user_id UUID,
  p_workspace_id UUID,
  p_permissoes JSONB,
  p_changed_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_target_user_role TEXT;
  v_changer_role TEXT;
BEGIN
  -- Verificar se quem está alterando é OWNER do workspace
  SELECT role INTO v_changer_role
  FROM fp_usuarios 
  WHERE id = p_changed_by 
  AND workspace_id = p_workspace_id 
  AND ativo = true;

  IF v_changer_role IS NULL OR v_changer_role != 'owner' THEN
    RAISE EXCEPTION 'Apenas proprietários podem alterar permissões';
  END IF;

  -- Verificar se usuário alvo existe no workspace
  SELECT role INTO v_target_user_role
  FROM fp_usuarios 
  WHERE id = p_user_id 
  AND workspace_id = p_workspace_id 
  AND ativo = true;

  IF v_target_user_role IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado ou não está ativo no workspace';
  END IF;

  -- Não permitir alterar permissões de outros OWNERs
  IF v_target_user_role = 'owner' THEN
    RAISE EXCEPTION 'Não é possível alterar permissões de proprietários';
  END IF;

  -- Validar estrutura do JSON de permissões
  IF NOT (
    p_permissoes ? 'dashboard' AND
    p_permissoes ? 'receitas' AND
    p_permissoes ? 'despesas' AND
    p_permissoes ? 'recorrentes' AND
    p_permissoes ? 'recebidos' AND
    p_permissoes ? 'relatorios' AND
    p_permissoes ? 'configuracoes' AND
    p_permissoes ? 'backup'
  ) THEN
    RAISE EXCEPTION 'JSON de permissões inválido - campos obrigatórios ausentes';
  END IF;

  -- Atualizar permissões
  UPDATE fp_usuarios 
  SET permissoes = p_permissoes,
      updated_at = NOW()
  WHERE id = p_user_id 
  AND workspace_id = p_workspace_id;

  -- Log da alteração na auditoria
  INSERT INTO fp_audit_logs (
    workspace_id, user_id, action, entity_type, entity_id, 
    metadata, created_at
  ) VALUES (
    p_workspace_id, 
    p_changed_by, 
    'permissions_changed', 
    'usuario', 
    p_user_id,
    jsonb_build_object(
      'target_user_id', p_user_id,
      'new_permissions', p_permissoes,
      'changed_by', p_changed_by,
      'timestamp', NOW()
    ),
    NOW()
  );

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro para debugging
    RAISE NOTICE 'Erro ao atualizar permissões: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNÇÃO PARA VERIFICAR PERMISSÃO ESPECÍFICA
-- =====================================================
CREATE OR REPLACE FUNCTION verificar_permissao_usuario(
  p_user_id UUID,
  p_workspace_id UUID,
  p_permissao TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_user_ativo BOOLEAN;
  v_permissoes JSONB;
  v_tem_permissao BOOLEAN := FALSE;
BEGIN
  -- Buscar role, status e permissões do usuário
  SELECT role, ativo, permissoes 
  INTO v_user_role, v_user_ativo, v_permissoes
  FROM fp_usuarios 
  WHERE id = p_user_id 
  AND workspace_id = p_workspace_id;

  -- Se usuário não existe ou está inativo
  IF v_user_role IS NULL OR v_user_ativo = FALSE THEN
    RETURN FALSE;
  END IF;

  -- OWNERs sempre têm todas as permissões
  IF v_user_role = 'owner' THEN
    RETURN TRUE;
  END IF;

  -- Para MEMBERs, verificar JSON de permissões
  IF v_permissoes IS NOT NULL AND v_permissoes ? p_permissao THEN
    SELECT (v_permissoes ->> p_permissao)::BOOLEAN INTO v_tem_permissao;
  END IF;

  RETURN COALESCE(v_tem_permissao, FALSE);

EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ATUALIZAR TRIGGER DE updated_at (se não existir)
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na fp_usuarios (se não existir)
DROP TRIGGER IF EXISTS set_timestamp_fp_usuarios ON fp_usuarios;
CREATE TRIGGER set_timestamp_fp_usuarios
  BEFORE UPDATE ON fp_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- 8. POLÍTICAS RLS PARA PERMISSÕES (REFORÇAR SEGURANÇA)
-- =====================================================

-- Policy para que apenas OWNERs vejam/editem permissões de MEMBERs
CREATE POLICY IF NOT EXISTS "Owners can manage member permissions"
  ON fp_usuarios FOR ALL
  USING (
    -- OWNER pode ver/editar qualquer membro do workspace
    EXISTS (
      SELECT 1 FROM fp_usuarios owner_user 
      WHERE owner_user.id = auth.uid()
      AND owner_user.workspace_id = fp_usuarios.workspace_id
      AND owner_user.role = 'owner'
      AND owner_user.ativo = true
    )
    OR
    -- Usuário pode ver/editar próprios dados
    id = auth.uid()
  );

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================
COMMENT ON COLUMN fp_usuarios.permissoes IS 'Permissões granulares para MEMBERs em formato JSON. OWNERs ignoram este campo.';
COMMENT ON FUNCTION atualizar_permissoes_usuario IS 'Atualiza permissões de um MEMBER. Apenas OWNERs podem executar.';
COMMENT ON FUNCTION verificar_permissao_usuario IS 'Verifica se usuário tem permissão específica. OWNERs sempre retorna TRUE.';

-- =====================================================
-- VALIDAÇÕES PÓS-EXECUÇÃO
-- =====================================================

-- Verificar se coluna foi criada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fp_usuarios' 
    AND column_name = 'permissoes'
  ) THEN
    RAISE EXCEPTION 'ERRO: Coluna permissoes não foi criada na tabela fp_usuarios';
  END IF;
  
  RAISE NOTICE 'SUCCESS: Coluna permissoes criada com sucesso';
END $$;

-- Verificar se índice foi criado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'fp_usuarios' 
    AND indexname = 'idx_fp_usuarios_permissoes'
  ) THEN
    RAISE NOTICE 'WARNING: Índice GIN não foi criado (pode estar sendo criado CONCURRENTLY)';
  ELSE
    RAISE NOTICE 'SUCCESS: Índice GIN criado com sucesso';
  END IF;
END $$;

-- Verificar se funções foram criadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'atualizar_permissoes_usuario'
  ) THEN
    RAISE EXCEPTION 'ERRO: Função atualizar_permissoes_usuario não foi criada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'verificar_permissao_usuario'  
  ) THEN
    RAISE EXCEPTION 'ERRO: Função verificar_permissao_usuario não foi criada';
  END IF;
  
  RAISE NOTICE 'SUCCESS: Funções SQL criadas com sucesso';
END $$;

-- Contar usuários com permissões aplicadas
DO $$
DECLARE
  v_owners_count INTEGER;
  v_members_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_owners_count 
  FROM fp_usuarios 
  WHERE role = 'owner' 
  AND permissoes IS NOT NULL;
  
  SELECT COUNT(*) INTO v_members_count 
  FROM fp_usuarios 
  WHERE role = 'member';
  
  RAISE NOTICE 'SUCCESS: % OWNERs com permissões aplicadas, % MEMBERs com padrão restritivo', 
    v_owners_count, v_members_count;
END $$;

-- =====================================================
-- SCRIPT FINALIZADO COM SUCESSO
-- Data: Janeiro 2025
-- Versão: Sistema de Permissões Granulares v1.0
-- =====================================================