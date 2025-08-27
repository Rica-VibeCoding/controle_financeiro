'use client'

import { Input } from '@/componentes/ui/input'
import { DateInput } from '@/componentes/ui/date-input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { Icone } from '@/componentes/ui/icone'
import { NovaTransacao, Subcategoria, FormaPagamento, CentroCusto } from '@/tipos/database'

interface SecaoOpcoesAvancadasProps {
  dados: Partial<NovaTransacao>
  onUpdate: (campo: string, valor: any) => void
  subcategorias: Subcategoria[]
  formasPagamento: FormaPagamento[]
  centrosCusto: CentroCusto[]
  carregandoSubcategorias?: boolean
}

export function SecaoOpcoesAvancadas({
  dados,
  onUpdate,
  subcategorias,
  formasPagamento,
  centrosCusto,
  carregandoSubcategorias = false
}: SecaoOpcoesAvancadasProps) {
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <Icone name="settings" className="w-4 h-4" aria-hidden="true" />
        Opções Avançadas
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subcategoria */}
        {dados.categoria_id && (
          <div>
            <Label htmlFor="subcategoria_id">Subcategoria</Label>
            <Select
              value={dados.subcategoria_id || ''}
              onChange={(e) => onUpdate('subcategoria_id', e.target.value)}
              disabled={carregandoSubcategorias}
            >
              <option value="">
                {carregandoSubcategorias ? 'Carregando...' : 'Selecione uma subcategoria'}
              </option>
              {subcategorias.map((sub: any) => (
                <option key={sub.id} value={sub.id}>
                  {sub.nome}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Forma de Pagamento */}
        {dados.tipo !== 'transferencia' && (
          <div>
            <Label htmlFor="forma_pagamento_id">Forma de Pagamento</Label>
            <Select
              value={dados.forma_pagamento_id || ''}
              onChange={(e) => onUpdate('forma_pagamento_id', e.target.value)}
            >
              <option value="">Selecione uma forma</option>
              {formasPagamento.map((forma: any) => (
                <option key={forma.id} value={forma.id}>
                  {forma.nome} ({forma.tipo})
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Centro de Custo */}
        <div>
          <Label htmlFor="centro_custo_id">Centro de Custo</Label>
          <Select
            value={dados.centro_custo_id || ''}
            onChange={(e) => onUpdate('centro_custo_id', e.target.value)}
          >
            <option value="">Selecione um centro de custo</option>
            {centrosCusto.map((centro: any) => (
              <option key={centro.id} value={centro.id}>
                {centro.nome}
              </option>
            ))}
          </Select>
        </div>

        {/* Data de Vencimento */}
        {dados.status === 'previsto' && (
          <div>
            <Label htmlFor="data_vencimento">Data de Vencimento</Label>
            <DateInput
              id="data_vencimento"
              value={dados.data_vencimento || ''}
              onChange={(e) => onUpdate('data_vencimento', e.target.value)}
              clearable
            />
          </div>
        )}
      </div>

      {/* Observações */}
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <textarea
          id="observacoes"
          className="w-full px-3 py-2 border border-gray-300 rounded-md resize-vertical min-h-[80px]"
          placeholder="Observações adicionais sobre esta transação..."
          value={dados.observacoes || ''}
          onChange={(e) => onUpdate('observacoes', e.target.value)}
        />
      </div>
    </div>
  )
}