'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import NextDynamic from 'next/dynamic'
import { Card, CardContent } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { TableContainer } from '@/componentes/ui/table-container'
import {
  obterClientes,
  alternarStatusContato,
  excluirContato
} from '@/servicos/supabase/contatos-queries'
import { useAuth } from '@/contextos/auth-contexto'
import { useModais } from '@/contextos/modais-contexto'
import { usePermissoes } from '@/hooks/usar-permissoes'
import type { Contato } from '@/tipos/database'

// Lazy load do modal - só carrega quando necessário
const ModalCliente = NextDynamic(
  () => import('@/componentes/modais/modal-cliente').then(mod => ({ default: mod.ModalCliente })),
  { ssr: false }
)

/**
 * Página de gerenciamento de Clientes (simplificado)
 */
export default function ClientesPage() {
  const { workspace } = useAuth()
  const { modalCliente, cliente } = useModais()
  const { verificarPermissao, loading: loadingPermissoes } = usePermissoes()
  const [clientes, setClientes] = useState<Contato[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Verificar permissão de acesso
  const temPermissao = verificarPermissao('cadastramentos')

  // Função para recarregar clientes
  const recarregarClientes = async () => {
    if (!workspace) return

    try {
      setCarregando(true)
      setErro(null)
      const dadosClientes = await obterClientes(workspace.id)
      setClientes(dadosClientes)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar clientes')
    } finally {
      setCarregando(false)
    }
  }

  // Alternar status ativo/inativo
  const handleAlternarStatus = async (id: string, ativoAtual: boolean) => {
    try {
      if (!workspace) return

      const novoStatus = !ativoAtual
      await alternarStatusContato(id, novoStatus, workspace.id)

      // Atualizar estado local
      setClientes(prev =>
        prev.map(cliente =>
          cliente.id === id
            ? { ...cliente, ativo: novoStatus }
            : cliente
        )
      )
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao alterar status')
    }
  }

  // Excluir cliente
  const handleExcluir = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir "${nome}"?\n\nClientes vinculados a transações não podem ser excluídos.`)) {
      try {
        if (!workspace) return

        await excluirContato(id, workspace.id)
        await recarregarClientes() // Recarregar lista
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao excluir cliente')
      }
    }
  }

  useEffect(() => {
    recarregarClientes()
  }, [workspace])

  // Loading permissões
  if (loadingPermissoes) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verificando permissões...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Bloqueio por falta de permissão
  if (!temPermissao) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <Icone name="shield-x" className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para acessar a página de Clientes.
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o proprietário do workspace para solicitar acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            👤 Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro simplificado para vincular às transações
          </p>
        </div>

        <Button onClick={() => cliente.abrir()}>
          <Icone name="plus-circle" className="w-4 h-4 mr-1" aria-hidden="true" />
          Novo Cliente
        </Button>
      </div>

      {/* Loading State */}
      {carregando && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Carregando clientes...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {erro && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              ❌ {erro}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Clientes */}
      {!carregando && !erro && (
        <TableContainer>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b bg-gray-50/50">
                <TableHead className="min-w-[200px] font-semibold sticky left-0 bg-gray-50/50 z-20">
                  Nome
                </TableHead>
                <TableHead className="w-[120px] font-semibold text-center hidden sm:table-cell">
                  Status
                </TableHead>
                <TableHead className="w-[130px] font-semibold text-center">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-4xl">👤</div>
                      <div className="font-medium">Nenhum cliente cadastrado</div>
                      <div className="text-sm">
                        Clique em "Novo Cliente" para começar
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((clienteItem) => (
                  <TableRow key={clienteItem.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium sticky left-0 bg-white z-10">
                      {clienteItem.nome}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          clienteItem.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {clienteItem.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        {/* Botão Editar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cliente.abrir(clienteItem.id)}
                          title="Editar cliente"
                          className="h-8 w-8 p-0"
                        >
                          <Icone name="pencil" className="w-4 h-4" aria-hidden="true" />
                        </Button>

                        {/* Botão Ativar/Desativar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAlternarStatus(clienteItem.id, clienteItem.ativo)}
                          title={clienteItem.ativo ? 'Desativar cliente' : 'Ativar cliente'}
                          className="h-8 w-8 p-0"
                        >
                          <Icone
                            name={clienteItem.ativo ? 'user-x' : 'user-plus'}
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </Button>

                        {/* Botão Excluir */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluir(clienteItem.id, clienteItem.nome)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          title="Excluir cliente"
                        >
                          <Icone name="trash-2" className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal */}
      {modalCliente && (
        <ModalCliente
          isOpen={modalCliente}
          onClose={cliente.fechar}
          onSuccess={recarregarClientes}
          clienteId={cliente.clienteId}
        />
      )}
    </div>
  )
}
