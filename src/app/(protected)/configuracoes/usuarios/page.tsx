'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contextos/auth-contexto'
import { supabaseClient } from '@/servicos/supabase/auth-client'
import { criarLinkConvite, desativarConvite, removerUsuarioWorkspace, alterarRoleUsuario } from '@/servicos/supabase/convites-simples'
import { atualizarPermissoesUsuario } from '@/servicos/supabase/permissoes-service'
import { ModalPermissoes } from '@/componentes/usuarios/modal-permissoes'
import type { PermissoesUsuario, ResultadoPermissoes } from '@/tipos/permissoes'
import { Usuario, ConviteLink } from '@/tipos/auth'
import { Icone } from '@/componentes/ui/icone'
import { useToast } from '@/contextos/toast-contexto'
import { useConfirmDialog } from '@/componentes/ui/confirm-dialog'
import { formatarUltimaAtividade, isUsuarioInativo, obterCorIndicadorAtividade } from '@/utilitarios/formatacao-data'

interface UsuarioCompleto extends Usuario {
  email?: string
  last_activity?: string
}

export default function UsuariosPage() {
  const { workspace, user } = useAuth()
  const { sucesso, erro } = useToast()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const [usuarios, setUsuarios] = useState<UsuarioCompleto[]>([])
  const [convites, setConvites] = useState<ConviteLink[]>([])
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true)
  const [enviandoConvite, setEnviandoConvite] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [novoConviteId, setNovoConviteId] = useState<string | null>(null)
  const [modalPermissoesAberto, setModalPermissoesAberto] = useState(false)
  const [usuarioPermissoesSelecionado, setUsuarioPermissoesSelecionado] = useState<UsuarioCompleto | null>(null)

  const carregarUsuarios = useCallback(async () => {
    if (!workspace) return

    setCarregandoUsuarios(true)
    try {
      const { data, error } = await supabaseClient
        .from('fp_usuarios')
        .select(`
          id,
          workspace_id,
          nome,
          email,
          role,
          ativo,
          permissoes,
          last_activity,
          created_at,
          updated_at
        `)
        .eq('workspace_id', workspace.id)

      if (error) {
        console.error('Erro ao carregar usuários:', error)
        erro('Erro ao carregar usuários', 'Não foi possível carregar a lista de usuários. Tente novamente.')
        return
      }

      // Usar email diretamente da tabela fp_usuarios
      setUsuarios(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      erro('Erro inesperado', 'Ocorreu um erro inesperado ao carregar os usuários.')
    } finally {
      setCarregandoUsuarios(false)
    }
  }, [workspace])

  const carregarConvites = useCallback(async () => {
    if (!workspace) return []

    try {
      const { data, error } = await supabaseClient
        .from('fp_convites_links')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('ativo', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar convites:', error)
        erro('Erro ao carregar convites', 'Não foi possível carregar a lista de convites ativos.')
        return []
      }
      
      if (data) {
        setConvites(data)
        return data
      }
      return []
    } catch (error) {
      console.error('Erro ao carregar convites:', error)
      erro('Erro inesperado', 'Ocorreu um erro inesperado ao carregar os convites.')
      return []
    }
  }, [workspace, erro])

  useEffect(() => {
    if (workspace && user) {
      setIsOwner(workspace.owner_id === user.id)
      carregarUsuarios()
      carregarConvites()
    }
  }, [workspace?.id, user?.id, carregarUsuarios, carregarConvites])

  const handleCriarConvite = async () => {
    if (!workspace) return

    setEnviandoConvite(true)
    try {
      const resultado = await criarLinkConvite(workspace.id)

      if (!resultado.success) {
        erro('Erro ao criar convite', resultado.error)
        return
      }

      // Copiar link para clipboard com fallback
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(resultado.data.link)
          sucesso('Convite criado!', `Link copiado para área de transferência. Código: ${resultado.data.codigo}`)
        } else {
          // Fallback para ambientes não seguros
          const textArea = document.createElement('textarea')
          textArea.value = resultado.data.link
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          sucesso('Convite criado!', `Link copiado: ${resultado.data.link}`)
        }
      } catch (clipboardError) {
        console.warn('Erro ao copiar para clipboard:', clipboardError)
        sucesso('Convite criado!', `Copie o link: ${resultado.data.link}`)
      }

      // Recarregar lista de convites
      await carregarConvites()

      // Destacar o novo convite por alguns segundos
      setTimeout(async () => {
        const convitesAtualizados = await carregarConvites()
        const novoConvite = convitesAtualizados?.find((c: ConviteLink) => c.codigo === resultado.data.codigo)
        if (novoConvite) {
          setNovoConviteId(novoConvite.id)
          setTimeout(() => setNovoConviteId(null), 3000)
        }
      }, 100)
    } catch (error) {
      console.error('Erro ao criar convite:', error)
      erro('Erro ao criar convite', 'Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setEnviandoConvite(false)
    }
  }

  const handleDesativarConvite = async (codigo: string) => {
    confirm({
      title: 'Excluir Convite',
      description: 'Tem certeza que deseja excluir este convite permanentemente? Esta ação não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          const resultado = await desativarConvite(codigo)
          
          if (resultado.success) {
            // Remover imediatamente da lista local (otimista)
            setConvites(convitesAtuais => convitesAtuais.filter(c => c.codigo !== codigo))
            
            sucesso('Convite excluído', 'Convite removido permanentemente!')
            
            // Recarregar lista para garantir sincronização
            setTimeout(() => {
              carregarConvites()
            }, 500)
          } else {
            erro('Erro ao excluir convite', resultado.error || 'Erro desconhecido')
          }
        } catch (error) {
          console.error('Erro ao excluir convite:', error)
          erro('Erro ao excluir convite', String(error))
        }
      }
    })
  }

  const copiarLinkConvite = async (codigo: string) => {
    try {
      // Verificar se estamos em ambiente seguro (HTTPS ou localhost)
      const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      
      const link = `${window.location.origin}/auth/register?invite=${codigo}`
      
      if (!isSecureContext) {
        throw new Error('Clipboard API requer contexto seguro (HTTPS)')
      }

      if (!navigator.clipboard) {
        throw new Error('Clipboard API não disponível neste navegador')
      }

      await navigator.clipboard.writeText(link)
      sucesso('Link copiado!', `Link copiado: ${link}`)
      
    } catch (error) {
      // Fallback: criar input temporário para copiar
      try {
        const link = `${window.location.origin}/auth/register?invite=${codigo}`
        const input = document.createElement('input')
        input.value = link
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        sucesso('Link copiado!', `Link copiado: ${link}`)
      } catch (fallbackError) {
        console.error('Erro ao copiar link:', error)
        erro('Erro ao copiar', `Copie manualmente: ${window.location.origin}/auth/register?invite=${codigo}`)
      }
    }
  }

  const handleAlterarRole = async (usuario: UsuarioCompleto, novaRole: 'owner' | 'member') => {
    if (!workspace || usuario.role === novaRole) return

    const isCurrentUser = usuario.id === user?.id
    const outrosOwners = usuarios.filter(u => u.role === 'owner' && u.id !== usuario.id && u.ativo)
    
    // Verificar se está tentando rebaixar único owner
    if (usuario.role === 'owner' && novaRole === 'member' && outrosOwners.length === 0) {
      erro('Não é possível alterar', 'Não é possível rebaixar o último proprietário do workspace.')
      return
    }

    const titulo = novaRole === 'owner' ? 'Promover a Proprietário' : 'Rebaixar a Membro'
    const descricao = isCurrentUser
      ? `Tem certeza que deseja alterar seu próprio role para ${novaRole === 'owner' ? 'proprietário' : 'membro'}?`
      : `Tem certeza que deseja alterar o role de ${usuario.nome} para ${novaRole === 'owner' ? 'proprietário' : 'membro'}?`

    confirm({
      title: titulo,
      description: descricao,
      type: novaRole === 'owner' ? 'warning' : 'info',
      confirmText: novaRole === 'owner' ? 'Promover' : 'Rebaixar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          const resultado = await alterarRoleUsuario(usuario.id, workspace.id, novaRole)
          
          if (resultado.success) {
            sucesso(
              'Role alterado com sucesso',
              `${usuario.nome} agora é ${novaRole === 'owner' ? 'proprietário' : 'membro'} do workspace.`
            )
            await carregarUsuarios() // Recarregar lista
          } else {
            erro('Erro ao alterar role', resultado.error || 'Erro desconhecido')
          }
        } catch (error) {
          console.error('Erro ao alterar role:', error)
          erro('Erro ao alterar role', String(error))
        }
      }
    })
  }

  const handleRemoverUsuario = async (usuario: UsuarioCompleto) => {
    if (!workspace) return

    // Verificar se é o próprio usuário e se é único owner
    const isCurrentUser = usuario.id === user?.id
    const isOwnerUser = usuario.role === 'owner'
    const outrosOwners = usuarios.filter(u => u.role === 'owner' && u.id !== usuario.id && u.ativo)
    
    if (isCurrentUser && isOwnerUser && outrosOwners.length === 0) {
      erro('Não é possível remover', 'Você não pode se remover sendo o último proprietário do workspace.')
      return
    }

    const titulo = isCurrentUser ? 'Sair do Workspace' : 'Remover Usuário'
    const descricao = isCurrentUser 
      ? 'Tem certeza que deseja sair deste workspace? Você perderá acesso a todos os dados.'
      : `Tem certeza que deseja remover ${usuario.nome} do workspace? O usuário perderá acesso a todos os dados.`

    confirm({
      title: titulo,
      description: descricao,
      type: 'danger',
      confirmText: isCurrentUser ? 'Sair' : 'Remover',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          const resultado = await removerUsuarioWorkspace(usuario.id, workspace.id)
          
          if (resultado.success) {
            sucesso(
              isCurrentUser ? 'Saída realizada' : 'Usuário removido', 
              isCurrentUser 
                ? 'Você foi removido do workspace com sucesso!' 
                : `${usuario.nome} foi removido do workspace com sucesso!`
            )
            await carregarUsuarios() // Recarregar lista
          } else {
            erro('Erro ao remover usuário', resultado.error || 'Erro desconhecido')
          }
        } catch (error) {
          console.error('Erro ao remover usuário:', error)
          erro('Erro ao remover usuário', String(error))
        }
      }
    })
  }

  // Handlers para modal de permissões
  const handleAbrirPermissoes = (usuario: UsuarioCompleto) => {
    if (usuario.role === 'owner') {
      erro('Ação não permitida', 'Não é possível alterar permissões de proprietários.')
      return
    }
    
    setUsuarioPermissoesSelecionado(usuario)
    setModalPermissoesAberto(true)
  }

  const handleFecharPermissoes = () => {
    setModalPermissoesAberto(false)
    setUsuarioPermissoesSelecionado(null)
  }

  const handleSalvarPermissoes = async (usuarioId: string, permissoes: PermissoesUsuario): Promise<ResultadoPermissoes> => {
    if (!workspace) {
      return { success: false, error: 'Workspace não encontrado' }
    }

    const resultado = await atualizarPermissoesUsuario(usuarioId, workspace.id, permissoes)
    
    if (resultado.success) {
      // Atualizar usuário na lista local
      setUsuarios(prev => prev.map(u => 
        u.id === usuarioId 
          ? { ...u, permissoes }
          : u
      ))
    }
    
    return resultado
  }

  if (!isOwner) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Icone name="alert-triangle" className="w-6 h-6 text-yellow-600" />
            <div>
              <h1 className="text-lg font-semibold text-yellow-800">Acesso Restrito</h1>
              <p className="text-yellow-700">
                Apenas o proprietário do workspace pode gerenciar usuários.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Cabeçalho com botão integrado */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
        </div>
        <button
          onClick={handleCriarConvite}
          disabled={enviandoConvite}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-start md:self-auto"
        >
          {enviandoConvite ? (
            <>
              <Icone name="loader-2" className="w-4 h-4 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Icone name="plus-circle" className="w-4 h-4" />
              Criar Convite
            </>
          )}
        </button>
      </div>

      {/* Convites Ativos - Layout Compacto */}
      {convites.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <Icone name="link-2" className="w-4 h-4" />
              Convites Ativos ({convites.length}):
            </h2>
            <div className="flex gap-2 flex-wrap">
              {convites.map((convite) => {
                const isNovo = novoConviteId === convite.id
                const dataFormatada = new Date(convite.expires_at).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit' 
                })
                
                return (
                  <div 
                    key={convite.id} 
                    className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-sm transition-all ${
                      isNovo 
                        ? 'bg-green-50 border-green-200 animate-pulse' 
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <code className="font-mono font-medium text-gray-800">
                      {convite.codigo}
                    </code>
                    <span className="text-xs text-gray-500">
                      {dataFormatada}
                    </span>
                    <button
                      onClick={() => copiarLinkConvite(convite.codigo)}
                      className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                      title="Copiar link"
                    >
                      <Icone name="copy" className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDesativarConvite(convite.codigo)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                      title="Excluir convite"
                    >
                      <Icone name="user-x" className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Icone name="users" className="w-5 h-5" />
            Usuários do Workspace ({usuarios.length})
          </h2>
        </div>
        
        {carregandoUsuarios ? (
          <div className="p-6 text-center">
            <Icone name="loader-2" className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-6 text-center">
            <Icone name="users" className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="divide-y">
            {usuarios.map((usuario) => {
              const isCurrentUser = usuario.id === user?.id
              const isOwnerUser = usuario.role === 'owner'
              const outrosOwners = usuarios.filter(u => u.role === 'owner' && u.id !== usuario.id && u.ativo)
              const podeRemover = !(isCurrentUser && isOwnerUser && outrosOwners.length === 0)
              const podeAlterarRole = usuario.role === 'member' || (usuario.role === 'owner' && outrosOwners.length > 0)

              return (
                <div key={usuario.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Icone name="user" className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        {usuario.nome}
                        {isCurrentUser && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Você
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{usuario.email}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          Membro desde {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <div 
                            className={`w-1.5 h-1.5 rounded-full ${obterCorIndicadorAtividade(usuario.last_activity || null)}`}
                            title={`Última atividade: ${formatarUltimaAtividade(usuario.last_activity || null)}`}
                          />
                          <span className={isUsuarioInativo(usuario.last_activity || null) ? 'text-orange-600' : ''}>
                            Ativo {formatarUltimaAtividade(usuario.last_activity || null).toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {/* Dropdown de Role */}
                      <div className="mb-2">
                        <select
                          value={usuario.role}
                          onChange={(e) => handleAlterarRole(usuario, e.target.value as 'owner' | 'member')}
                          disabled={!podeAlterarRole}
                          className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${
                            podeAlterarRole ? 'cursor-pointer hover:bg-opacity-80' : 'cursor-not-allowed opacity-50'
                          } ${
                            usuario.role === 'owner'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="owner">Proprietário</option>
                          <option value="member">Membro</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            usuario.ativo ? 'bg-green-400' : 'bg-red-400'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Botões de ação */}
                    <div className="flex items-center gap-1">
                      {/* Botão Permissões - apenas para MEMBERs */}
                      {usuario.role === 'member' && (
                        <button
                          onClick={() => handleAbrirPermissoes(usuario)}
                          className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Configurar permissões"
                        >
                          <Icone name="settings" className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Botão de remoção */}
                      {usuario.ativo && podeRemover && (
                        <button
                          onClick={() => handleRemoverUsuario(usuario)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title={isCurrentUser ? 'Sair do workspace' : 'Remover usuário'}
                        >
                          <Icone 
                            name={isCurrentUser ? "log-out" : "user-x"} 
                            className="w-4 h-4" 
                          />
                        </button>
                      )}
                    </div>
                    {/* Indicador de que não pode ser removido */}
                    {usuario.ativo && !podeRemover && (
                      <div 
                        className="text-gray-400 p-2 rounded-lg cursor-not-allowed"
                        title="Último proprietário não pode ser removido"
                      >
                        <Icone name="alert-triangle" className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog />
      
      {/* Modal de Permissões */}
      <ModalPermissoes
        isOpen={modalPermissoesAberto}
        usuario={usuarioPermissoesSelecionado}
        onClose={handleFecharPermissoes}
        onSave={handleSalvarPermissoes}
      />
    </div>
  )
}