/**
 * Tipos para dashboard administrativo
 */

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
  ultimaTransacao: string | null;
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

// ✅ MANTER tipos antigos para compatibilidade
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

// 🆕 Interface principal atualizada
export interface DashboardAdminDados {
  kpis: KPIMetricas;
  crescimento: DadosCrescimento[];
  usuariosCompletos: UsuarioCompleto[];    // ← NOVO
  workspacesCompletos: WorkspaceCompleto[]; // ← NOVO
  // ✅ Mantém campos antigos para compatibilidade
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