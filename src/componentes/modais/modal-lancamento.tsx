'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ModalBase } from './modal-base'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { Skeleton, SkeletonInput, SkeletonLabel, SkeletonButton } from '@/componentes/ui/skeleton'
import { UploadAnexo } from '@/componentes/transacoes/upload-anexo'
import { validarTransacao } from '@/utilitarios/validacao'
import { NovaTransacao, Conta, Categoria, Subcategoria, FormaPagamento, CentroCusto } from '@/tipos/database'
import { Icone } from '@/componentes/ui/icone'
import { obterTransacaoPorId, criarTransacao, atualizarTransacao } from '@/servicos/supabase/transacoes'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'

/**
 * Props para o componente ModalLancamento
 */
interface ModalLancamentoProps {
  /** Indica se o modal está aberto */
  isOpen: boolean
  /** Função chamada ao fechar o modal */
  onClose: () => void
  /** Função chamada após sucesso na operação */
  onSuccess?: () => void
  /** ID da transação para edição (opcional) */
  transacaoId?: string
}

type AbaAtiva = 'essencial' | 'categorizacao' | 'anexos'

/**
 * Componente botão de aba reutilizável
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

// Estado inicial padrão
const ESTADO_INICIAL = {
  data: new Date().toISOString().split('T')[0],
  descricao: '',
  valor: 0,
  tipo: 'despesa' as const,
  conta_id: '',
  status: 'previsto' as const,
  parcela_atual: 1,
  total_parcelas: 1,
  recorrente: false
}

/**
 * Formata o tipo de conta para exibição
 * @param tipo - Tipo da conta (ex: "conta_corrente")
 * @returns Tipo formatado (ex: "Conta Corrente")
 */
const formatarTipoConta = (tipo: string): string => {
  return tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Calcula próxima data de recorrência
 * @param dataAtual - Data atual em formato YYYY-MM-DD
 * @param frequencia - Frequência da recorrência
 * @returns Próxima data em formato YYYY-MM-DD
 */
const calcularProximaRecorrencia = (
  dataAtual: string,
  frequencia: 'diario' | 'semanal' | 'mensal' | 'anual'
): string => {
  const data = new Date(dataAtual + 'T00:00:00')
  
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

/**
 * Mapeia dados da transação do banco para o estado do formulário
 * @param transacao - Transação do banco de dados
 * @returns Estado formatado para o formulário
 */
const mapearTransacaoParaEstado = (transacao: NovaTransacao): Partial<NovaTransacao> => {
  return {
    data: transacao.data,
    descricao: transacao.descricao,
    valor: transacao.valor,
    tipo: transacao.tipo,
    conta_id: transacao.conta_id,
    conta_destino_id: transacao.conta_destino_id || undefined,
    categoria_id: transacao.categoria_id || undefined,
    subcategoria_id: transacao.subcategoria_id || undefined,
    forma_pagamento_id: transacao.forma_pagamento_id || undefined,
    centro_custo_id: transacao.centro_custo_id || undefined,
    status: transacao.status,
    data_vencimento: transacao.data_vencimento || undefined,
    observacoes: transacao.observacoes || undefined,
    anexo_url: transacao.anexo_url || undefined,
    recorrente: transacao.recorrente,
    frequencia_recorrencia: transacao.frequencia_recorrencia || undefined,
    proxima_recorrencia: transacao.proxima_recorrencia || undefined,
    parcela_atual: transacao.parcela_atual,
    total_parcelas: transacao.total_parcelas
  }
}

/**
 * Modal para lançamento e edição de transações financeiras
 * 
 * @component
 * @example
 * ```tsx
 * <ModalLancamento 
 *   isOpen={true}
 *   onClose={() => setOpen(false)}
 *   onSuccess={() => refetch()}
 *   transacaoId="123" // Para edição
 * />
 * ```
 */
export function ModalLancamento({ isOpen, onClose, onSuccess, transacaoId }: ModalLancamentoProps) {
  const isEdicao = !!transacaoId

  // Dados auxiliares do contexto global
  const { dados: dadosAuxiliares, loading: loadingAuxiliares, obterSubcategorias } = useDadosAuxiliares()

  // Estado das abas
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('essencial')

  // Estado do formulário
  const [dados, setDados] = useState<Partial<NovaTransacao>>(ESTADO_INICIAL)

  // Estados locais
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [loadingTransacao, setLoadingTransacao] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(null)

  // Carregar transação para edição
  useEffect(() => {
    async function carregarTransacao() {
      if (!isOpen || !transacaoId) return

      try {
        setLoadingTransacao(true)
        const transacao = await obterTransacaoPorId(transacaoId)
        if (transacao) {
          setDados(mapearTransacaoParaEstado(transacao))
        }
      } catch (error) {
        console.error('Erro ao carregar transação:', error)
        setMensagem({ 
          tipo: 'erro', 
          texto: 'Erro ao carregar dados da transação' 
        })
      } finally {
        setLoadingTransacao(false)
      }
    }

    if (isOpen) {
      setAbaAtiva('essencial')
      if (transacaoId) {
        carregarTransacao()
      } else {
        setDados(ESTADO_INICIAL)
      }
    }
    
    // Reset estados quando modal fechar
    if (!isOpen) {
      setSubcategorias([])
      setMensagem(null)
      setAbaAtiva('essencial')
      setDados(ESTADO_INICIAL)
    }
  }, [isOpen, transacaoId])

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

  // Filtrar categorias por tipo (otimizado)
  const categoriasFiltradas = useMemo(() => 
    dadosAuxiliares.categorias.filter(cat => 
      cat.tipo === dados.tipo || cat.tipo === 'ambos'
    ), [dadosAuxiliares.categorias, dados.tipo]
  )

  /**
   * Atualiza um campo específico do formulário
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
      ...(campo === 'categoria_id' ? { subcategoria_id: '' } : {}),
      ...(campo === 'tipo' && valor !== 'transferencia' ? { conta_destino_id: '' } : {})
    }))
  }, [])

  /**
   * Manipula o sucesso do upload de anexo
   * @param url - URL do anexo carregado
   * @param fileName - Nome do arquivo
   */
  const handleUploadSuccess = useCallback((url: string, fileName: string) => {
    if (url === '') {
      atualizarCampo('anexo_url', null)
      setMensagem({ tipo: 'sucesso', texto: 'Anexo removido com sucesso' })
    } else {
      atualizarCampo('anexo_url', url)
      setMensagem({ tipo: 'sucesso', texto: 'Anexo enviado com sucesso' })
    }
    
    setTimeout(() => setMensagem(null), 3000)
  }, [atualizarCampo])

  /**
   * Manipula erros no upload de anexo
   * @param error - Mensagem de erro
   */
  const handleUploadError = useCallback((error: string) => {
    setMensagem({ tipo: 'erro', texto: error })
    setTimeout(() => setMensagem(null), 5000)
  }, [])

  /**
   * Valida se os dados essenciais estão preenchidos
   * @returns true se válido, false caso contrário
   */
  const validarEssencial = useCallback(() => {
    const baseValid = dados.tipo && dados.data && dados.valor && dados.valor > 0 && dados.conta_id
    const transferValid = dados.tipo === 'transferencia' ? !!dados.conta_destino_id : true
    return baseValid && transferValid
  }, [dados.tipo, dados.data, dados.valor, dados.conta_id, dados.conta_destino_id])


  /**
   * Renderiza skeleton form unificado
   */
  const renderSkeletonForm = (tipo: 'essencial' | 'categorizacao' | 'anexos') => {
    if (tipo === 'anexos') {
      return (
        <div className="space-y-4">
          <div className="flex flex-col items-center space-y-4 py-8">
            <Skeleton className="h-32 w-64 rounded-lg" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
      )
    }

    const numCampos = tipo === 'essencial' ? 5 : 4
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
   * Submete o formulário criando ou atualizando transação
   * @param e - Evento do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errosValidacao = validarTransacao(dados)
    if (errosValidacao.length > 0) {
      setMensagem({ 
        tipo: 'erro', 
        texto: `Erro de validação: ${errosValidacao[0]}` 
      })
      setTimeout(() => setMensagem(null), 5000)
      return
    }

    try {
      setSalvando(true)
      
      if (isEdicao && transacaoId) {
        await atualizarTransacao(transacaoId, dados as NovaTransacao)
      } else {
        await criarTransacao(dados as NovaTransacao)
      }


      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setMensagem({ 
        tipo: 'erro', 
        texto: `Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      })
      setTimeout(() => setMensagem(null), 5000)
    } finally {
      setSalvando(false)
    }
  }


  // Renderizar conteúdo da aba
  const renderizarConteudo = () => {
    switch (abaAtiva) {
      case 'essencial':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  id="tipo"
                  value={dados.tipo}
                  onChange={(e) => atualizarCampo('tipo', e.target.value as 'despesa' | 'receita' | 'transferencia')}
                  required
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                  <option value="transferencia">Transferência</option>
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

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="conta_id">
                  Conta {dados.tipo === 'transferencia' ? 'Origem' : ''} *
                </Label>
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
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={dados.descricao}
                onChange={(e) => atualizarCampo('descricao', e.target.value)}
                placeholder="Ex: Supermercado, Salário, Transferência..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {dados.tipo === 'transferencia' ? (
                <div className="space-y-2">
                  <Label htmlFor="conta_destino_id">Conta Destino *</Label>
                  <Select
                    id="conta_destino_id"
                    value={dados.conta_destino_id || ''}
                    onChange={(e) => atualizarCampo('conta_destino_id', e.target.value)}
                    required
                  >
                    <option value="">Selecione a conta destino</option>
                    {dadosAuxiliares.contas.filter(c => c.id !== dados.conta_id).map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome}{conta.banco ? ` - ${conta.banco}` : ''} ({formatarTipoConta(conta.tipo)})
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div></div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={dados.status}
                  onChange={(e) => atualizarCampo('status', e.target.value as 'previsto' | 'realizado')}
                >
                  <option value="previsto">Previsto</option>
                  <option value="realizado">Realizado</option>
                </Select>
              </div>
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
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={dados.data_vencimento || ''}
                  onChange={(e) => atualizarCampo('data_vencimento', e.target.value)}
                />
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                value={dados.observacoes || ''}
                onChange={(e) => atualizarCampo('observacoes', e.target.value)}
                placeholder="Observações adicionais..."
              />
            </div>

            {/* Seção Recorrência */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="recorrente"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={dados.recorrente || false}
                  onChange={(e) => {
                    const isRecorrente = e.target.checked
                    atualizarCampo('recorrente', isRecorrente)
                    if (!isRecorrente) {
                      atualizarCampo('frequencia_recorrencia', undefined)
                      atualizarCampo('proxima_recorrencia', undefined)
                    }
                  }}
                />
                <Label htmlFor="recorrente" className="text-sm font-medium">
                  🔄 Transação Recorrente
                </Label>
              </div>

              {dados.recorrente && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequencia_recorrencia">Frequência</Label>
                    <Select
                      id="frequencia_recorrencia"
                      value={dados.frequencia_recorrencia || ''}
                      onChange={(e) => {
                        const freq = e.target.value as 'diario' | 'semanal' | 'mensal' | 'anual'
                        atualizarCampo('frequencia_recorrencia', freq)
                        if (dados.data) {
                          const proximaData = calcularProximaRecorrencia(dados.data, freq)
                          atualizarCampo('proxima_recorrencia', proximaData)
                        }
                      }}
                    >
                      <option value="">Selecione...</option>
                      <option value="diario">📅 Diário</option>
                      <option value="semanal">📆 Semanal</option>
                      <option value="mensal">🗓️ Mensal</option>
                      <option value="anual">📊 Anual</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proxima_recorrencia">Próxima Recorrência</Label>
                    <Input
                      id="proxima_recorrencia"
                      type="date"
                      value={dados.proxima_recorrencia || ''}
                      onChange={(e) => atualizarCampo('proxima_recorrencia', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'anexos':
        return (
          <div className="space-y-4">
            <UploadAnexo
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              anexoAtual={dados.anexo_url || undefined}
              disabled={salvando}
            />
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
      title={isEdicao ? "Editar Transação" : "Lançar Transação"} 
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
              Essencial
            </AbaButton>
            <AbaButton 
              ativa={abaAtiva === 'categorizacao'} 
              onClick={() => setAbaAtiva('categorizacao')}
            >
              Categorização
            </AbaButton>
            <AbaButton 
              ativa={abaAtiva === 'anexos'} 
              onClick={() => setAbaAtiva('anexos')}
            >
              Anexos
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
            {mensagem.texto}
          </div>
        )}

        {/* Conteúdo da Aba */}
        <div className="flex-1 overflow-y-auto">
          {(loadingAuxiliares || loadingTransacao) ? renderSkeletonForm(abaAtiva) : renderizarConteudo()}
        </div>

        {/* Rodapé com Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {(loadingAuxiliares || loadingTransacao) ? (
            <SkeletonButton className="w-36" />
          ) : (
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={salvando || !validarEssencial()}
            >
              {salvando ? 'Salvando...' : isEdicao ? 'Atualizar Transação' : 'Salvar Transação'}
            </Button>
          )}
        </div>
      </div>
    </ModalBase>
  )
}