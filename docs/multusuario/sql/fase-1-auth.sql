-- =====================================================
-- MULTIUSUÁRIO FASE 1: AUTH FOUNDATION
-- Arquivo: fase-1-auth.sql
-- =====================================================

-- 1. Criar tabela fp_workspaces
CREATE TABLE fp_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plano TEXT DEFAULT 'free',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela fp_usuarios (estende auth.users)
CREATE TABLE fp_usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE,
  nome TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member', -- 'owner' | 'member'
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX idx_fp_usuarios_workspace ON fp_usuarios(workspace_id);

-- 4. Função para criar categorias padrão
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

-- 5. Função para criar usuário e workspace após registro
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

-- 6. Trigger para novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 7. Verificação final
SELECT 
  'fp_workspaces' as tabela,
  COUNT(*) as registros,
  'Tabela criada com sucesso' as status
FROM fp_workspaces
UNION ALL
SELECT 
  'fp_usuarios',
  COUNT(*),
  'Tabela criada com sucesso'
FROM fp_usuarios;

-- Testar função de criação de dados padrão
SELECT 'trigger' as componente, 'handle_new_user criado' as status;
SELECT 'função' as componente, 'criar_categorias_padrao criada' as status;

-- =====================================================
-- FASE 1 CONCLUÍDA ✅
-- Próximo: Executar fase-2-database.sql
-- =====================================================