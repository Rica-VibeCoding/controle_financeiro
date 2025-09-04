'use client'

import { useState, useEffect, useMemo } from 'react'
import { ModalBase } from './modal-base'
import { CamposEssenciaisGenericos } from '@/componentes/comum/campos-essenciais-genericos'
import { SecaoPreview } from '@/componentes/comum/secao-preview'
import { BotoesAcaoModal } from '@/componentes/comum/botoes-acao-modal'
import { useModalForm } from '@/hooks/usar-modal-form'
import { useModais } from '@/contextos/modais-contexto'
import { useAuth } from '@/contextos/auth-contexto'
import { obterCategorias } from '@/servicos/supabase/categorias'
import { criarSubcategoria, atualizarSubcategoria, obterSubcategoriaPorId } from '@/servicos/supabase/subcategorias'
import { validarSubcategoria } from '@/utilitarios/validacao'
import type { Subcategoria, NovaSubcategoria } from '@/tipos/database'

/**
 * Props para o componente ModalSubcategoria
 */
interface ModalSubcategoriaProps {
  /** Indica se o modal está aberto */
  isOpen: boolean
  /** Função chamada ao fechar o modal */
  onClose: () => void
  /** Função chamada após sucesso na operação */
  onSuccess?: () => void
  /** ID da subcategoria para edição (opcional) */
  subcategoriaId?: string
}

/**
 * Estado inicial dos dados da subcategoria
 */
const ESTADO_INICIAL_SUBCATEGORIA: NovaSubcategoria = {
  nome: '',
  categoria_id: '',
  ativo: true,
  workspace_id: ''
}

/**
 * Modal para criação e edição de subcategorias
 * Formulário simples sem abas - apenas campos essenciais
 */
export function ModalSubcategoria({
  isOpen,
  onClose,
  onSuccess,
  subcategoriaId
}: ModalSubcategoriaProps) {
  
  const { workspace } = useAuth()
  const { fecharTodosModais } = useModais()
  
  // Estados locais
  const [mostrarPreview, setMostrarPreview] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  // Carregar categorias quando o modal abrir
  useEffect(() => {
    if (isOpen && workspace) {
      async function carregarCategorias() {
        try {
          setLoadingCategorias(true)
          const dadosCategorias = await obterCategorias(false, workspace?.id || '')
          setCategorias(dadosCategorias)
        } catch (error) {
          console.error('Erro ao carregar categorias:', error)
        } finally {
          setLoadingCategorias(false)
        }
      }
      carregarCategorias()
    }
  }, [isOpen, workspace])

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
  } = useModalForm<NovaSubcategoria>({
    estadoInicial: ESTADO_INICIAL_SUBCATEGORIA,
    validar: validarSubcategoria,
    salvar: async (dados) => {
      if (editando && subcategoriaId) {
        await atualizarSubcategoria(subcategoriaId, dados, workspace?.id || '')
      } else {
        await criarSubcategoria({
          ...dados,
          ativo: true
        }, workspace?.id || '')
      }
    },
    carregar: subcategoriaId && workspace ? async (id) => {
      return await obterSubcategoriaPorId(id, workspace.id) as NovaSubcategoria
    } : undefined,
    onSucesso: () => {
      onSuccess?.()
      onClose()
      setMostrarPreview(false)
    },
    onErro: (erro) => {
      console.error('Erro no modal subcategoria:', erro)
    }
  })

  // Dados auxiliares formatados para o componente genérico
  const dadosAuxiliares = useMemo(() => ({
    categorias: categorias?.map(cat => ({
      id: cat.id,
      nome: cat.nome,
      tipo: cat.tipo
    })) || []
  }), [categorias])

  // Efeito para inicializar edição
  useEffect(() => {
    if (isOpen && subcategoriaId) {
      // O useModalForm já cuida da inicialização via carregar()
    }
  }, [isOpen, subcategoriaId])

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

  // Preparar dados para preview
  const categoriasSelecionada = categorias?.find(cat => cat.id === dados.categoria_id)
  const dadosPreview = {
    ...dados,
    categoria_nome: categoriasSelecionada?.nome || '',
    categoria_tipo: categoriasSelecionada?.tipo || 'despesa'
  }

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleFechar}
      title={editando ? 'Editar Subcategoria' : 'Nova Subcategoria'}
      fixedWidth="500px"
    >
      <div className="space-y-6">
        
        {!mostrarPreview ? (
          <div className="space-y-4">
            {/* Campos essenciais */}
            <CamposEssenciaisGenericos
              tipo="subcategoria"
              dados={dados}
              onChange={atualizarCampo as any}
              erros={erros}
              carregando={carregandoDados || loadingCategorias}
              dadosAuxiliares={dadosAuxiliares}
            />

            {/* Botões de ação */}
            <div className="flex justify-between items-center pt-4">
              {/* Botão preview (só se dados válidos) */}
              <div>
                {formularioValido && dados.nome && dados.categoria_id && (
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
            {/* Preview da subcategoria */}
            <SecaoPreview
              tipo="subcategoria"
              dados={dadosPreview}
              titulo="Preview da Subcategoria"
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
                textoSalvar={editando ? 'Atualizar Subcategoria' : 'Criar Subcategoria'}
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