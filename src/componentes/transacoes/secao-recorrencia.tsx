'use client'

import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { NovaTransacao } from '@/tipos/database'

interface SecaoRecorrenciaProps {
  dados: Partial<NovaTransacao>
  onUpdate: (campo: string, valor: any) => void
}

export function SecaoRecorrencia({
  dados,
  onUpdate
}: SecaoRecorrenciaProps) {
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-lg font-medium">Recorrência</h3>
      
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

        {/* Frequência da Recorrência */}
        {dados.recorrente && (
          <>
            <div>
              <Label htmlFor="frequencia_recorrencia">Frequência *</Label>
              <Select
                value={dados.frequencia_recorrencia || ''}
                onChange={(e) => onUpdate('frequencia_recorrencia', e.target.value)}
                required={dados.recorrente}
              >
                <option value="">Selecione a frequência</option>
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
                <option value="bimestral">Bimestral</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="proxima_recorrencia">Próxima Data *</Label>
              <Input
                id="proxima_recorrencia"
                type="date"
                value={dados.proxima_recorrencia || ''}
                onChange={(e) => onUpdate('proxima_recorrencia', e.target.value)}
                required={dados.recorrente}
              />
              <p className="text-sm text-gray-600 mt-1">
                Data da próxima ocorrência desta transação
              </p>
            </div>
          </>
        )}
      </div>

      {dados.recorrente && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ Como funciona a recorrência?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• A transação atual será salva normalmente</li>
            <li>• Na data especificada, uma nova transação será criada automaticamente</li>
            <li>• Você pode editar ou cancelar transações recorrentes a qualquer momento</li>
            <li>• Transações recorrentes aparecem na aba "Recorrentes" da lista de transações</li>
          </ul>
        </div>
      )}
    </div>
  )
}