-- CORREÇÃO URGENTE: Database error querying schema
-- Baseado na Issue #1940 do Supabase Auth
-- https://github.com/supabase/auth/issues/1940

-- 1. Verificar se há colunas NULL no usuário dev
SELECT 
  id,
  email,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  email_confirmed_at
FROM auth.users 
WHERE email = 'ricardo@dev.com';

-- 2. Corrigir colunas NULL (que causam o erro)
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'ricardo@dev.com';

-- 3. Verificar se foi corrigido
SELECT 
  id,
  email,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  email_confirmed_at
FROM auth.users 
WHERE email = 'ricardo@dev.com';

-- 4. (OPCIONAL) Corrigir para TODOS os usuários
-- UPDATE auth.users
-- SET 
--   confirmation_token = COALESCE(confirmation_token, ''),
--   email_change = COALESCE(email_change, ''),
--   email_change_token_new = COALESCE(email_change_token_new, ''),
--   recovery_token = COALESCE(recovery_token, '')
-- WHERE confirmation_token IS NULL 
--    OR email_change IS NULL 
--    OR email_change_token_new IS NULL 
--    OR recovery_token IS NULL;