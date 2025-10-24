'use client'

import { useState, useEffect } from 'react'
import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import type { Usuario } from '@/tipos/auth'
import type { PermissoesUsuario, TipoPermissao, ResultadoPermissoes } from '@/tipos/permissoes'
import type { IconName } from '@/componentes/ui/icone'
import {
  TODAS_PERMISSOES,
  ROTULOS_PERMISSOES,
  ICONES_PERMISSOES,
  CORES_PERMISSOES,
  PERMISSOES_PADRAO_MEMBER,
  normalizarPermissoes
} from '@/tipos/permissoes'
import { useToast } from '@/contextos/toast-contexto'

interface ModalPermissoesProps {
  isOpen: boolean
  usuario: Usuario | null
  onClose: () => void
  onSave: (usuarioId: string, permissoes: PermissoesUsuario) => Promise<ResultadoPermissoes>
}

export function ModalPermissoes({ 
  isOpen, 
  usuario, 
  onClose, 
  onSave 
}: ModalPermissoesProps) {
  const { sucesso, erro } = useToast()
  const [permissoes, setPermissoes] = useState<PermissoesUsuario>(PERMISSOES_PADRAO_MEMBER)
  const [salvando, setSalvando] = useState(false)
  
  // Carregar permissões do usuário quando modal abrir
  useEffect(() => {
    if (isOpen && usuario) {
      // Normalizar permissões (remove campos antigos, adiciona novos)
      const permissoesUsuario = normalizarPermissoes(usuario.permissoes)
      setPermissoes(permissoesUsuario)
    }
  }, [isOpen, usuario])

  // Resetar estado quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setSalvando(false)
    }
  }, [isOpen])

  const handleTogglePermissao = (permissao: TipoPermissao) => {
    setPermissoes(prev => ({
      ...prev,
      [permissao]: !prev[permissao]
    }))
  }

  const handleSalvar = async () => {
    if (!usuario) return

    setSalvando(true)
    try {
      const resultado = await onSave(usuario.id, permissoes)
      
      if (resultado.success) {
        sucesso('Permissões atualizadas', `Permissões de ${usuario.nome} foram atualizadas com sucesso.`)
        onClose()
      } else {
        erro('Erro ao salvar', resultado.error || 'Não foi possível atualizar as permissões.')
      }
    } catch (error: any) {
      erro('Erro inesperado', error.message || 'Ocorreu um erro ao salvar as permissões.')
    } finally {
      setSalvando(false)
    }
  }

  const handleCancelar = () => {
    if (salvando) return
    onClose()
  }

  if (!usuario) return null

  const permissoesAtivas = TODAS_PERMISSOES.filter(p => permissoes[p]).length
  const totalPermissoes = TODAS_PERMISSOES.length

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleCancelar}
      title={`🔐 Permissões: ${usuario.nome}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Resumo das permissões */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              📊 {permissoesAtivas} de {totalPermissoes} funcionalidades liberadas
            </span>
            <span className="text-xs text-gray-500">
              {usuario.role === 'member' ? 'Membro' : 'Proprietário'}
            </span>
          </div>
        </div>

        {/* Tabela de permissões com scroll interno */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b">
            <div className="grid grid-cols-3 text-xs font-medium text-gray-600">
              <span>Funcionalidade</span>
              <span className="text-center">Status</span>
              <span className="text-center">Ação</span>
            </div>
          </div>
          
          {/* Container com scroll para +5 permissões */}
          <div className="max-h-64 overflow-y-auto">
            {TODAS_PERMISSOES.map((permissao) => {
              const ativo = permissoes[permissao]
              const cor = ativo ? CORES_PERMISSOES[permissao].ativo : CORES_PERMISSOES[permissao].inativo
              
              return (
                <div 
                  key={permissao}
                  className="grid grid-cols-3 items-center px-3 py-2.5 border-b last:border-b-0 hover:bg-gray-25 transition-colors"
                >
                  {/* Funcionalidade */}
                  <div className="flex items-center gap-2">
                    <Icone 
                      name={ICONES_PERMISSOES[permissao] as IconName} 
                      className={`w-4 h-4 ${cor}`}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {ROTULOS_PERMISSOES[permissao]}
                    </span>
                  </div>
                  
                  {/* Status visual */}
                  <div className="text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                      ativo 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {ativo ? (
                        <>
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          ON
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          OFF
                        </>
                      )}
                    </span>
                  </div>
                  
                  {/* Toggle */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => handleTogglePermissao(permissao)}
                      disabled={salvando}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                        ativo ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          ativo ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>


        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleCancelar}
            disabled={salvando}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSalvar}
            disabled={salvando}
            className="min-w-32"
          >
            {salvando ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Icone name="check" className="w-4 h-4" />
                Salvar Alterações
              </div>
            )}
          </Button>
        </div>
      </div>
    </ModalBase>
  )
}