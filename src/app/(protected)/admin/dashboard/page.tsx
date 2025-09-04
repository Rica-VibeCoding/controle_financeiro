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
    recarregar,
    alterarStatusUsuario // ← NOVA funcionalidade
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
              <Icone name="refresh-ccw" className="w-4 h-4 mr-2" />
              Tentar Novamente
            </button>
          </div>
        </div>
      </LayoutContainer>
    );
  }

  // Dashboard principal REFATORADO
  return (
    <LayoutContainer>
      <DashboardPrincipal
        dados={dados!}
        loading={loading}
        onRecarregar={recarregar}
        onToggleUsuario={alterarStatusUsuario} // ← NOVA funcionalidade
      />
    </LayoutContainer>
  );
}