'use client'

export const dynamic = 'force-dynamic'

import { useProjetosDashboard } from '@/hooks/usar-projetos-dados'
import { usarProjetosModo } from '@/hooks/usar-projetos-modo'
import { useState, useEffect } from 'react'

export default function DebugTogglePage() {
  const [logs, setLogs] = useState<string[]>([])
  const { data, isLoading, error } = useProjetosDashboard()
  const { mostrarPendentes, alternarModosPendentes, loading: loadingModo, config } = usarProjetosModo()

  const adicionarLog = (mensagem: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `${timestamp}: ${mensagem}`])
  }

  useEffect(() => {
    adicionarLog(`Hook inicializado - mostrarPendentes: ${mostrarPendentes}`)
  }, [])

  useEffect(() => {
    adicionarLog(`mostrarPendentes mudou para: ${mostrarPendentes}`)
  }, [mostrarPendentes])

  useEffect(() => {
    if (data) {
      adicionarLog(`Dados carregados - ${data.projetos.length} projetos`)
    }
  }, [data])

  const handleToggle = () => {
    adicionarLog('👆 Usuário clicou no toggle')
    alternarModosPendentes()
    adicionarLog('✅ Toggle executado - comportamento padrão SWR')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🐛 Debug Toggle Projetos</h1>
      
      {/* Estado atual */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Estado Atual:</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>mostrarPendentes: <strong className={mostrarPendentes ? 'text-green-600' : 'text-red-600'}>{String(mostrarPendentes)}</strong></div>
          <div>loadingModo: <strong>{String(loadingModo)}</strong></div>
          <div>isLoading: <strong>{String(isLoading)}</strong></div>
          <div>data existe: <strong>{data ? 'Sim' : 'Não'}</strong></div>
          <div>projetos count: <strong>{data?.projetos?.length || 0}</strong></div>
          <div>config.mostrarPendentes: <strong className={config.mostrarPendentes ? 'text-green-600' : 'text-red-600'}>{String(config.mostrarPendentes)}</strong></div>
        </div>
      </div>

      {/* Botão de teste */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Teste do Toggle:</h2>
        <button
          onClick={handleToggle}
          disabled={loadingModo}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            mostrarPendentes 
              ? 'bg-blue-500 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-700'
          } ${loadingModo ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          {mostrarPendentes ? '🟢 Incluindo Previstas' : '🔴 Apenas Realizadas'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Clique para alternar e veja os logs abaixo
        </p>
      </div>

      {/* Dados dos projetos */}
      {data && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Dados dos Projetos:</h2>
          {data.projetos.map(projeto => (
            <div key={projeto.id} className="border-l-4 border-green-500 pl-4 py-2 mb-2">
              <div className="font-medium">{projeto.nome}</div>
              <div className="text-sm text-gray-600">
                Receitas: R$ {projeto.total_receitas.toFixed(2)} | 
                Despesas: R$ {projeto.total_despesas.toFixed(2)} | 
                Resultado: <span className={projeto.resultado >= 0 ? 'text-green-600' : 'text-red-600'}>
                  R$ {projeto.resultado.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs em tempo real */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs">
        <h2 className="text-white text-sm font-bold mb-2">📋 Logs em tempo real:</h2>
        <div className="max-h-64 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))}
        </div>
      </div>

      {/* Função de teste localStorage */}
      <div className="mt-4">
        <button 
          onClick={() => {
            const storage = localStorage.getItem('configuracoes-projetos')
            adicionarLog(`📱 localStorage: ${storage}`)
          }}
          className="bg-yellow-500 text-white px-4 py-2 rounded text-sm"
        >
          Ver localStorage
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('configuracoes-projetos')
            adicionarLog('🗑️ localStorage limpo')
            window.location.reload()
          }}
          className="bg-red-500 text-white px-4 py-2 rounded text-sm ml-2"
        >
          Limpar localStorage
        </button>
      </div>
    </div>
  )
}