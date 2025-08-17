'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { LoadingText } from '@/componentes/comum/loading'
import { NovaMeta, Categoria } from '@/tipos/database'
import { supabase } from '@/servicos/supabase/cliente'

interface FormularioMetaProps {
  aoSalvar: (dados: NovaMeta) => Promise<void>
  aoCancelar: () => void
  metaInicial?: Partial<NovaMeta>
  titulo?: string
}

export function FormularioMeta({
  aoSalvar,
  aoCancelar,
  metaInicial,
  titulo = "Nova Meta"
}: FormularioMetaProps) {
  // Estado do formulário
  const [dados, setDados] = useState<Partial<NovaMeta>>({
    nome: '',
    descricao: '',
    valor_limite: 0,
    periodo_inicio: new Date().toISOString().split('T')[0],
    periodo_fim: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    tipo: 'categoria',
    categoria_id: '',
    ativo: true,
    ...metaInicial
  })

  // Dados auxiliares
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // Carregar categorias
  useEffect(() => {
    async function carregarCategorias() {
      try {
        const { data } = await supabase
          .from('fp_categorias')
          .select('*')
          .eq('ativo', true)
          .in('tipo', ['despesa', 'ambos'])
          .order('nome')

        setCategorias(data || [])
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarCategorias()
  }, [])

  // Atualizar campo
  const atualizarCampo = (campo: keyof NovaMeta, valor: any) => {
    setDados(prev => ({
      ...prev,
      [campo]: valor,
      // Limpar categoria se mudou para meta total
      ...(campo === 'tipo' && valor === 'total' ? { categoria_id: null } : {}),
      // Definir categoria obrigatória se mudou para categoria
      ...(campo === 'tipo' && valor === 'categoria' && !prev.categoria_id ? { categoria_id: '' } : {})
    }))
  }

  // Validar formulário
  const validarFormulario = (): string[] => {
    const erros: string[] = []

    if (!dados.nome?.trim()) {
      erros.push('Nome é obrigatório')
    }

    if (!dados.valor_limite || dados.valor_limite <= 0) {
      erros.push('Valor limite deve ser maior que zero')
    }

    if (dados.valor_limite && dados.valor_limite > 99999999.99) {
      erros.push('Valor limite máximo: R$ 99.999.999,99')
    }

    if (!dados.periodo_inicio) {
      erros.push('Data de início é obrigatória')
    }

    if (!dados.periodo_fim) {
      erros.push('Data de fim é obrigatória')
    }

    if (dados.periodo_inicio && dados.periodo_fim && dados.periodo_inicio > dados.periodo_fim) {
      erros.push('Data de início deve ser anterior à data de fim')
    }

    if (dados.tipo === 'categoria' && !dados.categoria_id) {
      erros.push('Categoria é obrigatória para metas por categoria')
    }

    return erros
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const erros = validarFormulario()
    if (erros.length > 0) {
      alert('Erros no formulário:\n' + erros.join('\n'))
      return
    }

    try {
      setSalvando(true)
      await aoSalvar(dados as NovaMeta)
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingText>Carregando formulário...</LoadingText>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>
          Defina limites de gastos para controlar seu orçamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome e Descrição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome da Meta *</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Ex: Alimentação do mês, Gastos totais..."
                value={dados.nome || ''}
                onChange={(e) => atualizarCampo('nome', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="valor_limite">Valor Limite (R$) *</Label>
              <Input
                id="valor_limite"
                type="number"
                step="0.01"
                min="0.01"
                max="99999999.99"
                placeholder="0,00"
                value={dados.valor_limite || ''}
                onChange={(e) => atualizarCampo('valor_limite', Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              type="text"
              placeholder="Descrição opcional da meta..."
              value={dados.descricao || ''}
              onChange={(e) => atualizarCampo('descricao', e.target.value)}
            />
          </div>

          {/* Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodo_inicio">Data de Início *</Label>
              <Input
                id="periodo_inicio"
                type="date"
                value={dados.periodo_inicio || ''}
                onChange={(e) => atualizarCampo('periodo_inicio', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="periodo_fim">Data de Fim *</Label>
              <Input
                id="periodo_fim"
                type="date"
                value={dados.periodo_fim || ''}
                onChange={(e) => atualizarCampo('periodo_fim', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Tipo de Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo de Meta *</Label>
              <Select
                id="tipo"
                value={dados.tipo || 'categoria'}
                onChange={(e) => atualizarCampo('tipo', e.target.value)}
                required
              >
                <option value="categoria">📂 Por Categoria</option>
                <option value="total">💰 Total de Gastos</option>
              </Select>
            </div>

            {dados.tipo === 'categoria' && (
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  id="categoria"
                  value={dados.categoria_id || ''}
                  onChange={(e) => atualizarCampo('categoria_id', e.target.value)}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* Explicação dos tipos */}
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
            <p className="font-medium">💡 Tipos de Meta:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• <strong>Por Categoria:</strong> Limite para uma categoria específica (ex: R$ 500 em Alimentação)</li>
              <li>• <strong>Total de Gastos:</strong> Limite para todas as despesas do período (ex: R$ 3.000 no mês)</li>
            </ul>
          </div>

          {/* Alertas automáticos */}
          <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800">
            <p className="font-medium">🔔 Alertas Automáticos:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• <span className="text-yellow-600">50% do limite:</span> Aviso amarelo</li>
              <li>• <span className="text-orange-600">80% do limite:</span> Aviso laranja</li>
              <li>• <span className="text-red-600">100% do limite:</span> Aviso vermelho</li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Criar Meta'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={aoCancelar}
              disabled={salvando}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}