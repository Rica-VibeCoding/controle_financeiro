'use client'

import { useState, useEffect, useMemo } from 'react'
import { ModalBase } from './modal-base'
import { CamposEssenciaisGenericos } from '@/componentes/comum/campos-essenciais-genericos'
import { SecaoPreview } from '@/componentes/comum/secao-preview'
import { BotoesAcaoModal } from '@/componentes/comum/botoes-acao-modal'
import { useModalForm } from '@/hooks/usar-modal-form'
import { useModais } from '@/contextos/modais-contexto'
import { useAuth } from '@/contextos/auth-contexto'
import { criarFormaPagamento, atualizarFormaPagamento, obterFormaPagamentoPorId } from '@/servicos/supabase/formas-pagamento'
import { validarFormaPagamento } from '@/utilitarios/validacao'
import type { FormaPagamento, NovaFormaPagamento } from '@/tipos/database'

/**
 * Props para o componente ModalFormaPagamento
 */
interface ModalFormaPagamentoProps {
  /** Indica se o modal está aberto */
  isOpen: boolean
  /** Função chamada ao fechar o modal */
  onClose: () => void
  /** Função chamada após sucesso na operação */
  onSuccess?: () => void
  /** ID da forma de pagamento para edição (opcional) */
  formaPagamentoId?: string
}

/**
 * Estado inicial dos dados da forma de pagamento
 */
const ESTADO_INICIAL_FORMA_PAGAMENTO: NovaFormaPagamento = {
  nome: '',
  tipo: 'debito',
  permite_parcelamento: false,
  ativo: true,
  workspace_id: ''
}

/**
 * Modal para criação e edição de formas de pagamento
 * Formulário simples sem abas - apenas campos essenciais
 */
export function ModalFormaPagamento({
  isOpen,
  onClose,
  onSuccess,
  formaPagamentoId
}: ModalFormaPagamentoProps) {
  
  const { workspace } = useAuth()
  const { fecharTodosModais } = useModais()
  
  // Estados locais
  const [mostrarPreview, setMostrarPreview] = useState(false)

  // Configuração do hook de formulário
  const {
    dados,
    erros,
    carregandoDados,
    salvando,
    editando,
    atualizarCampo,
    submeter,
    limparFormulario,
    formularioValido
  } = useModalForm<NovaFormaPagamento>({
    estadoInicial: ESTADO_INICIAL_FORMA_PAGAMENTO,
    validar: validarFormaPagamento,
    salvar: async (dados) => {
      if (editando && formaPagamentoId) {
        await atualizarFormaPagamento(formaPagamentoId, dados, workspace?.id || '')
      } else {
        const dadosLimpos = {
          nome: dados.nome,
          tipo: dados.tipo,
          permite_parcelamento: dados.permite_parcelamento ?? false,
          ativo: dados.ativo ?? true
        }
        await criarFormaPagamento(dadosLimpos, workspace?.id || '')
      }
    },
    carregar: formaPagamentoId && workspace ? async (id) => {
      return await obterFormaPagamentoPorId(id, workspace.id) as NovaFormaPagamento
    } : undefined,
    onSucesso: () => {
      onSuccess?.()
      onClose()
      setMostrarPreview(false)
    },
    onErro: (erro) => {
      console.error('Erro no modal forma pagamento:', erro)
    }
  })

  // Efeito para inicializar edição
  useEffect(() => {
    if (isOpen && formaPagamentoId) {
      // O useModalForm já cuida da inicialização via carregar()
    }
  }, [isOpen, formaPagamentoId])

  // Efeito para limpar formulário ao fechar
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        limparFormulario()
        setMostrarPreview(false)
      }, 300)
    }
  }, [isOpen, limparFormulario])

  // Handlers
  const handleFechar = () => {
    onClose()
    setMostrarPreview(false)
  }

  const handleSubmeter = async () => {
    await submeter()
  }

  const handleMostrarPreview = () => {
    setMostrarPreview(true)
  }

  const handleVoltarEdicao = () => {
    setMostrarPreview(false)
  }

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleFechar}
      title={editando ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
      fixedWidth="500px"
    >
      <div className="space-y-6">
        
        {!mostrarPreview ? (
          <div className="space-y-4">
            {/* Campos essenciais */}
            <CamposEssenciaisGenericos
              tipo="forma-pagamento"
              dados={dados}
              onChange={atualizarCampo as any}
              erros={erros}
              carregando={carregandoDados}
            />

            {/* Botões de ação */}
            <div className="flex justify-between items-center pt-4">
              {/* Botão preview (só se dados válidos) */}
              <div>
                {formularioValido && dados.nome && dados.tipo && (
                  <button
                    type="button"
                    onClick={handleMostrarPreview}
                    className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
                  >
                    👁️ Visualizar prévia
                  </button>
                )}
              </div>

              {/* Botões principais */}
              <BotoesAcaoModal
                onCancelar={handleFechar}
                onSalvar={handleSubmeter}
                salvando={salvando}
                desabilitarSalvar={!formularioValido}
                textoSalvar={editando ? 'Atualizar' : 'Criar'}
                carregando={carregandoDados}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview da forma de pagamento */}
            <SecaoPreview
              tipo="forma-pagamento"
              dados={dados}
              titulo="Preview da Forma de Pagamento"
              carregando={carregandoDados}
            />

            {/* Botões do preview */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={handleVoltarEdicao}
                className="text-sm text-gray-600 hover:text-gray-800 underline transition-colors"
              >
                ← Voltar para edição
              </button>

              <BotoesAcaoModal
                onCancelar={handleFechar}
                onSalvar={handleSubmeter}
                salvando={salvando}
                desabilitarSalvar={!formularioValido}
                textoSalvar={editando ? 'Atualizar Forma de Pagamento' : 'Criar Forma de Pagamento'}
                variantSalvar="default"
              />
            </div>
          </div>
        )}

        {/* Indicador de erros gerais */}
        {erros.length > 0 && !carregandoDados && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-800">
              <strong>Corrija os seguintes erros:</strong>
              <ul className="mt-1 list-disc list-inside space-y-1">
                {erros.map((erro, index) => (
                  <li key={index}>{erro}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </ModalBase>
  )
}