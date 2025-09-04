'use client'

import { useState, useEffect, useMemo } from 'react'
import { ModalBase } from './modal-base'
import { CamposEssenciaisGenericos } from '@/componentes/comum/campos-essenciais-genericos'
import { SecaoPreview } from '@/componentes/comum/secao-preview'
import { BotoesAcaoModal } from '@/componentes/comum/botoes-acao-modal'
import { useModalForm } from '@/hooks/usar-modal-form'
import { useModais } from '@/contextos/modais-contexto'
import { useAuth } from '@/contextos/auth-contexto'
import { criarCategoria, atualizarCategoria, obterCategoriaPorId } from '@/servicos/supabase/categorias'
import { validarCategoria } from '@/utilitarios/validacao'
import type { Categoria, NovaCategoria } from '@/tipos/database'

/**
 * Props para o componente ModalCategoria
 */
interface ModalCategoriaProps {
  /** Indica se o modal está aberto */
  isOpen: boolean
  /** Função chamada ao fechar o modal */
  onClose: () => void
  /** Função chamada após sucesso na operação */
  onSuccess?: () => void
  /** ID da categoria para edição (opcional) */
  categoriaId?: string
}

// Removido sistema de abas - layout único simplificado

// Estado inicial padrão
const ESTADO_INICIAL: NovaCategoria = {
  nome: '',
  tipo: 'despesa',
  icone: 'tag', // Sempre definido
  cor: '#3B82F6', // Sempre definido
  ativo: true,
  workspace_id: '' // Será preenchido pelo hook
}

/**
 * Modal para criar e editar categorias
 */
export function ModalCategoria({
  isOpen,
  onClose,
  onSuccess,
  categoriaId
}: ModalCategoriaProps) {
  const { workspace } = useAuth()
  const { categoria } = useModais()

  // Hook personalizado para gerenciar formulário
  const {
    dados,
    erros,
    carregandoDados,
    salvando,
    editando,
    atualizarCampo,
    inicializarEdicao,
    limparFormulario,
    submeter,
    formularioValido
  } = useModalForm<NovaCategoria>({
    estadoInicial: ESTADO_INICIAL,
    validar: validarCategoria,
    salvar: async (dadosCategoria) => {
      // Garantir que campos obrigatórios tenham valores definidos
      const dadosLimpos = {
        ...dadosCategoria,
        icone: dadosCategoria.icone || 'tag',
        cor: dadosCategoria.cor || '#3B82F6',
        ativo: dadosCategoria.ativo ?? true
      }
      
      if (editando && categoriaId) {
        await atualizarCategoria(categoriaId, dadosLimpos, workspace!.id)
      } else {
        await criarCategoria(dadosLimpos, workspace!.id)
      }
    },
    carregar: categoriaId && workspace ? async (id: string) => {
      const categoria = await obterCategoriaPorId(id)
      return categoria as NovaCategoria
    } : undefined,
    onSucesso: () => {
      onSuccess?.()
      categoria.fechar()
    },
    limparAposSucesso: true
  })

  // Inicializar edição quando modal abrir com ID
  useEffect(() => {
    if (isOpen && categoriaId && !editando) {
      inicializarEdicao(categoriaId)
    } else if (isOpen && !categoriaId) {
      limparFormulario()
    }
  }, [isOpen, categoriaId, editando, inicializarEdicao, limparFormulario])

  // Fechar modal e resetar estado
  const handleClose = () => {
    limparFormulario()
    onClose()
  }

  // Submeter formulário
  const handleSubmit = async () => {
    await submeter()
  }

  // Título do modal
  const titulo = editando ? 'Editar Categoria' : 'Nova Categoria'

  // Texto do botão principal
  const textoBotaoPrincipal = editando ? 'Atualizar Categoria' : 'Criar Categoria'

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleClose}
      title={titulo}
      fixedWidth="520px"
    >
      <div className="space-y-4">
        {/* Formulário Compacto */}
        <div className="space-y-4">
          <CamposEssenciaisGenericos
            tipo="categoria"
            dados={dados}
            onChange={(campo: string, valor: any) => atualizarCampo(campo as keyof NovaCategoria, valor)}
            erros={erros}
            carregando={carregandoDados}
          />
        </div>
        
        {/* Preview Compacto */}
        {dados.nome && (
          <div className="bg-gray-50 border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: dados.cor || '#3B82F6' }}
              >
                <div className="text-white text-sm">
                  {dados.icone === 'banknote' ? '💰' :
                   dados.icone === 'home' ? '🏠' : 
                   dados.icone === 'car' ? '🚗' : 
                   dados.icone === 'utensils' ? '🍽️' : 
                   dados.icone === 'shopping-cart' ? '🛒' : 
                   dados.icone === 'heart' ? '❤️' : 
                   dados.icone === 'gamepad-2' ? '🎮' : 
                   dados.icone === 'stethoscope' ? '🏥' :
                   dados.icone === 'graduation-cap' ? '🎓' : '🏷️'}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{dados.nome}</div>
                <div className="text-sm text-gray-500 capitalize">
                  {dados.tipo === 'receita' ? 'Receita' : 
                   dados.tipo === 'despesa' ? 'Despesa' : 'Ambos'} • {dados.cor || '#3B82F6'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Erros */}
        {erros.length > 0 && (
          <div className="px-3 py-2 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="text-sm text-red-700">
              {erros.map((erro, index) => (
                <div key={index}>{erro}</div>
              ))}
            </div>
          </div>
        )}
        
        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={salvando}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={salvando || !formularioValido}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? 'Salvando...' : textoBotaoPrincipal}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}