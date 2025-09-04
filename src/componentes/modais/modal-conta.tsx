'use client'

import { useState, useEffect } from 'react'
import { ModalBase } from './modal-base'
import { CamposEssenciaisGenericos } from '@/componentes/comum/campos-essenciais-genericos'
import { useModalForm } from '@/hooks/usar-modal-form'
import { useModais } from '@/contextos/modais-contexto'
import { useAuth } from '@/contextos/auth-contexto'
import { criarConta, atualizarConta, obterContaPorId } from '@/servicos/supabase/contas'
import { validarConta } from '@/utilitarios/validacao'
import type { NovaConta } from '@/tipos/database'

/**
 * Props para o componente ModalConta
 */
interface ModalContaProps {
  /** Indica se o modal está aberto */
  isOpen: boolean
  /** Função chamada ao fechar o modal */
  onClose: () => void
  /** Função chamada após sucesso na operação */
  onSuccess?: () => void
  /** ID da conta para edição (opcional) */
  contaId?: string
}

// Estado inicial padrão
const ESTADO_INICIAL: NovaConta = {
  nome: '',
  tipo: 'conta_corrente',
  banco: '',
  limite: null,
  data_fechamento: null,
  ativo: true,
  workspace_id: ''
}

/**
 * Modal para criar e editar contas
 */
export function ModalConta({
  isOpen,
  onClose,
  onSuccess,
  contaId
}: ModalContaProps) {
  const { workspace } = useAuth()
  const { conta } = useModais()

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
  } = useModalForm<NovaConta>({
    estadoInicial: ESTADO_INICIAL,
    validar: validarConta,
    salvar: async (dadosConta) => {
      if (editando && contaId) {
        await atualizarConta(contaId, dadosConta as any, workspace!.id)
      } else {
        await criarConta(dadosConta as any, workspace!.id)
      }
    },
    carregar: contaId && workspace ? async (id: string) => {
      const conta = await obterContaPorId(id)
      if (conta) {
        return {
          nome: conta.nome,
          tipo: conta.tipo,
          banco: conta.banco || '',
          limite: conta.limite ?? null,
          data_fechamento: conta.data_fechamento ?? null,
          ativo: conta.ativo ?? true,
          workspace_id: conta.workspace_id
        } as NovaConta
      }
      return ESTADO_INICIAL
    } : undefined,
    onSucesso: () => {
      onSuccess?.()
      conta.fechar()
    },
    limparAposSucesso: true
  })

  // Inicializar edição quando modal abrir com ID
  useEffect(() => {
    if (isOpen && contaId && !editando) {
      inicializarEdicao(contaId)
    } else if (isOpen && !contaId) {
      limparFormulario()
    }
  }, [isOpen, contaId, editando, inicializarEdicao, limparFormulario])

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
  const titulo = editando ? 'Editar Conta' : 'Nova Conta'

  // Texto do botão principal
  const textoBotaoPrincipal = editando ? 'Atualizar Conta' : 'Criar Conta'

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleClose}
      title={titulo}
      fixedWidth="480px"
    >
      <div className="space-y-4">
        {/* Formulário Compacto */}
        <div className="space-y-4">
          <CamposEssenciaisGenericos
            tipo="conta"
            dados={dados}
            onChange={(campo: string, valor: any) => atualizarCampo(campo as keyof NovaConta, valor)}
            erros={erros}
            carregando={carregandoDados}
          />
        </div>
        
        {/* Preview Compacto */}
        {dados.nome && (
          <div className="bg-gray-50 border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {dados.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{dados.nome}</div>
                <div className="text-sm text-gray-500">
                  {dados.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  {dados.banco && ` • ${dados.banco}`}
                  {dados.tipo === 'cartao_credito' && dados.limite && ` • Limite: R$ ${dados.limite.toLocaleString('pt-BR')}`}
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