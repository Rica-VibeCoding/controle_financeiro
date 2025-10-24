# 📨 Sistema de Convites - Documentação

**Versão:** 3.0 - Documentação de Consulta
**Última Atualização:** 24/10/2025
**Status:** ✅ 100% Funcionando em Produção

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Como Funciona](#como-funciona)
3. [Fluxo Técnico](#fluxo-técnico)
4. [Arquitetura](#arquitetura)
5. [Como Usar (API)](#como-usar-api)
6. [Troubleshooting](#troubleshooting)
7. [Referência Técnica](#referência-técnica)

---

## 🎯 Visão Geral

Sistema de convites por link que permite adicionar novos usuários a workspaces existentes.

### Características

- ✅ Links únicos com código de 6 caracteres (ex: `H02I6D`)
- ✅ Expiração configurável (padrão: 7 dias)
- ✅ Rate limiting (máx. 50 convites/dia por workspace)
- ✅ Validação automática via trigger SQL
- ✅ Auditoria completa de ações
- ✅ Integração automática ao registrar

### Onde Usar

- `/configuracoes/usuarios` - Criar convites
- `/auth/register?invite=CODIGO` - Aceitar convites
- `/juntar/[codigo]` - Rota alternativa (futura)

---

## 🔄 Como Funciona

### 1. Criação do Convite

```
Owner clica em "Convidar Usuário"
  → Sistema gera código único (6 chars)
  → Cria registro em fp_convites_links
  → Define expiração (hoje + 7 dias)
  → Retorna link: /auth/register?invite=CODIGO
```

### 2. Aceitação do Convite

```
Usuário abre link → /auth/register?invite=H02I6D
  → Sistema valida código (ativo + não expirado)
  → Mostra nome do workspace
  → Usuário preenche dados e cria conta
  → Trigger SQL adiciona ao workspace automaticamente
  → Usuário entra como 'member'
```

### 3. Registro Automático (Trigger)

Quando um usuário se registra com `invite_code` no metadata:

```sql
Trigger handle_new_user()
  → Detecta invite_code no metadata
  → Busca workspace em fp_convites_links
  → Adiciona usuário como 'member'
  → Registra auditoria
  → Retorna sucesso
```

---

## 🏗️ Fluxo Técnico

### Diagrama Simplificado

```
┌─────────────────────┐
│   Owner cria link   │
└──────────┬──────────┘
           │
           v
┌─────────────────────────────┐
│ fp_convites_links (banco)   │
│ - codigo: "H02I6D"          │
│ - workspace_id: uuid        │
│ - ativo: true               │
│ - expires_at: date          │
└──────────┬──────────────────┘
           │
           v (usuário acessa link)
┌─────────────────────────────┐
│ /auth/register?invite=...   │
│ → Valida código             │
│ → Mostra workspace          │
└──────────┬──────────────────┘
           │
           v (preenche form)
┌─────────────────────────────┐
│ supabase.auth.signUp()      │
│ metadata: {invite_code}     │
└──────────┬──────────────────┘
           │
           v (trigger automática)
┌─────────────────────────────┐
│ handle_new_user() TRIGGER   │
│ → Busca workspace           │
│ → Adiciona usuário          │
│ → Registra auditoria        │
└─────────────────────────────┘
```

---

## 📦 Arquitetura

### Arquivos Principais

```
src/
├── tipos/
│   └── convites.ts                    # 10 tipos TypeScript
├── constantes/
│   ├── convites.ts                    # Configurações
│   └── mensagens-convites.ts          # Mensagens padronizadas
├── servicos/
│   ├── supabase/
│   │   └── convites-simples.ts        # Funções principais
│   └── convites/
│       └── validador-convites.ts      # Validações
├── hooks/
│   └── usar-registro-convite.ts       # Hook React
└── app/
    ├── auth/register/page.tsx         # Página de registro
    └── (protected)/configuracoes/
        └── usuarios/page.tsx          # Gerenciar convites
```

### Banco de Dados

**Tabela: `fp_convites_links`**

```sql
CREATE TABLE fp_convites_links (
  id            uuid PRIMARY KEY,
  workspace_id  uuid REFERENCES fp_workspaces,
  codigo        text UNIQUE,           -- Ex: "H02I6D"
  criado_por    uuid REFERENCES auth.users,
  ativo         boolean DEFAULT true,
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now()
);
```

**Trigger: `handle_new_user`**

```sql
-- Roda automaticamente após auth.users INSERT
-- Busca convite e adiciona usuário ao workspace
```

---

## 💻 Como Usar (API)

### 1. Criar Convite

```typescript
import { criarLinkConvite } from '@/servicos/supabase/convites-simples'

const resultado = await criarLinkConvite()

if (resultado.success) {
  console.log('Link:', resultado.data.link)
  console.log('Código:', resultado.data.codigo)
  // Link: http://localhost:3000/auth/register?invite=H02I6D
}
```

### 2. Validar Convite

```typescript
import { usarCodigoConvite } from '@/servicos/supabase/convites-simples'

const resultado = await usarCodigoConvite('H02I6D')

if (resultado.success) {
  console.log('Workspace:', resultado.data.workspace.nome)
  console.log('Criador:', resultado.data.criadorNome)
}
```

### 3. Registrar com Convite (Hook)

```typescript
import { usarRegistroConvite } from '@/hooks/usar-registro-convite'

function RegistroPage() {
  const { loading, executarRegistro } = usarRegistroConvite()

  async function handleSubmit() {
    const resultado = await executarRegistro(
      {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'senha123',
        workspaceName: undefined  // null para convite
      },
      dadosConvite  // Dados do convite validado
    )

    if (resultado.sucesso) {
      router.push('/auth/login')
    }
  }
}
```

### 4. Deletar Convite

```typescript
import { deletarConvitePermanentemente } from '@/servicos/supabase/convites-simples'

const resultado = await deletarConvitePermanentemente('H02I6D')

if (resultado.success) {
  console.log('Convite deletado')
}
```

---

## 🔧 Troubleshooting

### Problema: Erro 500 ao registrar

**Sintoma:** `Database error saving new user`

**Causas Comuns:**

1. **Permissões faltando:**
   ```sql
   -- Verificar permissões
   SELECT grantee, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_name = 'fp_convites_links'
     AND grantee = 'supabase_auth_admin';

   -- Se vazio, aplicar:
   GRANT SELECT ON public.fp_convites_links TO supabase_auth_admin;
   GRANT SELECT, INSERT ON public.fp_usuarios TO supabase_auth_admin;
   GRANT SELECT, INSERT ON public.fp_workspaces TO supabase_auth_admin;
   ```

2. **Search path incorreto:**
   ```sql
   -- Verificar se a função tem SET search_path
   SELECT pg_get_functiondef(oid)
   FROM pg_proc
   WHERE proname = 'handle_new_user';

   -- Deve conter: SET search_path = public, pg_temp
   ```

### Problema: Convite não encontrado

**Sintoma:** "Convite inválido ou expirado"

**Verificações:**

```sql
-- 1. Verificar se existe
SELECT * FROM fp_convites_links WHERE codigo = 'H02I6D';

-- 2. Verificar status
SELECT
  codigo,
  ativo,
  expires_at,
  CASE
    WHEN NOT ativo THEN 'Desativado'
    WHEN expires_at < NOW() THEN 'Expirado'
    ELSE 'Válido'
  END as status
FROM fp_convites_links
WHERE codigo = 'H02I6D';
```

### Problema: Rate limit atingido

**Sintoma:** "Limite de convites atingido (50/dia)"

**Solução:**

```typescript
// Ajustar limite em src/constantes/convites.ts
export const CONVITES_CONFIG = {
  MAX_CONVITES_POR_DIA: 100,  // Aumentar se necessário
  // ...
}
```

### Problema: Usuário criado mas não adicionado

**Verificar audit logs:**

```sql
SELECT
  action,
  entity_type,
  metadata,
  created_at
FROM fp_audit_logs
WHERE user_id = 'uuid-do-usuario'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📚 Referência Técnica

### Constantes

**Arquivo:** `src/constantes/convites.ts`

```typescript
CONVITES_CONFIG = {
  MAX_CONVITES_POR_DIA: 50,              // Limite diário
  PERIODO_RESET_MS: 86400000,            // 24h em ms
  EXPIRACAO_DIAS: 7,                     // Dias até expirar
  TAMANHO_CODIGO: 6,                     // Caracteres do código
  CARACTERES_CODIGO: 'A-Z0-9',           // Alfanumérico
  REGEX_CODIGO: /^[A-Z0-9]{6}$/          // Validação
}
```

### Tipos TypeScript

**Arquivo:** `src/tipos/convites.ts`

```typescript
// Tipo genérico de resultado
type Resultado<T> = ResultadoSucesso<T> | ResultadoErro

// Resultado de sucesso
type ResultadoSucesso<T> = {
  success: true
  data: T
}

// Resultado de erro
type ResultadoErro = {
  success: false
  error: string
  details?: any
}

// Dados do convite validado
type DadosConvite = {
  codigo: string
  workspace: { id: string; nome: string }
  criadorNome: string
}

// Retornos específicos
type ResultadoCriacaoConvite = Resultado<{ link: string; codigo: string }>
type ResultadoValidacaoConvite = Resultado<DadosConvite>
type ResultadoAceitacaoConvite = Resultado<void>
```

### Mensagens

**Arquivo:** `src/constantes/mensagens-convites.ts`

Todas as mensagens do sistema centralizadas para:
- ✅ Consistência
- ✅ Manutenção fácil
- ✅ Preparação para i18n

### Migrations Aplicadas

1. **fix_convites_links_permissions_auth_admin**
   - Concede permissões SELECT para supabase_auth_admin

2. **fix_trigger_handle_new_user_schema_path**
   - Adiciona `SET search_path = public, pg_temp`
   - Garante acesso correto às tabelas

### Validações

**Classe:** `ValidadorCodigoConvite`

```typescript
// Validar formato
isFormatoValido(codigo: string): boolean
// Regex: /^[A-Z0-9]{6}$/

// Sanitizar
sanitizar(codigo: string): string
// Remove espaços, uppercase
```

**Classe:** `ConviteRateLimiter`

```typescript
// Verificar limite
verificarLimite(workspaceId: string): Promise<RateLimitInfo>
// Retorna: { permitido, tentativas, resetaEm }
```

---

## 📝 Histórico de Mudanças

### v3.0 (24/10/2025) - Correção em Produção
- ✅ Corrigidas permissões do supabase_auth_admin
- ✅ Adicionado search_path na trigger
- ✅ Sistema 100% funcional

### v2.0 (22/10/2025) - Refatoração Completa
- ✅ Tipos TypeScript centralizados
- ✅ Constantes e mensagens padronizadas
- ✅ Hook customizado criado
- ✅ Documentação JSDoc completa
- ✅ Código limpo e otimizado

### v1.0 (21/10/2025) - Implementação Inicial
- ✅ Sistema básico funcionando
- ✅ Trigger SQL implementada
- ✅ Validações básicas

---

## 🎓 Aprendizados

### Problemas Resolvidos

1. **Trigger não achava tabela**
   - Causa: Falta de search_path
   - Solução: `SET search_path = public, pg_temp`

2. **Erro de permissão disfarçado**
   - Erro mostrava: "relation does not exist"
   - Causa real: Falta de GRANT SELECT
   - Solução: Conceder permissões corretas

3. **Rate limiting no cliente**
   - Problema: Validação apenas no frontend
   - Solução: Mover para server-side

---

## 🔗 Links Relacionados

- [Documentação Multiusuário](./MULTIUSUARIO.md)
- [Dashboard Admin](./DASHBOARD-ADMIN.md)
- [Plano de Implementação Original](../desenvolvimento/PLANO-REFATORACAO-SISTEMA-CONVITES.md) (histórico)

---

**✅ Sistema 100% Funcional em Produção**

Para dúvidas ou problemas, consulte a seção [Troubleshooting](#troubleshooting).
