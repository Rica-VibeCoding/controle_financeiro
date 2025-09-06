/**
 * Hook para funcionalidades de Dashboard Admin
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import { buscarDadosDashboardAdmin, verificarAcessoSuperAdmin, alterarStatusUsuario } from '@/servicos/supabase/dashboard-admin';
import type { DashboardAdminDados, AcaoAdministrativa } from '@/tipos/dashboard-admin';

interface UsarDashboardAdminReturn {
  dados: DashboardAdminDados | null;
  loading: boolean;
  error: string | null;
  temAcesso: boolean;
  verificandoAcesso: boolean;
  recarregar: () => Promise<void>;
  // 🆕 Funcionalidades administrativas
  alterarStatusUsuario: (usuarioId: string, ativo: boolean) => Promise<AcaoAdministrativa>;
}

/**
 * Hook para gerenciar dados do dashboard administrativo
 * FASE 4: Com otimizações de performance e memoização
 */
export function usarDashboardAdmin(): UsarDashboardAdminReturn {
  const [dados, setDados] = useState<DashboardAdminDados | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [temAcesso, setTemAcesso] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);

  // FASE 4: Memoização dos dados para evitar re-renderizações desnecessárias
  const dadosMemoizados = useMemo(() => dados, [dados]);

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
   * Carrega dados do dashboard - FASE 4: Otimizado com debounce implícito
   */
  const carregarDados = useCallback(async () => {
    if (!temAcesso) return;

    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      console.log('📊 Carregando dashboard admin...');
      
      const dadosDashboard = await buscarDadosDashboardAdmin();
      
      setDados(dadosDashboard);
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ Dashboard admin carregado em ${loadTime}ms`);
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
   * 🆕 Função para alterar status de usuário (ativar/desativar)
   */
  const handleAlterarStatusUsuario = useCallback(async (usuarioId: string, ativo: boolean): Promise<AcaoAdministrativa> => {
    if (!temAcesso) {
      return {
        sucesso: false,
        mensagem: 'Acesso negado: permissão insuficiente'
      };
    }

    try {
      console.log(`🔄 ${ativo ? 'Ativando' : 'Desativando'} usuário ${usuarioId}...`);
      
      const resultado = await alterarStatusUsuario(usuarioId, ativo);
      
      if (resultado.sucesso) {
        console.log(`✅ Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`);
        // Recarregar dados após mudança
        await carregarDados();
      } else {
        console.error(`❌ Falha ao ${ativo ? 'ativar' : 'desativar'} usuário:`, resultado.mensagem);
      }
      
      return resultado;
    } catch (error) {
      console.error('❌ Erro ao alterar status do usuário:', error);
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, [temAcesso, carregarDados]);

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

  // FASE 4: Return otimizado com memoização
  return useMemo(() => ({
    dados: dadosMemoizados,
    loading,
    error,
    temAcesso,
    verificandoAcesso,
    recarregar,
    // 🆕 Funcionalidades administrativas
    alterarStatusUsuario: handleAlterarStatusUsuario
  }), [
    dadosMemoizados, 
    loading, 
    error, 
    temAcesso, 
    verificandoAcesso, 
    recarregar, 
    handleAlterarStatusUsuario
  ]);
}