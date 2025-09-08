'use client'

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CardKPI } from './card-kpi';
import { GraficoCrescimento } from './grafico-crescimento';
import { TabelaGestaoUsuarios } from './tabela-gestao-usuarios';
import { TabelaGestaoWorkspaces } from './tabela-gestao-workspaces';
import { Tabs, TabPanel } from '@/componentes/ui/tabs';
import { Icone } from '@/componentes/ui/icone';
import type { DashboardAdminDados } from '@/tipos/dashboard-admin';

interface DashboardPrincipalProps {
  dados: DashboardAdminDados;
  loading: boolean;
  onRecarregar: () => void;
  // 🆕 NOVA funcionalidade administrativa
  onToggleUsuario: (id: string, ativo: boolean) => Promise<import('@/tipos/dashboard-admin').AcaoAdministrativa>;
}

/**
 * Formatar crescimento de usuários de forma mais intuitiva
 * FASE 2: Melhoria visual para casos de início de sistema
 * FASE 3: Validações robustas e tratamento de casos extremos
 */
function formatarCrescimentoUsuarios(crescimentoPercentual: number, totalUsuarios: number): {
  valor: string;
  subtitulo: string;
} {
  // FASE 3: Validações de entrada
  const crescimentoSeguro = isNaN(crescimentoPercentual) || !isFinite(crescimentoPercentual) ? 0 : crescimentoPercentual;
  const totalSeguro = isNaN(totalUsuarios) || !isFinite(totalUsuarios) || totalUsuarios < 0 ? 0 : Math.floor(totalUsuarios);
  
  // FASE 3: Caso especial - sem usuários
  if (totalSeguro === 0) {
    return {
      valor: '0',
      subtitulo: 'nenhum usuário'
    };
  }
  
  // Caso especial: sistema novo (100% = todos os usuários são novos)
  if (crescimentoSeguro === 100 && totalSeguro <= 10) {
    return {
      valor: `+${totalSeguro}`,
      subtitulo: totalSeguro === 1 ? 'novo usuário' : 'novos usuários'
    };
  }
  
  // FASE 3: Casos extremos de crescimento
  if (crescimentoSeguro > 1000) {
    return {
      valor: '+999%',
      subtitulo: 'crescimento excepcional'
    };
  }
  
  if (crescimentoSeguro < -100) {
    return {
      valor: '-100%',
      subtitulo: 'declínio acentuado'
    };
  }
  
  // Caso normal: crescimento percentual com precisão limitada
  const percentualFormatado = Math.round(crescimentoSeguro * 10) / 10; // 1 decimal
  const sinal = percentualFormatado > 0 ? '+' : '';
  return {
    valor: `${sinal}${percentualFormatado}%`,
    subtitulo: 'vs mês anterior'
  };
}

/**
 * Componente principal do dashboard administrativo com TABS
 * FASE 3: Sistema de navegação organizado
 * Layout otimizado com conteúdo separado por contexto
 */
export function DashboardPrincipal({ dados, loading, onRecarregar, onToggleUsuario }: DashboardPrincipalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'usuarios');

  const { kpis, crescimento, usuariosCompletos = [], workspacesCompletos = [] } = dados || {};

  // Configuração das tabs
  const tabs = [
    { id: 'usuarios', label: 'Usuários', icon: 'users' as const, count: usuariosCompletos.length },
    { id: 'workspaces', label: 'Workspaces', icon: 'building' as const, count: workspacesCompletos.length },
    { id: 'metricas', label: 'Métricas', icon: 'line-chart' as const }
  ];

  // Função para trocar tab e atualizar URL
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', tabId);
    router.push(`?${newParams.toString()}`, { scroll: false });
  };
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton Limpo */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-9 bg-gray-200 rounded w-80 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 bg-gray-200 rounded-full w-32 animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* KPIs Skeleton - compactos */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-6 h-6 bg-gray-100 rounded-md animate-pulse"></div>
                <div className="w-12 h-3 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-gray-100 rounded w-16 animate-pulse"></div>
                <div className="h-6 bg-gray-100 rounded w-12 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-12 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 -mb-px">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2 py-4">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-5 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="h-9 bg-gray-200 rounded-md flex-1 max-w-md animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded-md w-24 animate-pulse"></div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Dados já extraídos no início da função

  return (
    <div className="space-y-6">
      {/* Header Otimizado para Mobile */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">
              Dashboard Administrativo
            </h1>
          </div>
          
          {/* Actions Header Compactas */}
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
              <span className="hidden sm:inline">Atualizado </span>há {Math.floor((Date.now() - Date.now()) / 60000) || 0}min
            </div>
            <button
              onClick={onRecarregar}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              title="Atualizar dados"
            >
              <Icone name="refresh-ccw" className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seção KPIs - FASE 3: Validações robustas */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <CardKPI
          titulo="Usuários Ativos"
          valor={(kpis?.usuariosAtivos ?? 0).toLocaleString('pt-BR')}
          icone="users"
          cor="azul"
          subtitulo={`${(kpis?.totalUsuarios ?? 0).toLocaleString('pt-BR')} total`}
        />
        
        <CardKPI
          titulo="Workspaces"
          valor={(kpis?.workspacesComTransacoes ?? 0).toLocaleString('pt-BR')}
          icone="building"
          cor="roxo"
          subtitulo={`${(kpis?.totalWorkspaces ?? 0).toLocaleString('pt-BR')} total`}
        />
        
        <CardKPI
          titulo="Transações"
          valor={(kpis?.totalTransacoes ?? 0).toLocaleString('pt-BR')}
          icone="activity"
          cor="verde"
          subtitulo="Volume processado"
        />
        
        <CardKPI
          titulo="Crescimento"
          valor={formatarCrescimentoUsuarios(kpis?.crescimentoPercentual ?? 0, kpis?.totalUsuarios ?? 0).valor}
          icone="trending-up"
          cor="laranja"
          subtitulo={formatarCrescimentoUsuarios(kpis?.crescimentoPercentual ?? 0, kpis?.totalUsuarios ?? 0).subtitulo}
          tendencia={{
            percentual: kpis?.crescimentoPercentual ?? 0,
            periodo: formatarCrescimentoUsuarios(kpis?.crescimentoPercentual ?? 0, kpis?.totalUsuarios ?? 0).subtitulo
          }}
        />
      </div>

      {/* Sistema de Tabs - FASE 3 */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange}>
        
        {/* Tab Panel: Usuários */}
        <TabPanel id="usuarios" activeTab={activeTab}>
          <TabelaGestaoUsuarios 
            usuarios={usuariosCompletos}
            loading={loading}
            onToggleUsuario={onToggleUsuario}
          />
        </TabPanel>

        {/* Tab Panel: Workspaces */}
        <TabPanel id="workspaces" activeTab={activeTab}>
          <TabelaGestaoWorkspaces 
            workspaces={workspacesCompletos}
            loading={loading}
          />
        </TabPanel>

        {/* Tab Panel: Métricas (Gráfico movido aqui) */}
        <TabPanel id="metricas" activeTab={activeTab}>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Crescimento Histórico
              </h3>
              <div className="bg-white rounded-lg border border-gray-200">
                <GraficoCrescimento 
                  dados={crescimento || []} 
                  loading={false}
                />
              </div>
            </div>
          </div>
        </TabPanel>

      </Tabs>
    </div>
  );
}