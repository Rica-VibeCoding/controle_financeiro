# 🗑️ PLANO COMPLETO: Função Deletar Usuário no Dashboard Admin

## 📋 **VISÃO GERAL**

**Objetivo:** Implementar função de hard delete de usuários no dashboard administrativo existente em `http://172.19.112.1:3003/admin/dashboard`

**Complexidade:** ALTA - Envolve múltiplas tabelas, workspaces, e diferentes cenários de deleção

**Prazo estimado:** 3-4 horas de desenvolvimento + testes

---

## 🎯 **ANÁLISE DE CENÁRIOS**

### **CENÁRIO 1: Deletar OWNER de Workspace**
**Situação:** Usuário é proprietário único do workspace
**Ação:** DELETAR TUDO relacionado ao workspace
**Impacto:** DESTRUTIVO - perda total de dados

**Dados que serão deletados:**
- ✅ Workspace inteiro
- ✅ TODAS as transações financeiras 
- ✅ TODAS as categorias personalizadas
- ✅ TODAS as contas e cartões
- ✅ TODAS as metas mensais
- ✅ TODOS os convites pendentes
- ✅ TODOS os logs de auditoria
- ✅ Usuário da autenticação (auth.users)
- ✅ Usuário do sistema (fp_usuarios)

### **CENÁRIO 2: Deletar OWNER com outros OWNERS**
**Situação:** Workspace tem múltiplos owners
**Ação:** Deletar apenas o usuário, manter workspace
**Impacto:** MODERADO - workspace continua funcionando

**Dados que serão deletados:**
- ✅ Usuário da autenticação (auth.users)
- ✅ Usuário do sistema (fp_usuarios)
- ✅ Logs de auditoria específicos do usuário
- ⚠️ Convites criados por ele (desativar ou manter?)

### **CENÁRIO 3: Deletar MEMBER (Convidado)**
**Situação:** Usuário é apenas membro convidado
**Ação:** Remover usuário, preservar workspace
**Impacto:** MÍNIMO - só remove o acesso do usuário

**Dados que serão deletados:**
- ✅ Usuário da autenticação (auth.users)
- ✅ Usuário do sistema (fp_usuarios) 
- ✅ Logs de auditoria específicos do usuário
- ⚠️ Convites criados por ele (se houver permissão)

---

## 🛡️ **MATRIZ DE RISCOS E VALIDAÇÕES**

### **VALIDAÇÕES CRÍTICAS (Impedem deleção):**
1. **Auto-deleção:** Usuário não pode deletar a si próprio
2. **Super Admin único:** Se é o único super admin, bloquear
3. **Owner único com dados:** Alertar sobre perda total de dados
4. **Usuário em sessão ativa:** Verificar se está logado em outro lugar

### **VALIDAÇÕES DE AVISO (Permitem mas alertam):**
1. **Workspace com muitos dados:** Avisar sobre volume de transações
2. **Convites pendentes:** Avisar que serão perdidos
3. **Último owner:** Avisar que workspace será deletado

### **ROLLBACK E RECUPERAÇÃO:**
- ❌ **NÃO HAVERÁ ROLLBACK** - Deleção é permanente
- ✅ **Backup preventivo:** Mostrar dados que serão perdidos
- ✅ **Confirmação dupla:** Input "DELETE" + confirmação email
- ✅ **Log de auditoria:** Registrar quem deletou o quê

---

## 🔧 **ARQUITETURA TÉCNICA**

### **FLUXO DE DADOS:**
```
Dashboard UI → Hook → Service → SQL Function → Database CASCADE
     ↓            ↓        ↓           ↓            ↓
  Confirmação → Loading → RPC Call → Validações → Hard Delete
```

### **DEPENDÊNCIAS ENTRE TABELAS:**
```
auth.users (PK)
    ↓ (CASCADE)
fp_usuarios (FK: auth.users.id)
    ↓ (SET NULL)
r_contatos (FK: fp_usuarios.id - vendedor_id, usuario_cadastro_id)
    ↓ (CASCADE)
fp_workspaces (FK: fp_usuarios.id - owner_id)
    ↓ (CASCADE para TUDO)
fp_transacoes, fp_categorias, fp_contas, fp_metas_mensais...
```

---

## 📱 **DESIGN DA INTERFACE**

### **Localização:**
- Página: `http://172.19.112.1:3003/admin/dashboard`
- Seção: Tabela "Gestão de Usuários"
- Posição: Coluna "Ações" - ao lado do botão "Ativar/Desativar"

### **Visual do Botão:**
```
[🟢 Ativar] [🔴 Deletar]  ← Owner único
[🟡 Desativar] [🔴 Deletar]  ← Member ativo
[🔴 Deletar]  ← Usuário inativo (só opção)
```

### **Modal de Confirmação - FASE 1:**
```
┌─────────────────────────────────────────────┐
│ ⚠️ CONFIRMAR DELEÇÃO PERMANENTE             │
├─────────────────────────────────────────────┤
│ Usuário: Fernando (fernando@email.com)      │
│ Workspace: Conecta                          │
│ Role: Member                                │
│                                             │
│ ⚠️ CENÁRIO DETECTADO: MEMBER                │
│ • Usuário será removido permanentemente     │
│ • Workspace "Conecta" será preservado       │
│ • Outros membros não serão afetados         │
│                                             │
│ Esta ação é IRREVERSÍVEL!                   │
│                                             │
│ [ ] Confirmo que entendo as consequências   │
│                                             │
│ [Cancelar]  [⚠️ Continuar]                  │
└─────────────────────────────────────────────┘
```

### **Modal de Confirmação - FASE 2 (Owner Único):**
```
┌─────────────────────────────────────────────┐
│ 🚨 DELEÇÃO DESTRUTIVA - CONFIRMAÇÃO FINAL   │
├─────────────────────────────────────────────┤
│ Usuário: Ricardo (ricardo@email.com)        │
│ Workspace: Minha Empresa                    │
│ Role: Owner (ÚNICO)                         │
│                                             │
│ 🚨 DADOS QUE SERÃO PERDIDOS:                │
│ • 247 transações financeiras               │
│ • 15 categorias personalizadas             │
│ • 8 contas e cartões                       │
│ • 3 metas mensais                          │
│ • Workspace inteiro será deletado          │
│                                             │
│ Digite "DELETE" para confirmar:             │
│ [________________]                          │
│                                             │
│ Digite o email do usuário:                  │
│ [________________]                          │
│                                             │
│ [❌ Cancelar] [💀 DELETAR PERMANENTEMENTE]  │
└─────────────────────────────────────────────┘
```

---

## 🗂️ **IMPLEMENTAÇÃO POR FASES**

### **FASE 0: Preparação e Validação (30 min)**
**Objetivo:** Garantir que o ambiente está pronto

**Tarefas:**
1. ✅ Validar que `admin_delete_user()` funciona
2. ✅ Testar função com usuários de teste
3. ✅ Verificar estrutura atual do dashboard admin
4. ✅ Confirmar permissões de super admin
5. ✅ Backup do banco antes dos testes

**Entregável:** Ambiente validado e seguro para desenvolvimento

---

### **FASE 1: Função SQL Inteligente (45 min)**
**Objetivo:** Criar função SQL que detecta cenários e age adequadamente

**Arquivo:** Migration SQL
**Nome da função:** `admin_hard_delete_user_smart()`

**Implementação:**
```sql
CREATE OR REPLACE FUNCTION admin_hard_delete_user_smart(usuario_id UUID)
RETURNS TABLE(
  sucesso BOOLEAN, 
  mensagem TEXT, 
  usuario_email TEXT,
  cenario TEXT,
  dados_perdidos JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
  v_workspace_id UUID;
  v_role TEXT;
  v_is_only_owner BOOLEAN;
  v_transaction_count INT;
  v_workspace_name TEXT;
BEGIN
  -- 1. VALIDAÇÕES INICIAIS
  -- 2. DETECTAR CENÁRIO (owner_unico/owner_multiplo/member)  
  -- 3. CALCULAR DADOS QUE SERÃO PERDIDOS
  -- 4. EXECUTAR DELEÇÃO ADEQUADA
  -- 5. REGISTRAR LOG DE AUDITORIA
END $$;
```

**Cenários implementados:**
- ✅ Member: Deletar apenas usuário
- ✅ Owner único: Deletar workspace inteiro  
- ✅ Owner múltiplo: Deletar só usuário
- ✅ Validações de segurança

**Testes:**
- Criar usuários de teste para cada cenário
- Executar função e validar resultados
- Verificar logs de auditoria

---

### **FASE 2: Service Layer (30 min)**
**Objetivo:** Conectar função SQL com TypeScript

**Arquivo:** `src/servicos/supabase/dashboard-admin.ts`

**Nova função:**
```typescript
/**
 * Deletar usuário permanentemente (hard delete)
 * Detecta automaticamente o cenário e age adequadamente
 */
export async function deletarUsuarioPermanente(
  usuarioId: string
): Promise<AcaoAdministrativa & { 
  cenario: string; 
  dadosPerdidos: any;
}> {
  try {
    const { data, error } = await supabase.rpc('admin_hard_delete_user_smart', {
      usuario_id: usuarioId
    });

    if (error) throw error;

    const resultado = data?.[0];
    
    // Invalidar cache após deleção
    if (resultado?.sucesso) {
      invalidarCacheDashboard();
    }
    
    return {
      sucesso: resultado?.sucesso || false,
      mensagem: resultado?.mensagem || 'Erro desconhecido',
      usuarioEmail: resultado?.usuario_email,
      cenario: resultado?.cenario,
      dadosPerdidos: resultado?.dados_perdidos
    };
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error);
    return {
      sucesso: false,
      mensagem: `Erro ao deletar usuário: ${error.message}`,
      cenario: 'erro',
      dadosPerdidos: null
    };
  }
}
```

**Testes:**
- Testar conexão com função SQL
- Validar retorno de dados
- Testar invalidação de cache

---

### **FASE 3: Hook Layer (20 min)**
**Objetivo:** Adicionar função ao hook existente

**Arquivo:** `src/hooks/usar-dashboard-admin.ts`

**Modificações:**
1. Adicionar `deletarUsuario` ao interface `UsarDashboardAdminReturn`
2. Implementar `handleDeletarUsuario` seguindo padrão existente
3. Adicionar ao return memoizado
4. Recarregar dados após deleção

**Implementação:**
```typescript
const handleDeletarUsuario = useCallback(async (usuarioId: string): Promise<AcaoAdministrativa> => {
  if (!temAcesso) {
    return { sucesso: false, mensagem: 'Acesso negado: permissão insuficiente' };
  }

  try {
    console.log(`🗑️ Deletando usuário ${usuarioId}...`);
    
    const resultado = await deletarUsuarioPermanente(usuarioId);
    
    if (resultado.sucesso) {
      console.log(`✅ Usuário deletado com sucesso (${resultado.cenario})`);
      await carregarDados(); // Recarregar lista
    }
    
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    return {
      sucesso: false,
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}, [temAcesso, carregarDados]);
```

---

### **FASE 4: Tipos TypeScript (15 min)**
**Objetivo:** Atualizar interfaces para nova funcionalidade

**Arquivo:** `src/tipos/dashboard-admin.ts`

**Modificações:**
```typescript
// Expandir AcaoAdministrativa
export interface AcaoAdministrativa {
  sucesso: boolean;
  mensagem: string;
  usuarioEmail?: string;
  // NOVOS campos para deleção
  cenario?: 'member' | 'owner_unico' | 'owner_multiplo' | 'erro';
  dadosPerdidos?: {
    transacoes: number;
    categorias: number;
    contas: number;
    metas: number;
    workspaceName: string;
  };
}

// Expandir props da tabela
export interface TabelaGestaoUsuariosProps {
  usuarios: UsuarioCompleto[];
  loading?: boolean;
  onToggleUsuario: (id: string, ativo: boolean) => Promise<AcaoAdministrativa>;
  onDeletarUsuario: (id: string) => Promise<AcaoAdministrativa>; // NOVO
}
```

---

### **FASE 5: Componente Modal (60 min)**
**Objetivo:** Criar modal especializado para confirmação de deleção

**Arquivo:** `src/componentes/dashboard-admin/modal-deletar-usuario.tsx`

**Features:**
- Modal em duas fases (pré-confirmação + confirmação final)
- Detecção automática de cenário
- Input "DELETE" para confirmação
- Input email para dupla validação
- Loading states diferenciados
- Visual específico para cada cenário

**Estrutura:**
```typescript
interface ModalDeletarUsuarioProps {
  isOpen: boolean;
  usuario: UsuarioCompleto | null;
  onConfirmar: (id: string) => Promise<AcaoAdministrativa>;
  onCancelar: () => void;
}

export function ModalDeletarUsuario({ 
  isOpen, usuario, onConfirmar, onCancelar 
}: ModalDeletarUsuarioProps) {
  const [fase, setFase] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [emailText, setEmailText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Lógica para detectar cenário
  // Renderização condicional por fase
  // Validações de input
  // Chamada da função de deleção
}
```

---

### **FASE 6: Integração na Tabela (30 min)**
**Objetivo:** Adicionar botão e modal na tabela existente

**Arquivo:** `src/componentes/dashboard-admin/tabela-gestao-usuarios.tsx`

**Modificações:**
1. Importar `ModalDeletarUsuario`
2. Adicionar estado para modal de deleção
3. Adicionar botão "Deletar" na coluna Ações
4. Implementar handlers de abertura/fechamento
5. Integrar com prop `onDeletarUsuario`

**Visual da coluna Ações:**
```tsx
// ANTES:
<button onClick={() => handleRequestToggle(usuario)}>
  {usuario.ativo ? 'Desativar' : 'Ativar'}
</button>

// DEPOIS:
<div className="flex gap-2">
  <button onClick={() => handleRequestToggle(usuario)}>
    {usuario.ativo ? 'Desativar' : 'Ativar'}
  </button>
  <button 
    onClick={() => handleRequestDelete(usuario)}
    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
  >
    Deletar
  </button>
</div>
```

---

### **FASE 7: Conexão Final (15 min)**
**Objetivo:** Conectar tudo no dashboard principal

**Arquivo:** `src/app/(protected)/admin/dashboard/page.tsx`

**Modificações:**
```typescript
const { 
  dados, loading, error, temAcesso, verificandoAcesso, recarregar,
  alterarStatusUsuario, // EXISTENTE
  deletarUsuario // NOVO
} = usarDashboardAdmin();

// Passar para DashboardPrincipal
<DashboardPrincipal
  dados={dados!}
  loading={loading}
  onRecarregar={recarregar}
  onToggleUsuario={alterarStatusUsuario} // EXISTENTE
  onDeletarUsuario={deletarUsuario} // NOVO
/>
```

**Arquivo:** `src/componentes/dashboard-admin/dashboard-principal.tsx`
- Passar props para `TabelaGestaoUsuarios`

---

## 🧪 **FASE 8: Testes e Validação (45 min)**

### **Testes Unitários:**
1. **Função SQL:**
   - ✅ Member normal → só remove usuário
   - ✅ Owner único → deleta workspace
   - ✅ Owner múltiplo → só remove usuário
   - ✅ Validações de segurança funcionam

2. **Service Layer:**
   - ✅ Conexão com função SQL
   - ✅ Tratamento de erros
   - ✅ Cache invalidation

3. **Componentes:**
   - ✅ Modal abre/fecha corretamente
   - ✅ Validações de input
   - ✅ Loading states
   - ✅ Cenários visuais diferentes

### **Testes de Integração:**
1. **Fluxo completo:** Dashboard → Botão → Modal → Confirmação → Deleção → Reload
2. **Cenários reais:** Testar com usuários Owner e Member
3. **Validações de segurança:** Tentar deletar a si próprio
4. **Performance:** Tempo de deleção e recarregamento

### **Testes de Usabilidade:**
1. **Clareza:** Usuário entende o que vai acontecer?
2. **Segurança:** É difícil fazer deleção acidental?
3. **Feedback:** Loading e mensagens são claras?

---

## 📚 **DOCUMENTAÇÃO FINAL**

### **Para o Usuário (README):**
```markdown
## Como Deletar Usuário no Dashboard Admin

1. Acesse http://172.19.112.1:3003/admin/dashboard
2. Vá na seção "Gestão de Usuários"
3. Clique no botão vermelho "Deletar" na linha do usuário
4. Confirme o cenário apresentado
5. Digite "DELETE" e o email para confirmar
6. Aguarde o processamento

⚠️ ATENÇÃO: Deleção é permanente e sem possibilidade de rollback!
```

### **Para o Desenvolvedor:**
- Documentar função SQL no código
- Adicionar comments nos componentes
- Atualizar tipos TypeScript
- Registrar decisões arquiteturais

---

## ⚡ **RESUMO DE ENTREGÁVEIS**

1. ✅ **Função SQL:** `admin_hard_delete_user_smart()`
2. ✅ **Service:** `deletarUsuarioPermanente()`
3. ✅ **Hook:** `deletarUsuario` no `usarDashboardAdmin`
4. ✅ **Modal:** `ModalDeletarUsuario` component
5. ✅ **Tabela:** Botão "Deletar" na `TabelaGestaoUsuarios`
6. ✅ **Conexão:** Props passadas pelo dashboard principal
7. ✅ **Tipos:** Interfaces atualizadas
8. ✅ **Testes:** Validação de todos os cenários

**Tempo total estimado:** 3h50min de desenvolvimento + 1h de testes = ~5 horas

**Risco:** BAIXO - Segue padrões existentes, função SQL já validada

**Prioridade:** ALTA - Feature crítica para gestão de usuários