'use client'

import { useState, useEffect } from 'react'
import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { TransacaoClassificada, DadosClassificacao } from '@/tipos/importacao'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'

interface ModalClassificacaoProps {
  isOpen: boolean
  onClose: () => void
  transacao: TransacaoClassificada | null
  onClassificar: (dados: DadosClassificacao) => void
}

export function ModalClassificacaoRapida({
  isOpen,
  onClose,
  transacao,
  onClassificar
}: ModalClassificacaoProps) {
  const [categoria, setCategoria] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [subcategorias, setSubcategorias] = useState<any[]>([])
  
  // Usar contexto de dados auxiliares
  const { dados, obterSubcategorias } = useDadosAuxiliares()

  // Resetar campos ao abrir modal
  useEffect(() => {
    if (isOpen && transacao) {
      setCategoria('')
      setSubcategoria('')
      setSubcategorias([])
      
      // PRE-SELECIONAR FORMA DE PAGAMENTO baseada no formato origem
      if (transacao.formato_origem === 'Cartão de crédito') {
        // ID do "Crédito" na tabela fp_formas_pagamento
        setFormaPagamento('777c439c-614d-41e0-b3bf-833d2abcf846')
        console.log('💳 Pré-selecionado: Cartão de Crédito para transação de cartão')
      } else {
        setFormaPagamento('')
      }
    }
  }, [isOpen, transacao])

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
    if (!categoria || !subcategoria || !formaPagamento) {
      return // Validação básica
    }

    onClassificar({
      categoria_id: categoria,
      subcategoria_id: subcategoria,
      forma_pagamento_id: formaPagamento
    })

    onClose()
  }

  const categoriasFiltradas = dados.categorias.filter(cat => 
    cat.ativo && (cat.tipo === transacao?.tipo || cat.tipo === 'ambos')
  )

  // Debug para verificar o que está acontecendo
  console.log('🐛 Debug Categorias:', {
    totalCategorias: dados.categorias.length,
    categoriasAtivas: dados.categorias.filter(c => c.ativo).length,
    tipoTransacao: transacao?.tipo,
    categoriasFiltradas: categoriasFiltradas.length,
    nomesFiltradas: categoriasFiltradas.map(c => c.nome)
  })

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
            Subcategoria *
          </label>
          <select
            value={subcategoria}
            onChange={(e) => setSubcategoria(e.target.value)}
            disabled={!categoria}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">
              {categoria ? 'Selecione uma subcategoria' : 'Primeiro selecione uma categoria'}
            </option>
            {subcategorias.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.nome}
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
            disabled={!categoria || !subcategoria || !formaPagamento}
            type="button"
          >
            Aplicar Classificação
          </Button>
        </div>
      </div>
    </ModalBase>
  )
}