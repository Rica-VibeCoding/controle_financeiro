'use client'

import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { NovaTransacao, Conta, Categoria } from '@/tipos/database'

interface CamposEssenciaisProps {
  dados: Partial<NovaTransacao>
  onUpdate: (campo: keyof NovaTransacao, valor: any) => void
  contas: Conta[]
  categorias: Categoria[]
  carregando?: boolean
}

export function CamposEssenciais({
  dados,
  onUpdate,
  contas,
  categorias,
  carregando = false
}: CamposEssenciaisProps) {
  // Filtrar categorias por tipo
  const categoriasFiltradas = categorias.filter((cat: any) => 
    cat.tipo === dados.tipo || cat.tipo === 'ambos'
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Data */}
      <div>
        <Label htmlFor="data">Data *</Label>
        <Input
          id="data"
          type="date"
          value={dados.data || ''}
          onChange={(e) => onUpdate('data', e.target.value)}
          required
        />
      </div>

      {/* Tipo */}
      <div>
        <Label htmlFor="tipo">Tipo *</Label>
        <Select
          value={dados.tipo || ''}
          onChange={(e) => onUpdate('tipo', e.target.value)}
          required
        >
          <option value="">Selecione o tipo</option>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
          <option value="transferencia">Transferência</option>
        </Select>
      </div>

      {/* Descrição */}
      <div className="md:col-span-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Input
          id="descricao"
          type="text"
          placeholder="Ex: Salário, Supermercado, Conta de luz..."
          value={dados.descricao || ''}
          onChange={(e) => onUpdate('descricao', e.target.value)}
          required
        />
      </div>

      {/* Valor */}
      <div>
        <Label htmlFor="valor">Valor *</Label>
        <Input
          id="valor"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          placeholder="Ex: 150,00"
          value={dados.valor || ''}
          onChange={(e) => onUpdate('valor', e.target.value === '' ? 0 : Number(e.target.value))}
          required
        />
      </div>

      {/* Conta */}
      <div>
        <Label htmlFor="conta_id">Conta *</Label>
        <Select
          value={dados.conta_id || ''}
          onChange={(e) => onUpdate('conta_id', e.target.value)}
          required
        >
          <option value="">Selecione uma conta</option>
          {contas.map((conta: any) => (
            <option key={conta.id} value={conta.id}>
              {conta.nome} ({conta.tipo}){conta.banco && ` - ${conta.banco}`}
            </option>
          ))}
        </Select>
      </div>

      {/* Conta Destino (apenas para transferências) */}
      {dados.tipo === 'transferencia' && (
        <div className="md:col-span-2">
          <Label htmlFor="conta_destino_id">Conta Destino *</Label>
          <Select
            value={dados.conta_destino_id || ''}
            onChange={(e) => onUpdate('conta_destino_id', e.target.value)}
            required
          >
            <option value="">Selecione a conta destino</option>
            {contas.filter((c: any) => c.id !== dados.conta_id).map((conta: any) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome} ({conta.tipo}){conta.banco && ` - ${conta.banco}`}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Categoria (não para transferências) */}
      {dados.tipo && dados.tipo !== 'transferencia' && (
        <div>
          <Label htmlFor="categoria_id">Categoria</Label>
          <Select
            value={dados.categoria_id || ''}
            onChange={(e) => onUpdate('categoria_id', e.target.value)}
          >
            <option value="">Selecione uma categoria</option>
            {categoriasFiltradas.map((categoria: any) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Status */}
      <div>
        <Label htmlFor="status">Status *</Label>
        <Select
          value={dados.status || 'previsto'}
          onChange={(e) => onUpdate('status', e.target.value)}
          required
        >
          <option value="previsto">Previsto</option>
          <option value="realizado">Realizado</option>
        </Select>
      </div>
    </div>
  )
}