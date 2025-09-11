'use client'

import React, { useState, useEffect } from 'react'
import { Icone } from '@/componentes/ui/icone'
import type { UsuarioCompleto, AcaoAdministrativa } from '@/tipos/dashboard-admin'

interface ModalDeletarUsuarioProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (usuarioId: string) => Promise<AcaoAdministrativa>
  usuario: UsuarioCompleto | null
  cenarioDetectado?: 'owner_unico' | 'owner_multiplo' | 'member'
  dadosPerdidos?: {
    transacoes: number
    categorias: number
    contas: number
  }
}

/**
 * Modal de confirmação para deleção de usuários
 * Comportamento adaptativo baseado no cenário:
 * - owner_unico: Confirmação dupla com checkbox + "DELETE" + email
 * - owner_multiplo/member: Confirmação simples
 */
export function ModalDeletarUsuario({
  isOpen,
  onClose,
  onConfirm,
  usuario,
  cenarioDetectado,
  dadosPerdidos
}: ModalDeletarUsuarioProps) {
  const [etapa, setEtapa] = useState<1 | 2>(1)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  
  // Estados para confirmação destrutiva
  const [checkboxMarcado, setCheckboxMarcado] = useState(false)
  const [textoConfirmacao, setTextoConfirmacao] = useState('')
  const [emailConfirmacao, setEmailConfirmacao] = useState('')
  
  // Reset quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setEtapa(1)
      setCheckboxMarcado(false)
      setTextoConfirmacao('')
      setEmailConfirmacao('')
      setErro(null)
      setProcessando(false)
    }
  }, [isOpen])
  
  if (!isOpen || !usuario) return null
  
  // Detectar cenário baseado no role e outros owners
  const isOwnerUnico = cenarioDetectado === 'owner_unico' || 
    (usuario.role === 'owner' && dadosPerdidos && dadosPerdidos.transacoes > 0)
  const isMember = cenarioDetectado === 'member' || usuario.role === 'member'
  
  // Validação para confirmação destrutiva
  const confirmacaoValida = () => {
    if (!isOwnerUnico) return true
    return (
      checkboxMarcado &&
      textoConfirmacao === 'DELETE' &&
      emailConfirmacao === usuario.email
    )
  }
  
  const handleConfirm = async () => {
    if (!confirmacaoValida()) {
      setErro('Por favor, complete todos os requisitos de confirmação')
      return
    }
    
    setProcessando(true)
    setErro(null)
    
    try {
      const resultado = await onConfirm(usuario.id)
      
      if (resultado.sucesso) {
        onClose()
      } else {
        setErro(resultado.mensagem)
      }
    } catch (error) {
      setErro('Erro ao processar deleção')
    } finally {
      setProcessando(false)
    }
  }
  
  // ETAPA 1: Informações sobre o que será deletado
  if (etapa === 1) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="p-6">
            {/* Header com ícone de alerta */}
            <div className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-12 h-12 ${isOwnerUnico ? 'bg-red-100' : 'bg-orange-100'} rounded-full flex items-center justify-center`}>
                <Icone 
                  name={isOwnerUnico ? 'alert-triangle' : 'user-minus'} 
                  className={`w-6 h-6 ${isOwnerUnico ? 'text-red-600' : 'text-orange-600'}`} 
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isOwnerUnico ? '🚨 DELEÇÃO DESTRUTIVA' : 'Remover Usuário'}
                </h3>
                <p className="text-gray-600">
                  {isOwnerUnico 
                    ? 'Esta ação é IRREVERSÍVEL e resultará em perda permanente de dados!'
                    : 'Você está prestes a remover o acesso deste usuário ao sistema.'}
                </p>
              </div>
            </div>
            
            {/* Informações do usuário */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Usuário a ser removido:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium text-gray-900">{usuario.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{usuario.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Workspace:</span>
                  <span className="font-medium text-gray-900">{usuario.workspaceNome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className={`font-medium px-2 py-0.5 rounded ${
                    usuario.role === 'owner' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {usuario.role === 'owner' ? 'Proprietário' : 'Membro'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Alerta de dados que serão perdidos */}
            {isOwnerUnico && dadosPerdidos && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-bold text-red-900 mb-3 flex items-center">
                  <Icone name="alert-triangle" className="w-5 h-5 mr-2" />
                  DADOS QUE SERÃO PERMANENTEMENTE PERDIDOS:
                </h4>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex items-center">
                    <Icone name="user-x" className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span><strong>{dadosPerdidos.transacoes}</strong> transações financeiras</span>
                  </li>
                  <li className="flex items-center">
                    <Icone name="user-x" className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span><strong>{dadosPerdidos.categorias}</strong> categorias cadastradas</span>
                  </li>
                  <li className="flex items-center">
                    <Icone name="user-x" className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span><strong>{dadosPerdidos.contas}</strong> contas bancárias</span>
                  </li>
                  <li className="flex items-center">
                    <Icone name="user-x" className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span><strong>Workspace "{usuario.workspaceNome}"</strong> será deletado</span>
                  </li>
                </ul>
                <p className="mt-3 text-xs text-red-700 font-medium">
                  ⚠️ Não há como desfazer esta ação. Todos os dados serão perdidos permanentemente.
                </p>
              </div>
            )}
            
            {/* Informação para member */}
            {isMember && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> O usuário perderá acesso ao workspace, mas os dados do workspace serão preservados.
                </p>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setEtapa(2)}
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                isOwnerUnico
                  ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
                  : 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500'
              }`}
            >
              {isOwnerUnico ? 'Entendo os riscos, continuar' : 'Continuar'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // ETAPA 2: Confirmação final
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 animate-in slide-in-from-bottom-4 duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Icone name="trash-2" className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Confirmação Final
              </h3>
              <p className="text-gray-600">
                {isOwnerUnico
                  ? 'Complete todos os requisitos abaixo para confirmar a deleção:'
                  : 'Confirme que deseja remover este usuário:'}
              </p>
            </div>
          </div>
          
          {/* Confirmação destrutiva para owner único */}
          {isOwnerUnico && (
            <div className="mt-6 space-y-4">
              {/* Checkbox */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="confirm-checkbox"
                  checked={checkboxMarcado}
                  onChange={(e) => setCheckboxMarcado(e.target.checked)}
                  className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="confirm-checkbox" className="ml-2 text-sm text-gray-700">
                  Eu entendo que <strong className="text-red-600">TODOS os dados serão permanentemente deletados</strong> e esta ação não pode ser desfeita.
                </label>
              </div>
              
              {/* Digite DELETE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Digite <strong className="text-red-600">DELETE</strong> para confirmar:
                </label>
                <input
                  type="text"
                  value={textoConfirmacao}
                  onChange={(e) => setTextoConfirmacao(e.target.value)}
                  placeholder="DELETE"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    textoConfirmacao && textoConfirmacao !== 'DELETE' 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
              
              {/* Digite o email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Digite o email do usuário <strong className="text-red-600">{usuario.email}</strong>:
                </label>
                <input
                  type="email"
                  value={emailConfirmacao}
                  onChange={(e) => setEmailConfirmacao(e.target.value)}
                  placeholder={usuario.email}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    emailConfirmacao && emailConfirmacao !== usuario.email 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
          )}
          
          {/* Confirmação simples para member */}
          {!isOwnerUnico && (
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                <strong>{usuario.nome}</strong> ({usuario.email}) será removido do workspace <strong>{usuario.workspaceNome}</strong>.
              </p>
            </div>
          )}
          
          {/* Mensagem de erro */}
          {erro && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{erro}</p>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between rounded-b-lg">
          <button
            type="button"
            onClick={() => setEtapa(1)}
            disabled={processando}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Voltar
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={processando}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={processando || (isOwnerUnico && !confirmacaoValida())}
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center space-x-2 ${
                isOwnerUnico
                  ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-300'
                  : 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500 disabled:bg-orange-300'
              } disabled:cursor-not-allowed`}
            >
              {processando && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{processando ? 'Deletando...' : 'Deletar Usuário'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}