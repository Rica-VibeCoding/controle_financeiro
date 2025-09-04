# 🔐 FASE 1: AUTH FOUNDATION AGENT

> **Objetivo:** Implementar autenticação completa com Supabase Auth
> **Complexidade:** Alta  
> **Tempo Estimado:** 2-3 dias

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **1. Setup Supabase Auth**
- [ ] Habilitar autenticação por email no Dashboard Supabase
- [ ] Configurar templates de email (confirmação, recuperação)
- [ ] Configurar URLs de redirecionamento
- [ ] Testar envio de emails

### **2. Verificar Tabelas Base (MOVIDO PARA FASE 0)**

```sql
-- ✅ VERIFICAÇÃO: Tabelas já devem existir da Fase 0
-- Executar apenas para validar
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ Existe' ELSE '❌ Faltando' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links');

-- Se alguma tabela estiver faltando, VOLTAR PARA FASE 0
```

### **3. Configurar RLS Básico (Apenas para fp_usuarios e fp_workspaces)**

```sql
-- Habilitar RLS nas tabelas base
ALTER TABLE fp_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_usuarios ENABLE ROW LEVEL SECURITY;

-- Função helper para obter workspace do usuário
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

-- Políticas para fp_usuarios
CREATE POLICY "Users can view their workspace users"
  ON fp_usuarios FOR SELECT
  USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can update their own profile"
  ON fp_usuarios FOR UPDATE
  USING (id = auth.uid());

-- Políticas para fp_workspaces  
CREATE POLICY "Users can view their workspace"
  ON fp_workspaces FOR SELECT
  USING (id = get_user_workspace_id());

CREATE POLICY "Owners can update workspace"
  ON fp_workspaces FOR UPDATE
  USING (owner_id = auth.uid());
```

### **4. Verificar Auth Hook (JÁ CRIADO NA FASE 0)**
```sql
-- ✅ VERIFICAÇÃO: Funções já devem existir da Fase 0
-- Executar apenas para validar
SELECT 
  routine_name,
  CASE WHEN routine_name IS NOT NULL THEN '✅ Existe' ELSE '❌ Faltando' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('criar_categorias_padrao', 'handle_new_user');

-- Verificar se trigger existe
SELECT 
  trigger_name,
  CASE WHEN trigger_name IS NOT NULL THEN '✅ Existe' ELSE '❌ Faltando' END as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Se algum item estiver faltando, VOLTAR PARA FASE 0
```

### **5. Cliente Supabase com Auth**
```typescript
// src/servicos/supabase/auth-client.ts
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

// Hook para obter sessão
export async function getSession() {
  const supabase = await supabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Hook para obter workspace atual
export async function getCurrentWorkspace() {
  const session = await getSession()
  if (!session) return null

  const supabase = await supabaseServer()
  const { data } = await supabase
    .from('fp_usuarios')
    .select('workspace_id, fp_workspaces(*)')
    .eq('id', session.user.id)
    .single()

  return data?.fp_workspaces
}
```

### **6. Middleware de Autenticação**
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rotas públicas
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/convite']
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Redirecionar se não autenticado
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Redirecionar se autenticado e tentando acessar rota pública
  if (session && isPublicRoute && !req.nextUrl.pathname.includes('convite')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### **7. Páginas de Autenticação**

#### **Login Page**
```typescript
// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/servicos/supabase/auth-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Erro no login: ' + error.message)
    } else {
      router.push('/')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center">
          Não tem conta? <a href="/auth/register" className="text-blue-500">Registrar</a>
        </p>
      </form>
    </div>
  )
}
```

#### **Register Page**
```typescript
// app/auth/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/servicos/supabase/auth-client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nome,
          workspace_name: workspaceName || 'Meu Workspace'
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      alert('Erro no registro: ' + error.message)
    } else {
      alert('Verifique seu email para confirmar o cadastro!')
      router.push('/auth/login')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleRegister} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Criar Conta</h1>
        
        <input
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          placeholder="Nome do workspace (ex: Família Silva)"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          className="w-full p-2 border rounded"
        />
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        
        <input
          type="password"
          placeholder="Senha (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          minLength={6}
          required
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white p-2 rounded"
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </button>

        <p className="text-center">
          Já tem conta? <a href="/auth/login" className="text-blue-500">Fazer login</a>
        </p>
      </form>
    </div>
  )
}
```

### **8. Páginas de Autenticação - Modo Dev**

**IMPORTANTE:** Durante desenvolvimento, implementar auto-login para evitar logar sempre.

#### **Página de Desenvolvimento**
```typescript
// app/auth/dev/page.tsx (CRIAR - APENAS DESENVOLVIMENTO)
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/servicos/supabase/auth-client'

export default function DevAuthPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      autoLogin()
    } else {
      router.push('/auth/login')
    }
  }, [])

  const autoLogin = async () => {
    try {
      // Verificar se já está logado
      const { data: { session } } = await supabaseClient.auth.getSession()
      
      if (!session) {
        console.log('🔧 Fazendo auto-login para desenvolvimento...')
        const { error } = await supabaseClient.auth.signInWithPassword({
          email: 'ricardo@dev.com',
          password: 'senha123'
        })

        if (error) {
          console.error('Erro no auto-login:', error)
          alert('Erro no auto-login. Verifique se o usuário de dev foi criado.')
          return
        }
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Fazendo login automático para desenvolvimento...</p>
        </div>
      </div>
    )
  }

  return null
}
```

#### **Botão de Logout para Dev**
```typescript
// src/componentes/auth/logout-dev.tsx (CRIAR)
'use client'

import { supabaseClient } from '@/servicos/supabase/auth-client'
import { useRouter } from 'next/navigation'

export function LogoutDevButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
    router.push('/auth/dev')
    router.refresh()
  }

  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return null
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
    >
      🔧 Dev Logout
    </button>
  )
}
```

### **9. Tratamento de Erros Robusto**

```typescript
// src/utilitarios/error-handler.ts (CRIAR NOVO ARQUIVO)
interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export class ErrorHandler {
  static formatError(error: any): AppError {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Erro desconhecido',
      details: error.details || null,
      timestamp: new Date()
    }
  }

  static logError(error: AppError, context: string) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Erro em ${context}`)
      console.error('Código:', error.code)
      console.error('Mensagem:', error.message)
      console.error('Detalhes:', error.details)
      console.error('Timestamp:', error.timestamp.toISOString())
      console.groupEnd()
    }
    
    // Em produção, enviar para serviço de monitoramento
    // TODO: Integrar com Sentry, LogRocket, etc.
  }

  static getUserFriendlyMessage(error: AppError): string {
    const messages: Record<string, string> = {
      'NETWORK_ERROR': 'Problema de conexão. Tente novamente.',
      'AUTH_ERROR': 'Erro de autenticação. Faça login novamente.',
      'VALIDATION_ERROR': 'Dados inválidos. Verifique os campos.',
      'PERMISSION_ERROR': 'Você não tem permissão para esta ação.',
      'NOT_FOUND': 'Registro não encontrado.',
      'DUPLICATE_ERROR': 'Este registro já existe.',
      'UNKNOWN_ERROR': 'Erro inesperado. Tente novamente.'
    }

    return messages[error.code] || messages['UNKNOWN_ERROR']
  }
}

// Hook para usar tratamento de erros
export function useErrorHandler() {
  const showError = (error: any, context: string = 'Aplicação') => {
    const appError = ErrorHandler.formatError(error)
    ErrorHandler.logError(appError, context)
    
    const userMessage = ErrorHandler.getUserFriendlyMessage(appError)
    
    // Mostrar toast/notificação para o usuário
    alert(userMessage) // Temporário - depois implementar toast
  }

  const handleAsync = async <T>(
    asyncFn: () => Promise<T>,
    context: string = 'Operação'
  ): Promise<{ data?: T; error?: AppError }> => {
    try {
      const data = await asyncFn()
      return { data }
    } catch (error) {
      const appError = ErrorHandler.formatError(error)
      ErrorHandler.logError(appError, context)
      return { error: appError }
    }
  }

  return { showError, handleAsync }
}

// Hook para toast/notifications (implementar depois)
export function useNotifications() {
  const showSuccess = (message: string) => {
    // TODO: Implementar toast success
    // Por enquanto usar alert (temporário)
    alert(`✅ ${message}`)
  }

  const showError = (message: string) => {
    // TODO: Implementar toast error  
    // Por enquanto usar alert (temporário)
    alert(`❌ ${message}`)
  }

  const showWarning = (message: string) => {
    // TODO: Implementar toast warning
    // Por enquanto usar alert (temporário) 
    alert(`⚠️ ${message}`)
  }

  return { showSuccess, showError, showWarning }
}
```

---

---

## 📋 **PRÉ-REQUISITOS DA FASE 1**

### **Validações Obrigatórias:**
```bash
# 1. Verificar se Fase 0 foi completada
echo "Verificando Fase 0..."

# 2. Confirmar tabelas existem
psql -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('fp_workspaces', 'fp_usuarios', 'fp_convites_links');"
# Deve retornar 3

# 3. Confirmar usuário dev existe
psql -c "SELECT email FROM auth.users WHERE email = 'ricardo@dev.com';"
# Deve retornar 1 linha

# 4. Confirmar dependências instaladas
npm list @supabase/auth-helpers-nextjs
```

---

## ⚠️ **PONTOS CRÍTICOS**

1. **Dependência da Fase 0**: Não prosseguir se Fase 0 não estiver completa
2. **Email Configuration**: Configurar SMTP no Supabase Dashboard
3. **URL Callbacks**: Configurar URLs corretas no Dashboard
4. **RLS Testing**: Testar políticas com diferentes usuários
5. **Session Management**: Implementar refresh automático de tokens
6. **Error Handling**: Tratar todos os cenários de erro

---

## 🛠️ **ROLLBACK PROCEDURES**

```sql
-- Em caso de erro na Fase 1:
-- 1. Remover políticas RLS
DROP POLICY IF EXISTS "Users can view their workspace users" ON fp_usuarios;
DROP POLICY IF EXISTS "Users can update their own profile" ON fp_usuarios;
DROP POLICY IF EXISTS "Users can view their workspace" ON fp_workspaces;
DROP POLICY IF EXISTS "Owners can update workspace" ON fp_workspaces;

-- 2. Desabilitar RLS (manter dados seguros)
ALTER TABLE fp_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE fp_workspaces DISABLE ROW LEVEL SECURITY;

-- 3. Remover função helper
DROP FUNCTION IF EXISTS get_user_workspace_id();
```

---

## ✅ **CRITÉRIOS DE SUCESSO**

### **Pré-requisitos:**
- [ ] Fase 0 completada com sucesso
- [ ] Todas as tabelas base existem
- [ ] Funções e triggers funcionando

### **Auth Foundation:**
- [ ] RLS básico configurado e funcionando
- [ ] Usuário consegue criar conta
- [ ] Email de confirmação é enviado
- [ ] Login/logout funcionando
- [ ] Recuperação de senha funcionando
- [ ] Workspace é criado automaticamente
- [ ] Sistema de convites funcionando

### **Frontend:**
- [ ] Páginas de auth funcionando
- [ ] Middleware de proteção ativo
- [ ] Cliente Supabase configurado
- [ ] Auto-login dev funcionando
- [ ] Tratamento de erros implementado

---

## 🔄 **PRÓXIMA FASE**

**IMPORTANTE:** Só prosseguir para Fase 2 se todos os critérios de sucesso foram atendidos.

Após completar esta fase, seguir para:
→ **FASE 2: DATABASE SCHEMA AGENT**