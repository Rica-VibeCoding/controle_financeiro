'use client'

import { LinhaConta } from './linha-conta'
import type { ContaPagarReceber, AbaContas } from '@/tipos/contas'

interface TabelaContasProps {
  contas: ContaPagarReceber[]
  isLoading: boolean
  abaAtiva: AbaContas
  onAbaChange: (aba: AbaContas) => void
  onMarcarComoRealizado: (id: string) => void
  onEditar: (id: string) => void
}

export function TabelaContas({
  contas,
  isLoading,
  abaAtiva,
  onAbaChange,
  onMarcarComoRealizado,
  onEditar
}: TabelaContasProps) {

  // Abas disponíveis
  const abas = [
    { id: 'a_pagar' as AbaContas, label: 'A Pagar', cor: 'blue' },
    { id: 'a_receber' as AbaContas, label: 'A Receber', cor: 'green' },
    { id: 'vencidas' as AbaContas, label: 'Vencidas', cor: 'red' }
  ]

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Abas */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {abas.map((aba) => (
              <button
                key={aba.id}
                className="px-6 py-3 border-b-2 border-transparent text-gray-500"
                disabled
              >
                {aba.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tabela Loading */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-8 w-8 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                  <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                  <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24 ml-auto" /></td>
                  <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                  <td className="px-4 py-4"><div className="h-8 bg-gray-200 rounded w-32 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Sistema de Abas */}
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex -mb-px">
          {abas.map((aba) => {
            const ativo = abaAtiva === aba.id
            const corClasses: Record<string, string> = {
              blue: ativo ? 'text-blue-600 border-blue-500' : 'text-gray-500',
              green: ativo ? 'text-green-600 border-green-500' : 'text-gray-500',
              red: ativo ? 'text-red-600 border-red-500' : 'text-gray-500'
            }

            return (
              <button
                key={aba.id}
                onClick={() => onAbaChange(aba.id)}
                className={`
                  relative px-6 py-3 text-sm font-medium transition-all border-b-2
                  ${ativo
                    ? `${corClasses[aba.cor]} bg-white`
                    : 'border-transparent hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {aba.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contato
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimento
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📋</span>
                    <p className="text-gray-500">
                      Nenhuma conta encontrada para este período
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              contas.map((conta) => (
                <LinhaConta
                  key={conta.id}
                  conta={conta}
                  onMarcarComoRealizado={onMarcarComoRealizado}
                  onEditar={onEditar}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer com total */}
      {contas.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Total: {contas.length} conta{contas.length !== 1 ? 's' : ''}
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {contas.reduce((sum, c) => sum + c.valor, 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
