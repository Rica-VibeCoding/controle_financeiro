'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select } from '@/componentes/ui/select'
import { obterCategorias } from '@/servicos/supabase/categorias'
import { obterContas } from '@/servicos/supabase/contas'
import { obterIconePorNome } from '@/componentes/ui/icone-picker'
import type { FiltrosTransacao } from '@/tipos/filtros'
import type { Categoria, Conta } from '@/tipos/database'

interface FiltrosTransacoesProps {
  filtros: FiltrosTransacao
  onFiltrosChange: (filtros: FiltrosTransacao) => void
  onLimpar: () => void
  carregando?: boolean
}

export function FiltrosTransacoes({ 
  filtros, 
  onFiltrosChange, 
  onLimpar,
  carregando = false 
}: FiltrosTransacoesProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [contas, setContas] = useState<Conta[]>([])
  const [expandido, setExpandido] = useState(false)

  useEffect(() => {
    async function carregarDados() {
      try {
        const [dadosCategorias, dadosContas] = await Promise.all([
          obterCategorias(),
          obterContas()
        ])
        setCategorias(dadosCategorias)
        setContas(dadosContas)
      } catch (error) {
        console.error('Erro ao carregar dados para filtros:', error)
      }
    }
    carregarDados()
  }, [])

  const handleChange = (campo: keyof FiltrosTransacao, valor: any) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor || undefined
    })
  }

  const filtrosAtivos = Object.values(filtros).some(valor => valor !== undefined && valor !== '')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">🔍 Filtros</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {filtrosAtivos && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLimpar}
                disabled={carregando}
              >
                Limpar
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setExpandido(!expandido)}
            >
              {expandido ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {expandido && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Busca por Descrição */}
            <div className="space-y-2">
              <Label htmlFor="busca">Buscar por descrição</Label>
              <Input
                id="busca"
                placeholder="Digite para buscar..."
                value={filtros.busca || ''}
                onChange={(e) => handleChange('busca', e.target.value)}
                disabled={carregando}
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={filtros.tipo || ''}
                onChange={(e) => handleChange('tipo', e.target.value)}
                disabled={carregando}
              >
                <option value="">Todos os tipos</option>
                <option value="receita">💰 Receita</option>
                <option value="despesa">💸 Despesa</option>
                <option value="transferencia">🔄 Transferência</option>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filtros.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={carregando}
              >
                <option value="">Todos os status</option>
                <option value="pendente">⏳ Pendente</option>
                <option value="pago">✅ Pago</option>
                <option value="cancelado">❌ Cancelado</option>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={filtros.categoria_id || ''}
                onChange={(e) => handleChange('categoria_id', e.target.value)}
                disabled={carregando}
              >
                <option value="">Todas as categorias</option>
                {categorias.map((categoria) => {
                  const IconeComponente = obterIconePorNome(categoria.icone)
                  return (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  )
                })}
              </Select>
            </div>

            {/* Conta */}
            <div className="space-y-2">
              <Label htmlFor="conta">Conta</Label>
              <Select
                value={filtros.conta_id || ''}
                onChange={(e) => handleChange('conta_id', e.target.value)}
                disabled={carregando}
              >
                <option value="">Todas as contas</option>
                {contas.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome}{conta.banco ? ` - ${conta.banco}` : ''} ({conta.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})
                  </option>
                ))}
              </Select>
            </div>

            {/* Recorrente */}
            <div className="space-y-2">
              <Label htmlFor="recorrente">Recorrência</Label>
              <Select
                value={filtros.recorrente === undefined ? '' : filtros.recorrente.toString()}
                onChange={(e) => handleChange('recorrente', e.target.value === '' ? undefined : e.target.value === 'true')}
                disabled={carregando}
              >
                <option value="">Todas</option>
                <option value="true">🔄 Apenas recorrentes</option>
                <option value="false">🔲 Apenas únicas</option>
              </Select>
            </div>
          </div>

          {/* Filtros de Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={filtros.data_inicio || ''}
                onChange={(e) => handleChange('data_inicio', e.target.value)}
                disabled={carregando}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_fim">Data fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={filtros.data_fim || ''}
                onChange={(e) => handleChange('data_fim', e.target.value)}
                disabled={carregando}
              />
            </div>
          </div>

          {/* Filtros de Valor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_min">Valor mínimo</Label>
              <Input
                id="valor_min"
                type="number"
                step="0.01"
                min="0"
                placeholder="R$ 0,00"
                value={filtros.valor_min || ''}
                onChange={(e) => handleChange('valor_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={carregando}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_max">Valor máximo</Label>
              <Input
                id="valor_max"
                type="number"
                step="0.01"
                min="0"
                placeholder="R$ 999.999,99"
                value={filtros.valor_max || ''}
                onChange={(e) => handleChange('valor_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={carregando}
              />
            </div>
          </div>

          {/* Atalhos de Data */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Atalhos de período:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoje = new Date()
                  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
                  handleChange('data_inicio', primeiroDiaMes.toISOString().split('T')[0])
                  handleChange('data_fim', hoje.toISOString().split('T')[0])
                }}
                disabled={carregando}
              >
                Este mês
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoje = new Date()
                  const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
                  const ultimoDiaMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
                  handleChange('data_inicio', mesPassado.toISOString().split('T')[0])
                  handleChange('data_fim', ultimoDiaMesPassado.toISOString().split('T')[0])
                }}
                disabled={carregando}
              >
                Mês passado
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoje = new Date()
                  const treseMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1)
                  handleChange('data_inicio', treseMesesAtras.toISOString().split('T')[0])
                  handleChange('data_fim', hoje.toISOString().split('T')[0])
                }}
                disabled={carregando}
              >
                Últimos 3 meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoje = new Date()
                  const inicioAno = new Date(hoje.getFullYear(), 0, 1)
                  handleChange('data_inicio', inicioAno.toISOString().split('T')[0])
                  handleChange('data_fim', hoje.toISOString().split('T')[0])
                }}
                disabled={carregando}
              >
                Este ano
              </Button>
            </div>
          </div>

          {filtrosAtivos && (
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Filtros ativos:</span> {Object.entries(filtros)
                  .filter(([_, valor]) => valor !== undefined && valor !== '')
                  .map(([chave, _]) => chave)
                  .join(', ')}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}