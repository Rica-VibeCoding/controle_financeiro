'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ModalBase } from './modal-base'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { Skeleton, SkeletonInput, SkeletonLabel, SkeletonButton } from '@/componentes/ui/skeleton'
import { validarTransacao } from '@/utilitarios/validacao'
import { NovaTransacao } from '@/tipos/database'
import { Icone } from '@/componentes/ui/icone'
import { criarTransacao } from '@/servicos/supabase/transacoes'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'

/**
 * Props para o componente ModalTransferencia
 */
interface ModalTransferenciaProps {
  /** Indica se o modal esta aberto */
  isOpen: boolean
  /** Funcao chamada ao fechar o modal */
  onClose: () => void
  /** Funcao chamada apos sucesso na operacao */
  onSuccess?: () => void
}

// Constantes para timeouts
const TIMEOUT_ERRO = 5000
const TIMEOUT_SUCESSO = 2000

// Estado inicial padrao para transferencia
const ESTADO_INICIAL = {
  data: new Date().toISOString().split('T')[0],
  descricao: '',
  valor: 0,
  tipo: 'transferencia' as const,
  conta_id: '',
  conta_destino_id: '',
  status: 'realizado' as const,
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
 * Modal para criacao de transferencias entre contas
 * 
 * @component
 * @example
 * ```tsx
 * <ModalTransferencia 
 *   isOpen={true}
 *   onClose={() => setOpen(false)}
 *   onSuccess={() => refetch()}
 * />
 * ```
 */
export function ModalTransferencia({ isOpen, onClose, onSuccess }: ModalTransferenciaProps) {
  // Dados auxiliares do contexto global
  const { dados: dadosAuxiliares, loading: loadingAuxiliares } = useDadosAuxiliares()

  // Estado do formulario
  const [dados, setDados] = useState<Partial<NovaTransacao>>(ESTADO_INICIAL)

  // Estados locais
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(null)

  // Reset modal quando abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setDados(ESTADO_INICIAL)
    } else {
      // Reset apenas quando fechar
      setMensagem(null)
    }
  }, [isOpen])

  // Buscar categoria transferencia automaticamente
  const categoriaTransferencia = useMemo(() => {
    return dadosAuxiliares.categorias.find(
      cat => cat.nome.toLowerCase().includes('transferencia') || 
             cat.nome.toLowerCase().includes('transferência')
    )
  }, [dadosAuxiliares.categorias])

  // Definir categoria automaticamente quando encontrada
  useEffect(() => {
    if (categoriaTransferencia && isOpen) {
      setDados(prev => ({
        ...prev,
        categoria_id: categoriaTransferencia.id
      }))
    }
  }, [categoriaTransferencia, isOpen])

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
      [campo]: valor
    }))
  }, [])

  /**
   * Valida se os dados essenciais estao preenchidos
   * @returns true se valido, false caso contrario
   */
  const validarEssencial = useCallback(() => {
    const baseValid = dados.data && dados.valor && dados.valor > 0 && dados.conta_id
    const tipoValid = dados.tipo === 'transferencia'
    const contaDestinoValid = !!dados.conta_destino_id
    const contasDiferentes = dados.conta_id !== dados.conta_destino_id
    return baseValid && tipoValid && contaDestinoValid && contasDiferentes
  }, [dados.data, dados.valor, dados.conta_id, dados.tipo, dados.conta_destino_id])

  /**
   * Renderiza skeleton form unificado
   */
  const renderSkeletonForm = () => {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
   * Submete o formulario criando transferencia
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

    // Validacao especifica de transferencia
    if (dados.conta_id === dados.conta_destino_id) {
      setMensagem({ 
        tipo: 'erro', 
        texto: 'Conta origem e destino devem ser diferentes' 
      })
      setTimeout(() => setMensagem(null), TIMEOUT_ERRO)
      return
    }

    if (!dados.conta_destino_id) {
      setMensagem({ 
        tipo: 'erro', 
        texto: 'Conta destino e obrigatoria' 
      })
      setTimeout(() => setMensagem(null), TIMEOUT_ERRO)
      return
    }

    try {
      setSalvando(true)
      
      await criarTransacao(dados as NovaTransacao)

      setMensagem({ 
        tipo: 'sucesso', 
        texto: 'Transferencia realizada com sucesso!' 
      })
      
      setTimeout(() => {
        setMensagem(null)
        onSuccess?.()
        onClose()
      }, TIMEOUT_SUCESSO)

    } catch (error) {
      console.error('Erro ao criar transferencia:', error)
      setMensagem({ 
        tipo: 'erro', 
        texto: `Erro ao criar transferencia: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      })
      setTimeout(() => setMensagem(null), TIMEOUT_ERRO)
    } finally {
      setSalvando(false)
    }
  }

  // Renderizar formulario
  const renderizarFormulario = () => {
    return (
      <div className="space-y-4">
        {/* Data e Valor */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Descricao */}
        <div className="space-y-2">
          <Label htmlFor="descricao">Descricao</Label>
          <Input
            id="descricao"
            value={dados.descricao}
            onChange={(e) => atualizarCampo('descricao', e.target.value)}
            placeholder="Ex: Transferencia para poupanca..."
          />
        </div>

        {/* Contas Origem e Destino */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="conta_origem">Conta Origem *</Label>
            <Select
              id="conta_origem"
              value={dados.conta_id}
              onChange={(e) => atualizarCampo('conta_id', e.target.value)}
              required
            >
              <option value="">Selecione a conta origem</option>
              {dadosAuxiliares.contas.map(conta => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome}{conta.banco ? ` - ${conta.banco}` : ''} ({formatarTipoConta(conta.tipo)})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conta_destino">Conta Destino *</Label>
            <Select
              id="conta_destino"
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
        </div>

        {/* Status e Forma de Pagamento */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Observacoes */}
        <div className="space-y-2">
          <Label htmlFor="observacoes">Observacoes</Label>
          <Input
            id="observacoes"
            value={dados.observacoes || ''}
            onChange={(e) => atualizarCampo('observacoes', e.target.value)}
            placeholder="Observacoes adicionais..."
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
              🔄 Transferência Recorrente
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
                  <option value="diario">Diário</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
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
  }

  return (
    <ModalBase 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Transferência Entre Contas" 
      fixedWidth="600px"
    >
      <div className="h-[450px] flex flex-col">
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

        {/* Conteudo do Formulario */}
        <div className="flex-1 overflow-y-auto">
          {loadingAuxiliares ? renderSkeletonForm() : renderizarFormulario()}
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
              {salvando ? 'Transferindo...' : 'Confirmar Transferencia'}
            </Button>
          )}
        </div>
      </div>
    </ModalBase>
  )
}
