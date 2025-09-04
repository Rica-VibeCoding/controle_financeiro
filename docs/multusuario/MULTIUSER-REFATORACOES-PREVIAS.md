# 🔧 REFATORAÇÕES PRÉVIAS - ANTES DA IMPLEMENTAÇÃO

> **IMPORTANTE:** Executar ANTES de iniciar as 3 fases
> **Objetivo:** Preparar código base para receber multiusuário
> **Tempo Estimado:** 1 dia

---

## ⚠️ **POR QUE ESSAS REFATORAÇÕES?**

Descobertas da análise do código atual:
1. Cliente Supabase usa singleton sem contexto de auth
2. Queries não estão preparadas para receber workspace_id
3. Hooks de dados não têm estrutura para cache por workspace
4. Funções de serviço precisam parâmetro workspace_id

---

## 📋 **CHECKLIST DE REFATORAÇÕES**

### **1. Padronizar Assinaturas de Funções**

**ANTES:**
```typescript
// src/servicos/supabase/categorias.ts
export async function obterCategorias() {
  const { data } = await supabase
    .from('fp_categorias')
    .select('*')
  return data || []
}
```

**DEPOIS:**
```typescript
// src/servicos/supabase/categorias.ts
export async function obterCategorias(workspaceId?: string) {
  const query = supabase
    .from('fp_categorias')
    .select('*')
  
  // Por enquanto opcional, será obrigatório após Fase 2
  if (workspaceId) {
    query.eq('workspace_id', workspaceId)
  }
  
  const { data } = await query
  return data || []
}
```

### **2. Preparar Hooks para Workspace**

**Arquivos a modificar:**
```
src/hooks/
├── usar-cards-dados.ts
├── usar-cartoes-dados.ts
├── usar-categorias-dados.ts
├── usar-contas-dados.ts
├── usar-projetos-dados.ts
├── usar-tendencia-dados.ts
└── usar-transacoes.ts
```

**Padrão a aplicar:**
```typescript
// ANTES
export function useCategoriasData(periodo: Periodo) {
  return useSWR<CategoriaData[]>(
    ['dashboard-categorias', periodo.inicio, periodo.fim],
    () => obterCategoriasMetas(periodo)
  )
}

// DEPOIS (preparado para workspace)
export function useCategoriasData(periodo: Periodo, workspaceId?: string) {
  return useSWR<CategoriaData[]>(
    workspaceId 
      ? ['dashboard-categorias', workspaceId, periodo.inicio, periodo.fim]
      : ['dashboard-categorias', periodo.inicio, periodo.fim],
    () => obterCategoriasMetas(periodo, workspaceId)
  )
}
```

### **3. Adicionar Parâmetro Workspace em Todas as Queries**

**Lista de arquivos e funções a modificar:**

```typescript
// src/servicos/supabase/dashboard-queries.ts
- obterDadosCards(periodo, workspaceId?: string)
- obterProximasContas(workspaceId?: string)
- obterCategoriasMetas(periodo, workspaceId?: string)
- obterDadosCartoes(periodo, workspaceId?: string)
- obterSaldosContas(periodo, workspaceId?: string)
- obterTendenciaMensal(ano, workspaceId?: string)

// src/servicos/supabase/transacoes.ts
- obterTransacoes(filtros, workspaceId?: string)
- criarTransacao(dados, workspaceId?: string)
- atualizarTransacao(id, dados, workspaceId?: string)
- excluirTransacao(id, workspaceId?: string)

// src/servicos/supabase/categorias.ts
- obterCategorias(workspaceId?: string)
- criarCategoria(dados, workspaceId?: string)

// src/servicos/supabase/subcategorias.ts
- obterSubcategoriasPorCategoria(categoriaId, workspaceId?: string)

// src/servicos/supabase/contas.ts
- obterContas(workspaceId?: string)
- criarConta(dados, workspaceId?: string)

// src/servicos/supabase/formas-pagamento.ts
- obterFormasPagamento(workspaceId?: string)

// src/servicos/supabase/centros-custo.ts
- obterCentrosCusto(workspaceId?: string)

// src/servicos/supabase/metas-mensais.ts
- obterMetasMes(mes, ano, workspaceId?: string)
- salvarMeta(dados, workspaceId?: string)

// src/servicos/supabase/projetos-pessoais.ts
- obterProjetos(workspaceId?: string)
- criarProjeto(dados, workspaceId?: string)
```

### **4. Criar Tipo para Workspace**

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

export interface Convite {
  id: string
  workspace_id: string
  email: string
  token: string
  enviado_por: string
  aceito: boolean
  expires_at: string
  created_at: string
}
```

### **5. Preparar Contextos para Receber Workspace**

```typescript
// src/contextos/dados-auxiliares-contexto.tsx
interface DadosAuxiliaresProviderProps {
  children: ReactNode
  workspaceId?: string // Adicionar prop opcional
}

export function DadosAuxiliaresProvider({ 
  children, 
  workspaceId 
}: DadosAuxiliaresProviderProps) {
  // Modificar carregamento para usar workspaceId quando disponível
  const carregarDados = async () => {
    const [contas, categorias, formasPagamento, centrosCusto] = await Promise.all([
      obterContas(workspaceId),
      obterCategorias(workspaceId),
      obterFormasPagamento(workspaceId),
      obterCentrosCusto(workspaceId)
    ])
    // ...
  }
}
```

### **6. Criar Arquivo de Constantes**

```typescript
// src/constantes/multiuser.ts (CRIAR NOVO ARQUIVO)
export const WORKSPACE_CONFIG = {
  // Limite de usuários por workspace (futuro)
  MAX_USERS_FREE: 3,
  MAX_USERS_PRO: 10,
  MAX_USERS_ENTERPRISE: -1, // ilimitado

  // Tempo de expiração de convites
  INVITE_EXPIRY_DAYS: 7,

  // Cache keys prefixes
  CACHE_PREFIX: {
    TRANSACOES: 'transacoes',
    CATEGORIAS: 'categorias',
    CONTAS: 'contas',
    DASHBOARD: 'dashboard'
  }
}

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/esqueci-senha',
  INVITE: '/auth/convite',
  ONBOARDING: '/onboarding'
}

export const PROTECTED_ROUTES = [
  '/',
  '/transacoes',
  '/relatorios',
  '/configuracoes'
]

export const OWNER_ONLY_ROUTES = [
  '/configuracoes/usuarios',
  '/configuracoes/billing'
]
```

### **7. Preparar Package.json**

```json
// Adicionar dependências necessárias
{
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/auth-helpers-react": "^0.5.0",
    "uuid": "^10.0.0"
  }
}
```

Executar:
```bash
npm install @supabase/auth-helpers-nextjs @supabase/auth-helpers-react uuid
```

### **8. Criar Estrutura de Pastas para Auth**

```
src/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── convite/
│   │   │   └── [token]/
│   │   │       └── page.tsx
│   │   ├── esqueci-senha/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── route.ts
│   └── onboarding/
│       └── page.tsx
├── componentes/
│   └── auth/
│       ├── formulario-login.tsx
│       ├── formulario-registro.tsx
│       └── guard-auth.tsx
└── servicos/
    └── supabase/
        ├── auth-client.ts (CRIAR)
        └── convites.ts (CRIAR)
```

### **9. Atualizar .env.local**

```env
# Adicionar se não existir
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Para produção
# NEXT_PUBLIC_APP_URL=https://seudominio.com
```

### **10. Criar Migration Helper**

```typescript
// src/utilitarios/migration-helper.ts (CRIAR NOVO ARQUIVO)
/**
 * Helper para facilitar migração para multiusuário
 * Remove após conclusão da migração
 */

export function isMultiUserEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MULTI_USER === 'true'
}

export function getDefaultWorkspaceId(): string | undefined {
  // Durante migração, pode retornar um workspace padrão
  // Remover após implementação completa
  return undefined
}

// Wrapper para queries durante migração
export async function queryWithWorkspace<T>(
  queryFn: (workspaceId?: string) => Promise<T>,
  workspaceId?: string
): Promise<T> {
  if (isMultiUserEnabled() && !workspaceId) {
    console.warn('Query executada sem workspaceId em modo multiusuário')
  }
  return queryFn(workspaceId)
}
```

---

## 🧪 **VALIDAÇÃO DAS REFATORAÇÕES**

### **Teste 1: Validação TypeScript**
```bash
npx tsc --noEmit
```
✅ Sem erros de TypeScript

### **Teste 2: Build Sem Erros**
```bash
npm run build
```
✅ Deve compilar sem erros

### **Teste 2.1: Linter (Opcional)**
```bash
npm run lint
```
⚠️ Pode falhar no WSL - ignorar se necessário

### **Teste 3: Sistema Atual Funcionando**
- Acessar aplicação
- Criar transação
- Visualizar dashboard
✅ Tudo deve funcionar como antes (sem multiusuário ativo)

### **Teste 4: Parâmetros Opcionais**
```typescript
// Deve funcionar sem workspace (compatibilidade)
await obterCategorias()

// Deve aceitar workspace (preparado)
await obterCategorias('workspace-id')
```

---

## ✅ **CRITÉRIOS DE SUCESSO**

- [ ] Todas as funções de serviço aceitam workspaceId opcional
- [ ] Hooks preparados para cache com workspace
- [ ] Tipos de Auth criados
- [ ] Estrutura de pastas Auth criada
- [ ] Dependências instaladas
- [ ] Build passa sem erros
- [ ] TypeScript sem erros
- [ ] Sistema atual continua funcionando

---

## 📝 **NOTAS IMPORTANTES**

1. **NÃO QUEBRAR** funcionalidade atual
2. Parâmetros workspace são **OPCIONAIS** nesta fase
3. Após Fase 2, tornam-se **OBRIGATÓRIOS**
4. Manter **retrocompatibilidade** até migração completa
5. **Documentar** mudanças significativas

---

## 🔄 **PRÓXIMO PASSO**

Após completar refatorações:
→ Iniciar **FASE 1: AUTH FOUNDATION AGENT**