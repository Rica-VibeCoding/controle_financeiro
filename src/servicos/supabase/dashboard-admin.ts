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
 * Cache inteligente para dashboard admin - FASE 4: Performance
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DashboardCache {
  private cache = new Map<string, CacheItem<any>>();
  
  set<T>(key: string, data: T, ttlMinutes: number = 2): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const dashboardCache = new DashboardCache();

/**
 * Parsing seguro de números - FASE 3: Validações robustas
 */
function parseFloatSeguro(valor: string | number | null | undefined): number {
  if (valor === null || valor === undefined) return 0;
  
  const numero = typeof valor === 'string' ? parseFloat(valor) : Number(valor);
  return isNaN(numero) || !isFinite(numero) ? 0 : numero;
}

/**
 * Parsing seguro de inteiros - FASE 3: Validações robustas  
 */
function parseIntSeguro(valor: string | number | null | undefined): number {
  if (valor === null || valor === undefined) return 0;
  
  const numero = typeof valor === 'string' ? parseInt(valor, 10) : Number(valor);
  return isNaN(numero) || !isFinite(numero) ? 0 : Math.max(0, Math.floor(numero));
}

/**
 * Busca métricas principais (KPIs) do sistema
 * FASE 3: Com validações robustas e tratamento de erros
 */
export async function buscarKPIMetricas(): Promise<KPIMetricas> {
  try {
    // Query 1: Usuários e crescimento
    const { data: usuarioStats, error: usuarioError } = await supabase.rpc('get_usuario_stats');
    if (usuarioError) throw usuarioError;

    // Query 2: Workspaces - USANDO NOVA FUNÇÃO ADMIN
    const { data: workspaceStats, error: workspaceError } = await supabase.rpc('get_workspace_stats_admin');  
    if (workspaceError) throw workspaceError;

    // Query 3: Volume financeiro
    const { data: volumeStats, error: volumeError } = await supabase.rpc('get_volume_stats');
    if (volumeError) throw volumeError;

    // FASE 3: Validações robustas - verificar se dados existem
    if (!Array.isArray(usuarioStats) || usuarioStats.length === 0) {
      throw new Error('Dados de usuários não encontrados');
    }
    if (!Array.isArray(workspaceStats) || workspaceStats.length === 0) {
      throw new Error('Dados de workspaces não encontrados');
    }
    if (!Array.isArray(volumeStats) || volumeStats.length === 0) {
      throw new Error('Dados de volume não encontrados');
    }

    const usuarioData = usuarioStats[0] || {};
    const workspaceData = workspaceStats[0] || {};
    const volumeData = volumeStats[0] || {};

    // FASE 3: Parsing seguro com funções validadas
    return {
      totalUsuarios: parseIntSeguro(usuarioData.total_usuarios),
      usuariosAtivos: parseIntSeguro(usuarioData.usuarios_ativos),
      crescimentoPercentual: parseFloatSeguro(usuarioData.crescimento_percentual),
      totalWorkspaces: parseIntSeguro(workspaceData.total_workspaces),
      workspacesComTransacoes: parseIntSeguro(workspaceData.workspaces_com_transacoes),
      totalReceitas: parseFloatSeguro(volumeData.total_receitas),
      totalDespesas: parseFloatSeguro(volumeData.total_despesas),
      totalTransacoes: parseIntSeguro(volumeData.total_transacoes),
      volumeMes: parseFloatSeguro(volumeData.volume_mes),
      transacoesMes: parseIntSeguro(volumeData.transacoes_mes)
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
    
    // FASE 4: Invalidar cache após modificação
    if (resultado?.sucesso) {
      invalidarCacheDashboard();
    }
    
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
 * FASE 4: Funções com cache individual para melhor performance
 */
async function buscarKPIMetricasComCache(): Promise<KPIMetricas> {
  const cacheKey = 'kpi_metricas';
  const cached = dashboardCache.get<KPIMetricas>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const result = await buscarKPIMetricas();
  dashboardCache.set(cacheKey, result, 2); // Cache por 2 minutos
  return result;
}

async function buscarDadosCrescimentoComCache(): Promise<DadosCrescimento[]> {
  const cacheKey = 'dados_crescimento';
  const cached = dashboardCache.get<DadosCrescimento[]>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const result = await buscarDadosCrescimento();
  dashboardCache.set(cacheKey, result, 5); // Cache por 5 minutos (dados históricos)
  return result;
}

async function buscarUsuariosCompletosComCache(): Promise<UsuarioCompleto[]> {
  const cacheKey = 'usuarios_completos';
  const cached = dashboardCache.get<UsuarioCompleto[]>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const result = await buscarUsuariosCompletos();
  dashboardCache.set(cacheKey, result, 1); // Cache por 1 minuto (dados dinâmicos)
  return result;
}

async function buscarWorkspacesCompletosComCache(): Promise<WorkspaceCompleto[]> {
  const cacheKey = 'workspaces_completos';
  const cached = dashboardCache.get<WorkspaceCompleto[]>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const result = await buscarWorkspacesCompletos();
  dashboardCache.set(cacheKey, result, 1); // Cache por 1 minuto (dados dinâmicos)
  return result;
}

/**
 * Limpar cache quando dados são modificados - FASE 4: Invalidação inteligente
 */
export function invalidarCacheDashboard(): void {
  dashboardCache.clear();
  console.log('🧹 Cache do dashboard admin limpo');
}

/**
 * Função principal - busca todos os dados do dashboard (FASE 4: Com cache inteligente)
 */
export async function buscarDadosDashboardAdmin(): Promise<DashboardAdminDados> {
  const cacheKey = 'dashboard_admin_complete';
  
  // FASE 4: Tentar buscar do cache primeiro
  const cached = dashboardCache.get<DashboardAdminDados>(cacheKey);
  if (cached) {
    console.log('⚡ Dashboard admin carregado do cache');
    return cached;
  }
  
  try {
    const startTime = Date.now();
    console.log('🔄 Carregando dados do dashboard admin...');

    // FASE 4: Executar queries com cache individual em paralelo
    const [kpis, crescimento, usuariosCompletos, workspacesCompletos] = await Promise.all([
      buscarKPIMetricasComCache(),
      buscarDadosCrescimentoComCache(),
      buscarUsuariosCompletosComCache(),
      buscarWorkspacesCompletosComCache()
    ]);

    // Status do sistema (hardcoded por enquanto)
    const statusSistema = {
      online: true,
      ultimoBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
      uptime: '99.8%'
    };

    const resultado = {
      kpis,
      crescimento,
      usuariosCompletos,
      workspacesCompletos,
      // ✅ Compatibilidade - arrays vazios (não fazemos mais essas queries)
      usuariosRecentes: [],
      workspacesAtivos: [],
      statusSistema
    };
    
    // FASE 4: Cache do resultado completo por 1 minuto
    dashboardCache.set(cacheKey, resultado, 1);
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Dashboard admin carregado com sucesso em ${loadTime}ms`);

    return resultado;
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