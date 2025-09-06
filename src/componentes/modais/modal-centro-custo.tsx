'use client'

import { useState, useEffect, useMemo } from 'react'
import { ModalBase } from './modal-base'
import { CamposEssenciaisGenericos } from '@/componentes/comum/campos-essenciais-genericos'
import { SecaoPreview } from '@/componentes/comum/secao-preview'
import { BotoesAcaoModal } from '@/componentes/comum/botoes-acao-modal'
import { useModalForm } from '@/hooks/usar-modal-form'
import { useModais } from '@/contextos/modais-contexto'
import { useAuth } from '@/contextos/auth-contexto'
import { criarCentroCusto, atualizarCentroCusto, obterCentroCustoPorId } from '@/servicos/supabase/centros-custo'
import { validarCentroCusto } from '@/utilitarios/validacao'
import type { CentroCusto, NovoCentroCusto } from '@/tipos/database'

/**
 * Props para o componente ModalCentroCusto
 */
interface ModalCentroCustoProps {
  /** Indica se o modal está aberto */
  isOpen: boolean
  /** Função chamada ao fechar o modal */
  onClose: () => void
  /** Função chamada após sucesso na operação */
  onSuccess?: () => void
  /** ID do centro de custo para edição (opcional) */
  centroCustoId?: string
}

/**
 * Estado inicial dos dados do centro de custo
 */
const ESTADO_INICIAL_CENTRO_CUSTO: NovoCentroCusto = {
  nome: '',
  descricao: '',
  cor: '#3B82F6',
  ativo: true,
  workspace_id: ''
}

/**
 * Modal para criação e edição de centros de custo
 * Formulário simples sem abas - apenas campos essenciais
 */
export function ModalCentroCusto({
  isOpen,
  onClose,
  onSuccess,
  centroCustoId
}: ModalCentroCustoProps) {
  
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
    inicializarEdicao,
    limparFormulario,
    submeter,
    formularioValido
  } = useModalForm<NovoCentroCusto>({
    estadoInicial: ESTADO_INICIAL_CENTRO_CUSTO,
    validar: validarCentroCusto,
    salvar: async (dados) => {
      if (editando && centroCustoId) {
        await atualizarCentroCusto(centroCustoId, dados, workspace?.id || '')
      } else {
        const dadosLimpos = {
          nome: dados.nome,
          descricao: dados.descricao || null,
          cor: dados.cor || '#3B82F6',
          ativo: dados.ativo ?? true,
          arquivado: dados.arquivado || false,
          valor_orcamento: dados.valor_orcamento || null,
          data_inicio: dados.data_inicio || new Date().toISOString().split('T')[0],
          data_fim: dados.data_fim || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          data_arquivamento: dados.data_arquivamento || null
        }
        await criarCentroCusto(dadosLimpos, workspace?.id || '')
      }
    },
    carregar: centroCustoId && workspace ? async (id) => {
      return await obterCentroCustoPorId(id, workspace.id) as NovoCentroCusto
    } : undefined,
    onSucesso: () => {
      onSuccess?.()
      onClose()
      setMostrarPreview(false)
    },
    onErro: (erro) => {
      console.error('Erro no modal centro de custo:', erro)
    }
  })

  // Inicializar edição quando modal abrir com ID
  useEffect(() => {
    if (isOpen && centroCustoId && !editando) {
      inicializarEdicao(centroCustoId)
    } else if (isOpen && !centroCustoId) {
      limparFormulario()
    }
  }, [isOpen, centroCustoId, editando]) // ← CORREÇÃO: Remover functions das dependências

  // Efeito para limpar formulário ao fechar
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        limparFormulario()
        setMostrarPreview(false)
      }, 300)
    }
  }, [isOpen]) // ← CORREÇÃO: Remover limparFormulario das dependências

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
      title={editando ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
      fixedWidth="500px"
    >
      <div className="space-y-6">
        
        {!mostrarPreview ? (
          <div className="space-y-4">
            {/* Campos essenciais */}
            <CamposEssenciaisGenericos
              tipo="centro-custo"
              dados={dados}
              onChange={atualizarCampo as any}
              erros={erros}
              carregando={carregandoDados}
            />

            {/* Botões de ação */}
            <div className="flex justify-between items-center pt-4">
              {/* Botão preview (só se dados válidos) */}
              <div>
                {formularioValido && dados.nome && (
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
            {/* Preview do centro de custo */}
            <SecaoPreview
              tipo="centro-custo"
              dados={dados}
              titulo="Preview do Centro de Custo"
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
                textoSalvar={editando ? 'Atualizar Centro de Custo' : 'Criar Centro de Custo'}
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