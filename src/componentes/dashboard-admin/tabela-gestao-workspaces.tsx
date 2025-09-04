'use client'

import { useState } from 'react';
import { Icone } from '@/componentes/ui/icone';
import type { WorkspaceCompleto } from '@/tipos/dashboard-admin';

/**
 * Formatador de data seguro - sem dependências externas
 */
function formatarDataRelativa(data: string | null): string {
  if (!data) return 'Nunca';
  
  try {
    const agora = new Date();
    const dataObj = new Date(data);
    const diffMs = agora.getTime() - dataObj.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutos < 60) return `há ${diffMinutos} min`;
    if (diffHoras < 24) return `há ${diffHoras}h`;
    if (diffDias < 30) return `há ${diffDias} dias`;
    
    return dataObj.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
}

interface TabelaGestaoWorkspacesProps {
  workspaces: WorkspaceCompleto[];
  loading?: boolean;
}

/**
 * Obter cor do indicador baseado na atividade
 */
function obterCorAtividade(status: WorkspaceCompleto['statusWorkspace']) {
  switch (status) {
    case 'muito_ativo': return 'text-green-600 bg-green-100';
    case 'ativo': return 'text-blue-600 bg-blue-100';
    case 'moderado': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-red-600 bg-red-100';
  }
}

/**
 * Obter cor do badge do plano
 */
function obterCorPlano(plano: WorkspaceCompleto['plano']) {
  switch (plano) {
    case 'free': return 'text-gray-600 bg-gray-100';
    case 'pro': return 'text-blue-600 bg-blue-100';
    case 'enterprise': return 'text-purple-600 bg-purple-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Tabela COMPLETA para gestão de workspaces
 * Inclui filtros, busca e métricas detalhadas
 */
export function TabelaGestaoWorkspaces({ workspaces, loading = false }: TabelaGestaoWorkspacesProps) {
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [filtroPlano, setFiltroPlano] = useState<'todos' | 'free' | 'pro' | 'enterprise'>('todos');
  const [busca, setBusca] = useState('');

  // Filtrar workspaces
  const workspacesFiltrados = workspaces.filter(workspace => {
    // Filtro por status
    if (filtro === 'ativos' && !workspace.ativo) return false;
    if (filtro === 'inativos' && workspace.ativo) return false;
    
    // Filtro por plano
    if (filtroPlano !== 'todos' && workspace.plano !== filtroPlano) return false;
    
    // Filtro por busca
    if (busca) {
      const buscaLower = busca.toLowerCase();
      return (
        workspace.nome.toLowerCase().includes(buscaLower) ||
        workspace.ownerEmail.toLowerCase().includes(buscaLower)
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-28"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 bg-gray-200 rounded w-56"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
        <div className="p-4 animate-pulse">
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header compacto com busca inline */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Título e contador */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gestão de Workspaces</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {workspacesFiltrados.length} de {workspaces.length} workspaces
            </p>
          </div>

          {/* Busca e filtros inline */}
          <div className="flex items-center space-x-3">
            {/* Busca compacta */}
            <div className="w-56">
              <input
                type="text"
                placeholder="Buscar por nome ou owner..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtros compactos */}
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>

            <select
              value={filtroPlano}
              onChange={(e) => setFiltroPlano(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Planos</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Workspace</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Owner</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Plano</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Usuários</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Transações</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Volume</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Atividade</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {workspacesFiltrados.map((workspace) => (
              <tr key={workspace.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150">
                {/* Workspace */}
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${workspace.ativo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <div className="font-medium text-gray-900">{workspace.nome}</div>
                      <div className="text-xs text-gray-500">
                        {formatarDataRelativa(workspace.createdAt)}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Owner */}
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-700">{workspace.ownerEmail}</div>
                </td>

                {/* Plano */}
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${obterCorPlano(workspace.plano)}`}>
                    {workspace.plano.toUpperCase()}
                  </span>
                </td>

                {/* Usuários */}
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <Icone name="users" className="w-4 h-4 text-gray-400" />
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">{workspace.totalUsuarios}</span>
                      <span className="text-gray-500 ml-1">
                        ({workspace.usuariosAtivos} ativos)
                      </span>
                    </div>
                  </div>
                </td>

                {/* Transações */}
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <Icone name="activity" className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {workspace.totalTransacoes.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </td>

                {/* Volume */}
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-gray-700">
                    R$ {workspace.volumeTotal.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                </td>

                {/* Atividade */}
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-600">
                    {formatarDataRelativa(workspace.ultimaAtividade)}
                  </div>
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obterCorAtividade(workspace.statusWorkspace)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                      workspace.statusWorkspace === 'muito_ativo' ? 'bg-green-600' : 
                      workspace.statusWorkspace === 'ativo' ? 'bg-blue-600' :
                      workspace.statusWorkspace === 'moderado' ? 'bg-yellow-600' : 'bg-red-600'
                    }`}></div>
                    {workspace.statusWorkspace === 'muito_ativo' ? 'Muito Ativo' :
                     workspace.statusWorkspace === 'ativo' ? 'Ativo' :
                     workspace.statusWorkspace === 'moderado' ? 'Moderado' : 'Inativo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}