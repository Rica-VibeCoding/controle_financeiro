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