'use client'

import { useState, useEffect } from 'react'
import { ModalBase } from './modal-base'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Skeleton, SkeletonInput, SkeletonLabel } from '@/componentes/ui/skeleton'
import { useModalForm } from '@/hooks/usar-modal-form'
import { useModais } from '@/contextos/modais-contexto'
import { useAuth } from '@/contextos/auth-contexto'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'
import {
  criarCliente,
  atualizarContato,
  obterContatoPorId
} from '@/servicos/supabase/contatos-queries'
import { validarContato } from '@/utilitarios/validacao'

/**
 * Props para o componente ModalCliente
 */
interface ModalClienteProps {
  /** Indica se o modal está aberto */
  isOpen: boolean
  /** Função chamada ao fechar o modal */
  onClose: () => void
  /** Função chamada após sucesso na operação */
  onSuccess?: () => void
  /** ID do cliente para edição (opcional) */
  clienteId?: string
}

// Estado inicial padrão
const ESTADO_INICIAL = {
  nome: '',
  telefone: '',
  email: ''
}

/**
 * Modal para criar e editar clientes de forma simplificada
 * Apenas campo: nome
 */
export function ModalCliente({
  isOpen,
  onClose,
  onSuccess,
  clienteId
}: ModalClienteProps) {
  const { workspace } = useAuth()
  const { cliente } = useModais()
  const { recarregarDados } = useDadosAuxiliares()

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
  } = useModalForm<typeof ESTADO_INICIAL>({
    estadoInicial: ESTADO_INICIAL,
    validar: validarContato,
    salvar: async (dadosCliente) => {
      if (editando && clienteId) {
        await atualizarContato(
          clienteId,
          dadosCliente.nome,
          workspace!.id,
          dadosCliente.telefone,
          dadosCliente.email
        )
      } else {
        await criarCliente(
          dadosCliente.nome,
          workspace!.id,
          dadosCliente.telefone,
          dadosCliente.email
        )
      }
    },
    carregar: clienteId && workspace ? async (id: string) => {
      const contato = await obterContatoPorId(id)
      if (contato) {
        return {
          nome: contato.nome,
          telefone: contato.telefone || '',
          email: contato.email || ''
        }
      }
      return ESTADO_INICIAL
    } : undefined,
    onSucesso: async () => {
      await recarregarDados() // Recarregar cache de dados auxiliares
      onSuccess?.()
      cliente.fechar()
    },
    limparAposSucesso: true
  })

  // Inicializar edição quando modal abrir com ID
  useEffect(() => {
    if (isOpen && clienteId && !editando) {
      inicializarEdicao(clienteId)
    } else if (isOpen && !clienteId) {
      limparFormulario()
    }
  }, [isOpen, clienteId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submeter()
  }

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={editando ? "Editar Cliente" : "Novo Cliente"}
      fixedWidth="500px"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mensagem informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <div className="flex gap-2">
            <span>💡</span>
            <div>
              <strong>Cadastro Simplificado</strong>
              <p className="mt-1 text-blue-700">
                Este formulário permite cadastro rápido com apenas o nome.
                Para cadastro completo aguarde o módulo "Fluyt Comercial".
              </p>
            </div>
          </div>
        </div>

        {carregandoDados ? (
          <div className="space-y-4">
            <div>
              <SkeletonLabel />
              <SkeletonInput />
            </div>
          </div>
        ) : (
          <>
            {/* Campo Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome do Cliente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                value={dados.nome}
                onChange={(e) => atualizarCampo('nome', e.target.value)}
                placeholder="Ex: João Silva, Empresa XYZ Ltda"
                disabled={salvando}
                autoFocus
                maxLength={255}
              />
            </div>

            {/* Campo Telefone */}
            <div className="space-y-2">
              <Label htmlFor="telefone">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={dados.telefone}
                onChange={(e) => atualizarCampo('telefone', e.target.value)}
                placeholder="Ex: (11) 99999-9999"
                disabled={salvando}
                maxLength={15}
              />
            </div>

            {/* Campo Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={dados.email}
                onChange={(e) => atualizarCampo('email', e.target.value)}
                placeholder="Ex: cliente@exemplo.com"
                disabled={salvando}
                maxLength={255}
              />
            </div>
          </>
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

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={salvando || carregandoDados || !formularioValido}
          >
            {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </ModalBase>
  )
}
