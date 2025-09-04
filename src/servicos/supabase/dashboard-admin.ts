/**
 * Serviços para dashboard administrativo
 */

import { createClient } from './auth-client';
import type { 
  DashboardAdminDados, 
  KPIMetricas,
  DadosCrescimento,
  UsuarioCompleto,
  WorkspaceCompleto,
  AcaoAdministrativa
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

    const usuarioData = usuarioStats?.[0] || {};
    const workspaceData = workspaceStats?.[0] || {};
    const volumeData = volumeStats?.[0] || {};

    return {
      totalUsuarios: usuarioData.total_usuarios || 0,
      usuariosAtivos: usuarioData.usuarios_ativos || 0,
      crescimentoPercentual: usuarioData.crescimento_percentual || 0,
      totalWorkspaces: workspaceData.total_workspaces || 0,
      workspacesComTransacoes: workspaceData.workspaces_com_transacoes || 0,
      totalReceitas: parseFloat(volumeData.total_receitas || '0'),
      totalDespesas: parseFloat(volumeData.total_despesas || '0'),
      totalTransacoes: volumeData.total_transacoes || 0,
      volumeMes: parseFloat(volumeData.volume_mes || '0'),
      transacoesMes: volumeData.transacoes_mes || 0
    };
  } catch (error: any) {
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

    return (data || []).map((item: any) => ({
      mesNome: item.mes_nome,
      mesNumero: item.mes_numero,
      usuarios: item.usuarios || 0,
      workspaces: item.workspaces || 0,
      volume: parseFloat(item.volume || '0')
    }));
  } catch (error: any) {
    console.error('Erro ao buscar crescimento:', error);
    throw new Error(`Falha ao carregar dados de crescimento: ${error.message}`);
  }
}


/**
 * 🆕 Busca todos os usuários com dados completos para gestão
 */
export async function buscarUsuariosCompletos(): Promise<UsuarioCompleto[]> {
  try {
    const { data, error } = await supabase.rpc('get_todos_usuarios');
    if (error) throw error;

    return (data || []).map((usuario: any) => ({
      id: usuario.id,
      nome: usuario.nome || 'Sem nome',
      email: usuario.email || 'sem-email',
      workspaceNome: usuario.workspace_nome || 'Workspace sem nome',
      workspaceId: usuario.workspace_id,
      ativo: usuario.ativo,
      superAdmin: usuario.super_admin || false,
      createdAt: usuario.created_at,
      lastActivity: usuario.last_activity,
      totalTransacoes: usuario.total_transacoes || 0,
      ultimaTransacao: usuario.ultima_transacao,
      atividadeStatus: usuario.atividade_status
    }));
  } catch (error: any) {
    console.error('Erro ao buscar usuários completos:', error);
    throw new Error(`Falha ao carregar usuários completos: ${error.message}`);
  }
}

/**
 * 🆕 Busca todos os workspaces com métricas completas
 */
export async function buscarWorkspacesCompletos(): Promise<WorkspaceCompleto[]> {
  try {
    const { data, error } = await supabase.rpc('get_todos_workspaces');
    if (error) throw error;

    return (data || []).map((workspace: any) => ({
      id: workspace.id,
      nome: workspace.nome,
      ownerEmail: workspace.owner_email || 'sem-email',
      plano: workspace.plano as 'free' | 'pro' | 'enterprise',
      ativo: workspace.ativo,
      totalUsuarios: workspace.total_usuarios || 0,
      usuariosAtivos: workspace.usuarios_ativos || 0,
      totalTransacoes: workspace.total_transacoes || 0,
      volumeTotal: parseFloat(workspace.volume_total || '0'),
      createdAt: workspace.created_at,
      ultimaAtividade: workspace.ultima_atividade,
      statusWorkspace: workspace.status_workspace
    }));
  } catch (error: any) {
    console.error('Erro ao buscar workspaces completos:', error);
    throw new Error(`Falha ao carregar workspaces completos: ${error.message}`);
  }
}

/**
 * 🆕 Ativar/Desativar usuário (função administrativa)
 */
export async function alterarStatusUsuario(usuarioId: string, novoStatus: boolean): Promise<AcaoAdministrativa> {
  try {
    const { data, error } = await supabase.rpc('admin_toggle_usuario', {
      usuario_id: usuarioId,
      novo_status: novoStatus
    });

    if (error) throw error;

    const resultado = data?.[0];
    return {
      sucesso: resultado?.sucesso || false,
      mensagem: resultado?.mensagem || 'Erro desconhecido',
      usuarioEmail: resultado?.usuario_email
    };
  } catch (error: any) {
    console.error('Erro ao alterar status do usuário:', error);
    return {
      sucesso: false,
      mensagem: `Erro ao alterar status: ${error.message}`
    };
  }
}

/**
 * Função principal - busca todos os dados do dashboard (ATUALIZADA)
 */
export async function buscarDadosDashboardAdmin(): Promise<DashboardAdminDados> {
  try {
    console.log('🔄 Carregando dados do dashboard admin...');

    // Executar apenas as queries necessárias em paralelo para melhor performance
    const [kpis, crescimento, usuariosCompletos, workspacesCompletos] = await Promise.all([
      buscarKPIMetricas(),
      buscarDadosCrescimento(),
      buscarUsuariosCompletos(),
      buscarWorkspacesCompletos()
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
      usuariosCompletos,
      workspacesCompletos,
      // ✅ Compatibilidade - arrays vazios (não fazemos mais essas queries)
      usuariosRecentes: [],
      workspacesAtivos: [],
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