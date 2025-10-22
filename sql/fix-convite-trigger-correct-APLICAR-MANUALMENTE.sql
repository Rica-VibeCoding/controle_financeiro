-- ⚠️ APLICAR MANUALMENTE NO SUPABASE DASHBOARD
-- SQL Editor → New Query → Colar este código → Run

-- CORREÇÃO CRÍTICA: Trigger handle_new_user
-- Problema: Buscava convite mais recente ao invés do código específico
-- Solução: Passar código do convite via metadata e buscar pelo código exato

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id_var uuid;
  workspace_name_var text;
  user_name_var text;
  is_invite_registration boolean;
  invite_workspace_id uuid;
  invite_codigo text;
BEGIN
  -- Extrair dados do usuário
  user_name_var := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  workspace_name_var := NEW.raw_user_meta_data->>'workspace_name';
  invite_codigo := NEW.raw_user_meta_data->>'invite_code';  -- ✨ LEITURA DO CÓDIGO

  -- Determinar se é registro via convite
  is_invite_registration := (workspace_name_var IS NULL OR workspace_name_var = '');

  -- Log detalhado
  INSERT INTO public.fp_audit_logs (workspace_id, user_id, action, entity_type, metadata)
  VALUES (
    null,
    NEW.id,
    'user_registered_detailed',
    'auth',
    jsonb_build_object(
      'email', NEW.email,
      'nome', user_name_var,
      'workspace_name_raw', workspace_name_var,
      'invite_code', invite_codigo,  -- ✨ LOG DO CÓDIGO RECEBIDO
      'is_invite', is_invite_registration,
      'user_id', NEW.id,
      'timestamp', NOW()
    )
  );

  IF NOT is_invite_registration THEN
    -- REGISTRO NORMAL: criar workspace e usuário como owner
    BEGIN
      INSERT INTO public.fp_workspaces (nome, owner_id)
      VALUES (workspace_name_var, NEW.id)
      RETURNING id INTO workspace_id_var;

      INSERT INTO public.fp_usuarios (
        id, workspace_id, nome, email, role, ativo
      )
      VALUES (
        NEW.id, workspace_id_var, user_name_var, NEW.email, 'owner', true
      );

      INSERT INTO public.fp_audit_logs (workspace_id, user_id, action, entity_type, metadata)
      VALUES (
        workspace_id_var, NEW.id, 'workspace_criado_success', 'workspace',
        jsonb_build_object('workspace_name', workspace_name_var, 'workspace_id', workspace_id_var, 'timestamp', NOW())
      );

    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.fp_audit_logs (workspace_id, user_id, action, entity_type, metadata)
      VALUES (null, NEW.id, 'workspace_creation_failed', 'error',
        jsonb_build_object('error', SQLERRM, 'timestamp', NOW())
      );
      RAISE;
    END;

  ELSE
    -- REGISTRO VIA CONVITE: buscar workspace pelo CÓDIGO ESPECÍFICO
    BEGIN
      -- ✨ CORREÇÃO: Buscar pelo código específico, não o mais recente
      IF invite_codigo IS NOT NULL AND invite_codigo != '' THEN
        SELECT cl.workspace_id, cl.codigo
        INTO invite_workspace_id, invite_codigo
        FROM fp_convites_links cl
        WHERE cl.codigo = invite_codigo  -- ✨ BUSCA ESPECÍFICA
          AND cl.ativo = true
          AND (cl.expires_at IS NULL OR cl.expires_at > NOW());
      ELSE
        -- Fallback: buscar mais recente (compatibilidade)
        SELECT cl.workspace_id, cl.codigo
        INTO invite_workspace_id, invite_codigo
        FROM fp_convites_links cl
        WHERE cl.ativo = true
          AND (cl.expires_at IS NULL OR cl.expires_at > NOW())
        ORDER BY cl.created_at DESC
        LIMIT 1;
      END IF;

      -- Log da busca
      INSERT INTO public.fp_audit_logs (workspace_id, user_id, action, entity_type, metadata)
      VALUES (
        invite_workspace_id, NEW.id, 'invite_search_result', 'convite',
        jsonb_build_object(
          'found_workspace_id', invite_workspace_id,
          'found_codigo', invite_codigo,
          'searched_codigo', NEW.raw_user_meta_data->>'invite_code',
          'email', NEW.email,
          'timestamp', NOW()
        )
      );

      -- Se encontrou workspace, criar usuário como member
      IF invite_workspace_id IS NOT NULL THEN
        INSERT INTO public.fp_usuarios (
          id, workspace_id, nome, email, role, ativo
        )
        VALUES (
          NEW.id, invite_workspace_id, user_name_var, NEW.email, 'member', true
        );

        INSERT INTO public.fp_audit_logs (workspace_id, user_id, action, entity_type, metadata)
        VALUES (
          invite_workspace_id, NEW.id, 'invite_user_created_success', 'convite',
          jsonb_build_object(
            'email', NEW.email, 'workspace_id', invite_workspace_id,
            'codigo_usado', invite_codigo, 'timestamp', NOW()
          )
        );

      ELSE
        -- Não encontrou workspace
        INSERT INTO public.fp_audit_logs (workspace_id, user_id, action, entity_type, metadata)
        VALUES (
          null, NEW.id, 'invite_user_no_workspace', 'error',
          jsonb_build_object(
            'reason', 'nenhum_workspace_ativo_encontrado',
            'searched_codigo', invite_codigo,
            'email', NEW.email,
            'timestamp', NOW()
          )
        );

        RAISE EXCEPTION 'Nenhum convite ativo encontrado com código: %', invite_codigo;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.fp_audit_logs (workspace_id, user_id, action, entity_type, metadata)
      VALUES (
        null, NEW.id, 'invite_user_creation_failed', 'error',
        jsonb_build_object('error', SQLERRM, 'email', NEW.email, 'timestamp', NOW())
      );
      RAISE;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log de aplicação
INSERT INTO public.fp_audit_logs (workspace_id, user_id, action, entity_type, metadata)
VALUES (
  null, null, 'trigger_updated', 'system',
  jsonb_build_object(
    'trigger_name', 'handle_new_user',
    'fix', 'Busca convite por código específico ao invés de mais recente',
    'data_aplicacao', NOW()
  )
);
