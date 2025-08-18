'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ModalBase } from './modal-base'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { Skeleton, SkeletonInput, SkeletonLabel, SkeletonButton } from '@/componentes/ui/skeleton'
import { validarTransacao } from '@/utilitarios/validacao'
import { NovaTransacao, Subcategoria } from '@/tipos/database'
import { criarTransacaoParcelada } from '@/servicos/supabase/transacoes'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'

/**
 * Props para o componente ModalParcelamento
 */
interface ModalParcelamentoProps {
  /** Indica se o modal esta aberto */
  isOpen: boolean
  /** Funcao chamada ao fechar o modal */
  onClose: () => void
  /** Funcao chamada apos sucesso na operacao */
  onSuccess?: () => void
}

type AbaAtiva = 'essencial' | 'categorizacao' | 'resumo'

// Constantes para timeouts
const TIMEOUT_ERRO = 5000
const TIMEOUT_SUCESSO = 2000

/**
 * Componente botao de aba reutilizavel
 */
const AbaButton = ({ 
  ativa, 
  onClick, 
  children 
}: { 
  ativa: boolean
  onClick: () => void
  children: React.ReactNode 
}) => (
  <button
    onClick={onClick}
    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
      ativa
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
)

// Estado inicial padrao para parcelamento
const ESTADO_INICIAL = {
  data: new Date().toISOString().split('T')[0],
  descricao: '',
  valor: 0,
  tipo: 'despesa' as const, // Parceladas sao sempre despesas
  conta_id: '',
  status: 'previsto' as const,
  parcela_atual: 1,
  total_parcelas: 1,
  recorrente: false
}

/**
 * Formata o tipo de conta para exibicao
 * @param tipo - Tipo da conta (ex: "conta_corrente")
 * @returns Tipo formatado (ex: "Conta Corrente")
 */
const formatarTipoConta = (tipo: string): string => {
  return tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Calcula as datas das parcelas
 * @param dataInicial - Data da primeira parcela
 * @param numeroParcelas - Numero total de parcelas
 * @returns Array com as datas das parcelas
 */
const calcularDatasParcelas = (dataInicial: string, numeroParcelas: number): string[] => {
  const datas: string[] = []
  const dataBase = new Date(dataInicial)
  
  for (let i = 0; i < numeroParcelas; i++) {
    const dataParcela = new Date(dataBase)
    dataParcela.setMonth(dataParcela.getMonth() + i)
    datas.push(dataParcela.toISOString().split('T')[0])
  }
  
  return datas
}

/**
 * Formata data para exibicao (dd/mm/aaaa)
 * @param data - Data em formato ISO (yyyy-mm-dd)
 * @returns Data formatada
 */
const formatarData = (data: string): string => {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

/**
 * Modal para criacao de transacoes parceladas
 * 
 * @component
 * @example
 * ```tsx
 * <ModalParcelamento 
 *   isOpen={true}
 *   onClose={() => setOpen(false)}
 *   onSuccess={() => refetch()}
 * />
 * ```
 */
export function ModalParcelamento({ isOpen, onClose, onSuccess }: ModalParcelamentoProps) {
  // Dados auxiliares do contexto global
  const { dados: dadosAuxiliares, loading: loadingAuxiliares, obterSubcategorias } = useDadosAuxiliares()

  // Estado das abas
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('essencial')

  // Estado do formulario
  const [dados, setDados] = useState<Partial<NovaTransacao>>(ESTADO_INICIAL)
  const [numeroParcelas, setNumeroParcelas] = useState(2)

  // Estados locais
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(null)

  // Calculos derivados
  const valorParcela = useMemo(() => {
    return dados.valor && numeroParcelas > 0 ? dados.valor / numeroParcelas : 0
  }, [dados.valor, numeroParcelas])

  const datasParcelas = useMemo(() => {
    return dados.data ? calcularDatasParcelas(dados.data, numeroParcelas) : []
  }, [dados.data, numeroParcelas])

  // Reset modal quando abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setAbaAtiva('essencial')
      setDados(ESTADO_INICIAL)
      setNumeroParcelas(2)
    } else {
      // Reset apenas quando fechar
      setSubcategorias([])
      setMensagem(null)
    }
  }, [isOpen])

  // Carregar subcategorias quando categoria muda
  useEffect(() => {
    async function carregarSubcategorias() {
      if (!dados.categoria_id) {
        setSubcategorias([])
        return
      }

      try {
        const subcategoriasData = await obterSubcategorias(dados.categoria_id)
        setSubcategorias(subcategoriasData)
      } catch (error) {
        console.error('Erro ao carregar subcategorias:', error)
        setSubcategorias([])
      }
    }

    carregarSubcategorias()
  }, [dados.categoria_id, obterSubcategorias])

  // Filtrar categorias por tipo (apenas despesas)
  const categoriasFiltradas = useMemo(() => 
    dadosAuxiliares.categorias.filter(cat => 
      cat.tipo === 'despesa' || cat.tipo === 'ambos'
    ), [dadosAuxiliares.categorias]
  )

  /**
   * Atualiza um campo especifico do formulario
   * @param campo - Nome do campo a ser atualizado
   * @param valor - Novo valor para o campo
   */
  const atualizarCampo = useCallback(<K extends keyof NovaTransacao>(
    campo: K, 
    valor: NovaTransacao[K]
  ) => {
    setDados(prev => ({
      ...prev,
      [campo]: valor,
      ...(campo === 'categoria_id' ? { subcategoria_id: '' } : {})
    }))
  }, [])

  /**
   * Valida se os dados essenciais estao preenchidos
   * @returns true se valido, false caso contrario
   */
  const validarEssencial = useCallback(() => {
    const baseValid = dados.data && dados.valor && dados.valor > 0 && dados.conta_id
    const tipoValid = dados.tipo === 'despesa'
    const parcelasValid = numeroParcelas >= 2 && numeroParcelas <= 60
    return baseValid && tipoValid && parcelasValid
  }, [dados.data, dados.valor, dados.conta_id, dados.tipo, numeroParcelas])

  /**
   * Renderiza skeleton form unificado
   */
  const renderSkeletonForm = (tipo: 'essencial' | 'categorizacao' | 'resumo') => {
    if (tipo === 'resumo') {
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <Skeleton className="h-6 w-48 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      )
    }

    const numCampos = 4
    return (
      <div className="space-y-4">
        {Array.from({ length: numCampos }).map((_, i) => (
          <div key={i} className={i < 2 ? "grid grid-cols-2 gap-4" : "space-y-2"}>
            {i < 2 ? (
              <>
                <div className="space-y-2">
                  <SkeletonLabel />
                  <SkeletonInput />
                </div>
                <div className="space-y-2">
                  <SkeletonLabel />
                  <SkeletonInput />
                </div>
              </>
            ) : (
              <>
                <SkeletonLabel />
                <SkeletonInput />
              </>
            )}
          </div>
        ))}
      </div>
    )
  }

  /**
   * Submete o formulario criando transacao parcelada
   * @param e - Evento do formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validacoes basicas
    const errosValidacao = validarTransacao(dados)
    if (errosValidacao.length > 0) {
      setMensagem({ 
        tipo: 'erro', 
        texto: `Erro de validacao: ${errosValidacao[0]}` 
      })
      setTimeout(() => setMensagem(null), TIMEOUT_ERRO)
      return
    }

    // Validacao especifica de parcelamento
    if (numeroParcelas < 2 || numeroParcelas > 60) {
      setMensagem({ 
        tipo: 'erro', 
        texto: 'Numero de parcelas deve estar entre 2 e 60' 
      })
      setTimeout(() => setMensagem(null), TIMEOUT_ERRO)
      return
    }

    if (!dados.valor || dados.valor < 0.02) {
      setMensagem({ 
        tipo: 'erro', 
        texto: 'Valor total deve ser maior que R$ 0,02 para parcelamento' 
      })
      setTimeout(() => setMensagem(null), TIMEOUT_ERRO)
      return
    }

    try {
      setSalvando(true)
      
      await criarTransacaoParcelada(dados as NovaTransacao, numeroParcelas)

      setMensagem({ 
        tipo: 'sucesso', 
        texto: `Parcelamento criado com sucesso! ${numeroParcelas} parcelas geradas.` 
      })
      
      setTimeout(() => {
        setMensagem(null)
        onSuccess?.()
        onClose()
      }, TIMEOUT_SUCESSO)

    } catch (error) {
      console.error('Erro ao criar parcelamento:', error)
      setMensagem({ 
        tipo: 'erro', 
        texto: `Erro ao criar parcelamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      })
      setTimeout(() => setMensagem(null), TIMEOUT_ERRO)
    } finally {
      setSalvando(false)
    }
  }

  // Renderizar conteudo da aba
  const renderizarConteudo = () => {
    switch (abaAtiva) {
      case 'essencial':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data da 1a Parcela *</Label>
                <Input
                  id="data"
                  type="date"
                  value={dados.data}
                  onChange={(e) => atualizarCampo('data', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parcelas">Numero de Parcelas *</Label>
                <Input
                  id="parcelas"
                  type="number"
                  min="2"
                  max="60"
                  value={numeroParcelas}
                  onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 2)}
                  required
                />
                <p className="text-xs text-gray-500">Entre 2 e 60 parcelas</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Total (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0.02"
                  max="99999999.99"
                  value={dados.valor}
                  onChange={(e) => atualizarCampo('valor', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  required
                />
                {valorParcela > 0 && (
                  <p className="text-xs text-blue-600">
                    {numeroParcelas}x de R$ {valorParcela.toFixed(2).replace('.', ',')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="conta_id">Conta/Cartao *</Label>
                <Select
                  id="conta_id"
                  value={dados.conta_id}
                  onChange={(e) => atualizarCampo('conta_id', e.target.value)}
                  required
                >
                  <option value="">Selecione uma conta</option>
                  {dadosAuxiliares.contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome}{conta.banco ? ` - ${conta.banco}` : ''} ({formatarTipoConta(conta.tipo)})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descricao</Label>
              <Input
                id="descricao"
                value={dados.descricao}
                onChange={(e) => atualizarCampo('descricao', e.target.value)}
                placeholder="Ex: Geladeira, Sofa, Notebook..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={dados.status}
                onChange={(e) => atualizarCampo('status', e.target.value as 'previsto' | 'realizado')}
              >
                <option value="previsto">🟡 Previsto</option>
                <option value="realizado">✅ Realizado</option>
              </Select>
            </div>
          </div>
        )

      case 'categorizacao':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="forma_pagamento_id">Forma de Pagamento</Label>
                <Select
                  id="forma_pagamento_id"
                  value={dados.forma_pagamento_id || ''}
                  onChange={(e) => atualizarCampo('forma_pagamento_id', e.target.value)}
                >
                  <option value="">Selecione uma forma</option>
                  {dadosAuxiliares.formasPagamento.map(forma => (
                    <option key={forma.id} value={forma.id}>
                      {forma.nome} ({forma.tipo})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="centro_custo_id">Centro de Custo</Label>
                <Select
                  id="centro_custo_id"
                  value={dados.centro_custo_id || ''}
                  onChange={(e) => atualizarCampo('centro_custo_id', e.target.value)}
                >
                  <option value="">Selecione um centro</option>
                  {dadosAuxiliares.centrosCusto.map(centro => (
                    <option key={centro.id} value={centro.id}>
                      {centro.nome}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observacoes</Label>
              <Input
                id="observacoes"
                value={dados.observacoes || ''}
                onChange={(e) => atualizarCampo('observacoes', e.target.value)}
                placeholder="Observacoes adicionais..."
              />
            </div>
          </div>
        )

      case 'resumo':
        return (
          <div className="space-y-4">
            {dados.valor && numeroParcelas > 1 && dados.data ? (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3">📋 Resumo do Parcelamento</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>Descricao:</strong> {dados.descricao || 'Compra parcelada'}</p>
                  <p><strong>Valor total:</strong> R$ {dados.valor.toFixed(2).replace('.', ',')}</p>
                  <p><strong>Parcelas:</strong> {numeroParcelas}x de R$ {valorParcela.toFixed(2).replace('.', ',')}</p>
                  <p><strong>Primeira parcela:</strong> {formatarData(dados.data)}</p>
                  <p><strong>Ultima parcela:</strong> {formatarData(datasParcelas[datasParcelas.length - 1] || dados.data)}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
                <p className="text-gray-600">Preencha os campos essenciais para ver o resumo</p>
              </div>
            )}

            {datasParcelas.length > 0 && dados.valor && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">📅 Cronograma das Parcelas</h5>
                <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                  {datasParcelas.slice(0, 12).map((data, index) => (
                    <div key={index} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                      <span>Parcela {index + 1}/{numeroParcelas}</span>
                      <span>{formatarData(data)}</span>
                      <span className="font-medium">R$ {valorParcela.toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                  {numeroParcelas > 12 && (
                    <p className="text-gray-500 text-center pt-2">
                      ... e mais {numeroParcelas - 12} parcelas
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <ModalBase 
      isOpen={isOpen} 
      onClose={onClose} 
      title="💳 Criar Parcelamento" 
      fixedWidth="600px"
    >
      <div className="h-[550px] flex flex-col">
        {/* Header com Abas */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex space-x-8">
            <AbaButton 
              ativa={abaAtiva === 'essencial'} 
              onClick={() => setAbaAtiva('essencial')}
            >
              💳 Essencial
            </AbaButton>
            <AbaButton 
              ativa={abaAtiva === 'categorizacao'} 
              onClick={() => setAbaAtiva('categorizacao')}
            >
              📊 Categorizacao
            </AbaButton>
            <AbaButton 
              ativa={abaAtiva === 'resumo'} 
              onClick={() => setAbaAtiva('resumo')}
            >
              📋 Resumo
            </AbaButton>
          </nav>
        </div>

        {/* Mensagem Global */}
        {mensagem && (
          <div 
            className={`mb-4 p-3 rounded-lg text-sm ${
              mensagem.tipo === 'erro' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
            role="alert"
            aria-live="polite"
          >
            {mensagem.tipo === 'erro' ? '❌' : '✅'} {mensagem.texto}
          </div>
        )}

        {/* Conteudo da Aba */}
        <div className="flex-1 overflow-y-auto">
          {loadingAuxiliares ? renderSkeletonForm(abaAtiva) : renderizarConteudo()}
        </div>

        {/* Rodape com Botoes */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {loadingAuxiliares ? (
            <SkeletonButton className="w-36" />
          ) : (
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={salvando || !validarEssencial()}
            >
              {salvando ? 'Criando Parcelas...' : 'Criar Parcelamento'}
            </Button>
          )}
        </div>
      </div>
    </ModalBase>
  )
}