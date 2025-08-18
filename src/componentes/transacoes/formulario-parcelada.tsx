'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { LoadingText } from '@/componentes/comum/loading'
import { UploadAnexo } from './upload-anexo'
import { validarTransacao } from '@/utilitarios/validacao'
import { NovaTransacao, Conta, Categoria, Subcategoria, FormaPagamento, CentroCusto } from '@/tipos/database'
import { supabase } from '@/servicos/supabase/cliente'

interface FormularioParceladaProps {
  aoSalvar: (dados: NovaTransacao, numeroParcelas: number) => Promise<void>
  aoCancelar: () => void
  titulo?: string
}

export function FormularioParcelada({
  aoSalvar,
  aoCancelar,
  titulo = "Nova Transação Parcelada"
}: FormularioParceladaProps) {
  // Estado do formulário
  const [dados, setDados] = useState<Partial<NovaTransacao>>({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: 0,
    tipo: 'despesa', // Parceladas são sempre despesas conforme PRD
    conta_id: '',
    status: 'previsto',
    parcela_atual: 1,
    total_parcelas: 1,
    recorrente: false
  })

  const [numeroParcelas, setNumeroParcelas] = useState(2)

  // Dados auxiliares
  const [contas, setContas] = useState<Conta[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([])
  
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagemAnexo, setMensagemAnexo] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(null)

  // Carregar dados auxiliares
  useEffect(() => {
    async function carregarDados() {
      try {
        const [contasRes, categoriasRes, formasRes, centrosRes] = await Promise.all([
          supabase.from('fp_contas').select('*').eq('ativo', true).order('nome'),
          supabase.from('fp_categorias').select('*').eq('ativo', true).eq('tipo', 'despesa').order('nome'),
          supabase.from('fp_formas_pagamento').select('*').eq('ativo', true).eq('permite_parcelamento', true).order('nome'),
          supabase.from('fp_centros_custo').select('*').eq('ativo', true).order('nome')
        ])

        setContas(contasRes.data || [])
        setCategorias(categoriasRes.data || [])
        setFormasPagamento(formasRes.data || [])
        setCentrosCusto(centrosRes.data || [])
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [])

  // Carregar subcategorias quando categoria muda
  useEffect(() => {
    if (dados.categoria_id) {
      supabase
        .from('fp_subcategorias')
        .select('*')
        .eq('categoria_id', dados.categoria_id)
        .eq('ativo', true)
        .order('nome')
        .then(({ data }) => setSubcategorias(data || []))
    } else {
      setSubcategorias([])
    }
  }, [dados.categoria_id])

  // Atualizar campo
  const atualizarCampo = (campo: string, valor: any) => {
    setDados(prev => ({ ...prev, [campo]: valor }))
  }

  // Calcular valor das parcelas
  const valorParcela = dados.valor ? Number((dados.valor / numeroParcelas).toFixed(2)) : 0

  // Manipular upload de anexo
  const handleUploadSuccess = (url: string, fileName: string) => {
    if (url === '') {
      atualizarCampo('anexo_url', null)
      setMensagemAnexo({ tipo: 'sucesso', texto: 'Anexo removido com sucesso' })
    } else {
      atualizarCampo('anexo_url', url)
      setMensagemAnexo({ tipo: 'sucesso', texto: 'Anexo enviado com sucesso' })
    }
    
    setTimeout(() => setMensagemAnexo(null), 3000)
  }

  const handleUploadError = (error: string) => {
    setMensagemAnexo({ tipo: 'erro', texto: error })
    setTimeout(() => setMensagemAnexo(null), 5000)
  }

  // Validar formulário
  const validarFormulario = (): string[] => {
    const erros: string[] = []

    if (!dados.descricao?.trim()) {
      erros.push('Descrição é obrigatória')
    }
    if (!dados.valor || dados.valor <= 0) {
      erros.push('Valor deve ser maior que zero')
    }
    if (dados.valor && dados.valor > 99999999.99) {
      erros.push('Valor máximo permitido: R$ 99.999.999,99')
    }
    if (!dados.conta_id) {
      erros.push('Conta é obrigatória')
    }
    if (!dados.data) {
      erros.push('Data é obrigatória')
    }
    if (numeroParcelas < 2 || numeroParcelas > 100) {
      erros.push('Número de parcelas deve ser entre 2 e 100')
    }

    return erros
  }

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const erros = validarFormulario()
    if (erros.length > 0) {
      alert('Erros no formulário:\n' + erros.join('\n'))
      return
    }

    try {
      setSalvando(true)
      await aoSalvar(dados as NovaTransacao, numeroParcelas)
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
          Divida uma despesa em parcelas mensais iguais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data */}
            <div>
              <Label htmlFor="data">Data da Primeira Parcela *</Label>
              <Input
                id="data"
                type="date"
                value={dados.data || ''}
                onChange={(e) => atualizarCampo('data', e.target.value)}
                required
              />
            </div>

            {/* Número de Parcelas */}
            <div>
              <Label htmlFor="parcelas">Número de Parcelas *</Label>
              <Input
                id="parcelas"
                type="number"
                min="2"
                max="100"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              type="text"
              placeholder="Ex: Geladeira, Sofá, Notebook..."
              value={dados.descricao || ''}
              onChange={(e) => atualizarCampo('descricao', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Valor Total */}
            <div>
              <Label htmlFor="valor">Valor Total *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                max="99999999.99"
                placeholder="0,00"
                value={dados.valor || ''}
                onChange={(e) => atualizarCampo('valor', Number(e.target.value))}
                required
              />
              {dados.valor && numeroParcelas > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {numeroParcelas}x de R$ {valorParcela.toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>

            {/* Conta */}
            <div>
              <Label htmlFor="conta">Conta *</Label>
              <Select
                value={dados.conta_id || ''}
                onChange={(e) => atualizarCampo('conta_id', e.target.value)}
              >
                <option value="">Selecione uma conta</option>
                {contas.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome}{conta.banco ? ` - ${conta.banco}` : ''} ({conta.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria */}
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={dados.categoria_id || ''}
                onChange={(e) => atualizarCampo('categoria_id', e.target.value)}
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </Select>
            </div>

            {/* Subcategoria */}
            <div>
              <Label htmlFor="subcategoria">Subcategoria</Label>
              <Select
                value={dados.subcategoria_id || ''}
                onChange={(e) => atualizarCampo('subcategoria_id', e.target.value)}
                disabled={!dados.categoria_id}
              >
                <option value="">Selecione uma subcategoria</option>
                {subcategorias.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nome}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Forma de Pagamento */}
            <div>
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select
                value={dados.forma_pagamento_id || ''}
                onChange={(e) => atualizarCampo('forma_pagamento_id', e.target.value)}
              >
                <option value="">Selecione uma forma</option>
                {formasPagamento.map((forma) => (
                  <option key={forma.id} value={forma.id}>
                    {forma.nome} ({forma.tipo})
                  </option>
                ))}
              </Select>
            </div>

            {/* Centro de Custo */}
            <div>
              <Label htmlFor="centro_custo">Centro de Custo</Label>
              <Select
                value={dados.centro_custo_id || ''}
                onChange={(e) => atualizarCampo('centro_custo_id', e.target.value)}
              >
                <option value="">Selecione um centro</option>
                {centrosCusto.map((centro) => (
                  <option key={centro.id} value={centro.id}>
                    {centro.nome}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Input
              id="observacoes"
              type="text"
              placeholder="Informações adicionais (opcional)"
              value={dados.observacoes || ''}
              onChange={(e) => atualizarCampo('observacoes', e.target.value)}
            />
          </div>

          {/* Seção de Anexos */}
          <div className="border-t pt-4">
            <UploadAnexo
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              anexoAtual={dados.anexo_url || undefined}
              disabled={salvando}
            />
            
            {/* Mensagens de feedback do anexo */}
            {mensagemAnexo && (
              <div className={`mt-2 p-2 rounded text-xs ${
                mensagemAnexo.tipo === 'erro' 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {mensagemAnexo.tipo === 'erro' ? '❌' : '✅'} {mensagemAnexo.texto}
              </div>
            )}
          </div>

          {/* Resumo do Parcelamento */}
          {dados.valor && numeroParcelas > 1 && (
            <div className="bg-muted p-3 rounded">
              <h4 className="font-medium mb-2">Resumo do Parcelamento</h4>
              <p className="text-sm text-muted-foreground">
                • {numeroParcelas} parcelas de R$ {valorParcela.toFixed(2).replace('.', ',')} cada<br/>
                • Primeira parcela: {dados.data}<br/>
                • Última parcela: {new Date(new Date(dados.data!).setMonth(new Date(dados.data!).getMonth() + numeroParcelas - 1)).toISOString().split('T')[0]}<br/>
                • Valor total: R$ {dados.valor.toFixed(2).replace('.', ',')}
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Criar Parcelamento'}
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