# 🚀 FASE 0: SETUP INICIAL
  
> **Objetivo:** Preparação completa antes de implementar multiusuário
> **Complexidade:** Baixa  
> **Tempo Estimado:** 1 dia
> **Pré-requisito:** Backup externo já feito ✅

---

## 📋 **PRÉ-REQUISITOS**

### **Ambiente de Desenvolvimento:**
- [x] Node.js 18+ instalado
- [x] npm ou yarn funcionando
- [x] Projeto Next.js configurado
- [x] Supabase projeto criado e configurado
- [x] Variáveis de ambiente (.env.local) configuradas
- [x] Backup externo dos dados já realizado ✅

### **Verificações Iniciais:**
```bash
# Validar TypeScript
npx tsc --noEmit

# Testar build
npm run build

# Verificar conexão Supabase
echo "Teste de conexão com Supabase..."
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **1. Configuração Supabase Auth**

```bash
# 1. Acessar Dashboard Supabase
# 2. Ir em Authentication > Settings
# 3. Habilitar Email Authentication
# 4. Configurar Site URL: http://localhost:3000 (dev)
# 5. Configurar Redirect URLs:
#    - http://localhost:3000/auth/callback
#    - https://seudominio.com/auth/callback (produção)
```

### **2. Criar Tabelas Base (MOVIDO DA FASE 1)**

```sql
-- 1. Tabela Workspaces
CREATE TABLE fp_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plano TEXT DEFAULT 'free',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela Usuários (estende auth.users)
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

-- 3. Índices para performance
CREATE INDEX idx_fp_usuarios_workspace ON fp_usuarios(workspace_id);
CREATE INDEX idx_fp_workspaces_owner ON fp_workspaces(owner_id);
```

### **3. Criar Usuário de Desenvolvimento**

```sql
-- Executar no SQL Editor do Supabase
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
```

### **4. Instalar Dependências Auth**

```bash
npm install @supabase/auth-helpers-nextjs @supabase/auth-helpers-react uuid
npm install @types/uuid -D
```

### **5. Configurar Variáveis de Ambiente**

```env
# .env.local - ADICIONAR
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEV_MODE=true
```

### **6. Criar Cliente Supabase com Auth**

```typescript
// src/servicos/supabase/auth-client.ts (CRIAR NOVO ARQUIVO)
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Cliente para componentes cliente
export const supabaseClient = createClientComponentClient()

// Cliente para componentes servidor  
export async function supabaseServer() {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// Auto-login para desenvolvimento
export async function autoLoginDev() {
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    const { data: { session } } = await supabaseClient.auth.getSession()
    
    if (!session) {
      console.log('🔧 Fazendo auto-login para desenvolvimento...')
      await supabaseClient.auth.signInWithPassword({
        email: 'ricardo@dev.com',
        password: 'senha123'
      })
    }
  }
}
```

### **7. Criar Sistema de Convites Simplificado**

```typescript
// src/servicos/supabase/convites-simples.ts (CRIAR NOVO ARQUIVO)
import { supabaseClient } from './auth-client'
import { v4 as uuidv4 } from 'uuid'

interface ConviteLink {
  id: string
  workspace_id: string
  codigo: string
  criado_por: string
  ativo: boolean
  expires_at: string
  created_at: string
}

// Gerar código simples (6 caracteres)
function gerarCodigoConvite(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Criar link de convite
export async function criarLinkConvite(workspaceId: string): Promise<{
  link?: string
  codigo?: string
  error?: string
}> {
  try {
    const codigo = gerarCodigoConvite()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 dias

    const { data: user } = await supabaseClient.auth.getUser()
    if (!user.user) return { error: 'Usuário não autenticado' }

    const { data, error } = await supabaseClient
      .from('fp_convites_links')
      .insert({
        workspace_id: workspaceId,
        codigo,
        criado_por: user.user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) return { error: error.message }

    const link = `${process.env.NEXT_PUBLIC_APP_URL}/juntar/${codigo}`
    
    return { 
      link,
      codigo,
      error: undefined 
    }
  } catch (error) {
    return { error: 'Erro ao criar convite' }
  }
}

// Validar e usar código de convite
export async function usarCodigoConvite(codigo: string): Promise<{
  workspace?: any
  error?: string
}> {
  try {
    // Verificar se código é válido
    const { data: convite } = await supabaseClient
      .from('fp_convites_links')
      .select('*, fp_workspaces(*)')
      .eq('codigo', codigo.toUpperCase())
      .eq('ativo', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (!convite) {
      return { error: 'Código inválido ou expirado' }
    }

    return { 
      workspace: convite.fp_workspaces,
      error: undefined 
    }
  } catch (error) {
    return { error: 'Erro ao validar código' }
  }
}

// Desativar convite após uso
export async function desativarConvite(codigo: string) {
  await supabaseClient
    .from('fp_convites_links')
    .update({ ativo: false })
    .eq('codigo', codigo.toUpperCase())
}
```

### **8. Criar Tabela de Convites por Link**

```sql
-- Executar no SQL Editor do Supabase
CREATE TABLE fp_convites_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES fp_workspaces(id) ON DELETE CASCADE,
  codigo TEXT UNIQUE NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  ativo BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_convites_links_codigo ON fp_convites_links(codigo);
CREATE INDEX idx_convites_links_workspace ON fp_convites_links(workspace_id);

-- RLS
ALTER TABLE fp_convites_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace invites"
  ON fp_convites_links FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM fp_usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create workspace invites"
  ON fp_convites_links FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM fp_usuarios WHERE id = auth.uid()
    )
  );
```

### **9. Criar Tipos TypeScript**

```typescript
// src/tipos/auth.ts (CRIAR NOVO ARQUIVO)
export interface Workspace {
  id: string
  nome: string
  owner_id: string
  plano: 'free' | 'pro' | 'enterprise'
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  workspace_id: string
  nome: string
  email?: string
  avatar_url?: string
  role: 'owner' | 'member'
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ConviteLink {
  id: string
  workspace_id: string
  codigo: string
  criado_por: string
  ativo: boolean
  expires_at: string
  created_at: string
}
```

### **10. Middleware Básico (Preparação)**

```typescript
// middleware.ts (CRIAR ARQUIVO NA RAIZ)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Por enquanto só refresh de sessão
  await supabase.auth.getSession()

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### **11. Estrutura de Pastas Auth**

```bash
# Criar pastas
mkdir -p src/app/auth/{login,register,callback}
mkdir -p src/app/juntar/[codigo]
mkdir -p src/componentes/auth
```

---

### **12. Função para Criar Dados Padrão (MOVIDO DA FASE 1)**

```sql
-- Função para criar categorias padrão
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

-- Trigger para criar workspace e dados padrão
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
```

---

## 🧪 **TESTES DE VALIDAÇÃO**

### **Teste 1: Validação de Ambiente**
```bash
# 1. Verificar TypeScript
npx tsc --noEmit
# ✅ Deve passar sem erros

# 2. Verificar build
npm run build
# ✅ Deve compilar sem erros

# 3. Verificar dependências
npm list @supabase/auth-helpers-nextjs
# ✅ Deve mostrar versão instalada
```

### **Teste 2: Auth Configurado**
```bash
# Acessar Supabase Dashboard
# Verificar se Authentication está habilitado
# Verificar se usuário ricardo@dev.com foi criado
```

### **Teste 3: Validação Database**
```sql
-- Verificar se todas as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links');
-- ✅ Deve retornar 3 tabelas

-- Verificar usuário de desenvolvimento
SELECT email FROM auth.users WHERE email = 'ricardo@dev.com';
-- ✅ Deve retornar 1 registro
```

### **Teste 4: Auto-login Dev**
```typescript
// Em qualquer componente, testar
import { autoLoginDev } from '@/servicos/supabase/auth-client'
await autoLoginDev()
// Deve fazer login automaticamente em desenvolvimento
```

### **Teste 5: Sistema de Convites**
```typescript
// Testar geração de código
const { link, codigo } = await criarLinkConvite('workspace-id')
console.log('Link:', link) // deve ser válido
console.log('Código:', codigo) // deve ter 6 caracteres
```

---

## 🛠️ **ROLLBACK PROCEDURES**

```sql
-- Em caso de erro, executar rollback:
-- 1. Remover trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Remover funções
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS criar_categorias_padrao(UUID);

-- 3. Remover tabelas (ordem inversa)
DROP TABLE IF EXISTS fp_convites_links;
DROP TABLE IF EXISTS fp_usuarios;
DROP TABLE IF EXISTS fp_workspaces;

-- 4. Remover usuário de desenvolvimento
DELETE FROM auth.users WHERE email = 'ricardo@dev.com';
```

---

## ✅ **CRITÉRIOS DE SUCESSO**

### **Database:**
- [x] Tabelas fp_workspaces, fp_usuarios, fp_convites_links criadas
- [x] Índices criados e funcionando
- [x] RLS habilitado em fp_convites_links
- [x] Funções auxiliares removidas (aguardando Fase 2)
- [x] Schema preparado para multiusuário

### **Auth:**
- [x] Supabase Auth configurado e funcionando
- [x] Dependências de auth instaladas
- [x] Auto-login dev implementado
- [x] Cliente auth-helpers configurado

### **Frontend:**
- [x] Dependências instaladas sem erro
- [x] Cliente Supabase Auth criado
- [x] Sistema de convites por link implementado
- [x] Tipos TypeScript definidos
- [x] Middleware básico configurado
- [x] Estrutura de pastas Auth criada

### **Validação:**
- [x] TypeScript sem erros (npx tsc --noEmit)
- [x] Build passando (npm run build)
- [x] Todas as tabelas multiuser existem no banco
- [x] Warnings críticos removidos

---

## 🎯 **VANTAGENS DESTA ABORDAGEM**

1. **Zero configuração de email** - Não depende de SMTP
2. **Compartilhamento flexível** - WhatsApp, Telegram, etc.  
3. **Fallback automático** - Código de 6 dígitos como alternativa
4. **Desenvolvimento ágil** - Auto-login evita logar sempre
5. **Segurança mantida** - Links expiram em 7 dias

---

## 🔄 **PRÓXIMA FASE**

Após completar esta fase:
→ **FASE 1: AUTH FOUNDATION AGENT**