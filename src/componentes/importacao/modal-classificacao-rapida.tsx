'use client'

import { useState, useEffect } from 'react'
import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { TransacaoClassificada, DadosClassificacao } from '@/tipos/importacao'
import { FormatoCSV } from '@/servicos/importacao/detector-formato'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'

interface ModalClassificacaoProps {
  isOpen: boolean
  onClose: () => void
  transacao: TransacaoClassificada | null
  onClassificar: (dados: DadosClassificacao) => void
  formatoOrigem?: FormatoCSV
}

export function ModalClassificacaoRapida({
  isOpen,
  onClose,
  transacao,
  onClassificar,
  formatoOrigem
}: ModalClassificacaoProps) {
  const [categoria, setCategoria] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [centroCusto, setCentroCusto] = useState('')
  const [subcategorias, setSubcategorias] = useState<any[]>([])

  // Usar contexto de dados auxiliares
  const { dados, obterSubcategorias } = useDadosAuxiliares()

  // Resetar campos ao abrir modal
  useEffect(() => {
    if (isOpen && transacao) {
      // PRÉ-PREENCHER com dados já existentes na transação (prioridade)
      // ou fallback para classificacao_automatica
      const classificacaoAuto = (transacao as any).classificacao_automatica

      const categoriaId = transacao.categoria_id || classificacaoAuto?.categoria_id || ''
      const subcategoriaId = transacao.subcategoria_id || classificacaoAuto?.subcategoria_id || ''
      const centroCustoId = transacao.centro_custo_id || classificacaoAuto?.centro_custo_id || ''

      setCategoria(categoriaId)
      setSubcategoria(subcategoriaId)
      setCentroCusto(centroCustoId)
      setSubcategorias([])

      // FASE 2: PRE-SELECIONAR FORMA DE PAGAMENTO PADRÃO
      // Priorizar dados já na transação, depois classificação automática
      let formaSelecionada = transacao.forma_pagamento_id || classificacaoAuto?.forma_pagamento_id || ''

      if (!formaSelecionada) {
        // Tentar pré-selecionar PIX (mais usual)
        const pixForm = dados.formasPagamento.find(f =>
          f.nome.toLowerCase().includes('pix') && f.ativo
        )
        if (pixForm) {
          formaSelecionada = pixForm.id
        } else {
          // Fallback: primeira forma ativa
          const formaAtiva = dados.formasPagamento.find(f => f.ativo)
          if (formaAtiva) {
            formaSelecionada = formaAtiva.id
          }
        }
      }

      // Fallback: tentar lógica antiga baseada em formato_origem (compatibilidade)
      if (!formaSelecionada && transacao.formato_origem) {
        if (transacao.formato_origem.toLowerCase().includes('cartão')) {
          const cartaoForm = dados.formasPagamento.find(f =>
            f.tipo === 'credito' && f.ativo
          )
          if (cartaoForm) {
            formaSelecionada = cartaoForm.id
          }
        }
      }

      setFormaPagamento(formaSelecionada)
    }
  }, [isOpen, transacao, formatoOrigem, dados.formasPagamento])

  // Carregar subcategorias quando categoria mudar
  useEffect(() => {
    const carregarSubcategorias = async () => {
      if (categoria) {
        const subs = await obterSubcategorias(categoria)
        setSubcategorias(subs)
      } else {
        setSubcategorias([])
      }
      setSubcategoria('')
    }

    carregarSubcategorias()
  }, [categoria, obterSubcategorias])

  const handleSalvar = () => {
    if (!categoria || !formaPagamento) {
      return // Validação básica - subcategoria e centro de custo são opcionais
    }

    onClassificar({
      categoria_id: categoria,
      subcategoria_id: subcategoria || null,
      forma_pagamento_id: formaPagamento,
      centro_custo_id: centroCusto || null
    })

    onClose()
  }

  const categoriasFiltradas = dados.categorias.filter(cat =>
    cat.ativo && (cat.tipo === transacao?.tipo || cat.tipo === 'ambos')
  )

  return (
    <ModalBase 
      isOpen={isOpen} 
      onClose={onClose} 
      title="⏳ Classificar Transação"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Dados da transação */}
        {transacao && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="font-medium text-gray-900 mb-1">
              {transacao.descricao.replace(/- •••\.\d+\.\d+-•• - .+$/, '').trim()}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-4">
              <span>{new Date(transacao.data).toLocaleDateString('pt-BR')}</span>
              <span className={`font-medium ${
                transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transacao.tipo === 'receita' ? '+' : '-'}R$ {transacao.valor.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria *
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione uma categoria</option>
            {categoriasFiltradas.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategoria
          </label>
          <select
            value={subcategoria}
            onChange={(e) => setSubcategoria(e.target.value)}
            disabled={!categoria}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">
              {categoria ? 'Subcategoria (opcional)' : 'Primeiro selecione uma categoria'}
            </option>
            {subcategorias.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Centro de Custo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Centro de Custo
          </label>
          <select
            value={centroCusto}
            onChange={(e) => setCentroCusto(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Centro de custo (opcional)</option>
            {dados.centrosCusto
              ?.filter(cc => cc.ativo && !cc.arquivado)
              .map(cc => (
                <option key={cc.id} value={cc.id}>
                  {cc.nome}
                </option>
              ))}
          </select>
        </div>

        {/* Forma de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Forma de Pagamento *
          </label>
          <select
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione uma forma de pagamento</option>
            {dados.formasPagamento.map(forma => (
              <option key={forma.id} value={forma.id}>
                {forma.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Botões */}
        <div className="flex gap-3 justify-end pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            type="button"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvar}
            disabled={!categoria || !formaPagamento}
            type="button"
          >
            Aplicar Classificação
          </Button>
        </div>
      </div>
    </ModalBase>
  )
}