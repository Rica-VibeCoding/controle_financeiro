'use client'

import { useEffect } from 'react'
import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { Icone } from '@/componentes/ui/icone'
import { NovaTransacao } from '@/tipos/database'

interface SecaoRecorrenciaProps {
  dados: Partial<NovaTransacao>
  onUpdate: (campo: string, valor: any) => void
}

export function SecaoRecorrencia({
  dados,
  onUpdate
}: SecaoRecorrenciaProps) {
  
  // Função para calcular próxima data baseada na data de vencimento e frequência
  const calcularProximaData = (dataVencimento: string | undefined, frequencia: string | undefined): string => {
    if (!dataVencimento || !frequencia) return ''
    
    const data = new Date(dataVencimento)
    
    switch (frequencia) {
      case 'diario':
        data.setDate(data.getDate() + 1)
        break
      case 'semanal':
        data.setDate(data.getDate() + 7)
        break
      case 'mensal':
        data.setMonth(data.getMonth() + 1)
        break
      case 'anual':
        data.setFullYear(data.getFullYear() + 1)
        break
      default:
        // Se não tem frequência ainda, assume mensal
        data.setMonth(data.getMonth() + 1)
    }
    
    return data.toISOString().split('T')[0]
  }

  // Auto-calcular próxima recorrência baseada na data de vencimento
  useEffect(() => {
    if (dados.recorrente && dados.data_vencimento && dados.frequencia_recorrencia) {
      const proximaData = calcularProximaData(dados.data_vencimento, dados.frequencia_recorrencia)
      // Só atualiza se for diferente do valor atual
      if (proximaData !== dados.proxima_recorrencia) {
        onUpdate('proxima_recorrencia', proximaData)
      }
    }
  }, [dados.recorrente, dados.data_vencimento, dados.frequencia_recorrencia, dados.proxima_recorrencia, onUpdate])
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <Icone name="tags" className="w-4 h-4" aria-hidden="true" />
        Recorrência
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Transação Recorrente */}
        <div className="md:col-span-2">
          <div className="flex items-center space-x-2">
            <input
              id="recorrente"
              type="checkbox"
              checked={dados.recorrente || false}
              onChange={(e) => onUpdate('recorrente', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="recorrente">Esta é uma transação recorrente</Label>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Marque esta opção se esta transação se repete periodicamente (ex: salário, aluguel, assinaturas)
          </p>
        </div>

        {/* Campos para Transação Recorrente */}
        {dados.recorrente && (
          <>
            <div>
              <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={dados.data_vencimento || ''}
                onChange={(e) => onUpdate('data_vencimento', e.target.value)}
                required={dados.recorrente}
              />
              <p className="text-sm text-gray-600 mt-1">
                Quando esta transação vence mensalmente
              </p>
            </div>

            <div>
              <Label htmlFor="frequencia_recorrencia">Frequência *</Label>
              <Select
                value={dados.frequencia_recorrencia || ''}
                onChange={(e) => onUpdate('frequencia_recorrencia', e.target.value)}
                required={dados.recorrente}
              >
                <option value="">Selecione a frequência</option>
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
                <option value="anual">Anual</option>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="proxima_recorrencia" className="flex items-center gap-2">
                Próxima Recorrência (Calculado)
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  Auto
                </span>
              </Label>
              <Input
                id="proxima_recorrencia"
                type="date"
                value={dados.proxima_recorrencia || ''}
                readOnly
                className="bg-green-50 border-green-200 cursor-not-allowed"
              />
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <span>✅</span>
                {dados.proxima_recorrencia ? 
                  `Próximo vencimento será em ${new Date(dados.proxima_recorrencia).toLocaleDateString('pt-BR')}` :
                  'Será calculado automaticamente'
                }
              </p>
            </div>
          </>
        )}
      </div>

      {dados.recorrente && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Icone name="info" className="w-4 h-4" aria-hidden="true" />
            Como funciona a recorrência?
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Data Vencimento:</strong> Quando a conta vence todo mês/período</li>
            <li>• <strong>Próxima Recorrência:</strong> É calculada automaticamente</li>
            <li>• A transação atual será salva com status "previsto"</li>
            <li>• Novas transações são geradas automaticamente nas datas certas</li>
          </ul>
        </div>
      )}
    </div>
  )
}