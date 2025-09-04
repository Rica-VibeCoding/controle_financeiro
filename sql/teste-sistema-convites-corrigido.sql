-- TESTE COMPLETO DO SISTEMA DE CONVITES CORRIGIDO
-- Execute este arquivo para testar o sistema após as correções

-- 1. VERIFICAR ESTADO ATUAL DO SISTEMA
SELECT 'VERIFICAÇÃO INICIAL' as fase;

-- 1.1. Convites ativos
SELECT 
  'Convites Ativos' as item,
  COUNT(*) as quantidade
FROM fp_convites_links 
WHERE ativo = true AND expires_at > NOW();

-- 1.2. Função handle_new_user
SELECT 
  'Função handle_new_user' as item,
  CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
    THEN 'EXISTE' 
    ELSE 'MISSING' 
  END as status;

-- 1.3. Trigger ativo
SELECT 
  'Trigger on_auth_user_created' as item,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
    THEN 'ATIVO' 
    ELSE 'INATIVO' 
  END as status;

-- 2. VERIFICAR ÚLTIMOS LOGS DE ERRO
SELECT 'LOGS DE ERRO RECENTES' as fase;

SELECT 
  created_at,
  action,
  entity_type,
  metadata->>'error' as erro,
  metadata->>'email' as email
FROM fp_audit_logs 
WHERE entity_type = 'error' 
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 5;

-- 3. VERIFICAR USUÁRIOS ÓRFÃOS (em auth.users mas não em fp_usuarios)
SELECT 'USUÁRIOS ÓRFÃOS' as fase;

SELECT 
  au.email,
  au.created_at,
  'ÓRFÃO - não está em fp_usuarios' as status
FROM auth.users au
LEFT JOIN fp_usuarios fpu ON au.id = fpu.id
WHERE fpu.id IS NULL
  AND au.created_at >= NOW() - INTERVAL '7 days';

-- 4. SIMULAR TESTE DE CONVITE (análise do que aconteceria)
SELECT 'SIMULAÇÃO DE REGISTRO VIA CONVITE' as fase;

-- 4.1. Mostrar convite que seria usado
SELECT 
  'Convite que seria usado' as item,
  codigo,
  workspace_id,
  expires_at,
  created_at
FROM fp_convites_links 
WHERE ativo = true 
  AND expires_at > NOW()
ORDER BY created_at DESC 
LIMIT 1;

-- 4.2. Mostrar workspace de destino
SELECT 
  'Workspace de destino' as item,
  w.id,
  w.nome,
  w.owner_id,
  u.email as owner_email
FROM fp_convites_links cl
JOIN fp_workspaces w ON cl.workspace_id = w.id
JOIN fp_usuarios u ON w.owner_id = u.id
WHERE cl.ativo = true 
  AND cl.expires_at > NOW()
ORDER BY cl.created_at DESC 
LIMIT 1;

-- 5. RELATÓRIO FINAL
SELECT 'RELATÓRIO FINAL' as fase;

SELECT 
  'Sistema corrigido em:' as item,
  NOW() as timestamp,
  'Função handle_new_user atualizada com logs detalhados' as status;

SELECT 
  'Próximo passo:' as item,
  'Testar registro real via convite com email válido' as acao;

SELECT 
  'Link de convite ativo:' as item,
  CONCAT('https://seu-dominio.com/auth/convite/', codigo) as link
FROM fp_convites_links 
WHERE ativo = true 
  AND expires_at > NOW()
ORDER BY created_at DESC 
LIMIT 1;