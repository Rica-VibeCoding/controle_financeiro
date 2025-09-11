'use client'

import { useState, useEffect } from 'react'
import { obterProjetosPessoais } from '@/servicos/supabase/projetos-pessoais'
import { useAuth } from '@/contextos/auth-contexto'

export default function TestProjetosPage() {
  const { workspace } = useAuth()
  const [incluirPendentes, setIncluirPendentes] = useState(false)
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const buscarDados = async () => {
    if (!workspace) return
    
    setLoading(true)
    try {
      const resultado = await obterProjetosPessoais(
        { 
          apenas_ativos: true,
          incluir_pendentes: incluirPendentes 
        },
        workspace.id
      )
      setDados(resultado)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    buscarDados()
  }, [incluirPendentes, workspace])

  if (!workspace) return <div>Carregando...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Teste: Projetos com Transações Previstas</h1>
      
      {/* Controle do Toggle */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between">
          <label className="text-lg font-medium">
            Modo de visualização:
          </label>
          <button
            onClick={() => setIncluirPendentes(!incluirPendentes)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              incluirPendentes 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {incluirPendentes ? '✅ Incluindo Previstas' : '❌ Apenas Realizadas'}
          </button>
          <div className="text-xs text-green-600 mt-2">
            🚀 NOVO: Atualização instantânea implementada!
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Estado atual: <strong>{incluirPendentes ? 'INCLUINDO' : 'EXCLUINDO'}</strong> transações previstas
        </p>
      </div>

      {/* Resultados */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Dados do Banco:</h2>
        
        {loading ? (
          <div>Carregando...</div>
        ) : dados ? (
          <div>
            {/* Resumo Geral */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">📊 Resumo Geral:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total Projetos: <strong>{dados.resumo.total_projetos}</strong></div>
                <div>Projetos Ativos: <strong>{dados.resumo.projetos_ativos}</strong></div>
                <div>Total Receitas: <strong>R$ {dados.resumo.total_receitas.toFixed(2)}</strong></div>
                <div>Total Despesas: <strong>R$ {dados.resumo.total_despesas.toFixed(2)}</strong></div>
                <div className="col-span-2">
                  Resultado Geral: 
                  <strong className={dados.resumo.resultado_geral >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {' '}R$ {dados.resumo.resultado_geral.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Projetos Individuais */}
            <h3 className="font-medium mb-2">📁 Projetos:</h3>
            {dados.projetos.length > 0 ? (
              <div className="space-y-3">
                {dados.projetos.map((projeto: any) => (
                  <div key={projeto.id} className="border p-3 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-green-600">{projeto.nome}</h4>
                      <span className={`text-sm px-2 py-1 rounded ${
                        projeto.resultado >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        R$ {projeto.resultado.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>Receitas: R$ {projeto.total_receitas.toFixed(2)}</div>
                      <div>Despesas: R$ {projeto.total_despesas.toFixed(2)}</div>
                      <div>Modo: {projeto.modo_calculo}</div>
                      <div>Status: <span className={`font-medium text-${projeto.status_cor === 'verde' ? 'green' : projeto.status_cor === 'vermelho' ? 'red' : 'gray'}-600`}>
                        {projeto.status_descricao}
                      </span></div>
                    </div>
                    {projeto.modo_calculo === 'orcamento' && (
                      <div className="mt-2 text-sm">
                        Orçamento: R$ {projeto.valor_orcamento?.toFixed(2) || '0'} | 
                        Restante: R$ {projeto.valor_restante_orcamento?.toFixed(2) || '0'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum projeto com movimentação encontrado</p>
            )}
          </div>
        ) : (
          <div>Sem dados</div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-medium mb-2">🔍 Debug:</h3>
        <div className="text-xs font-mono">
          <div>Filtro aplicado: {JSON.stringify({ incluir_pendentes: incluirPendentes })}</div>
          <div>SQL esperado: {incluirPendentes 
            ? "WHERE status IN ('realizado', 'previsto')" 
            : "WHERE status = 'realizado'"}</div>
          <div className="mt-2">
            <strong>Dados do projeto "Casa do Mato" no banco:</strong>
            <div>- Realizadas: 1 transação = R$ 4,75</div>
            <div>- Previstas: 1 transação = R$ 1.000,00</div>
            <div className="mt-1">
              {incluirPendentes 
                ? "✅ Deve mostrar: R$ -1.004,75 (soma tudo)" 
                : "✅ Deve mostrar: R$ -4,75 (só realizadas)"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}