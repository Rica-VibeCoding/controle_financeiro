'use client'

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
    const agora = new Date();
    const dataPassada = new Date(data);
    const diffMs = agora.getTime() - dataPassada.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) return 'hoje';
    if (diffDias === 1) return 'ontem';
    if (diffDias < 7) return `há ${diffDias} dias`;
    if (diffDias < 30) {
      const semanas = Math.floor(diffDias / 7);
      return `há ${semanas} semana${semanas > 1 ? 's' : ''}`;
    }
    const meses = Math.floor(diffDias / 30);
    return `há ${meses} mês${meses > 1 ? 'es' : ''}`;
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