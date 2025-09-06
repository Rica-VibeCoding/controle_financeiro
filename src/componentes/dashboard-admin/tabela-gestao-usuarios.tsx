'use client'

import { useState } from 'react';
import { Icone } from '@/componentes/ui/icone';
import { DropdownMenu } from '@/componentes/ui/dropdown-menu';
import { ConfirmModal } from '@/componentes/ui/confirm-modal';
import type { UsuarioCompleto, AcaoAdministrativa } from '@/tipos/dashboard-admin';

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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    usuario: UsuarioCompleto | null;
  }>({ isOpen: false, usuario: null });

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

  const handleRequestToggle = (usuario: UsuarioCompleto) => {
    setConfirmModal({ isOpen: true, usuario });
  };

  const handleConfirmToggle = async () => {
    if (!confirmModal.usuario) return;
    
    const { id, ativo } = confirmModal.usuario;
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
      setConfirmModal({ isOpen: false, usuario: null });
    }
  };

  const handleCancelToggle = () => {
    setConfirmModal({ isOpen: false, usuario: null });
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
        <div className="p-4 border-b border-gray-200 animate-pulse">
          <div className="mb-3">
            <div className="h-6 bg-gray-200 rounded w-80"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
        <div className="p-4 animate-pulse">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header otimizado para mobile */}
      <div className="p-4 border-b border-gray-200">
        {/* Linha 1: Título e contador inline */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            Gestão de Usuários
            <span className="ml-2 text-sm font-normal text-gray-600">
              | {usuariosFiltrados.length} de {usuarios.length} usuários
            </span>
          </h3>
        </div>

        {/* Linha 2: Busca e filtros responsivos */}
        <div className="flex items-center space-x-2">
          {/* Busca flex */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome, email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtros compactos */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as any)}
              className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Usuário</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Workspace</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Atividade</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Transações</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Cadastro</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150">
                {/* Status */}
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${usuario.ativo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${obterCorStatus(usuario.atividadeStatus)}`}>
                      {usuario.atividadeStatus.replace('_', ' ')}
                    </span>
                  </div>
                </td>

                {/* Usuário */}
                <td className="py-3 px-4">
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
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-700">{usuario.workspaceNome}</div>
                </td>

                {/* Atividade */}
                <td className="py-3 px-4">
                  <div className="text-sm">
                    <span className="text-gray-600">
                      {formatarDataRelativa(usuario.lastActivity)}
                    </span>
                  </div>
                </td>

                {/* Transações */}
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-gray-700">
                    {usuario.totalTransacoes.toLocaleString('pt-BR')}
                  </div>
                </td>

                {/* Cadastro */}
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-600">
                    {formatarDataRelativa(usuario.createdAt)}
                  </div>
                </td>

                {/* Ações */}
                <td className="py-3 px-4">
                  <DropdownMenu
                    items={[
                      {
                        label: usuario.ativo ? 'Desativar Usuário' : 'Ativar Usuário',
                        icon: usuario.ativo ? 'user-minus' : 'user-plus',
                        onClick: () => handleRequestToggle(usuario),
                        disabled: processando === usuario.id || usuario.superAdmin,
                        variant: usuario.ativo ? 'destructive' : 'default'
                      }
                    ]}
                    disabled={processando === usuario.id || usuario.superAdmin}
                  />
                  {processando === usuario.id && (
                    <div className="inline-flex items-center ml-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelToggle}
        onConfirm={handleConfirmToggle}
        title={confirmModal.usuario?.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
        description={
          confirmModal.usuario?.ativo 
            ? `Tem certeza que deseja desativar o usuário "${confirmModal.usuario.nome}"? O usuário perderá acesso ao sistema.`
            : `Tem certeza que deseja ativar o usuário "${confirmModal.usuario?.nome}"? O usuário terá acesso ao sistema novamente.`
        }
        confirmText={confirmModal.usuario?.ativo ? 'Desativar' : 'Ativar'}
        variant={confirmModal.usuario?.ativo ? 'destructive' : 'default'}
        icon={confirmModal.usuario?.ativo ? 'user-minus' : 'user-plus'}
        loading={processando === confirmModal.usuario?.id}
      />
    </div>
  );
}