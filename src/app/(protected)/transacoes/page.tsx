'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { mutate } from 'swr'
import { Button } from '@/componentes/ui/button'
import { SplitButton } from '@/componentes/ui/split-button'
import { ListaReceitas } from '@/componentes/transacoes/lista-receitas'
import { ListaDespesas } from '@/componentes/transacoes/lista-despesas'
import { ListaPrevistas } from '@/componentes/transacoes/lista-previstas'
import { ListaRecorrentes } from '@/componentes/transacoes/lista-recorrentes'
import { useModais } from '@/contextos/modais-contexto'
import { Icone } from '@/componentes/ui/icone'
import { ProtectedNavItem } from '@/componentes/ui/protected-link'
import { usePermissoes } from '@/hooks/usar-permissoes'
import { useAuth } from '@/contextos/auth-contexto'
import { ErrorBoundary } from '@/componentes/ui/error-boundary'

// Import direto para teste - remover lazy loading temporariamente
import { ModalTransferencia } from '@/componentes/modais/modal-transferencia'
import { ModalLancamento } from '@/componentes/modais/modal-lancamento'
import { ModalParcelamento } from '@/componentes/modais/modal-parcelamento'
import { ModalImportacaoCSV } from '@/componentes/importacao/modal-importacao-csv'

// Definição das abas com suas permissões - Despesas primeiro (padrão)
const ABAS_TRANSACOES = [
  {
    key: 'despesas',
    label: 'Despesas', 
    permissao: 'despesas' as const,
    icon: 'trending-down',
    color: 'text-red-600'
  },
  {
    key: 'receitas',
    label: 'Receitas',
    permissao: 'receitas' as const,
    icon: 'trending-up',
    color: 'text-green-600'
  },
  {
    key: 'previstas',
    label: 'Previstas',
    permissao: 'previstas' as const,
    icon: 'clock',
    color: 'text-yellow-600'
  },
  {
    key: 'recorrentes',
    label: 'Recorrentes',
    permissao: 'recorrentes' as const,
    icon: 'refresh-ccw',
    color: 'text-purple-600'
  }
] as const

type AbaKey = typeof ABAS_TRANSACOES[number]['key']

function TransacoesPageContent() {
  const { modalAberto, dadosModal, abrirModal, fecharModal } = useModais()
  const { verificarPermissao, loading: permissoesLoading } = usePermissoes()
  const { user, workspace, loading: authLoading } = useAuth()
  
  // Função para atualizar listas após mudanças (sem reload da página)
  const atualizarListasTransacoes = useCallback(() => {
    if (!workspace) return
    
    try {
      // Forçar atualização das listas através de evento customizado
      window.dispatchEvent(new CustomEvent('atualizarTransacoes'))
      
      // Invalidar cache SWR relacionado (dashboard, etc)
      mutate((key: any) => 
        Array.isArray(key) && key[0]?.includes('dashboard') && key[1] === workspace.id
      )
    } catch (error) {
      console.error('Erro ao atualizar listas:', error)
    }
  }, [workspace])
  
  // Debug logging para rastrear problemas
  const isDev = process.env.NODE_ENV === 'development'
  
  // Estado simplificado - apenas aba ativa
  const [abaAtiva, setAbaAtiva] = useState<AbaKey>('despesas')
  const [componenteCarregado, setComponenteCarregado] = useState(false)

  // Memoizar primeira aba permitida
  const primeiraAbaPermitida = useMemo((): AbaKey => {
    if (permissoesLoading) return 'despesas'
    return ABAS_TRANSACOES.find(aba => verificarPermissao(aba.permissao))?.key || 'despesas'
  }, [verificarPermissao, permissoesLoading])

  // Debug: Log estados críticos
  useEffect(() => {
    if (isDev) {
      console.log('🔍 TransacoesPage State:', {
        authLoading,
        permissoesLoading,
        user: user?.id,
        workspace: workspace?.id,
        abaAtiva,
        componenteCarregado,
        timestamp: new Date().toISOString()
      })
    }
  }, [authLoading, permissoesLoading, user, workspace, abaAtiva, componenteCarregado, isDev])

  // Inicialização simplificada do componente
  useEffect(() => {
    if (!authLoading && !permissoesLoading && user && workspace) {
      setAbaAtiva(primeiraAbaPermitida)
      setComponenteCarregado(true)
      
      if (isDev) {
        console.log('✅ TransacoesPage: Componente inicializado', {
          abaAtiva: primeiraAbaPermitida,
          user: user.id,
          workspace: workspace.id
        })
      }
    }
  }, [authLoading, permissoesLoading, user, workspace, primeiraAbaPermitida, isDev])

  // Navegar para aba (otimizada com useCallback)
  const navegarParaAba = useCallback((aba: AbaKey) => {
    setAbaAtiva(aba)
  }, [])


  // Renderizar conteúdo baseado na aba ativa
  const renderConteudoAba = useMemo(() => {
    // Fallback robusto - sempre mostrar algo
    if (!componenteCarregado || !user || !workspace) {
      if (isDev) {
        console.log('⚠️ Conteúdo não carregado:', { componenteCarregado, user: !!user, workspace: !!workspace })
      }
      return (
        <div className="text-center py-12 border rounded-lg">
          <div className="space-y-4">
            <div className="text-4xl opacity-50">⏳</div>
            <p className="text-sm text-muted-foreground">
              Carregando transações...
            </p>
          </div>
        </div>
      )
    }

    switch (abaAtiva) {
      case 'receitas':
        return <ListaReceitas />
      case 'despesas':
        return <ListaDespesas />
      case 'previstas':
        return <ListaPrevistas />
      case 'recorrentes':
        return <ListaRecorrentes />
      default:
        return <ListaDespesas />
    }
  }, [abaAtiva, componenteCarregado, user, workspace, isDev])

  // Condições mais robustas para loading
  const estaCarregando = authLoading || permissoesLoading || !user || !workspace
  
  if (estaCarregando) {
    return (
      <div className="max-w-full mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Transações
            </h1>
          </div>
        </div>
        
        {/* Skeleton das abas */}
        <div className="flex border-b">
          {ABAS_TRANSACOES.map((aba) => (
            <div
              key={aba.key}
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground animate-pulse flex items-center gap-2"
            >
              <div className="w-4 h-4 bg-muted rounded" />
              {aba.label}
            </div>
          ))}
        </div>

        {/* Loading content */}
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  // Adicionar fallback de emergência - NUNCA retornar vazio
  if (!user || !workspace) {
    if (isDev) {
      console.error('🚨 FALLBACK DE EMERGÊNCIA: user ou workspace ausente', { user: !!user, workspace: !!workspace })
    }
    return (
      <div className="max-w-full mx-auto px-4 space-y-6">
        <div className="flex items-center justify-center min-h-[400px] border rounded-lg">
          <div className="text-center space-y-4">
            <div className="text-6xl opacity-50">🔄</div>
            <h3 className="text-lg font-medium">Reconectando...</h3>
            <p className="text-sm text-muted-foreground">
              Verificando autenticação e workspace
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Recarregar Página
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="max-w-full mx-auto px-4 space-y-6 opacity-100 transition-opacity duration-200"
      style={{ 
        minHeight: '400px' // Evitar layout shift
      }}
    >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Transações
            </h1>
          </div>
          
          <div className="flex gap-2">
            <SplitButton
              primaryLabel="Nova Transação"
              primaryIcon="plus-circle"
              onPrimaryClick={() => abrirModal('lancamento')}
              actions={[
                {
                  label: 'Parcelar',
                  icon: 'credit-card',
                  onClick: () => abrirModal('parcelamento')
                },
                {
                  label: 'Transferir',
                  icon: 'arrow-left-right',
                  onClick: () => abrirModal('transferencia')
                },
                {
                  label: 'Importar CSV',
                  icon: 'folder',
                  onClick: () => abrirModal('importacao')
                }
              ]}
            />
          </div>
        </div>

        {/* Abas de navegação protegidas */}
        <div className="flex border-b">
          {ABAS_TRANSACOES.map((aba) => (
            <ProtectedNavItem
              key={aba.key}
              permissaoNecessaria={aba.permissao}
            >
              <button
                onClick={() => navegarParaAba(aba.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 ${
                  abaAtiva === aba.key
                    ? 'border-primary text-primary bg-primary/5 shadow-sm'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icone 
                  name={aba.icon} 
                  className={`w-4 h-4 transition-colors ${
                    abaAtiva === aba.key ? aba.color : 'text-current'
                  }`} 
                />
                {aba.label}
              </button>
            </ProtectedNavItem>
          ))}
        </div>

        {/* Conteúdo da aba ativa com Error Boundary */}
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('🚨 Erro na aba ativa:', { 
              aba: abaAtiva, 
              error: error.message, 
              componenteCarregado,
              user: user?.id,
              workspace: workspace?.id
            })
          }}
          fallback={
            <div className="text-center py-12 border border-orange-200 rounded-lg bg-orange-50">
              <div className="space-y-4">
                <div className="text-4xl opacity-50">⚠️</div>
                <h3 className="text-lg font-medium text-orange-800">
                  Erro ao carregar {ABAS_TRANSACOES.find(a => a.key === abaAtiva)?.label || 'aba'}
                </h3>
                <p className="text-sm text-orange-600">
                  Tente alternar para outra aba ou recarregar a página
                </p>
                <div className="flex gap-2 justify-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navegarParaAba('despesas')}
                    className="text-orange-700 border-orange-300 hover:bg-orange-100"
                  >
                    Ir para Despesas
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="text-orange-700 border-orange-300 hover:bg-orange-100"
                  >
                    Recarregar
                  </Button>
                </div>
              </div>
            </div>
          }
        >
          {renderConteudoAba}
        </ErrorBoundary>

        {/* Modais globais */}
        <ModalLancamento
          isOpen={modalAberto === 'lancamento'}
          onClose={fecharModal}
          onSuccess={atualizarListasTransacoes}
          transacaoId={dadosModal?.transacaoId}
        />
        
        <ModalParcelamento
          isOpen={modalAberto === 'parcelamento'}
          onClose={fecharModal}
          onSuccess={atualizarListasTransacoes}
        />
        
        <ModalTransferencia 
          isOpen={modalAberto === 'transferencia'}
          onClose={fecharModal}
          onSuccess={atualizarListasTransacoes}
        />

        <ModalImportacaoCSV
          isOpen={modalAberto === 'importacao'}
          onClose={fecharModal}
          onSuccess={atualizarListasTransacoes}
        />
      </div>
  )
}

// Wrapper principal com ErrorBoundary global
export default function TransacoesPage() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('🚨 ERRO CRÍTICO na página de transações:', { 
          error: error.message, 
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        })
      }}
      fallback={
        <div className="max-w-full mx-auto px-4 space-y-6">
          <div className="flex items-center justify-center min-h-[400px] border border-red-200 rounded-lg bg-red-50">
            <div className="text-center space-y-4 p-8">
              <div className="text-6xl opacity-50">💥</div>
              <h3 className="text-lg font-medium text-red-800">
                Erro crítico na página de transações
              </h3>
              <p className="text-sm text-red-600 max-w-md">
                A página encontrou um erro inesperado. Tente recarregar ou volte ao dashboard.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/dashboard'}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  Ir para Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  Recarregar Página
                </Button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <TransacoesPageContent />
    </ErrorBoundary>
  )
}