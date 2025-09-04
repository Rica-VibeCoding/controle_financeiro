-- ================================================================
-- DASHBOARD ADMINISTRATIVO - QUERIES PARA GESTÃO COMPLETA
-- Implementação das novas queries focadas em controle administrativo
-- ================================================================

-- NOVA QUERY 1: TODOS OS USUÁRIOS COM DADOS DE GESTÃO
CREATE OR REPLACE FUNCTION get_todos_usuarios()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  workspace_nome TEXT,
  workspace_id UUID,
  ativo BOOLEAN,
  super_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  total_transacoes BIGINT,
  ultima_transacao TIMESTAMPTZ,
  atividade_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH usuario_transacoes AS (
    SELECT 
      t.workspace_id,
      COUNT(*) as total,
      MAX(t.created_at) as ultima
    FROM fp_transacoes t
    GROUP BY t.workspace_id
  )
  SELECT 
    u.id,
    COALESCE(u.nome, 'Sem nome') as nome,
    u.email,
    w.nome as workspace_nome,
    u.workspace_id,
    u.ativo,
    COALESCE(u.super_admin, false) as super_admin,
    u.created_at,
    u.last_activity,
    COALESCE(ut.total, 0) as total_transacoes,
    ut.ultima as ultima_transacao,
    CASE 
      WHEN u.last_activity >= CURRENT_DATE - INTERVAL '7 days' THEN 'muito_ativo'
      WHEN u.last_activity >= CURRENT_DATE - INTERVAL '30 days' THEN 'ativo'
      WHEN u.last_activity >= CURRENT_DATE - INTERVAL '90 days' THEN 'inativo'
      ELSE 'muito_inativo'
    END as atividade_status
  FROM fp_usuarios u
  LEFT JOIN fp_workspaces w ON w.id = u.workspace_id
  LEFT JOIN usuario_transacoes ut ON ut.workspace_id = u.workspace_id
  ORDER BY u.created_at DESC;
END;
$$;

-- NOVA QUERY 2: TODOS OS WORKSPACES COM MÉTRICAS COMPLETAS  
CREATE OR REPLACE FUNCTION get_todos_workspaces()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  owner_email TEXT,
  plano TEXT,
  ativo BOOLEAN,
  total_usuarios BIGINT,
  usuarios_ativos BIGINT,
  total_transacoes BIGINT,
  volume_total NUMERIC,
  created_at TIMESTAMPTZ,
  ultima_atividade TIMESTAMPTZ,
  status_workspace TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH workspace_stats AS (
    SELECT 
      w.id,
      w.nome,
      owner_u.email as owner_email,
      w.plano,
      w.ativo,
      w.created_at,
      COUNT(DISTINCT u.id) as total_usuarios,
      COUNT(DISTINCT CASE WHEN u.last_activity >= CURRENT_DATE - INTERVAL '30 days' THEN u.id END) as usuarios_ativos,
      (SELECT COUNT(*) FROM fp_transacoes WHERE workspace_id = w.id) as total_transacoes,
      (SELECT COALESCE(SUM(valor), 0) FROM fp_transacoes WHERE workspace_id = w.id) as volume_total,
      MAX(GREATEST(
        COALESCE(u.last_activity, w.created_at),
        COALESCE(t.created_at, w.created_at)
      )) as ultima_atividade
    FROM fp_workspaces w
    LEFT JOIN fp_usuarios owner_u ON owner_u.id = w.owner_id
    LEFT JOIN fp_usuarios u ON u.workspace_id = w.id
    LEFT JOIN fp_transacoes t ON t.workspace_id = w.id
    GROUP BY w.id, w.nome, owner_u.email, w.plano, w.ativo, w.created_at
  )
  SELECT 
    ws.id,
    ws.nome,
    ws.owner_email,
    ws.plano,
    ws.ativo,
    ws.total_usuarios,
    ws.usuarios_ativos,
    ws.total_transacoes,
    ws.volume_total,
    ws.created_at,
    ws.ultima_atividade,
    CASE 
      WHEN ws.ultima_atividade >= CURRENT_DATE - INTERVAL '1 day' THEN 'muito_ativo'
      WHEN ws.ultima_atividade >= CURRENT_DATE - INTERVAL '7 days' THEN 'ativo' 
      WHEN ws.ultima_atividade >= CURRENT_DATE - INTERVAL '30 days' THEN 'moderado'
      ELSE 'inativo'
    END as status_workspace
  FROM workspace_stats ws
  ORDER BY ws.ultima_atividade DESC, ws.total_transacoes DESC;
END;
$$;

-- NOVA QUERY 3: FUNÇÃO PARA ATIVAR/DESATIVAR USUÁRIO
CREATE OR REPLACE FUNCTION admin_toggle_usuario(
  usuario_id UUID,
  novo_status BOOLEAN
)
RETURNS TABLE (
  sucesso BOOLEAN,
  mensagem TEXT,
  usuario_email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Verificar se usuário existe
  SELECT email INTO user_email 
  FROM fp_usuarios 
  WHERE id = usuario_id;
  
  IF user_email IS NULL THEN
    RETURN QUERY SELECT false, 'Usuário não encontrado', ''::TEXT;
    RETURN;
  END IF;
  
  -- Atualizar status
  UPDATE fp_usuarios 
  SET 
    ativo = novo_status,
    updated_at = NOW()
  WHERE id = usuario_id;
  
  -- Registrar log de auditoria
  INSERT INTO fp_audit_logs (
    action, 
    table_name, 
    record_id, 
    details
  ) VALUES (
    CASE WHEN novo_status THEN 'ativou_usuario' ELSE 'desativou_usuario' END,
    'fp_usuarios',
    usuario_id,
    jsonb_build_object('email', user_email, 'novo_status', novo_status)
  );
  
  RETURN QUERY SELECT 
    true, 
    CASE WHEN novo_status THEN 'Usuário ativado com sucesso' ELSE 'Usuário desativado com sucesso' END,
    user_email;
END;
$$;