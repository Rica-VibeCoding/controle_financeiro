'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contextos/auth-contexto'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'

interface DebugPanelProps {
  abaAtiva: string
  componenteCarregado: boolean
}

interface LogEntry {
  timestamp: string
  tipo: 'info' | 'warn' | 'error' | 'success'
  mensagem: string
  dados?: any
}

export function DebugPanel({ abaAtiva, componenteCarregado }: DebugPanelProps) {
  const { user, workspace, loading: authLoading } = useAuth()
  const [expandido, setExpandido] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [monitorAtivo, setMonitorAtivo] = useState(false)

  // Adicionar log
  const addLog = (tipo: LogEntry['tipo'], mensagem: string, dados?: any) => {
    const log: LogEntry = {
      timestamp: new Date().toISOString(),
      tipo,
      mensagem,
      dados
    }
    setLogs(prev => [...prev.slice(-49), log]) // Manter últimos 50 logs
  }

  // Monitor de mudanças de estado
  useEffect(() => {
    if (!monitorAtivo) return

    addLog('info', 'Estado atualizado', {
      abaAtiva,
      componenteCarregado,
      authLoading,
      user: user?.id,
      workspace: workspace?.id
    })
  }, [abaAtiva, componenteCarregado, authLoading, user, workspace, monitorAtivo])

  // Detectar problema: conteúdo some
  useEffect(() => {
    if (!monitorAtivo) return

    if (!authLoading && user && workspace && !componenteCarregado) {
      addLog('error', '🚨 PROBLEMA DETECTADO: componente não carregado mesmo com auth OK', {
        authLoading,
        user: user.id,
        workspace: workspace.id,
        componenteCarregado
      })
    }

    if (!authLoading && (!user || !workspace)) {
      addLog('warn', '⚠️ Auth completo mas user/workspace ausente', {
        authLoading,
        user: !!user,
        workspace: !!workspace
      })
    }
  }, [authLoading, user, workspace, componenteCarregado, monitorAtivo])

  // Escutar evento de atualização
  useEffect(() => {
    if (!monitorAtivo) return

    const handleAtualizar = () => {
      addLog('success', '✅ Evento atualizarTransacoes disparado', {
        abaAtiva,
        timestamp: new Date().toISOString()
      })
    }

    window.addEventListener('atualizarTransacoes', handleAtualizar)
    return () => window.removeEventListener('atualizarTransacoes', handleAtualizar)
  }, [abaAtiva, monitorAtivo])

  // Teste de stress
  const executarTesteStress = () => {
    addLog('info', '🔥 Iniciando teste de stress', {})

    // Simular múltiplas mudanças de aba
    let count = 0
    const interval = setInterval(() => {
      window.dispatchEvent(new CustomEvent('atualizarTransacoes'))
      count++

      if (count >= 10) {
        clearInterval(interval)
        addLog('success', '✅ Teste de stress completo: 10 eventos disparados', { count })
      }
    }, 500)
  }

  // Limpar cache do workspace (forçar reload)
  const limparCacheWorkspace = () => {
    addLog('warn', '🧹 Limpando cache do workspace', {})
    // @ts-expect-error - acessar internals do AuthContext
    if (window.__workspaceCache) {
      // @ts-expect-error - acessar internals do AuthContext
      window.__workspaceCache = null
      addLog('success', '✅ Cache limpo - workspace será recarregado', {})
    }
  }

  // Informações do ambiente
  const getEstadoAtual = () => {
    return {
      timestamp: new Date().toISOString(),
      aba: abaAtiva,
      auth: {
        loading: authLoading,
        userId: user?.id,
        workspaceId: workspace?.id,
        workspaceNome: workspace?.nome
      },
      componente: {
        carregado: componenteCarregado
      },
      navegador: {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        memoria: (performance as any).memory?.usedJSHeapSize
          ? `${((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
          : 'N/A'
      }
    }
  }

  const exportarLogs = () => {
    const estado = getEstadoAtual()
    const relatorio = {
      estado,
      logs,
      exportadoEm: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-transacoes-${Date.now()}.json`
    a.click()

    addLog('success', '✅ Logs exportados', { totalLogs: logs.length })
  }

  if (!expandido) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setExpandido(true)}
          size="sm"
          className="shadow-lg bg-orange-600 hover:bg-orange-700 text-white gap-2"
        >
          <Icone name="file-search" className="w-4 h-4" />
          Debug Panel
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[600px] max-h-[600px] shadow-2xl">
      <Card className="border-orange-500 border-2">
        <CardHeader className="bg-orange-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icone name="file-search" className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">🔍 Debug Panel - Transações</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandido(false)}
              className="h-8 w-8 p-0"
            >
              <span className="text-lg">✕</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Estado Atual */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Icone name="activity" className="w-4 h-4" />
              Estado Atual
            </h4>
            <div className="bg-gray-50 rounded p-3 space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span>Aba Ativa:</span>
                <span className="font-bold text-blue-600">{abaAtiva}</span>
              </div>
              <div className="flex justify-between">
                <span>Componente Carregado:</span>
                <span className={componenteCarregado ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {componenteCarregado ? '✅ SIM' : '❌ NÃO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Auth Loading:</span>
                <span className={authLoading ? 'text-yellow-600 font-bold' : 'text-green-600 font-bold'}>
                  {authLoading ? '⏳ CARREGANDO' : '✅ PRONTO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className={user ? 'text-green-600' : 'text-red-600'}>
                  {user?.id?.substring(0, 8) || '❌ NULL'}...
                </span>
              </div>
              <div className="flex justify-between">
                <span>Workspace ID:</span>
                <span className={workspace ? 'text-green-600' : 'text-red-600'}>
                  {workspace?.id?.substring(0, 8) || '❌ NULL'}...
                </span>
              </div>
              <div className="flex justify-between">
                <span>Workspace Nome:</span>
                <span className="text-blue-600">{workspace?.nome || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Icone name="settings" className="w-4 h-4" />
              Controles
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={monitorAtivo ? 'default' : 'outline'}
                onClick={() => {
                  setMonitorAtivo(!monitorAtivo)
                  addLog('info', monitorAtivo ? 'Monitor pausado' : 'Monitor ativado', {})
                }}
                className="text-xs gap-1"
              >
                <span>{monitorAtivo ? '⏸️' : '▶️'}</span>
                {monitorAtivo ? 'Pausar' : 'Iniciar'} Monitor
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={executarTesteStress}
                className="text-xs gap-1"
              >
                <span>⚡</span>
                Teste Stress
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setLogs([])}
                className="text-xs gap-1"
              >
                <Icone name="trash-2" className="w-3 h-3" />
                Limpar Logs
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={exportarLogs}
                className="text-xs gap-1"
              >
                <span>💾</span>
                Exportar
              </Button>
            </div>
          </div>

          {/* Logs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Icone name="list" className="w-4 h-4" />
                Logs ({logs.length})
              </h4>
            </div>
            <div className="bg-gray-900 rounded p-3 max-h-[300px] overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">
                  Nenhum log ainda. Ative o monitor ou execute ações.
                </p>
              ) : (
                logs.slice().reverse().map((log, idx) => (
                  <div key={idx} className="text-xs font-mono border-b border-gray-800 pb-1">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                      <span className={
                        log.tipo === 'error' ? 'text-red-400' :
                        log.tipo === 'warn' ? 'text-yellow-400' :
                        log.tipo === 'success' ? 'text-green-400' :
                        'text-blue-400'
                      }>
                        {log.mensagem}
                      </span>
                    </div>
                    {log.dados && (
                      <pre className="text-gray-400 text-[10px] mt-1 ml-20 overflow-x-auto">
                        {JSON.stringify(log.dados, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Diagnóstico Automático */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Icone name="alert-triangle" className="w-4 h-4" />
              Diagnóstico
            </h4>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 space-y-2 text-xs">
              {!authLoading && user && workspace && componenteCarregado && (
                <div className="flex items-center gap-2 text-green-700">
                  <Icone name="check-circle-2" className="w-4 h-4" />
                  <span>✅ Sistema operando normalmente</span>
                </div>
              )}

              {authLoading && (
                <div className="flex items-center gap-2 text-yellow-700">
                  <Icone name="loader-2" className="w-4 h-4 animate-spin" />
                  <span>⏳ Aguardando autenticação...</span>
                </div>
              )}

              {!authLoading && !user && (
                <div className="flex items-center gap-2 text-red-700">
                  <span>❌</span>
                  <span>Usuário não autenticado</span>
                </div>
              )}

              {!authLoading && user && !workspace && (
                <div className="flex items-center gap-2 text-red-700">
                  <span>❌</span>
                  <span>Workspace não carregado - Cache expirado?</span>
                </div>
              )}

              {!authLoading && user && workspace && !componenteCarregado && (
                <div className="flex items-center gap-2 text-red-700">
                  <Icone name="alert-triangle" className="w-4 h-4" />
                  <span>🚨 PROBLEMA: Auth OK mas componente não inicializa!</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
