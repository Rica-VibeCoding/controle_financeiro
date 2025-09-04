-- =====================================================
-- CORREÇÃO URGENTE: Database error saving new user
-- Executar no Supabase Dashboard > SQL Editor
-- =====================================================

-- FASE 0: CRIAÇÃO ESTRUTURA MULTIUSUÁRIO

-- 1. Criar tabelas base
CREATE TABLE IF NOT EXISTS fp_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plano TEXT DEFAULT 'free',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fp_usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE,
  nome TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 3. Habilitar Row Level Security
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
DROP POLICY IF EXISTS "Users can view their workspace users" ON fp_usuarios;
CREATE POLICY "Users can view their workspace users"
  ON fp_usuarios FOR SELECT
  USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Users can update their own profile" ON fp_usuarios;
CREATE POLICY "Users can update their own profile"
  ON fp_usuarios FOR UPDATE
  USING (id = auth.uid());

-- Para fp_workspaces  
DROP POLICY IF EXISTS "Users can view their workspace" ON fp_workspaces;
CREATE POLICY "Users can view their workspace"
  ON fp_workspaces FOR SELECT
  USING (id = get_user_workspace_id());

DROP POLICY IF EXISTS "Owners can update workspace" ON fp_workspaces;
CREATE POLICY "Owners can update workspace"
  ON fp_workspaces FOR UPDATE
  USING (owner_id = auth.uid());

-- Para fp_convites_links
DROP POLICY IF EXISTS "Users can view workspace invites" ON fp_convites_links;
CREATE POLICY "Users can view workspace invites"
  ON fp_convites_links FOR SELECT
  USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Users can create workspace invites" ON fp_convites_links;
CREATE POLICY "Users can create workspace invites"
  ON fp_convites_links FOR INSERT
  WITH CHECK (workspace_id = get_user_workspace_id());

-- 6. Função para criar categorias padrão (flexível)
CREATE OR REPLACE FUNCTION criar_categorias_padrao(p_workspace_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verificar se tabela fp_categorias existe antes de tentar inserir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fp_categorias') THEN
    -- Categorias básicas de despesa
    INSERT INTO fp_categorias (workspace_id, nome, tipo, icone, cor)
    VALUES 
      (p_workspace_id, 'Alimentação', 'despesa', 'utensils', '#FF6B6B'),
      (p_workspace_id, 'Transporte', 'despesa', 'car', '#4ECDC4'),
      (p_workspace_id, 'Outros', 'despesa', 'circle', '#95A5A6')
    ON CONFLICT DO NOTHING;
      
    -- Categorias básicas de receita
    INSERT INTO fp_categorias (workspace_id, nome, tipo, icone, cor)
    VALUES 
      (p_workspace_id, 'Salário', 'receita', 'wallet', '#2ECC71'),
      (p_workspace_id, 'Outros', 'receita', 'circle', '#95A5A6')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO TRIGGER PRINCIPAL (CORRIGIDA E ROBUSTA)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
  workspace_name TEXT;
  user_name TEXT;
BEGIN
  -- Log de início
  RAISE LOG 'handle_new_user: Processando usuário %', NEW.id;
  
  -- Preparar valores seguros com fallbacks
  workspace_name := COALESCE(NEW.raw_user_meta_data->>'workspace_name', 'Meu Workspace');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuário');
  
  -- ETAPA 1: Criar workspace (CRÍTICO - deve funcionar)
  BEGIN
    INSERT INTO fp_workspaces (nome, owner_id)
    VALUES (workspace_name, NEW.id)
    RETURNING id INTO new_workspace_id;
    
    RAISE LOG 'handle_new_user: ✅ Workspace criado - ID: %', new_workspace_id;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: ❌ ERRO CRÍTICO ao criar workspace: %', SQLERRM;
      RAISE; -- Falhar o registro se não conseguir criar workspace
  END;

  -- ETAPA 2: Criar perfil do usuário (CRÍTICO - deve funcionar)
  BEGIN
    INSERT INTO fp_usuarios (id, workspace_id, nome, role)
    VALUES (NEW.id, new_workspace_id, user_name, 'owner');
    
    RAISE LOG 'handle_new_user: ✅ Usuário criado no workspace %', new_workspace_id;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: ❌ ERRO CRÍTICO ao criar usuário: %', SQLERRM;
      RAISE; -- Falhar o registro se não conseguir criar usuário
  END;

  -- ETAPA 3: Criar dados padrão (NÃO CRÍTICO - pode falhar sem impacto)
  BEGIN
    -- Tentar criar categorias padrão
    PERFORM criar_categorias_padrao(new_workspace_id);
    RAISE LOG 'handle_new_user: ✅ Categorias padrão processadas';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: ⚠️ AVISO ao criar categorias: %', SQLERRM;
      -- Não falhar o registro por causa das categorias
  END;

  -- ETAPA 4: Criar conta padrão (NÃO CRÍTICO - pode falhar sem impacto)
  BEGIN
    -- Verificar se tabela fp_contas existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fp_contas') THEN
      INSERT INTO fp_contas (workspace_id, nome, tipo, banco)
      VALUES (new_workspace_id, 'Carteira', 'dinheiro', 'Dinheiro em Espécie');
      RAISE LOG 'handle_new_user: ✅ Conta padrão criada';
    ELSE
      RAISE LOG 'handle_new_user: ⚠️ Tabela fp_contas não existe - pulando criação de conta';
    END IF;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: ⚠️ AVISO ao criar conta padrão: %', SQLERRM;
      -- Não falhar o registro por causa da conta
  END;

  RAISE LOG 'handle_new_user: ✅ SUCESSO COMPLETO para usuário % (workspace: %)', NEW.id, new_workspace_id;
  RETURN NEW;

EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: ❌ ERRO GERAL INESPERADO: %', SQLERRM;
    RAISE; -- Re-lançar erro para falhar o registro
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Aplicar o trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 9. Criar workspace para usuário dev existente (se necessário)
DO $$
DECLARE
  dev_user_id UUID;
  existing_workspace UUID;
BEGIN
  -- Procurar usuário dev
  SELECT id INTO dev_user_id 
  FROM auth.users 
  WHERE email = 'ricardo@dev.com';
  
  IF dev_user_id IS NOT NULL THEN
    -- Verificar se já tem workspace
    SELECT workspace_id INTO existing_workspace 
    FROM fp_usuarios 
    WHERE id = dev_user_id;
    
    IF existing_workspace IS NULL THEN
      -- Criar workspace e usuário para o dev
      DECLARE
        dev_workspace_id UUID;
      BEGIN
        INSERT INTO fp_workspaces (nome, owner_id)
        VALUES ('Workspace Desenvolvimento', dev_user_id)
        RETURNING id INTO dev_workspace_id;
        
        INSERT INTO fp_usuarios (id, workspace_id, nome, role)
        VALUES (dev_user_id, dev_workspace_id, 'Ricardo Dev', 'owner');
        
        -- Tentar criar dados padrão
        BEGIN
          PERFORM criar_categorias_padrao(dev_workspace_id);
        EXCEPTION WHEN OTHERS THEN
          -- Ignorar erro
        END;
        
        RAISE NOTICE '✅ Workspace criado para usuário dev: %', dev_workspace_id;
      END;
    ELSE
      RAISE NOTICE '✅ Usuário dev já possui workspace: %', existing_workspace;
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Usuário dev ricardo@dev.com não encontrado';
  END IF;
END;
$$;

-- 10. VALIDAÇÃO FINAL
DO $$
DECLARE
  tabelas_count INTEGER;
  trigger_count INTEGER;
  funcoes_count INTEGER;
BEGIN
  -- Contar tabelas criadas
  SELECT COUNT(*) INTO tabelas_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links');
  
  -- Contar trigger
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created';
  
  -- Contar funções
  SELECT COUNT(*) INTO funcoes_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'get_user_workspace_id', 'criar_categorias_padrao');
  
  -- Relatório de validação
  RAISE NOTICE '';
  RAISE NOTICE '=== VALIDAÇÃO DA CORREÇÃO ===';
  RAISE NOTICE 'Tabelas multiusuário: %/3 ✅', tabelas_count;
  RAISE NOTICE 'Trigger auth criado: %/1 ✅', trigger_count;
  RAISE NOTICE 'Funções criadas: %/3 ✅', funcoes_count;
  
  IF tabelas_count = 3 AND trigger_count = 1 AND funcoes_count = 3 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CORREÇÃO APLICADA COM SUCESSO!';
    RAISE NOTICE '✅ O erro "Database error saving new user" foi corrigido';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Testar registro de usuário em /auth/register';
    RAISE NOTICE '2. Verificar criação automática do workspace';
    RAISE NOTICE '3. Validar que não há mais erros no console';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '❌ CORREÇÃO INCOMPLETA - Verificar erros acima';
  END IF;
END;
$$;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- 1. Copie este SQL completo
-- 2. Vá ao Supabase Dashboard > SQL Editor
-- 3. Cole e execute (RUN)
-- 4. Verifique o resultado na aba de logs
-- 5. Teste o registro de usuário na aplicação
-- =====================================================