# 📊 PLANO DE IMPLEMENTAÇÃO - DASHBOARD SUPER ADMIN

> **Documento de Implementação Completa**  
> Sistema de Dashboard Administrativo para Controle Geral da Plataforma

---

## 🎯 VISÃO GERAL

### **Objetivo**
Criar um dashboard executivo para super administrador, permitindo visão completa do sistema em uma única tela, com métricas de crescimento, usuários e workspaces.

### **Escopo (ATUALIZADO - Focado em Gestão)**
- **Dashboard de gestão** com controles de ativação/desativação
- **Tabelas completas** de usuários e workspaces
- **Controles administrativos** - ativar/desativar usuários
- **Interface compacta** - remover elementos decorativos
- **Foco em ação** - menos visualização, mais controle
- Acesso exclusivo para super admin
- Zero configuração - tudo funcional e prático

### **Resultado Final (REDESIGNADO)**
Página `/admin/dashboard` focada em **GESTÃO ADMINISTRATIVA**:
- ✅ **4 KPIs** principais compactos
- ✅ **Gráfico de crescimento** reduzido (altura menor)
- ✅ **Tabela COMPLETA de usuários** - TODOS os usuários do sistema
- ✅ **Tabela COMPLETA de workspaces** - TODOS os workspaces com status
- ✅ **Controles de ação** - botões para ativar/desativar usuários
- ❌ **Removido:** Footer informativo extenso, indicadores de saúde decorativos
- ❌ **Removido:** Tabela "usuários recentes" (substituída por tabela completa)

---

## 🗂️ ESTRUTURA DE FASES (NOVO PLANO)

### **FASE 1: Infraestrutura - Dados Completos** (2-3 horas)
- ✅ **Queries SQL atuais** (já funcionando)
- 🆕 **Query TODOS os usuários** com controles
- 🆕 **Query TODOS os workspaces** com métricas
- 🆕 **Functions para ativar/desativar** usuários
- Estrutura de dados TypeScript expandida

### **FASE 2: Componentes de Gestão** (3-4 horas)  
- ✅ **Cards KPI** (mantém atual, mas compactos)
- ✅ **Gráfico crescimento** (reduz altura para 200px)
- 🆕 **Tabela Gestão Usuários** - COMPLETA com ações
- 🆕 **Tabela Gestão Workspaces** - COMPLETA com status
- ❌ **Remove:** Indicadores saúde, footer informativo

### **FASE 3: Layout Compacto** (1-2 horas)
- 🆕 **Layout otimizado** - mais conteúdo, menos espaço perdido
- **Row 1:** 4 KPIs compactos
- **Row 2:** Gráfico reduzido (altura 200px)
- **Row 3:** Tabela Usuários COMPLETA
- **Row 4:** Tabela Workspaces COMPLETA

### **FASE 4: Funcionalidades Administrativas** (2-3 horas)
- 🆕 **Botões ação** - Ativar/Desativar usuário
- 🆕 **Filtros e busca** nas tabelas
- 🆕 **Confirmações** para ações críticas
- **Performance otimizada** para tabelas grandes

---

## 📋 FASE 1: INFRAESTRUTURA - DADOS COMPLETOS

### **1.1 - Queries SQL Expandidas** ⏱️ 60min

#### **MANTER:** Queries KPI atuais (já funcionando)
```sql
-- ✅ get_usuario_stats() - já implementada
-- ✅ get_workspace_stats() - já implementada  
-- ✅ get_volume_stats() - já implementada
-- ✅ get_crescimento_historico() - já implementada
```

#### **ADICIONAR:** Queries para gestão completa

#### **Arquivo:** `sql/dashboard-admin-gestao.sql`
```sql
-- NOVA QUERY 1: TODOS OS USUÁRIOS COM DADOS DE GESTÃO
CREATE OR REPLACE FUNCTION get_todos_usuarios()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  workspace_nome TEXT,
  workspace_id UUID,
  ativo BOOLEAN,
  super_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  total_transacoes BIGINT,
  ultima_transacao TIMESTAMPTZ,
  atividade_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH usuario_transacoes AS (
    SELECT 
      t.workspace_id,
      COUNT(*) as total,
      MAX(t.created_at) as ultima
    FROM fp_transacoes t
    GROUP BY t.workspace_id
  )
  SELECT 
    u.id,
    COALESCE(u.nome, 'Sem nome') as nome,
    u.email,
    w.nome as workspace_nome,
    u.workspace_id,
    u.ativo,
    COALESCE(u.super_admin, false) as super_admin,
    u.created_at,
    u.last_activity,
    COALESCE(ut.total, 0) as total_transacoes,
    ut.ultima as ultima_transacao,
    CASE 
      WHEN u.last_activity >= CURRENT_DATE - INTERVAL '7 days' THEN 'muito_ativo'
      WHEN u.last_activity >= CURRENT_DATE - INTERVAL '30 days' THEN 'ativo'
      WHEN u.last_activity >= CURRENT_DATE - INTERVAL '90 days' THEN 'inativo'
      ELSE 'muito_inativo'
    END as atividade_status
  FROM fp_usuarios u
  LEFT JOIN fp_workspaces w ON w.id = u.workspace_id
  LEFT JOIN usuario_transacoes ut ON ut.workspace_id = u.workspace_id
  ORDER BY u.created_at DESC;
END;
$$;

-- NOVA QUERY 2: TODOS OS WORKSPACES COM MÉTRICAS COMPLETAS  
CREATE OR REPLACE FUNCTION get_todos_workspaces()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  owner_email TEXT,
  plano TEXT,
  ativo BOOLEAN,
  total_usuarios BIGINT,
  usuarios_ativos BIGINT,
  total_transacoes BIGINT,
  volume_total NUMERIC,
  created_at TIMESTAMPTZ,
  ultima_atividade TIMESTAMPTZ,
  status_workspace TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH workspace_stats AS (
    SELECT 
      w.id,
      w.nome,
      owner_u.email as owner_email,
      w.plano,
      w.ativo,
      w.created_at,
      COUNT(DISTINCT u.id) as total_usuarios,
      COUNT(DISTINCT CASE WHEN u.last_activity >= CURRENT_DATE - INTERVAL '30 days' THEN u.id END) as usuarios_ativos,
      COUNT(DISTINCT t.id) as total_transacoes,
      COALESCE(SUM(t.valor), 0) as volume_total,
      MAX(GREATEST(
        COALESCE(u.last_activity, w.created_at),
        COALESCE(t.created_at, w.created_at)
      )) as ultima_atividade
    FROM fp_workspaces w
    LEFT JOIN fp_usuarios owner_u ON owner_u.id = w.owner_id
    LEFT JOIN fp_usuarios u ON u.workspace_id = w.id
    LEFT JOIN fp_transacoes t ON t.workspace_id = w.id
    GROUP BY w.id, w.nome, owner_u.email, w.plano, w.ativo, w.created_at
  )
  SELECT 
    ws.id,
    ws.nome,
    ws.owner_email,
    ws.plano,
    ws.ativo,
    ws.total_usuarios,
    ws.usuarios_ativos,
    ws.total_transacoes,
    ws.volume_total,
    ws.created_at,
    ws.ultima_atividade,
    CASE 
      WHEN ws.ultima_atividade >= CURRENT_DATE - INTERVAL '1 day' THEN 'muito_ativo'
      WHEN ws.ultima_atividade >= CURRENT_DATE - INTERVAL '7 days' THEN 'ativo' 
      WHEN ws.ultima_atividade >= CURRENT_DATE - INTERVAL '30 days' THEN 'moderado'
      ELSE 'inativo'
    END as status_workspace
  FROM workspace_stats ws
  ORDER BY ws.ultima_atividade DESC, ws.total_transacoes DESC;
END;
$$;

-- NOVA QUERY 3: FUNÇÃO PARA ATIVAR/DESATIVAR USUÁRIO
CREATE OR REPLACE FUNCTION admin_toggle_usuario(
  usuario_id UUID,
  novo_status BOOLEAN
)
RETURNS TABLE (
  sucesso BOOLEAN,
  mensagem TEXT,
  usuario_email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Verificar se usuário existe
  SELECT email INTO user_email 
  FROM fp_usuarios 
  WHERE id = usuario_id;
  
  IF user_email IS NULL THEN
    RETURN QUERY SELECT false, 'Usuário não encontrado', ''::TEXT;
    RETURN;
  END IF;
  
  -- Atualizar status
  UPDATE fp_usuarios 
  SET 
    ativo = novo_status,
    updated_at = NOW()
  WHERE id = usuario_id;
  
  -- Registrar log de auditoria
  INSERT INTO fp_audit_logs (
    action, 
    table_name, 
    record_id, 
    details
  ) VALUES (
    CASE WHEN novo_status THEN 'ativou_usuario' ELSE 'desativou_usuario' END,
    'fp_usuarios',
    usuario_id,
    jsonb_build_object('email', user_email, 'novo_status', novo_status)
  );
  
  RETURN QUERY SELECT 
    true, 
    CASE WHEN novo_status THEN 'Usuário ativado com sucesso' ELSE 'Usuário desativado com sucesso' END,
    user_email;
END;
$$;
```

#### **✅ Validação Fase 1.1:**
- [ ] Novas functions SQL criadas e testadas
- [ ] Query get_todos_usuarios() retorna todos os usuários
- [ ] Query get_todos_workspaces() retorna dados completos
- [ ] Function admin_toggle_usuario() funciona corretamente
- [ ] Logs de auditoria registrados

---

### **1.2 - Tipos TypeScript Expandidos** ⏱️ 30min

#### **Arquivo:** `src/tipos/dashboard-admin.ts` (ATUALIZAR)
```typescript
// Tipos para dashboard administrativo focado em gestão

// ✅ MANTER tipos KPI atuais
export interface KPIMetricas {
  totalUsuarios: number;
  usuariosAtivos: number;
  crescimentoPercentual: number;
  totalWorkspaces: number;
  workspacesComTransacoes: number;
  totalReceitas: number;
  totalDespesas: number;
  totalTransacoes: number;
  volumeMes: number;
  transacoesMes: number;
}

export interface DadosCrescimento {
  mesNome: string;
  mesNumero: number;
  usuarios: number;
  workspaces: number;
  volume: number;
}

// 🆕 NOVOS tipos para gestão completa
export interface UsuarioCompleto {
  id: string;
  nome: string;
  email: string;
  workspaceNome: string;
  workspaceId: string;
  ativo: boolean;
  superAdmin: boolean;
  createdAt: string;
  lastActivity: string;
  totalTransacoes: number;
  ultimaTransacao: string;
  atividadeStatus: 'muito_ativo' | 'ativo' | 'inativo' | 'muito_inativo';
}

export interface WorkspaceCompleto {
  id: string;
  nome: string;
  ownerEmail: string;
  plano: 'free' | 'pro' | 'enterprise';
  ativo: boolean;
  totalUsuarios: number;
  usuariosAtivos: number;
  totalTransacoes: number;
  volumeTotal: number;
  createdAt: string;
  ultimaAtividade: string;
  statusWorkspace: 'muito_ativo' | 'ativo' | 'moderado' | 'inativo';
}

// 🆕 Interface para ações administrativas
export interface AcaoAdministrativa {
  sucesso: boolean;
  mensagem: string;
  usuarioEmail?: string;
}

// 🆕 Interface principal atualizada
export interface DashboardAdminDados {
  kpis: KPIMetricas;
  crescimento: DadosCrescimento[];
  usuariosCompletos: UsuarioCompleto[];    // ← NOVO
  workspacesCompletos: WorkspaceCompleto[]; // ← NOVO
  // ❌ Removidos: usuariosRecentes, workspacesAtivos, statusSistema
}

export interface DashboardAdminResponse {
  sucesso: boolean;
  dados?: DashboardAdminDados;
  erro?: string;
  timestamp: string;
}
```

#### **✅ Validação Fase 1.2:**
- [ ] Novos tipos TypeScript definidos e funcionais
- [ ] Interface UsuarioCompleto cobre todos os campos
- [ ] Interface WorkspaceCompleto com métricas necessárias
- [ ] Interface DashboardAdminDados atualizada

---

## 📋 FASE 2: COMPONENTES DE GESTÃO

### **2.1 - Tabela Gestão Usuários COMPLETA** ⏱️ 90min

#### **Arquivo:** `src/componentes/dashboard-admin/tabela-gestao-usuarios.tsx`
```typescript
'use client'

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Icone } from '@/componentes/ui/icone';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import type { UsuarioCompleto, AcaoAdministrativa } from '@/tipos/dashboard-admin';

interface TabelaGestaoUsuariosProps {
  usuarios: UsuarioCompleto[];
  loading?: boolean;
  onToggleUsuario: (id: string, ativo: boolean) => Promise<AcaoAdministrativa>;
}

/**
 * Tabela COMPLETA para gestão de usuários
 * Inclui filtros, busca, paginação e controles administrativos
 */
export function TabelaGestaoUsuarios({ usuarios, loading = false, onToggleUsuario }: TabelaGestaoUsuariosProps) {
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [busca, setBusca] = useState('');
  const [processando, setProcessando] = useState<string | null>(null);

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter(usuario => {
    // Filtro por status
    if (filtro === 'ativos' && !usuario.ativo) return false;
    if (filtro === 'inativos' && usuario.ativo) return false;
    
    // Filtro por busca
    if (busca) {
      const buscaLower = busca.toLowerCase();
      return (
        usuario.nome.toLowerCase().includes(buscaLower) ||
        usuario.email.toLowerCase().includes(buscaLower) ||
        usuario.workspaceNome.toLowerCase().includes(buscaLower)
      );
    }
    
    return true;
  });

  const handleToggleUsuario = async (id: string, ativo: boolean) => {
    setProcessando(id);
    try {
      const resultado = await onToggleUsuario(id, !ativo);
      if (!resultado.sucesso) {
        alert(`Erro: ${resultado.mensagem}`);
      }
    } catch (error) {
      alert('Erro ao alterar status do usuário');
    } finally {
      setProcessando(null);
    }
  };

  const obterCorStatus = (status: UsuarioCompleto['atividadeStatus']) => {
    switch (status) {
      case 'muito_ativo': return 'text-green-700 bg-green-100';
      case 'ativo': return 'text-blue-700 bg-blue-100';
      case 'inativo': return 'text-orange-700 bg-orange-100';
      default: return 'text-red-700 bg-red-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header com controles */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">👥 Gestão de Usuários</h3>
            <p className="text-sm text-gray-600 mt-1">
              {usuariosFiltrados.length} de {usuarios.length} usuários
            </p>
          </div>
        </div>

        {/* Filtros e busca */}
        <div className="flex items-center space-x-4">
          {/* Busca */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Buscar por nome, email ou workspace..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filtro por status */}
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="todos">Todos</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Usuário</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Workspace</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Atividade</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Transações</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Cadastro</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                {/* Status */}
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${usuario.ativo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${obterCorStatus(usuario.atividadeStatus)}`}>
                      {usuario.atividadeStatus.replace('_', ' ')}
                    </span>
                  </div>
                </td>

                {/* Usuário */}
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center space-x-2">
                      <span>{usuario.nome}</span>
                      {usuario.superAdmin && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Super Admin
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{usuario.email}</div>
                  </div>
                </td>

                {/* Workspace */}
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-700">{usuario.workspaceNome}</div>
                </td>

                {/* Atividade */}
                <td className="py-4 px-4">
                  <div className="text-sm">
                    {usuario.lastActivity ? (
                      <span className="text-gray-600">
                        {formatDistanceToNow(new Date(usuario.lastActivity), { addSuffix: true, locale: ptBR })}
                      </span>
                    ) : (
                      <span className="text-gray-400">Nunca</span>
                    )}
                  </div>
                </td>

                {/* Transações */}
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-700">
                    {usuario.totalTransacoes.toLocaleString('pt-BR')}
                  </div>
                </td>

                {/* Cadastro */}
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(usuario.createdAt), { addSuffix: true, locale: ptBR })}
                  </div>
                </td>

                {/* Ações */}
                <td className="py-4 px-4">
                  <Button
                    size="sm"
                    variant={usuario.ativo ? "outline" : "default"}
                    onClick={() => handleToggleUsuario(usuario.id, usuario.ativo)}
                    disabled={processando === usuario.id || usuario.superAdmin}
                    className="flex items-center space-x-2"
                  >
                    {processando === usuario.id ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    ) : (
                      <Icone name={usuario.ativo ? 'user-x' : 'user-check'} className="w-4 h-4" />
                    )}
                    <span>{usuario.ativo ? 'Desativar' : 'Ativar'}</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500">
          Super admins não podem ser desativados. Use filtros e busca para encontrar usuários específicos.
        </p>
      </div>
    </div>
  );
}
```

### **2.2 - Tabela Gestão Workspaces COMPLETA** ⏱️ 60min

#### **Arquivo:** `src/componentes/dashboard-admin/tabela-gestao-workspaces.tsx`
crescimento_usuarios AS (
  SELECT 
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as este_mes,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' 
               AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as mes_anterior
  FROM fp_usuarios 
  WHERE ativo = true
)
SELECT 
  us.total_usuarios,
  us.usuarios_ativos,
  cu.este_mes,
  ROUND(
    CASE 
      WHEN cu.mes_anterior = 0 THEN 100 
      ELSE ((cu.este_mes::float / cu.mes_anterior::float) - 1) * 100 
    END, 1
  ) as crescimento_percentual
FROM usuarios_stats us, crescimento_usuarios cu;

-- Query 2: Workspaces ativos
SELECT 
  COUNT(*) as total_workspaces,
  COUNT(CASE WHEN w.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as workspaces_mes,
  COUNT(DISTINCT t.workspace_id) as workspaces_com_transacoes
FROM fp_workspaces w
LEFT JOIN fp_transacoes t ON t.workspace_id = w.id 
  AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
WHERE w.ativo = true;

-- Query 3: Volume financeiro
WITH volume_stats AS (
  SELECT 
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as total_despesas,
    COUNT(*) as total_transacoes
  FROM fp_transacoes
),
volume_mensal AS (
  SELECT 
    SUM(valor) as volume_mes,
    COUNT(*) as transacoes_mes
  FROM fp_transacoes 
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT 
  vs.total_receitas,
  vs.total_despesas,
  vs.total_transacoes,
  vm.volume_mes,
  vm.transacoes_mes
FROM volume_stats vs, volume_mensal vm;

-- DADOS HISTÓRICOS (6 meses)
-- Query 4: Crescimento temporal
WITH meses AS (
  SELECT generate_series(
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
    DATE_TRUNC('month', CURRENT_DATE),
    INTERVAL '1 month'
  ) as mes
),
usuarios_por_mes AS (
  SELECT 
    DATE_TRUNC('month', created_at) as mes,
    COUNT(*) as usuarios
  FROM fp_usuarios 
  WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
  GROUP BY DATE_TRUNC('month', created_at)
),
workspaces_por_mes AS (
  SELECT 
    DATE_TRUNC('month', created_at) as mes,
    COUNT(*) as workspaces
  FROM fp_workspaces
  WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
  GROUP BY DATE_TRUNC('month', created_at)
),
volume_por_mes AS (
  SELECT 
    DATE_TRUNC('month', created_at) as mes,
    SUM(valor) as volume
  FROM fp_transacoes
  WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
  GROUP BY DATE_TRUNC('month', created_at)
)
SELECT 
  TO_CHAR(m.mes, 'Mon') as mes_nome,
  EXTRACT(MONTH FROM m.mes) as mes_numero,
  COALESCE(u.usuarios, 0) as usuarios,
  COALESCE(w.workspaces, 0) as workspaces,
  COALESCE(v.volume, 0) as volume
FROM meses m
LEFT JOIN usuarios_por_mes u ON m.mes = u.mes
LEFT JOIN workspaces_por_mes w ON m.mes = w.mes  
LEFT JOIN volume_por_mes v ON m.mes = v.mes
ORDER BY m.mes;

-- LISTAS INFORMATIVAS
-- Query 5: Usuários recentes (7 dias)
SELECT 
  u.nome,
  u.email,
  w.nome as workspace_nome,
  u.created_at,
  u.last_activity
FROM fp_usuarios u
JOIN fp_workspaces w ON w.id = u.workspace_id
WHERE u.created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND u.ativo = true
ORDER BY u.created_at DESC
LIMIT 5;

-- Query 6: Workspaces mais ativos
WITH workspace_activity AS (
  SELECT 
    w.id,
    w.nome,
    COUNT(DISTINCT u.id) as total_usuarios,
    COUNT(DISTINCT t.id) as transacoes_mes,
    MAX(GREATEST(
      COALESCE(u.last_activity, w.created_at),
      COALESCE(t.created_at, w.created_at)
    )) as ultima_atividade
  FROM fp_workspaces w
  LEFT JOIN fp_usuarios u ON u.workspace_id = w.id AND u.ativo = true
  LEFT JOIN fp_transacoes t ON t.workspace_id = w.id 
    AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
  WHERE w.ativo = true
  GROUP BY w.id, w.nome
)
SELECT 
  nome,
  total_usuarios,
  transacoes_mes,
  ultima_atividade,
  CASE 
    WHEN ultima_atividade >= CURRENT_DATE - INTERVAL '1 day' THEN 'hoje'
    WHEN ultima_atividade >= CURRENT_DATE - INTERVAL '7 days' THEN 'esta semana'
    WHEN ultima_atividade >= CURRENT_DATE - INTERVAL '30 days' THEN 'este mês'
    ELSE 'mais de 30 dias'
  END as atividade_relativa
FROM workspace_activity
ORDER BY ultima_atividade DESC, transacoes_mes DESC
LIMIT 5;
```

#### **✅ Validação Fase 1.1:**
```sql
-- Testar todas as queries individualmente
-- Verificar se retornam dados coerentes
-- Confirmar performance (< 500ms cada)
```

---

### **1.2 - Tipos TypeScript** ⏱️ 20min

#### **Arquivo:** `src/tipos/dashboard-admin.ts`
```typescript
// Tipos para dashboard administrativo

export interface KPIMetricas {
  totalUsuarios: number;
  usuariosAtivos: number;
  crescimentoPercentual: number;
  totalWorkspaces: number;
  workspacesComTransacoes: number;
  totalReceitas: number;
  totalDespesas: number;
  totalTransacoes: number;
  volumeMes: number;
  transacoesMes: number;
}

export interface DadosCrescimento {
  mesNome: string;
  mesNumero: number;
  usuarios: number;
  workspaces: number;
  volume: number;
}

export interface UsuarioRecente {
  nome: string;
  email: string;
  workspaceNome: string;
  createdAt: string;
  lastActivity: string;
}

export interface WorkspaceAtivo {
  nome: string;
  totalUsuarios: number;
  transacoesMes: number;
  ultimaAtividade: string;
  atividadeRelativa: 'hoje' | 'esta semana' | 'este mês' | 'mais de 30 dias';
}

export interface DashboardAdminDados {
  kpis: KPIMetricas;
  crescimento: DadosCrescimento[];
  usuariosRecentes: UsuarioRecente[];
  workspacesAtivos: WorkspaceAtivo[];
  statusSistema: {
    online: boolean;
    ultimoBackup: string;
    uptime: string;
  };
}

export interface DashboardAdminResponse {
  sucesso: boolean;
  dados?: DashboardAdminDados;
  erro?: string;
  timestamp: string;
}
```

#### **✅ Validação Fase 1.2:**
- [ ] Tipos compilam sem erro TypeScript
- [ ] Interfaces cobrem todos os dados das queries

---

### **1.3 - Serviços Backend** ⏱️ 45min

#### **Arquivo:** `src/servicos/supabase/dashboard-admin.ts`
```typescript
import { createClient } from './auth-client';
import type { 
  DashboardAdminDados, 
  KPIMetricas,
  DadosCrescimento,
  UsuarioRecente,
  WorkspaceAtivo 
} from '@/tipos/dashboard-admin';

const supabase = createClient();

/**
 * Busca métricas principais (KPIs) do sistema
 */
export async function buscarKPIMetricas(): Promise<KPIMetricas> {
  try {
    // Query 1: Usuários e crescimento
    const { data: usuarioStats, error: usuarioError } = await supabase.rpc('get_usuario_stats');
    if (usuarioError) throw usuarioError;

    // Query 2: Workspaces
    const { data: workspaceStats, error: workspaceError } = await supabase.rpc('get_workspace_stats');  
    if (workspaceError) throw workspaceError;

    // Query 3: Volume financeiro
    const { data: volumeStats, error: volumeError } = await supabase.rpc('get_volume_stats');
    if (volumeError) throw volumeError;

    return {
      totalUsuarios: usuarioStats.total_usuarios || 0,
      usuariosAtivos: usuarioStats.usuarios_ativos || 0,
      crescimentoPercentual: usuarioStats.crescimento_percentual || 0,
      totalWorkspaces: workspaceStats.total_workspaces || 0,
      workspacesComTransacoes: workspaceStats.workspaces_com_transacoes || 0,
      totalReceitas: volumeStats.total_receitas || 0,
      totalDespesas: volumeStats.total_despesas || 0,
      totalTransacoes: volumeStats.total_transacoes || 0,
      volumeMes: volumeStats.volume_mes || 0,
      transacoesMes: volumeStats.transacoes_mes || 0
    };
  } catch (error) {
    console.error('Erro ao buscar KPIs:', error);
    throw new Error(`Falha ao carregar métricas do sistema: ${error.message}`);
  }
}

/**
 * Busca dados históricos de crescimento (6 meses)
 */
export async function buscarDadosCrescimento(): Promise<DadosCrescimento[]> {
  try {
    const { data, error } = await supabase.rpc('get_crescimento_historico');
    if (error) throw error;

    return data.map(item => ({
      mesNome: item.mes_nome,
      mesNumero: item.mes_numero,
      usuarios: item.usuarios || 0,
      workspaces: item.workspaces || 0,
      volume: item.volume || 0
    }));
  } catch (error) {
    console.error('Erro ao buscar crescimento:', error);
    throw new Error(`Falha ao carregar dados de crescimento: ${error.message}`);
  }
}

/**
 * Busca usuários recentes (7 dias)
 */
export async function buscarUsuariosRecentes(): Promise<UsuarioRecente[]> {
  try {
    const { data, error } = await supabase.rpc('get_usuarios_recentes');
    if (error) throw error;

    return data.map(usuario => ({
      nome: usuario.nome || 'Sem nome',
      email: usuario.email,
      workspaceNome: usuario.workspace_nome,
      createdAt: usuario.created_at,
      lastActivity: usuario.last_activity
    }));
  } catch (error) {
    console.error('Erro ao buscar usuários recentes:', error);
    throw new Error(`Falha ao carregar usuários recentes: ${error.message}`);
  }
}

/**
 * Busca workspaces mais ativos
 */
export async function buscarWorkspacesAtivos(): Promise<WorkspaceAtivo[]> {
  try {
    const { data, error } = await supabase.rpc('get_workspaces_ativos');
    if (error) throw error;

    return data.map(workspace => ({
      nome: workspace.nome,
      totalUsuarios: workspace.total_usuarios || 0,
      transacoesMes: workspace.transacoes_mes || 0,
      ultimaAtividade: workspace.ultima_atividade,
      atividadeRelativa: workspace.atividade_relativa as any
    }));
  } catch (error) {
    console.error('Erro ao buscar workspaces ativos:', error);
    throw new Error(`Falha ao carregar workspaces ativos: ${error.message}`);
  }
}

/**
 * Função principal - busca todos os dados do dashboard
 */
export async function buscarDadosDashboardAdmin(): Promise<DashboardAdminDados> {
  try {
    console.log('🔄 Carregando dados do dashboard admin...');

    // Executar todas as queries em paralelo para melhor performance
    const [kpis, crescimento, usuariosRecentes, workspacesAtivos] = await Promise.all([
      buscarKPIMetricas(),
      buscarDadosCrescimento(),
      buscarUsuariosRecentes(),
      buscarWorkspacesAtivos()
    ]);

    // Status do sistema (hardcoded por enquanto)
    const statusSistema = {
      online: true,
      ultimoBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
      uptime: '99.8%'
    };

    console.log('✅ Dashboard admin carregado com sucesso');

    return {
      kpis,
      crescimento,
      usuariosRecentes,
      workspacesAtivos,
      statusSistema
    };
  } catch (error) {
    console.error('❌ Erro ao carregar dashboard admin:', error);
    throw error;
  }
}

/**
 * Função para verificar se usuário atual é super admin
 */
export async function verificarAcessoSuperAdmin(): Promise<boolean> {
  try {
    const { data: usuario, error } = await supabase.auth.getUser();
    if (error || !usuario.user) return false;

    const { data, error: dbError } = await supabase
      .from('fp_usuarios')
      .select('super_admin')
      .eq('id', usuario.user.id)
      .eq('ativo', true)
      .single();

    return !dbError && data?.super_admin === true;
  } catch (error) {
    console.error('Erro ao verificar super admin:', error);
    return false;
  }
}
```

#### **✅ Validação Fase 1.3:**
- [ ] Funções compilam sem erro
- [ ] Tratamento de erros implementado
- [ ] Verificação de super admin funciona

---

### **1.4 - Functions SQL no Supabase** ⏱️ 30min

#### **Arquivo:** Executar no SQL Editor do Supabase
```sql
-- Function 1: Estatísticas de usuários
CREATE OR REPLACE FUNCTION get_usuario_stats()
RETURNS TABLE (
  total_usuarios BIGINT,
  usuarios_ativos BIGINT,
  crescimento_percentual NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH usuarios_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN last_activity >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as ativos
    FROM fp_usuarios 
    WHERE ativo = true
  ),
  crescimento_usuarios AS (
    SELECT 
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as este_mes,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' 
                 AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as mes_anterior
    FROM fp_usuarios 
    WHERE ativo = true
  )
  SELECT 
    us.total,
    us.ativos,
    ROUND(
      CASE 
        WHEN cu.mes_anterior = 0 THEN 100 
        ELSE ((cu.este_mes::NUMERIC / cu.mes_anterior::NUMERIC) - 1) * 100 
      END, 1
    )
  FROM usuarios_stats us, crescimento_usuarios cu;
END;
$$;

-- Function 2: Estatísticas de workspaces
CREATE OR REPLACE FUNCTION get_workspace_stats()
RETURNS TABLE (
  total_workspaces BIGINT,
  workspaces_com_transacoes BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total,
    COUNT(DISTINCT t.workspace_id)::BIGINT as com_transacoes
  FROM fp_workspaces w
  LEFT JOIN fp_transacoes t ON t.workspace_id = w.id 
    AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
  WHERE w.ativo = true;
END;
$$;

-- Function 3: Estatísticas de volume
CREATE OR REPLACE FUNCTION get_volume_stats()
RETURNS TABLE (
  total_receitas NUMERIC,
  total_despesas NUMERIC,
  total_transacoes BIGINT,
  volume_mes NUMERIC,
  transacoes_mes BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH volume_stats AS (
    SELECT 
      SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receitas,
      SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesas,
      COUNT(*) as transacoes
    FROM fp_transacoes
  ),
  volume_mensal AS (
    SELECT 
      SUM(valor) as mes,
      COUNT(*) as transacoes_mes
    FROM fp_transacoes 
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  )
  SELECT 
    COALESCE(vs.receitas, 0),
    COALESCE(vs.despesas, 0),
    vs.transacoes,
    COALESCE(vm.mes, 0),
    vm.transacoes_mes
  FROM volume_stats vs, volume_mensal vm;
END;
$$;

-- Function 4: Crescimento histórico
CREATE OR REPLACE FUNCTION get_crescimento_historico()
RETURNS TABLE (
  mes_nome TEXT,
  mes_numero INTEGER,
  usuarios BIGINT,
  workspaces BIGINT,
  volume NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH meses AS (
    SELECT generate_series(
      DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
      DATE_TRUNC('month', CURRENT_DATE),
      INTERVAL '1 month'
    ) as mes
  ),
  usuarios_por_mes AS (
    SELECT 
      DATE_TRUNC('month', created_at) as mes,
      COUNT(*) as usuarios
    FROM fp_usuarios 
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
  ),
  workspaces_por_mes AS (
    SELECT 
      DATE_TRUNC('month', created_at) as mes,
      COUNT(*) as workspaces
    FROM fp_workspaces
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
  ),
  volume_por_mes AS (
    SELECT 
      DATE_TRUNC('month', created_at) as mes,
      SUM(valor) as volume
    FROM fp_transacoes
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
  )
  SELECT 
    TO_CHAR(m.mes, 'Mon'),
    EXTRACT(MONTH FROM m.mes)::INTEGER,
    COALESCE(u.usuarios, 0),
    COALESCE(w.workspaces, 0),
    COALESCE(v.volume, 0)
  FROM meses m
  LEFT JOIN usuarios_por_mes u ON m.mes = u.mes
  LEFT JOIN workspaces_por_mes w ON m.mes = w.mes  
  LEFT JOIN volume_por_mes v ON m.mes = v.mes
  ORDER BY m.mes;
END;
$$;

-- Function 5: Usuários recentes
CREATE OR REPLACE FUNCTION get_usuarios_recentes()
RETURNS TABLE (
  nome TEXT,
  email TEXT,
  workspace_nome TEXT,
  created_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.nome,
    u.email,
    w.nome as workspace_nome,
    u.created_at,
    u.last_activity
  FROM fp_usuarios u
  JOIN fp_workspaces w ON w.id = u.workspace_id
  WHERE u.created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND u.ativo = true
  ORDER BY u.created_at DESC
  LIMIT 5;
END;
$$;

-- Function 6: Workspaces ativos
CREATE OR REPLACE FUNCTION get_workspaces_ativos()
RETURNS TABLE (
  nome TEXT,
  total_usuarios BIGINT,
  transacoes_mes BIGINT,
  ultima_atividade TIMESTAMPTZ,
  atividade_relativa TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH workspace_activity AS (
    SELECT 
      w.id,
      w.nome,
      COUNT(DISTINCT u.id) as usuarios,
      COUNT(DISTINCT t.id) as transacoes,
      MAX(GREATEST(
        COALESCE(u.last_activity, w.created_at),
        COALESCE(t.created_at, w.created_at)
      )) as atividade
    FROM fp_workspaces w
    LEFT JOIN fp_usuarios u ON u.workspace_id = w.id AND u.ativo = true
    LEFT JOIN fp_transacoes t ON t.workspace_id = w.id 
      AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
    WHERE w.ativo = true
    GROUP BY w.id, w.nome
  )
  SELECT 
    wa.nome,
    wa.usuarios,
    wa.transacoes,
    wa.atividade,
    CASE 
      WHEN wa.atividade >= CURRENT_DATE - INTERVAL '1 day' THEN 'hoje'
      WHEN wa.atividade >= CURRENT_DATE - INTERVAL '7 days' THEN 'esta semana'
      WHEN wa.atividade >= CURRENT_DATE - INTERVAL '30 days' THEN 'este mês'
      ELSE 'mais de 30 dias'
    END
  FROM workspace_activity wa
  ORDER BY wa.atividade DESC, wa.transacoes DESC
  LIMIT 5;
END;
$$;
```

#### **✅ Validação Fase 1.4:**
- [ ] Todas as functions executam sem erro
- [ ] Functions retornam dados coerentes
- [ ] Performance adequada (< 1 segundo total)

---

### **1.5 - Hook Customizado** ⏱️ 30min

#### **Arquivo:** `src/hooks/usar-dashboard-admin.ts`
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react';
import { buscarDadosDashboardAdmin, verificarAcessoSuperAdmin } from '@/servicos/supabase/dashboard-admin';
import type { DashboardAdminDados } from '@/tipos/dashboard-admin';

interface UsarDashboardAdminReturn {
  dados: DashboardAdminDados | null;
  loading: boolean;
  error: string | null;
  temAcesso: boolean;
  verificandoAcesso: boolean;
  recarregar: () => Promise<void>;
}

/**
 * Hook para gerenciar dados do dashboard administrativo
 * Inclui verificação de acesso e carregamento otimizado
 */
export function usarDashboardAdmin(): UsarDashboardAdminReturn {
  const [dados, setDados] = useState<DashboardAdminDados | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [temAcesso, setTemAcesso] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);

  /**
   * Verifica se usuário tem acesso de super admin
   */
  const verificarAcesso = useCallback(async () => {
    try {
      setVerificandoAcesso(true);
      const acesso = await verificarAcessoSuperAdmin();
      setTemAcesso(acesso);
      
      if (!acesso) {
        setError('Acesso negado: apenas super administradores podem acessar esta página');
        setLoading(false);
      }
    } catch (err) {
      console.error('Erro ao verificar acesso:', err);
      setError('Erro ao verificar permissões de acesso');
      setTemAcesso(false);
      setLoading(false);
    } finally {
      setVerificandoAcesso(false);
    }
  }, []);

  /**
   * Carrega dados do dashboard
   */
  const carregarDados = useCallback(async () => {
    if (!temAcesso) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Carregando dashboard admin...');
      const dadosDashboard = await buscarDadosDashboardAdmin();
      
      setDados(dadosDashboard);
      console.log('✅ Dashboard admin carregado com sucesso');
    } catch (err) {
      console.error('❌ Erro ao carregar dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, [temAcesso]);

  /**
   * Função para recarregar dados manualmente
   */
  const recarregar = useCallback(async () => {
    await carregarDados();
  }, [carregarDados]);

  /**
   * Effect para verificar acesso na inicialização
   */
  useEffect(() => {
    verificarAcesso();
  }, [verificarAcesso]);

  /**
   * Effect para carregar dados quando acesso for confirmado
   */
  useEffect(() => {
    if (temAcesso) {
      carregarDados();
    }
  }, [temAcesso, carregarDados]);

  return {
    dados,
    loading,
    error,
    temAcesso,
    verificandoAcesso,
    recarregar
  };
}
```

#### **✅ Validação Fase 1.5:**
- [ ] Hook compila sem erros
- [ ] Verificação de acesso funciona
- [ ] Carregamento de dados otimizado
- [ ] Estados loading/error corretos

---

## ✅ CHECKPOINT FASE 1

### **Testes de Validação:**
```typescript
// src/__tests__/dashboard-admin.test.ts
import { buscarDadosDashboardAdmin, verificarAcessoSuperAdmin } from '@/servicos/supabase/dashboard-admin';

describe('Dashboard Admin - Fase 1', () => {
  test('Verificar acesso super admin', async () => {
    const acesso = await verificarAcessoSuperAdmin();
    expect(typeof acesso).toBe('boolean');
  });

  test('Carregar dados do dashboard', async () => {
    const dados = await buscarDadosDashboardAdmin();
    expect(dados).toBeTruthy();
    expect(dados.kpis).toBeDefined();
    expect(dados.crescimento).toBeInstanceOf(Array);
  });
});
```

### **Critérios de Aprovação Fase 1:**
- [ ] Todas as queries SQL funcionam
- [ ] Functions Supabase criadas e testadas
- [ ] Tipos TypeScript definidos
- [ ] Serviços backend funcionais
- [ ] Hook customizado criado
- [ ] Verificação de acesso implementada
- [ ] Performance adequada (< 2s total)

---

## 📋 FASE 2: COMPONENTES UI

### **2.1 - Card KPI** ⏱️ 45min

#### **Arquivo:** `src/componentes/dashboard-admin/card-kpi.tsx`
```typescript
'use client'

import { Icone } from '@/componentes/ui/icone';

interface CardKPIProps {
  titulo: string;
  valor: string | number;
  icone: string;
  cor?: 'verde' | 'azul' | 'roxo' | 'laranja' | 'vermelho';
  subtitulo?: string;
  tendencia?: {
    percentual: number;
    periodo: string;
  };
}

const cores = {
  verde: 'text-green-600 bg-green-50 border-green-200',
  azul: 'text-blue-600 bg-blue-50 border-blue-200', 
  roxo: 'text-purple-600 bg-purple-50 border-purple-200',
  laranja: 'text-orange-600 bg-orange-50 border-orange-200',
  vermelho: 'text-red-600 bg-red-50 border-red-200'
};

const coresIcone = {
  verde: 'text-green-600',
  azul: 'text-blue-600',
  roxo: 'text-purple-600', 
  laranja: 'text-orange-600',
  vermelho: 'text-red-600'
};

export function CardKPI({ titulo, valor, icone, cor = 'azul', subtitulo, tendencia }: CardKPIProps) {
  return (
    <div className={`p-6 rounded-lg border ${cores[cor]} bg-white shadow-sm hover:shadow-md transition-shadow`}>
      {/* Header com ícone */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${cores[cor]}`}>
          <Icone name={icone} className={`w-6 h-6 ${coresIcone[cor]}`} />
        </div>
        
        {/* Indicador de tendência */}
        {tendencia && (
          <div className="flex items-center space-x-1">
            <Icone 
              name={tendencia.percentual >= 0 ? 'trending-up' : 'trending-down'} 
              className={`w-4 h-4 ${tendencia.percentual >= 0 ? 'text-green-500' : 'text-red-500'}`} 
            />
            <span className={`text-sm font-medium ${tendencia.percentual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {tendencia.percentual > 0 ? '+' : ''}{tendencia.percentual}%
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">{titulo}</h3>
        <p className="text-3xl font-bold text-gray-900">{valor}</p>
        {subtitulo && (
          <p className="text-sm text-gray-500 mt-1">{subtitulo}</p>
        )}
        {tendencia && (
          <p className="text-xs text-gray-400 mt-2">{tendencia.periodo}</p>
        )}
      </div>
    </div>
  );
}
```

#### **✅ Validação Fase 2.1:**
- [ ] Card renderiza corretamente
- [ ] Cores e ícones funcionam
- [ ] Indicadores de tendência exibem
- [ ] Responsivo (mobile/desktop)

---

### **2.2 - Gráfico Crescimento** ⏱️ 60min

#### **Arquivo:** `src/componentes/dashboard-admin/grafico-crescimento.tsx`
```typescript
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DadosCrescimento } from '@/tipos/dashboard-admin';

interface GraficoCrescimentoProps {
  dados: DadosCrescimento[];
  loading?: boolean;
}

/**
 * Componente de gráfico para mostrar crescimento temporal
 * Exibe linhas para usuários, workspaces e volume
 */
export function GraficoCrescimento({ dados, loading = false }: GraficoCrescimentoProps) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!dados || dados.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Crescimento do Sistema</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">📊</p>
            <p>Nenhum dado disponível</p>
          </div>
        </div>
      </div>
    );
  }

  // Formatar dados para o gráfico
  const dadosFormatados = dados.map(item => ({
    mes: item.mesNome,
    Usuários: item.usuarios,
    Workspaces: item.workspaces,
    'Volume (R$ mil)': Math.round(item.volume / 1000) // Converter para milhares
  }));

  // Formatador customizado para tooltip
  const formatarTooltip = (value: number, name: string) => {
    if (name === 'Volume (R$ mil)') {
      return [`R$ ${(value * 1000).toLocaleString('pt-BR')}`, 'Volume Total'];
    }
    return [value.toLocaleString('pt-BR'), name];
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">📈 Crescimento do Sistema</h3>
        <p className="text-sm text-gray-600 mt-1">Evolução dos últimos 6 meses</p>
      </div>

      {/* Gráfico */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dadosFormatados}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="mes" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip 
              formatter={formatarTooltip}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            
            {/* Linhas do gráfico */}
            <Line 
              type="monotone" 
              dataKey="Usuários" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Workspaces" 
              stroke="#059669" 
              strokeWidth={3}
              dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Volume (R$ mil)" 
              stroke="#7c3aed" 
              strokeWidth={3}
              dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer informativo */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <p>Dados atualizados automaticamente</p>
        <div className="flex space-x-4">
          <span className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            Usuários
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-green-600 rounded-full mr-1"></div>
            Workspaces
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-purple-600 rounded-full mr-1"></div>
            Volume
          </span>
        </div>
      </div>
    </div>
  );
}
```

#### **✅ Validação Fase 2.2:**
- [ ] Gráfico renderiza com dados corretos
- [ ] Linhas coloridas e interativas
- [ ] Tooltip formatado corretamente
- [ ] Loading state implementado
- [ ] Responsivo para diferentes tamanhos

---

### **2.3 - Tabela Usuários Recentes** ⏱️ 30min

#### **Arquivo:** `src/componentes/dashboard-admin/tabela-usuarios-recentes.tsx`
```typescript
'use client'

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UsuarioRecente } from '@/tipos/dashboard-admin';

interface TabelaUsuariosRecentesProps {
  usuarios: UsuarioRecente[];
  loading?: boolean;
}

/**
 * Formatar data relativa (ex: "há 2 dias")
 */
function formatarDataRelativa(data: string): string {
  try {
    return formatDistanceToNow(new Date(data), { 
      addSuffix: true, 
      locale: ptBR 
    });
  } catch {
    return 'Data inválida';
  }
}

/**
 * Componente de tabela para usuários recentes
 */
export function TabelaUsuariosRecentes({ usuarios, loading = false }: TabelaUsuariosRecentesProps) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">👥 Usuários Recentes</h3>
        <p className="text-sm text-gray-600 mt-1">Cadastros dos últimos 7 dias</p>
      </div>

      {/* Tabela */}
      {usuarios.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">👤</p>
          <p>Nenhum usuário recente</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Workspace</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Cadastro</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Última Atividade</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario, index) => (
                <tr key={`${usuario.email}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{usuario.nome || 'Sem nome'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">{usuario.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-700">{usuario.workspaceNome}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {formatarDataRelativa(usuario.createdAt)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {usuario.lastActivity ? formatarDataRelativa(usuario.lastActivity) : 'Nunca'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-500">
        <p>Mostrando até 5 usuários mais recentes</p>
      </div>
    </div>
  );
}
```

#### **✅ Validação Fase 2.3:**
- [ ] Tabela renderiza usuários corretamente
- [ ] Datas formatadas em português
- [ ] Loading state implementado
- [ ] Estado vazio tratado
- [ ] Responsiva (overflow horizontal)

---

### **2.4 - Tabela Workspaces Ativos** ⏱️ 30min

#### **Arquivo:** `src/componentes/dashboard-admin/tabela-workspaces-ativos.tsx`
```typescript
'use client'

import { Icone } from '@/componentes/ui/icone';
import type { WorkspaceAtivo } from '@/tipos/dashboard-admin';

interface TabelaWorkspacesAtivosProps {
  workspaces: WorkspaceAtivo[];
  loading?: boolean;
}

/**
 * Obter cor do indicador baseado na atividade
 */
function obterCorAtividade(atividade: WorkspaceAtivo['atividadeRelativa']) {
  switch (atividade) {
    case 'hoje': return 'text-green-600 bg-green-100';
    case 'esta semana': return 'text-blue-600 bg-blue-100'; 
    case 'este mês': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-red-600 bg-red-100';
  }
}

/**
 * Componente de tabela para workspaces ativos
 */
export function TabelaWorkspacesAtivos({ workspaces, loading = false }: TabelaWorkspacesAtivosProps) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">🏢 Workspaces Ativos</h3>
        <p className="text-sm text-gray-600 mt-1">Mais ativos por atividade e transações</p>
      </div>

      {/* Tabela */}
      {workspaces.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">🏢</p>
          <p>Nenhum workspace encontrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Usuários</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Transações/Mês</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Atividade</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((workspace, index) => (
                <tr key={`${workspace.nome}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{workspace.nome}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Icone name="users" className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{workspace.totalUsuarios}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Icone name="activity" className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {workspace.transacoesMes.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {workspace.atividadeRelativa}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obterCorAtividade(workspace.atividadeRelativa)}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1 ${workspace.atividadeRelativa === 'hoje' ? 'bg-green-600' : 
                        workspace.atividadeRelativa === 'esta semana' ? 'bg-blue-600' :
                        workspace.atividadeRelativa === 'este mês' ? 'bg-yellow-600' : 'bg-red-600'}`}></div>
                      {workspace.atividadeRelativa === 'hoje' ? 'Ativo' :
                       workspace.atividadeRelativa === 'esta semana' ? 'Recente' :
                       workspace.atividadeRelativa === 'este mês' ? 'Moderado' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-500">
        <p>Mostrando até 5 workspaces ordenados por atividade</p>
      </div>
    </div>
  );
}
```

#### **✅ Validação Fase 2.4:**
- [ ] Tabela renderiza workspaces corretamente
- [ ] Indicadores de status coloridos
- [ ] Ícones funcionais
- [ ] Loading state implementado
- [ ] Responsiva

---

### **2.5 - Indicadores de Saúde** ⏱️ 20min

#### **Arquivo:** `src/componentes/dashboard-admin/indicadores-saude.tsx`
```typescript
'use client'

import { Icone } from '@/componentes/ui/icone';

interface StatusSistema {
  online: boolean;
  ultimoBackup: string;
  uptime: string;
}

interface IndicadoresSaudeProps {
  status: StatusSistema;
}

/**
 * Formatar tempo desde último backup
 */
function formatarTempoBackup(data: string): string {
  try {
    const agora = new Date();
    const backup = new Date(data);
    const diffMs = agora.getTime() - backup.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHoras < 1) {
      const diffMinutos = Math.floor(diffMs / (1000 * 60));
      return `há ${diffMinutos}min`;
    }
    
    if (diffHoras < 24) {
      return `há ${diffHoras}h`;
    }
    
    const diffDias = Math.floor(diffHoras / 24);
    return `há ${diffDias} dia${diffDias > 1 ? 's' : ''}`;
  } catch {
    return 'Data inválida';
  }
}

/**
 * Componente de indicadores de saúde do sistema
 */
export function IndicadoresSaude({ status }: IndicadoresSaudeProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">⚡ Saúde do Sistema</h3>
        <p className="text-sm text-gray-600 mt-1">Status operacional e métricas</p>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Online */}
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
            status.online ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Icone 
              name={status.online ? 'wifi' : 'wifi-off'} 
              className={`w-6 h-6 ${status.online ? 'text-green-600' : 'text-red-600'}`} 
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900">Sistema</h4>
              <div className={`w-2 h-2 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <p className={`text-sm ${status.online ? 'text-green-600' : 'text-red-600'}`}>
              {status.online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Uptime */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
            <Icone name="activity" className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Uptime</h4>
            <p className="text-sm text-blue-600 font-semibold">{status.uptime}</p>
          </div>
        </div>

        {/* Último Backup */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100">
            <Icone name="database" className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Backup</h4>
            <p className="text-sm text-purple-600">
              {formatarTempoBackup(status.ultimoBackup)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <p>Atualizado automaticamente</p>
          <p>Monitoramento em tempo real</p>
        </div>
      </div>
    </div>
  );
}
```

#### **✅ Validação Fase 2.5:**
- [ ] Indicadores renderizam com cores corretas
- [ ] Status online/offline funcional
- [ ] Tempo de backup formatado
- [ ] Layout responsivo
- [ ] Ícones adequados

---

## ✅ CHECKPOINT FASE 2

### **Critérios de Aprovação Fase 2:**
- [ ] Todos os componentes renderizam corretamente
- [ ] States de loading implementados
- [ ] Cores e ícones consistentes
- [ ] Layout responsivo funcionando
- [ ] Estados vazios tratados
- [ ] TypeScript sem erros
- [ ] Performance adequada (< 100ms render)

---

## 📋 FASE 3: LAYOUT E PÁGINA

### **3.1 - Layout Container** ⏱️ 20min

#### **Arquivo:** `src/componentes/dashboard-admin/layout-container.tsx`
```typescript
'use client'

interface LayoutContainerProps {
  children: React.ReactNode;
}

/**
 * Container principal do dashboard admin
 * Define grid e espaçamentos padronizados
 */
export function LayoutContainer({ children }: LayoutContainerProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da página */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard Super Admin</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Visão geral do sistema de controle financeiro
                </p>
              </div>
              
              {/* Indicador de super admin */}
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                  Super Admin
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
```

#### **✅ Validação Fase 3.1:**
- [ ] Layout renderiza corretamente
- [ ] Header com título adequado
- [ ] Indicador super admin visível
- [ ] Responsivo para diferentes tamanhos
- [ ] Espaçamentos consistentes

---

### **3.2 - Dashboard Principal** ⏱️ 45min

#### **Arquivo:** `src/componentes/dashboard-admin/dashboard-principal.tsx`
```typescript
'use client'

import { CardKPI } from './card-kpi';
import { GraficoCrescimento } from './grafico-crescimento';
import { TabelaUsuariosRecentes } from './tabela-usuarios-recentes';
import { TabelaWorkspacesAtivos } from './tabela-workspaces-ativos';
import { IndicadoresSaude } from './indicadores-saude';
import { Button } from '@/componentes/ui/button';
import { Icone } from '@/componentes/ui/icone';
import type { DashboardAdminDados } from '@/tipos/dashboard-admin';

interface DashboardPrincipalProps {
  dados: DashboardAdminDados;
  loading: boolean;
  onRecarregar: () => void;
}

/**
 * Componente principal do dashboard administrativo
 * Organiza todos os componentes em layout grid
 */
export function DashboardPrincipal({ dados, loading, onRecarregar }: DashboardPrincipalProps) {
  if (loading) {
    return (
      <div className="space-y-8">
        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        
        {/* Gráfico Skeleton */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const { kpis, crescimento, usuariosRecentes, workspacesAtivos, statusSistema } = dados;

  return (
    <div className="space-y-8">
      {/* Header com botão de recarregar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
        <Button
          onClick={onRecarregar}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Icone name="refresh-cw" className="w-4 h-4" />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardKPI
          titulo="Crescimento Mensal"
          valor={`${kpis.crescimentoPercentual > 0 ? '+' : ''}${kpis.crescimentoPercentual}%`}
          icone="trending-up"
          cor="verde"
          subtitulo="Usuários este mês"
          tendencia={{
            percentual: kpis.crescimentoPercentual,
            periodo: "vs mês anterior"
          }}
        />
        
        <CardKPI
          titulo="Usuários Ativos"
          valor={kpis.usuariosAtivos.toLocaleString('pt-BR')}
          icone="users"
          cor="azul"
          subtitulo={`${kpis.totalUsuarios} total`}
        />
        
        <CardKPI
          titulo="Workspaces"
          valor={kpis.workspacesComTransacoes.toLocaleString('pt-BR')}
          icone="building"
          cor="roxo"
          subtitulo={`${kpis.totalWorkspaces} total`}
        />
        
        <CardKPI
          titulo="Volume Total"
          valor={`R$ ${(kpis.totalReceitas + kpis.totalDespesas).toLocaleString('pt-BR')}`}
          icone="dollar-sign"
          cor="laranja"
          subtitulo={`${kpis.totalTransacoes.toLocaleString('pt-BR')} transações`}
        />
      </div>

      {/* Row 2: Gráfico Principal */}
      <GraficoCrescimento 
        dados={crescimento} 
        loading={false}
      />

      {/* Row 3: Tabelas Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TabelaUsuariosRecentes 
          usuarios={usuariosRecentes}
          loading={false}
        />
        
        <TabelaWorkspacesAtivos 
          workspaces={workspacesAtivos}
          loading={false}
        />
      </div>

      {/* Row 4: Indicadores de Saúde */}
      <IndicadoresSaude status={statusSistema} />

      {/* Footer informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Icone name="info" className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Informações Importantes</h4>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• Os dados são atualizados automaticamente a cada 5 minutos</li>
              <li>• Crescimento é calculado comparando os últimos 30 dias com o período anterior</li>
              <li>• Volume total inclui receitas e despesas de todos os workspaces</li>
              <li>• Usuários ativos são aqueles com login nos últimos 30 dias</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### **✅ Validação Fase 3.2:**
- [ ] Dashboard renderiza todos os componentes
- [ ] Layout grid responsivo funciona
- [ ] Botão recarregar operacional
- [ ] Loading state completo
- [ ] Footer informativo presente
- [ ] Dados passados corretamente

---

### **3.3 - Página Administrativa** ⏱️ 30min

#### **Arquivo:** `src/app/(protected)/admin/dashboard/page.tsx`
```typescript
'use client'

import { LayoutContainer } from '@/componentes/dashboard-admin/layout-container';
import { DashboardPrincipal } from '@/componentes/dashboard-admin/dashboard-principal';
import { usarDashboardAdmin } from '@/hooks/usar-dashboard-admin';
import { Icone } from '@/componentes/ui/icone';

/**
 * Página principal do dashboard administrativo
 * Acesso restrito apenas para super administradores
 */
export default function DashboardAdminPage() {
  const { 
    dados, 
    loading, 
    error, 
    temAcesso, 
    verificandoAcesso, 
    recarregar 
  } = usarDashboardAdmin();

  // Loading inicial - verificando acesso
  if (verificandoAcesso) {
    return (
      <LayoutContainer>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando permissões...</p>
          </div>
        </div>
      </LayoutContainer>
    );
  }

  // Acesso negado
  if (!temAcesso) {
    return (
      <LayoutContainer>
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="mx-auto h-16 w-16 text-red-500 mb-6">
              <Icone name="shield-x" className="w-16 h-16" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acesso Negado
            </h2>
            <p className="text-gray-600 mb-6">
              Esta área é restrita apenas para super administradores. 
              Entre em contato com o suporte se você deveria ter acesso.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Erro:</strong> {error || 'Usuário não possui privilégios de super administrador'}
              </p>
            </div>
          </div>
        </div>
      </LayoutContainer>
    );
  }

  // Erro no carregamento dos dados
  if (error && !loading) {
    return (
      <LayoutContainer>
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="mx-auto h-16 w-16 text-red-500 mb-6">
              <Icone name="alert-triangle" className="w-16 h-16" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Erro ao Carregar
            </h2>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro ao carregar os dados do dashboard. 
              Tente novamente em alguns minutos.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Detalhes:</strong> {error}
              </p>
            </div>
            <button
              onClick={recarregar}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Icone name="refresh-cw" className="w-4 h-4 mr-2" />
              Tentar Novamente
            </button>
          </div>
        </div>
      </LayoutContainer>
    );
  }

  // Dashboard principal
  return (
    <LayoutContainer>
      <DashboardPrincipal
        dados={dados!}
        loading={loading}
        onRecarregar={recarregar}
      />
    </LayoutContainer>
  );
}
```

#### **✅ Validação Fase 3.3:**
- [ ] Página carrega corretamente
- [ ] Verificação de acesso funciona
- [ ] Estados de erro tratados
- [ ] Loading states adequados
- [ ] Dashboard renderiza quando tem dados
- [ ] Botão "tentar novamente" funciona

---

### **3.4 - Middleware de Acesso** ⏱️ 15min

#### **Arquivo:** `src/app/(protected)/admin/layout.tsx`
```typescript
'use client'

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout para área administrativa
 * Adiciona contexto específico para super admin
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-area">
      {children}
    </div>
  );
}
```

#### **Arquivo:** `src/app/(protected)/admin/page.tsx`
```typescript
'use client'

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Página raiz da área admin - redireciona para dashboard
 */
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}
```

#### **✅ Validação Fase 3.4:**
- [ ] Layout admin criado
- [ ] Redirecionamento /admin → /admin/dashboard funciona
- [ ] Estrutura de rotas adequada

---

## ✅ CHECKPOINT FASE 3

### **Critérios de Aprovação Fase 3:**
- [ ] Página `/admin/dashboard` acessível
- [ ] Verificação de super admin funciona
- [ ] Layout responsivo implementado
- [ ] Estados de erro bem tratados
- [ ] Performance adequada
- [ ] Navegação fluida

---

## 📋 FASE 4: VALIDAÇÃO E TESTES

### **4.1 - Testes Funcionais** ⏱️ 30min

#### **Arquivo:** `src/__tests__/dashboard-admin-funcional.test.ts`
```typescript
/**
 * Testes funcionais do dashboard administrativo
 * Verificar se todos os componentes funcionam corretamente
 */

describe('Dashboard Admin - Testes Funcionais', () => {
  
  test('Deve verificar acesso super admin', async () => {
    // Mock do usuário super admin
    const mockUser = { id: 'test-id', email: 'conectamovelmar@gmail.com' };
    
    // TODO: Implementar teste real com mock do Supabase
    expect(true).toBe(true); // Placeholder
  });

  test('Deve carregar dados do dashboard', async () => {
    // TODO: Mock das functions SQL
    // TODO: Verificar se dados são carregados corretamente
    expect(true).toBe(true); // Placeholder
  });

  test('KPI Cards devem renderizar dados corretos', () => {
    // TODO: Teste dos componentes de KPI
    expect(true).toBe(true); // Placeholder
  });

  test('Gráfico deve renderizar com dados históricos', () => {
    // TODO: Teste do componente de gráfico
    expect(true).toBe(true); // Placeholder
  });

  test('Tabelas devem listar usuários e workspaces', () => {
    // TODO: Teste dos componentes de tabela
    expect(true).toBe(true); // Placeholder
  });

});
```

#### **Checklist Manual de Testes:**
```markdown
## ✅ Checklist de Testes Manuais

### Acesso e Segurança
- [ ] Usuário comum não consegue acessar `/admin/dashboard`
- [ ] Super admin consegue acessar normalmente
- [ ] Redirecionamento de `/admin` para `/admin/dashboard` funciona
- [ ] Mensagem de "Acesso Negado" aparece corretamente

### Dados e Métricas
- [ ] KPI de crescimento mostra percentual correto
- [ ] KPI de usuários ativos mostra número correto  
- [ ] KPI de workspaces mostra dados atualizados
- [ ] KPI de volume financeiro soma receitas + despesas

### Componentes Visuais
- [ ] Cards KPI têm cores e ícones corretos
- [ ] Gráfico de crescimento renderiza 3 linhas coloridas
- [ ] Tabela de usuários mostra 5 registros mais recentes
- [ ] Tabela de workspaces mostra status de atividade
- [ ] Indicadores de saúde mostram status online

### Interatividade
- [ ] Botão "Atualizar" recarrega dados
- [ ] Gráfico tem tooltip interativo
- [ ] Hover effects funcionam nas tabelas
- [ ] Loading states aparecem durante carregamento

### Responsividade
- [ ] Desktop: layout em grid funciona perfeitamente
- [ ] Tablet: cards empilham corretamente
- [ ] Mobile: tabelas têm scroll horizontal
- [ ] Texto e ícones são legíveis em todos os tamanhos
```

#### **✅ Validação Fase 4.1:**
- [ ] Todos os testes manuais passam
- [ ] Estrutura de testes automatizados criada
- [ ] Acesso funciona corretamente
- [ ] Dados são exibidos adequadamente

---

### **4.2 - Testes de Performance** ⏱️ 20min

#### **Script de Teste:** `scripts/test-dashboard-performance.js`
```javascript
/**
 * Teste de performance do dashboard admin
 * Simular carregamento e medir tempos
 */

const { performance } = require('perf_hooks');

async function testarPerformance() {
  console.log('🚀 Iniciando testes de performance...\n');

  // Teste 1: Tempo de carregamento das queries
  const startQuery = performance.now();
  
  // Simular execução das queries (substituir por chamadas reais)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const endQuery = performance.now();
  const queryTime = endQuery - startQuery;
  
  console.log(`📊 Queries SQL: ${queryTime.toFixed(2)}ms`);
  
  // Teste 2: Tempo de renderização dos componentes
  const startRender = performance.now();
  
  // Simular renderização (substituir por testes reais)
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const endRender = performance.now();
  const renderTime = endRender - startRender;
  
  console.log(`🎨 Renderização: ${renderTime.toFixed(2)}ms`);
  
  // Teste 3: Tempo total da página
  const totalTime = queryTime + renderTime;
  console.log(`⏱️  Tempo Total: ${totalTime.toFixed(2)}ms`);
  
  // Verificar se está dentro dos limites aceitáveis
  const limites = {
    queries: 2000, // 2 segundos
    render: 500,   // 500ms
    total: 2500    // 2.5 segundos
  };
  
  console.log('\n📋 Resultados:');
  console.log(`Queries: ${queryTime <= limites.queries ? '✅' : '❌'} (${limites.queries}ms limite)`);
  console.log(`Render: ${renderTime <= limites.render ? '✅' : '❌'} (${limites.render}ms limite)`);
  console.log(`Total: ${totalTime <= limites.total ? '✅' : '❌'} (${limites.total}ms limite)`);
  
  return {
    queryTime,
    renderTime, 
    totalTime,
    aprovado: queryTime <= limites.queries && renderTime <= limites.render && totalTime <= limites.total
  };
}

// Executar teste
testarPerformance()
  .then(resultado => {
    console.log(`\n🎯 Performance: ${resultado.aprovado ? 'APROVADO' : 'REPROVADO'}`);
    process.exit(resultado.aprovado ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  });
```

#### **✅ Validação Fase 4.2:**
- [ ] Script de performance criado
- [ ] Tempos de carregamento < 2 segundos
- [ ] Renderização < 500ms
- [ ] Memory leaks verificados

---

### **4.3 - Testes de Responsividade** ⏱️ 15min

#### **Checklist de Breakpoints:**
```markdown
## 📱 Teste de Responsividade

### Desktop (1920x1080)
- [ ] Grid de 4 colunas nos KPIs
- [ ] Gráfico ocupa largura completa
- [ ] Tabelas side-by-side (2 colunas)
- [ ] Todo conteúdo visível sem scroll horizontal

### Desktop Médio (1366x768)  
- [ ] Layout mantém proporções
- [ ] Textos legíveis
- [ ] Botões e links clicáveis
- [ ] Cards não ficam muito pequenos

### Tablet (768x1024)
- [ ] KPIs em 2 colunas
- [ ] Gráfico responsivo
- [ ] Tabelas empilham verticalmente
- [ ] Touch targets ≥ 44px

### Mobile (375x667)
- [ ] KPIs em 1 coluna
- [ ] Gráfico legível
- [ ] Tabelas com scroll horizontal
- [ ] Header compacto
- [ ] Botões fáceis de tocar

### Teste de Orientação
- [ ] Portrait: layout vertical funciona
- [ ] Landscape: aproveita largura extra
- [ ] Rotação não quebra layout
```

#### **✅ Validação Fase 4.3:**
- [ ] Todos os breakpoints testados
- [ ] Layout responsivo funcionando
- [ ] Touch targets adequados
- [ ] Orientação portrait/landscape ok

---

### **4.4 - Checklist Final** ⏱️ 15min

#### **Validação Completa:**
```markdown
## ✅ Checklist Final - Dashboard Super Admin

### Funcionalidades Core
- [ ] Acesso restrito a super admin implementado
- [ ] Dados carregam corretamente do banco
- [ ] KPIs mostram métricas atuais
- [ ] Gráfico histórico (6 meses) funciona
- [ ] Tabelas listam dados recentes
- [ ] Indicadores de saúde operacionais

### Interface e UX
- [ ] Layout limpo e profissional
- [ ] Cores consistentes com a marca
- [ ] Ícones adequados para cada seção
- [ ] Loading states implementados
- [ ] Estados de erro tratados
- [ ] Feedback visual ao usuário

### Performance
- [ ] Carregamento inicial < 2 segundos
- [ ] Queries otimizadas (< 500ms cada)
- [ ] Componentes renderizam rapidamente
- [ ] Cache implementado (SWR)
- [ ] Sem vazamentos de memória

### Segurança
- [ ] Verificação de super admin funciona
- [ ] Dados sensíveis protegidos
- [ ] Queries com SECURITY DEFINER
- [ ] Acesso negado para usuários comuns
- [ ] Logs de auditoria (futuro)

### Compatibilidade
- [ ] Desktop (Chrome, Firefox, Safari, Edge)
- [ ] Tablet (iOS Safari, Android Chrome)
- [ ] Mobile responsivo
- [ ] TypeScript sem erros
- [ ] Build sem warnings

### Documentação
- [ ] Código bem comentado
- [ ] Tipos TypeScript completos
- [ ] README atualizado
- [ ] Plano de implementação completo
```

#### **✅ Validação Fase 4.4:**
- [ ] Todos os itens do checklist aprovados
- [ ] Sistema pronto para produção
- [ ] Documentação completa

---

## 🚀 DEPLOYMENT E FINALIZAÇÃO

### **Deploy Checklist:**
```markdown
## 🔧 Preparação para Deploy

### Banco de Dados
- [ ] Functions SQL criadas no Supabase
- [ ] Usuário super admin configurado
- [ ] Queries testadas e otimizadas
- [ ] Índices de performance criados

### Aplicação
- [ ] Build produção sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] TypeScript validado
- [ ] Testes passando

### Vercel Deploy
- [ ] Projeto conectado ao GitHub
- [ ] Variáveis de ambiente setadas
- [ ] Build automático funcionando
- [ ] Domain/subdomain configurado

### Pós-Deploy
- [ ] Página /admin/dashboard acessível
- [ ] Super admin consegue fazer login
- [ ] Dados carregam corretamente
- [ ] Performance adequada em produção
```

---

## 📋 CRONOGRAMA ESTIMADO

| Fase | Tempo Estimado | Responsável | Status |
|------|----------------|-------------|--------|
| **Fase 1: Infraestrutura** | 2-3 horas | Desenvolvedor | ⏳ |
| 1.1 - Queries SQL | 45min | Dev | ⏳ |
| 1.2 - Tipos TypeScript | 20min | Dev | ⏳ |
| 1.3 - Serviços Backend | 45min | Dev | ⏳ |
| 1.4 - Functions Supabase | 30min | Dev | ⏳ |
| 1.5 - Hook Customizado | 30min | Dev | ⏳ |
| **Fase 2: Componentes** | 3-4 horas | Desenvolvedor | ⏳ |
| 2.1 - Card KPI | 45min | Dev | ⏳ |
| 2.2 - Gráfico Crescimento | 60min | Dev | ⏳ |
| 2.3 - Tabela Usuários | 30min | Dev | ⏳ |
| 2.4 - Tabela Workspaces | 30min | Dev | ⏳ |
| 2.5 - Indicadores Saúde | 20min | Dev | ⏳ |
| **Fase 3: Layout** | 2-3 horas | Desenvolvedor | ⏳ |
| 3.1 - Container Layout | 20min | Dev | ⏳ |
| 3.2 - Dashboard Principal | 45min | Dev | ⏳ |
| 3.3 - Página Admin | 30min | Dev | ⏳ |
| 3.4 - Middleware Acesso | 15min | Dev | ⏳ |
| **Fase 4: Validação** | 1-2 horas | Desenvolvedor | ⏳ |
| 4.1 - Testes Funcionais | 30min | Dev | ⏳ |
| 4.2 - Testes Performance | 20min | Dev | ⏳ |
| 4.3 - Responsividade | 15min | Dev | ⏳ |
| 4.4 - Checklist Final | 15min | Dev | ⏳ |
| **TOTAL ESTIMADO** | **8-12 horas** | - | ⏳ |

---

## 🎯 CRITÉRIOS DE SUCESSO

### **Funcional:**
- ✅ Dashboard carrega em < 2 segundos
- ✅ Apenas super admin pode acessar
- ✅ Dados são atuais e precisos
- ✅ Gráficos e tabelas funcionais
- ✅ Interface responsiva

### **Técnico:**
- ✅ TypeScript sem erros
- ✅ Build sem warnings  
- ✅ Queries otimizadas
- ✅ Código bem estruturado
- ✅ Performance adequada

### **UX/UI:**
- ✅ Interface intuitiva
- ✅ Loading states adequados
- ✅ Tratamento de erros
- ✅ Design consistente
- ✅ Responsividade total

---

## 📞 SUPORTE E MANUTENÇÃO

### **Contatos:**
- **Desenvolvedor Principal:** [Nome]
- **Super Admin:** conectamovelmar@gmail.com
- **Suporte Técnico:** [Email/Canal]

### **Logs e Debug:**
- Console do browser para erros frontend
- Supabase Dashboard > Logs para erros backend  
- Network tab para performance de queries
- React DevTools para debug de componentes

### **Manutenção Futura:**
- Adicionar novos KPIs conforme necessidade
- Otimizar queries com mais dados
- Implementar cache mais agressivo
- Adicionar mais filtros e drill-downs

---

**🎉 PLANO DE IMPLEMENTAÇÃO CONCLUÍDO**

Este documento fornece uma roadmap completa para implementar o Dashboard Super Admin de forma segura, organizada e eficiente. Seguindo todas as fases e validações, o resultado será uma ferramenta robusta e profissional para gerenciamento do sistema.