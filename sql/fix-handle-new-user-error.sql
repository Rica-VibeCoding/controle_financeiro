-- =====================================================
-- CORREÇÃO URGENTE: Database error saving new user
-- Data: 2025-09-01
-- Problema: Trigger handle_new_user() falhando
-- =====================================================

-- 1. VERIFICAR ESTADO ATUAL
SELECT 'Verificando triggers existentes...' as status;

SELECT 
    event_manipulation,
    event_object_table, 
    trigger_name,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- 2. VERIFICAR FUNÇÃO ATUAL
SELECT 'Verificando função handle_new_user...' as status;

SELECT 
    p.proname as function_name,
    p.prosrc as has_source,
    p.provolatile as volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'handle_new_user';

-- 3. RECRIAR FUNÇÃO criar_categorias_padrao COM TRATAMENTO DE ERROS
SELECT 'Recriando função criar_categorias_padrao...' as status;

CREATE OR REPLACE FUNCTION criar_categorias_padrao(workspace_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Categorias de despesa com ON CONFLICT
    INSERT INTO fp_categorias (id, nome, tipo, icone, cor, workspace_id)
    VALUES 
        (gen_random_uuid(), 'Alimentação', 'despesa', 'utensils', '#10B981', workspace_uuid),
        (gen_random_uuid(), 'Transporte', 'despesa', 'car', '#3B82F6', workspace_uuid),
        (gen_random_uuid(), 'Casa', 'despesa', 'home', '#F59E0B', workspace_uuid),
        (gen_random_uuid(), 'Saúde', 'despesa', 'heart', '#EF4444', workspace_uuid),
        (gen_random_uuid(), 'Educação', 'despesa', 'book-open', '#8B5CF6', workspace_uuid),
        (gen_random_uuid(), 'Lazer', 'despesa', 'gamepad-2', '#EC4899', workspace_uuid)
    ON CONFLICT DO NOTHING;
    
    -- Categorias de receita com ON CONFLICT
    INSERT INTO fp_categorias (id, nome, tipo, icone, cor, workspace_id)
    VALUES 
        (gen_random_uuid(), 'Salário', 'receita', 'banknote', '#059669', workspace_uuid),
        (gen_random_uuid(), 'Freelance', 'receita', 'laptop', '#7C3AED', workspace_uuid),
        (gen_random_uuid(), 'Investimentos', 'receita', 'trending-up', '#0891B2', workspace_uuid)
    ON CONFLICT DO NOTHING;

    -- Formas de pagamento padrão com ON CONFLICT
    INSERT INTO fp_formas_pagamento (id, nome, tipo, workspace_id)
    VALUES 
        (gen_random_uuid(), 'Dinheiro', 'dinheiro', workspace_uuid),
        (gen_random_uuid(), 'Pix', 'pix', workspace_uuid),
        (gen_random_uuid(), 'Cartão de Débito', 'debito', workspace_uuid),
        (gen_random_uuid(), 'Cartão de Crédito', 'credito', workspace_uuid)
    ON CONFLICT DO NOTHING;

EXCEPTION WHEN OTHERS THEN
    -- Log do erro mas continua o processo
    RAISE WARNING 'Erro ao criar categorias padrão para workspace %: %', workspace_uuid, SQLERRM;
END;
$function$;

-- 4. RECRIAR FUNÇÃO handle_new_user COM TRATAMENTO ROBUSTO DE ERROS
SELECT 'Recriando função handle_new_user...' as status;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_workspace_id UUID;
    workspace_name TEXT;
    user_name TEXT;
BEGIN
    -- Validação básica
    IF NEW.id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;
    
    -- Extrair nome do workspace dos metadados ou usar padrão
    workspace_name := COALESCE(
        NEW.raw_user_meta_data->>'workspace_name', 
        'Meu Workspace'
    );
    
    -- Extrair nome do usuário
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'Usuário'
    );
    
    -- 1. Criar workspace
    BEGIN
        INSERT INTO fp_workspaces (id, nome, owner_id, plano, ativo, created_at, updated_at)
        VALUES (
            gen_random_uuid(), 
            workspace_name, 
            NEW.id, 
            'free', 
            true, 
            now(), 
            now()
        )
        RETURNING id INTO new_workspace_id;
        
        -- Log de sucesso
        RAISE NOTICE 'Workspace criado com sucesso: % para usuário %', new_workspace_id, NEW.email;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar workspace: %', SQLERRM;
    END;
    
    -- 2. Criar usuário em fp_usuarios
    BEGIN
        INSERT INTO fp_usuarios (id, workspace_id, nome, role, ativo, created_at, updated_at)
        VALUES (
            NEW.id, 
            new_workspace_id, 
            user_name, 
            'owner', 
            true, 
            now(), 
            now()
        );
        
        RAISE NOTICE 'Usuário criado em fp_usuarios: %', NEW.email;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar usuário em fp_usuarios: %', SQLERRM;
    END;
    
    -- 3. Criar categorias padrão (com tratamento de erro independente)
    BEGIN
        PERFORM criar_categorias_padrao(new_workspace_id);
        RAISE NOTICE 'Categorias padrão criadas para workspace: %', new_workspace_id;
        
    EXCEPTION WHEN OTHERS THEN
        -- Avisa mas não para o processo
        RAISE WARNING 'Erro ao criar categorias padrão (continuando): %', SQLERRM;
    END;
    
    RAISE NOTICE 'handle_new_user concluído com sucesso para: %', NEW.email;
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    -- Log detalhado do erro
    RAISE EXCEPTION 'ERRO CRÍTICO em handle_new_user para usuário % (id: %): %', NEW.email, NEW.id, SQLERRM;
END;
$function$;

-- 5. VERIFICAR SE TRIGGER EXISTE E RECRIAR SE NECESSÁRIO
SELECT 'Verificando e recriando trigger...' as status;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 6. VERIFICAR CONSTRAINTS QUE PODEM ESTAR CAUSANDO ERRO
SELECT 'Verificando constraints...' as status;

SELECT 
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    ccu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.table_name IN ('fp_workspaces', 'fp_usuarios', 'fp_categorias', 'fp_formas_pagamento')
    AND tc.constraint_type IN ('UNIQUE', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type;

-- 7. TESTE SIMPLES (comentado - descomente para testar)
-- SELECT 'TESTE: Criando usuário de teste...' as status;
-- INSERT INTO auth.users (
--     id, 
--     email, 
--     encrypted_password,
--     email_confirmed_at,
--     created_at,
--     updated_at,
--     raw_user_meta_data,
--     aud,
--     role
-- ) VALUES (
--     gen_random_uuid(),
--     'teste-fix@exemplo.com',
--     crypt('senha123', gen_salt('bf')),
--     now(),
--     now(),
--     now(),
--     '{"full_name": "Teste Fix", "workspace_name": "Workspace Teste Fix"}'::jsonb,
--     'authenticated',
--     'authenticated'
-- );

-- 8. VERIFICAÇÃO FINAL
SELECT 'Verificação final...' as status;

SELECT 
    'TRIGGER' as tipo,
    trigger_name,
    'ATIVO' as status
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created'

UNION ALL

SELECT 
    'FUNÇÃO' as tipo,
    p.proname as trigger_name,
    'ATIVA' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('handle_new_user', 'criar_categorias_padrao');

-- =====================================================
-- INSTRUÇÕES DE USO:
-- 1. Execute este script no Supabase Dashboard > SQL Editor
-- 2. Teste criação de usuário em /auth/register
-- 3. Se ainda falhar, descomente o teste na seção 7
-- 4. Verifique logs do PostgreSQL para detalhes
-- =====================================================

SELECT '✅ CORREÇÃO APLICADA - Teste a criação de usuário agora!' as resultado;