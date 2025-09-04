# 🎨 FASE 3: FRONTEND INTEGRATION AGENT

> **Objetivo:** Adaptar todo frontend para contexto multiusuário
> **Complexidade:** Alta  
> **Tempo Estimado:** 3-4 dias
> **Pré-requisito:** Fases 0, 1 e 2 completas

---

## 📋 **PRÉ-REQUISITOS DA FASE 3**

### **Validações Obrigatórias:**
```bash
# 1. Verificar se todas as fases anteriores foram completadas
echo "Verificando Fases 0, 1 e 2..."

# 2. Validar database schema multiusuário
psql -c "SELECT * FROM validar_migracao_multiuser() WHERE status LIKE '%INCOMPLETO%' OR status LIKE '%REQUERIDA%';"
# NÃO deve retornar nenhuma linha

# 3. Confirmar sistema de backup funcionando
npm run test:backup 2>/dev/null || echo "⚠️ Testar backup manualmente"

# 4. Validar TypeScript e Build
npx tsc --noEmit && npm run build

# 5. Verificar se refatorações prévias foram feitas
echo "Verificar se hooks usar-*-dados.ts aceitam workspaceId..."
```

**🚫 NÃO PROSSEGUIR se alguma validação falhar!**

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **1. Provider de Autenticação**

```typescript
// src/contextos/auth-contexto.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabaseClient } from '@/servicos/supabase/auth-client'

interface Workspace {
  id: string
  nome: string
  owner_id: string
  plano: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  workspace: Workspace | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar sessão inicial
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadWorkspace(session.user.id)
      }
      setLoading(false)
    })

    // Escutar mudanças de auth
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadWorkspace(session.user.id)
        } else {
          setWorkspace(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadWorkspace = async (userId: string) => {
    const { data } = await supabaseClient
      .from('fp_usuarios')
      .select('workspace_id, fp_workspaces(*)')
      .eq('id', userId)
      .single()

    if (data?.fp_workspaces) {
      setWorkspace(data.fp_workspaces as Workspace)
    }
  }

  const signOut = async () => {
    await supabaseClient.auth.signOut()
    setUser(null)
    setSession(null)
    setWorkspace(null)
  }

  const refreshSession = async () => {
    const { data: { session } } = await supabaseClient.auth.refreshSession()
    setSession(session)
    setUser(session?.user ?? null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      workspace,
      loading,
      signOut,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
```

### **2. Atualizar Layout Principal**

```typescript
// app/layout.tsx
import { AuthProvider } from '@/contextos/auth-contexto'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### **3. Atualizar TODOS os Hooks de Dados**

```typescript
// src/hooks/usar-categorias-dados.ts
import useSWR from 'swr'
import { useAuth } from '@/contextos/auth-contexto'
import { obterCategoriasMetas } from '@/servicos/supabase/dashboard-queries'
import type { CategoriaData, Periodo } from '@/tipos/dashboard'

export function useCategoriasData(periodo: Periodo) {
  const { workspace } = useAuth()
  
  return useSWR<CategoriaData[]>(
    workspace ? ['dashboard-categorias', workspace.id, periodo.inicio, periodo.fim] : null,
    () => obterCategoriasMetas(periodo, workspace!.id),
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}
```

### **4. Atualizar TODAS as Queries do Supabase**

```typescript
// src/servicos/supabase/dashboard-queries.ts
import { supabase } from './cliente'
import type { Periodo } from '@/tipos/dashboard'

export async function obterDadosCards(periodo: Periodo, workspaceId: string) {
  try {
    // Receitas do período atual
    const { data: receitasAtual } = await supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('workspace_id', workspaceId) // NOVO
      .eq('tipo', 'receita')
      .eq('status', 'realizado')
      .gte('data', periodo.inicio)
      .lte('data', periodo.fim)

    // ... resto da função
  } catch (error) {
    console.error('Erro ao obter dados dos cards:', error)
    throw error
  }
}

// Atualizar TODAS as funções para incluir workspaceId
```

### **5. Atualizar Contexto de Dados Auxiliares**

```typescript
// src/contextos/dados-auxiliares-contexto.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contextos/auth-contexto'
import { Conta, Categoria, Subcategoria, FormaPagamento, CentroCusto } from '@/tipos/database'
import { obterCategorias } from '@/servicos/supabase/categorias'
import { obterContas } from '@/servicos/supabase/contas'
import { logger } from '@/utilitarios/logger'

interface DadosAuxiliaresContextType {
  contas: Conta[]
  categorias: Categoria[]
  formasPagamento: FormaPagamento[]
  centrosCusto: CentroCusto[]
  carregando: boolean
  recarregar: () => Promise<void>
  obterSubcategorias: (categoriaId: string) => Promise<Subcategoria[]>
}

const DadosAuxiliaresContext = createContext<DadosAuxiliaresContextType | undefined>(undefined)

export function DadosAuxiliaresProvider({ children }: { children: ReactNode }) {
  const { workspace } = useAuth()
  const [dados, setDados] = useState<DadosAuxiliares>({
    contas: [],
    categorias: [],
    formasPagamento: [],
    centrosCusto: []
  })
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (workspace) {
      carregarDados()
    } else {
      // Limpar dados quando não há workspace
      setDados({
        contas: [],
        categorias: [],
        formasPagamento: [],
        centrosCusto: []
      })
      setCarregando(false)
    }
  }, [workspace?.id]) // Recarregar quando workspace mudar

  const carregarDados = async () => {
    if (!workspace) return
    
    setCarregando(true)
    try {
      const [contas, categorias, formasPagamento, centrosCusto] = await Promise.all([
        obterContas(workspace.id),
        obterCategorias(workspace.id),
        obterFormasPagamento(workspace.id),
        obterCentrosCusto(workspace.id)
      ])

      setDados({
        contas,
        categorias,
        formasPagamento,
        centrosCusto
      })
    } catch (error) {
      logger.erro('Erro ao carregar dados auxiliares', error)
    } finally {
      setCarregando(false)
    }
  }

  // ... resto do contexto
}
```

### **6. Criar Tela de Gerenciamento de Usuários**

```typescript
// app/configuracoes/usuarios/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contextos/auth-contexto'
import { supabaseClient } from '@/servicos/supabase/auth-client'
import { criarConvite } from '@/servicos/supabase/convites'

interface Usuario {
  id: string
  nome: string
  email: string
  role: string
  created_at: string
}

export default function UsuariosPage() {
  const { workspace, user } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [emailConvite, setEmailConvite] = useState('')
  const [enviandoConvite, setEnviandoConvite] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (workspace) {
      carregarUsuarios()
      verificarOwner()
    }
  }, [workspace?.id])

  const carregarUsuarios = async () => {
    if (!workspace) return

    const { data } = await supabaseClient
      .from('fp_usuarios')
      .select('id, nome, role, created_at, auth.users(email)')
      .eq('workspace_id', workspace.id)

    if (data) {
      setUsuarios(data.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.auth?.users?.email || '',
        role: u.role,
        created_at: u.created_at
      })))
    }
  }

  const verificarOwner = async () => {
    if (!workspace || !user) return
    setIsOwner(workspace.owner_id === user.id)
  }

  const handleConvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspace) return

    setEnviandoConvite(true)
    const { error } = await criarConvite(emailConvite, workspace.id)

    if (error) {
      alert('Erro ao enviar convite: ' + error.message)
    } else {
      alert('Convite enviado com sucesso!')
      setEmailConvite('')
    }
    setEnviandoConvite(false)
  }

  if (!isOwner) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
        <p>Apenas o proprietário do workspace pode gerenciar usuários.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Usuários</h1>

      {/* Formulário de Convite */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Convidar Novo Usuário</h2>
        <form onSubmit={handleConvite} className="flex gap-4">
          <input
            type="email"
            placeholder="Email do convidado"
            value={emailConvite}
            onChange={(e) => setEmailConvite(e.target.value)}
            className="flex-1 p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={enviandoConvite}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {enviandoConvite ? 'Enviando...' : 'Enviar Convite'}
          </button>
        </form>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Usuários do Workspace ({usuarios.length})
          </h2>
          <div className="space-y-4">
            {usuarios.map(usuario => (
              <div key={usuario.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">{usuario.nome}</p>
                  <p className="text-sm text-gray-500">{usuario.email}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-sm ${
                    usuario.role === 'owner' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {usuario.role === 'owner' ? 'Proprietário' : 'Membro'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Desde {new Date(usuario.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### **7. Atualizar Sidebar com Controle de Acesso**

```typescript
// src/componentes/layout/sidebar.tsx
import { useAuth } from '@/contextos/auth-contexto'

export function Sidebar() {
  const { workspace, user } = useAuth()
  const isOwner = workspace?.owner_id === user?.id

  return (
    <nav className="sidebar">
      {/* Links padrão */}
      <Link href="/">Dashboard</Link>
      <Link href="/transacoes">Transações</Link>
      <Link href="/relatorios">Relatórios</Link>
      
      {/* Configurações */}
      <div className="mt-auto">
        <Link href="/configuracoes">Configurações</Link>
        {isOwner && (
          <Link href="/configuracoes/usuarios">
            <Users className="w-4 h-4" />
            Usuários
          </Link>
        )}
        <Link href="/configuracoes/metas">Metas</Link>
        <Link href="/configuracoes/backup">Backup</Link>
      </div>

      {/* Info do Workspace */}
      <div className="p-4 border-t">
        <p className="text-xs text-gray-500">Workspace</p>
        <p className="text-sm font-medium">{workspace?.nome}</p>
      </div>
    </nav>
  )
}
```

### **8. Sistema de Cache com Workspace**

```typescript
// src/hooks/usar-invalidacao-cache.ts
import { mutate } from 'swr'
import { useAuth } from '@/contextos/auth-contexto'

export function useInvalidacaoCache() {
  const { workspace } = useAuth()

  const invalidarTransacoes = () => {
    if (!workspace) return
    // Invalidar apenas cache do workspace atual
    mutate((key: any) => 
      Array.isArray(key) && 
      key[0]?.includes('transacoes') && 
      key[1] === workspace.id
    )
  }

  const invalidarCategorias = () => {
    if (!workspace) return
    mutate((key: any) => 
      Array.isArray(key) && 
      key[0]?.includes('categorias') && 
      key[1] === workspace.id
    )
  }

  const invalidarTudo = () => {
    if (!workspace) return
    // Invalidar todo cache do workspace
    mutate((key: any) => 
      Array.isArray(key) && 
      key.includes(workspace.id)
    )
  }

  return {
    invalidarTransacoes,
    invalidarCategorias,
    invalidarTudo
  }
}
```

### **9. Página de Onboarding**

```typescript
// app/onboarding/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contextos/auth-contexto'

export default function OnboardingPage() {
  const { workspace } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [nomeWorkspace, setNomeWorkspace] = useState(workspace?.nome || '')

  const handleComplete = async () => {
    // Atualizar nome do workspace se mudou
    if (nomeWorkspace !== workspace?.nome) {
      await supabaseClient
        .from('fp_workspaces')
        .update({ nome: nomeWorkspace })
        .eq('id', workspace?.id)
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-2xl p-8">
        <h1 className="text-3xl font-bold mb-8">
          Bem-vindo ao Sistema Financeiro!
        </h1>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl">Vamos configurar seu workspace</h2>
            <input
              type="text"
              placeholder="Nome do workspace (ex: Família Silva)"
              value={nomeWorkspace}
              onChange={(e) => setNomeWorkspace(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
            <button
              onClick={() => setStep(2)}
              className="w-full bg-blue-500 text-white p-3 rounded-lg"
            >
              Próximo
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl">Seu workspace está pronto!</h2>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">O que você pode fazer:</h3>
              <ul className="space-y-2 text-sm">
                <li>✅ Adicionar transações e categorias</li>
                <li>✅ Convidar familiares ou sócios</li>
                <li>✅ Visualizar relatórios e gráficos</li>
                <li>✅ Definir metas mensais</li>
              </ul>
            </div>
            <button
              onClick={handleComplete}
              className="w-full bg-green-500 text-white p-3 rounded-lg"
            >
              Começar a Usar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

### **10. Proteção de Rotas**

```typescript
// app/(protected)/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contextos/auth-contexto'
import { Sidebar } from '@/componentes/layout/sidebar'

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { user, loading, workspace } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!user || !workspace) {
    return null
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
```

---

## 🛠️ **ROLLBACK PROCEDURES**

```bash
# Em caso de erro crítico na Fase 3:

# 1. Remover AuthProvider do layout
# Reverter app/layout.tsx para versão anterior
git checkout HEAD~1 -- app/layout.tsx

# 2. Remover contextos criados
rm -f src/contextos/auth-contexto.tsx

# 3. Reverter hooks para versão single-user
git checkout HEAD~1 -- "src/hooks/usar-*-dados.ts"

# 4. Reverter queries do Supabase
git checkout HEAD~1 -- "src/servicos/supabase/dashboard-queries.ts"

# 5. Remover páginas de auth criadas
rm -rf src/app/auth/
rm -rf src/app/configuracoes/usuarios/
rm -rf src/app/onboarding/

# 6. Rebuild para validar
npm run build
```

---

## ⚠️ **PONTOS CRÍTICOS**

### **1. Dependências das Fases Anteriores**
- 🚫 **NÃO PROSSEGUIR** se Fases 0, 1 e 2 não estiverem completas
- Database schema deve ter todas as tabelas com workspace_id
- RLS deve estar funcionando corretamente
- Sistema de backup deve estar atualizado

### **2. Cache Management**
- SEMPRE incluir workspace_id nas chaves SWR
- Invalidar cache específico do workspace
- Limpar cache ao trocar workspace/logout

### **3. Context Updates**
- AuthContext deve ser o provider mais externo
- Todos os hooks devem verificar workspace antes de fazer queries
- Tratar loading states apropriadamente

### **4. Error Handling**
- Tratar casos onde workspace é null
- Mostrar mensagens de erro claras
- Implementar retry logic para falhas temporárias

### **5. Performance**
- Usar React.memo para componentes pesados
- Implementar lazy loading onde apropriado
- Otimizar re-renders desnecessários

---

## 🧪 **TESTES DE VALIDAÇÃO**

### **Teste 1: Validação de Pré-requisitos**
```bash
# Verificar se fases anteriores estão completas
psql -c "SELECT * FROM validar_migracao_multiuser();"
# Deve retornar apenas status ✅

# Verificar RLS funcionando
psql -c "SELECT COUNT(*) FROM fp_transacoes WHERE workspace_id IS NULL;"
# Deve retornar 0
```

### **Teste 2: Login e Workspace**
1. Criar nova conta
2. Verificar se workspace foi criado
3. Verificar categorias padrão

### **Teste 3: Sistema de Convites**
1. Owner envia convite
2. Novo usuário aceita
3. Ambos veem mesmos dados

### **Teste 4: Isolamento de Cache**
1. Login com Usuário A
2. Adicionar transação
3. Login com Usuário B (outro workspace)
4. Não deve ver transação do Usuário A

### **Teste 5: Controle de Acesso**
1. Member não vê "Usuários" na sidebar
2. Owner vê e acessa "Usuários"
3. Testar todas as rotas protegidas

---

## ✅ **CRITÉRIOS DE SUCESSO**

### **Pré-requisitos:**
- [ ] Fases 0, 1 e 2 validadas e funcionando
- [ ] Database schema multiusuário completo
- [ ] RLS testado e funcionando
- [ ] Sistema backup/restore atualizado
- [ ] Refatorações prévias completadas

### **Auth e Contextos:**
- [ ] AuthProvider funcionando e disponível
- [ ] AuthContext retornando user, workspace, session
- [ ] Middleware de autenticação funcionando
- [ ] Rotas protegidas funcionando

### **Frontend Integration:**
- [ ] Todos os hooks usando workspace_id
- [ ] Todas as queries filtradas por workspace
- [ ] Cache isolado por workspace
- [ ] DadosAuxiliaresContext adaptado
- [ ] Loading states implementados

### **Funcionalidades Multiusuário:**
- [ ] Tela de usuários funcionando (apenas owners)
- [ ] Sistema de convites completo
- [ ] Onboarding para novos usuários
- [ ] Sidebar com controle de acesso
- [ ] Isolamento de dados testado

### **Validação Final:**
- [ ] TypeScript sem erros (npx tsc --noEmit)
- [ ] Build passando (npm run build)
- [ ] Teste com 2+ usuários em workspaces diferentes
- [ ] Performance mantida (< 2s carregamento inicial)

---

## 🎉 **CONCLUSÃO DA IMPLEMENTAÇÃO**

**IMPORTANTE:** Só considerar sistema completo se TODOS os critérios de sucesso foram atendidos.

### **Lista de Verificação Final:**
```bash
# 1. Validação técnica
npx tsc --noEmit  # Sem erros TypeScript
npm run build     # Build bem-sucedido

# 2. Teste funcional básico
# - Criar 2 contas diferentes
# - Verificar isolamento de dados
# - Testar sistema de convites
# - Validar permissões (owner vs member)

# 3. Performance
# - Carregamento inicial < 2s
# - Queries principais < 100ms
# - Cache funcionando corretamente
```

### **Após Conclusão:**
1. 🗺️ **Documentar** problemas encontrados e soluções
2. 📊 **Criar métricas** de monitoramento
3. 🚀 **Deploy** em ambiente de produção
4. 📈 **Monitorar** por 1-2 semanas
5. 🔍 **Coletar feedback** de usuários reais
6. 🛠️ **Implementar melhorias** baseadas no uso real

**Parabéns!** 🎉 Sistema multiusuário completamente implementado.