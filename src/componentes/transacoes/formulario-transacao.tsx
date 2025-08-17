'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { LoadingText } from '@/componentes/comum/loading'
import { UploadAnexo } from './upload-anexo'
import { NovaTransacao, Conta, Categoria, Subcategoria, FormaPagamento, CentroCusto } from '@/tipos/database'
import { obterCategorias } from '@/servicos/supabase/categorias'
import { obterContas } from '@/servicos/supabase/contas'
import { obterSubcategoriasPorCategoria } from '@/servicos/supabase/subcategorias'
import { obterFormasPagamento } from '@/servicos/supabase/formas-pagamento'
import { obterCentrosCusto } from '@/servicos/supabase/centros-custo'

interface FormularioTransacaoProps {
  aoSalvar: (dados: NovaTransacao) => Promise<void>
  aoCancelar: () => void
  transacaoInicial?: Partial<NovaTransacao>
  titulo?: string
}

export function FormularioTransacao({
  aoSalvar,
  aoCancelar,
  transacaoInicial,
  titulo = "Nova Transação"
}: FormularioTransacaoProps) {
  // Estado do formulário
  const [dados, setDados] = useState<Partial<NovaTransacao>>({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: 0,
    tipo: 'despesa',
    conta_id: '',
    status: 'pendente',
    parcela_atual: 1,
    total_parcelas: 1,
    recorrente: false,
    ...transacaoInicial
  })

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
        const [contasData, categoriasData, formasData, centrosData] = await Promise.all([
          obterContas(),
          obterCategorias(),
          obterFormasPagamento(),
          obterCentrosCusto()
        ])

        setContas(contasData)
        setCategorias(categoriasData)
        setFormasPagamento(formasData)
        setCentrosCusto(centrosData)
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
    async function carregarSubcategorias() {
      if (!dados.categoria_id) {
        setSubcategorias([])
        return
      }

      try {
        const subcategoriasData = await obterSubcategoriasPorCategoria(dados.categoria_id)
        setSubcategorias(subcategoriasData)
      } catch (error) {
        console.error('Erro ao carregar subcategorias:', error)
      }
    }

    carregarSubcategorias()
  }, [dados.categoria_id])

  // Filtrar categorias por tipo
  const categoriasFiltradas = categorias.filter(cat => 
    cat.tipo === dados.tipo || cat.tipo === 'ambos'
  )

  // Calcular próxima data de recorrência
  const calcularProximaRecorrencia = (dataAtual: string, frequencia: 'diario' | 'semanal' | 'mensal' | 'anual') => {
    const data = new Date(dataAtual)

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
    }

    return data.toISOString().split('T')[0]
  }

  // Atualizar campo
  const atualizarCampo = (campo: keyof NovaTransacao, valor: any) => {
    setDados(prev => ({
      ...prev,
      [campo]: valor,
      // Limpar subcategoria se categoria mudou
      ...(campo === 'categoria_id' ? { subcategoria_id: '' } : {}),
      // Limpar conta destino se não é transferência
      ...(campo === 'tipo' && valor !== 'transferencia' ? { conta_destino_id: '' } : {}),
      // Recalcular próxima recorrência se data mudou e é recorrente
      ...(campo === 'data' && prev.recorrente && prev.frequencia_recorrencia ? {
        proxima_recorrencia: calcularProximaRecorrencia(valor, prev.frequencia_recorrencia as 'diario' | 'semanal' | 'mensal' | 'anual')
      } : {})
    }))
  }

  // Manipular upload de anexo
  const handleUploadSuccess = (url: string, fileName: string) => {
    if (url === '') {
      // Remover anexo
      atualizarCampo('anexo_url', null)
      setMensagemAnexo({ tipo: 'sucesso', texto: 'Anexo removido com sucesso' })
    } else {
      // Adicionar anexo
      atualizarCampo('anexo_url', url)
      setMensagemAnexo({ tipo: 'sucesso', texto: 'Anexo enviado com sucesso' })
    }
    
    // Limpar mensagem após 3 segundos
    setTimeout(() => setMensagemAnexo(null), 3000)
  }

  const handleUploadError = (error: string) => {
    setMensagemAnexo({ tipo: 'erro', texto: error })
    
    // Limpar mensagem após 5 segundos
    setTimeout(() => setMensagemAnexo(null), 5000)
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações conforme documentação
    if (!dados.data || !dados.descricao || !dados.conta_id) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    if (!dados.valor || dados.valor <= 0) {
      alert('Valor deve ser maior que zero')
      return
    }

    if (dados.tipo === 'transferencia' && !dados.conta_destino_id) {
      alert('Transferências precisam de conta destino')
      return
    }

    if (dados.conta_id === dados.conta_destino_id) {
      alert('Conta origem e destino devem ser diferentes')
      return
    }

    try {
      setSalvando(true)
      await aoSalvar(dados as NovaTransacao)
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
          Preencha os dados da transação. Campos com * são obrigatórios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campos obrigatórios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                id="tipo"
                value={dados.tipo}
                onChange={(e) => atualizarCampo('tipo', e.target.value)}
                required
              >
                <option value="receita">💰 Receita</option>
                <option value="despesa">💸 Despesa</option>
                <option value="transferencia">🔄 Transferência</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={dados.data}
                onChange={(e) => atualizarCampo('data', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={dados.descricao}
              onChange={(e) => atualizarCampo('descricao', e.target.value)}
              placeholder="Ex: Supermercado, Salário, Transferência..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                max="99999999.99"
                value={dados.valor}
                onChange={(e) => atualizarCampo('valor', parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta_id">Conta {dados.tipo === 'transferencia' ? 'Origem' : ''} *</Label>
              <Select
                id="conta_id"
                value={dados.conta_id}
                onChange={(e) => atualizarCampo('conta_id', e.target.value)}
                required
              >
                <option value="">Selecione uma conta</option>
                {contas.map(conta => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome} ({conta.tipo})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Conta destino para transferências */}
          {dados.tipo === 'transferencia' && (
            <div className="space-y-2">
              <Label htmlFor="conta_destino_id">Conta Destino *</Label>
              <Select
                id="conta_destino_id"
                value={dados.conta_destino_id || ''}
                onChange={(e) => atualizarCampo('conta_destino_id', e.target.value)}
                required
              >
                <option value="">Selecione a conta destino</option>
                {contas.filter(c => c.id !== dados.conta_id).map(conta => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome} ({conta.tipo})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Campos opcionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria_id">Categoria</Label>
              <Select
                id="categoria_id"
                value={dados.categoria_id || ''}
                onChange={(e) => atualizarCampo('categoria_id', e.target.value)}
              >
                <option value="">Selecione uma categoria</option>
                {categoriasFiltradas.map(categoria => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategoria_id">Subcategoria</Label>
              <Select
                id="subcategoria_id"
                value={dados.subcategoria_id || ''}
                onChange={(e) => atualizarCampo('subcategoria_id', e.target.value)}
                disabled={!dados.categoria_id}
              >
                <option value="">Selecione uma subcategoria</option>
                {subcategorias.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nome}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={dados.status}
                onChange={(e) => atualizarCampo('status', e.target.value)}
              >
                <option value="pendente">🟡 Pendente</option>
                <option value="pago">🟢 Pago</option>
                <option value="cancelado">🔴 Cancelado</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_pagamento_id">Forma de Pagamento</Label>
              <Select
                id="forma_pagamento_id"
                value={dados.forma_pagamento_id || ''}
                onChange={(e) => atualizarCampo('forma_pagamento_id', e.target.value)}
              >
                <option value="">Selecione uma forma</option>
                {formasPagamento.map(forma => (
                  <option key={forma.id} value={forma.id}>
                    {forma.nome} ({forma.tipo})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Input
              id="observacoes"
              value={dados.observacoes || ''}
              onChange={(e) => atualizarCampo('observacoes', e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>

          {/* Seção de Anexos - conforme PRD */}
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

          {/* Seção de Recorrência - conforme PRD */}
          <div className="border-t pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  id="recorrente"
                  type="checkbox"
                  checked={dados.recorrente || false}
                  onChange={(e) => {
                    const isRecorrente = e.target.checked
                    atualizarCampo('recorrente', isRecorrente)
                    if (isRecorrente) {
                      // Definir próxima recorrência baseada na data atual e frequência
                      if (dados.data) {
                        const proximaData = calcularProximaRecorrencia(dados.data, (dados.frequencia_recorrencia || 'mensal') as 'diario' | 'semanal' | 'mensal' | 'anual')
                        atualizarCampo('proxima_recorrencia', proximaData)
                      }
                    } else {
                      atualizarCampo('proxima_recorrencia', null)
                      atualizarCampo('frequencia_recorrencia', null)
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="recorrente" className="text-sm font-medium">
                  🔄 Transação Recorrente
                </Label>
              </div>

              {dados.recorrente && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="frequencia">Frequência *</Label>
                    <Select
                      id="frequencia"
                      value={dados.frequencia_recorrencia || 'mensal'}
                      onChange={(e) => {
                        const frequencia = e.target.value as 'diario' | 'semanal' | 'mensal' | 'anual'
                        atualizarCampo('frequencia_recorrencia', frequencia)
                        // Recalcular próxima data quando frequência muda
                        if (dados.data) {
                          const proximaData = calcularProximaRecorrencia(dados.data, frequencia)
                          atualizarCampo('proxima_recorrencia', proximaData)
                        }
                      }}
                    >
                      <option value="diario">📅 Diário</option>
                      <option value="semanal">📅 Semanal</option>
                      <option value="mensal">📅 Mensal</option>
                      <option value="anual">📅 Anual</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proxima_recorrencia">Próxima Ocorrência</Label>
                    <Input
                      id="proxima_recorrencia"
                      type="date"
                      value={dados.proxima_recorrencia || ''}
                      onChange={(e) => atualizarCampo('proxima_recorrencia', e.target.value)}
                      className="bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
              )}

              {dados.recorrente && (
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                  <p className="font-medium">ℹ️ Como funciona a recorrência:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Transações recorrentes sempre nascem como "pendente"</li>
                    <li>• Marque como "pago" quando efetuar o pagamento</li>
                    <li>• A próxima ocorrência será gerada automaticamente</li>
                    <li>• Você pode parar a recorrência a qualquer momento</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" disabled={salvando} className="flex-1">
              {salvando ? 'Salvando...' : 'Salvar Transação'}
            </Button>
            <Button type="button" variant="outline" onClick={aoCancelar} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}