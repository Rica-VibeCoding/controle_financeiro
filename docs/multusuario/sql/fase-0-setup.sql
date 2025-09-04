-- =====================================================
-- MULTIUSUÁRIO FASE 0: SETUP INICIAL
-- Arquivo: fase-0-setup.sql
-- 
-- IMPORTANTE: Executar em ambiente de desenvolvimento
-- PRÉ-REQUISITOS:
-- - Supabase projeto configurado
-- - Authentication habilitado no Dashboard
-- - Backup externo já realizado
-- =====================================================

-- 1. Criar tabelas base (MOVIDO DA FASE 1)
-- Ordem: fp_workspaces → fp_usuarios → fp_convites_links

-- 1.1. Tabela Workspaces
CREATE TABLE IF NOT EXISTS fp_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plano TEXT DEFAULT 'free',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2. Tabela Usuários (estende auth.users)
CREATE TABLE IF NOT EXISTS fp_usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE,
  nome TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member', -- 'owner' | 'member'
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3. Tabela Convites por Link
CREATE TABLE IF NOT EXISTS fp_convites_links (
CREATE TABLE IF NOT EXISTS fp_convites_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE,
  codigo TEXT UNIQUE NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  ativo BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_fp_usuarios_workspace ON fp_usuarios(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fp_workspaces_owner ON fp_workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_convites_links_codigo ON fp_convites_links(codigo);
CREATE INDEX IF NOT EXISTS idx_convites_links_workspace ON fp_convites_links(workspace_id);

-- 3. Habilitar RLS nas tabelas base
ALTER TABLE fp_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_convites_links ENABLE ROW LEVEL SECURITY;

-- 4. Função helper para RLS
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

-- 5. Políticas RLS básicas
-- Para fp_usuarios
CREATE POLICY "Users can view their workspace users"
  ON fp_usuarios FOR SELECT
  USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can update their own profile"
  ON fp_usuarios FOR UPDATE
  USING (id = auth.uid());

-- Para fp_workspaces
CREATE POLICY "Users can view their workspace"
  ON fp_workspaces FOR SELECT
  USING (id = get_user_workspace_id());

CREATE POLICY "Owners can update workspace"
  ON fp_workspaces FOR UPDATE
  USING (owner_id = auth.uid());

-- Para fp_convites_links
CREATE POLICY "Users can view workspace invites"
  ON fp_convites_links FOR SELECT
  USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can create workspace invites"
  ON fp_convites_links FOR INSERT
  WITH CHECK (workspace_id = get_user_workspace_id());

-- 6. Função para criar dados padrão (MOVIDO DA FASE 1)
CREATE OR REPLACE FUNCTION criar_categorias_padrao(p_workspace_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Categorias de despesa
  INSERT INTO fp_categorias (workspace_id, nome, tipo, icone, cor)
  VALUES 
    (p_workspace_id, 'Alimentação', 'despesa', 'utensils', '#FF6B6B'),
    (p_workspace_id, 'Transporte', 'despesa', 'car', '#4ECDC4'),
    (p_workspace_id, 'Moradia', 'despesa', 'home', '#45B7D1'),
    (p_workspace_id, 'Saúde', 'despesa', 'heart', '#96CEB4'),
    (p_workspace_id, 'Educação', 'despesa', 'book', '#FFEAA7'),
    (p_workspace_id, 'Lazer', 'despesa', 'gamepad', '#DDA0DD'),
    (p_workspace_id, 'Outros', 'despesa', 'circle', '#95A5A6');
    
  -- Categorias de receita
  INSERT INTO fp_categorias (workspace_id, nome, tipo, icone, cor)
  VALUES 
    (p_workspace_id, 'Salário', 'receita', 'wallet', '#2ECC71'),
    (p_workspace_id, 'Freelance', 'receita', 'briefcase', '#3498DB'),
    (p_workspace_id, 'Investimentos', 'receita', 'trending-up', '#9B59B6'),
    (p_workspace_id, 'Outros', 'receita', 'circle', '#95A5A6');
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para novos usuários (MOVIDO DA FASE 1)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Criar workspace padrão
  INSERT INTO fp_workspaces (nome, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'workspace_name', 'Meu Workspace'),
    NEW.id
  )
  RETURNING id INTO new_workspace_id;

  -- Criar perfil do usuário
  INSERT INTO fp_usuarios (id, workspace_id, nome, role)
  VALUES (
    NEW.id,
    new_workspace_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'owner'
  );

  -- Criar categorias padrão
  PERFORM criar_categorias_padrao(new_workspace_id);

  -- Criar conta padrão
  INSERT INTO fp_contas (workspace_id, nome, tipo, banco)
  VALUES (new_workspace_id, 'Carteira', 'dinheiro', 'Dinheiro em Espécie');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 8. Criar usuário de desenvolvimento (APENAS DESENVOLVIMENTO)
-- ATENÇÃO: Executar apenas em ambiente de desenvolvimento
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmation_token,
  recovery_sent_at,
  recovery_token,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'ricardo@dev.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NOW(),
  '',
  NOW(),
  '',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 9. Validação completa da Fase 0
DO $$
DECLARE
  tabelas_criadas INTEGER;
  indices_criados INTEGER;
  funcoes_criadas INTEGER;
  triggers_criados INTEGER;
  usuarios_dev INTEGER;
  rls_habilitado INTEGER;
BEGIN
  -- Contar tabelas
  SELECT COUNT(*) INTO tabelas_criadas
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links');
  
  -- Contar índices
  SELECT COUNT(*) INTO indices_criados
  FROM pg_indexes 
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%workspace%' OR indexname LIKE 'idx_%convites%';
  
  -- Contar funções
  SELECT COUNT(*) INTO funcoes_criadas
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_workspace_id', 'criar_categorias_padrao', 'handle_new_user');
  
  -- Contar triggers
  SELECT COUNT(*) INTO triggers_criados
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created';
  
  -- Contar usuários dev
  SELECT COUNT(*) INTO usuarios_dev
  FROM auth.users
  WHERE email = 'ricardo@dev.com';
  
  -- Contar RLS habilitado
  SELECT COUNT(*) INTO rls_habilitado
  FROM pg_tables p
  JOIN pg_class c ON c.relname = p.tablename
  WHERE p.schemaname = 'public'
  AND p.tablename IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links')
  AND c.relrowsecurity = true;
  
  -- Relatório
  RAISE NOTICE '=== VALIDAÇÃO FASE 0 ===';
  RAISE NOTICE 'Tabelas criadas: %/3 (fp_workspaces, fp_usuarios, fp_convites_links)', tabelas_criadas;
  RAISE NOTICE 'Índices criados: %/4', indices_criados;
  RAISE NOTICE 'Funções criadas: %/3', funcoes_criadas;
  RAISE NOTICE 'Triggers criados: %/1', triggers_criados;
  RAISE NOTICE 'Usuário dev criado: %/1', usuarios_dev;
  RAISE NOTICE 'RLS habilitado: %/3', rls_habilitado;
  
  IF tabelas_criadas = 3 AND indices_criados >= 4 AND funcoes_criadas = 3 
     AND triggers_criados = 1 AND usuarios_dev = 1 AND rls_habilitado = 3 THEN
    RAISE NOTICE '✅ FASE 0 COMPLETADA COM SUCESSO!';
    RAISE NOTICE '➡️ Próximo: Executar FASE 1';
  ELSE
    RAISE NOTICE '❌ FASE 0 INCOMPLETA - Verificar erros acima';
    RAISE NOTICE '🚫 NÃO prosseguir para Fase 1';
  END IF;
END
$$;

-- =====================================================
-- ROLLBACK PROCEDURE (se necessário)
-- =====================================================
-- 
-- Em caso de erro, executar na ordem:
-- 
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user();
-- DROP FUNCTION IF EXISTS criar_categorias_padrao(UUID);
-- DROP FUNCTION IF EXISTS get_user_workspace_id();
-- DROP TABLE IF EXISTS fp_convites_links;
-- DROP TABLE IF EXISTS fp_usuarios;
-- DROP TABLE IF EXISTS fp_workspaces;
-- DELETE FROM auth.users WHERE email = 'ricardo@dev.com';
--
-- =====================================================
-- FASE 0 CONCLUÍDA ✅
-- Validar com a seção "Validação completa" acima
-- Próximo: Executar FASE 1 apenas se validação passou
-- =====================================================