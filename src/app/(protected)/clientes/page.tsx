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
  const [clientes, setClientes] = useState<Contato[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

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
                <TableHead className="w-[300px] font-semibold sticky left-0 bg-gray-50/50 z-20">
                  Nome
                </TableHead>
                <TableHead className="w-[100px] font-semibold text-center">
                  Status
                </TableHead>
                <TableHead className="w-[150px] font-semibold text-center">
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
                  <TableRow key={clienteItem.id} className="border-b hover:bg-gray-50/50">
                    <TableCell className="font-medium sticky left-0 bg-white z-10">
                      {clienteItem.nome}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          clienteItem.ativo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {clienteItem.ativo ? '✓ Ativo' : '✗ Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Botão Editar */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cliente.abrir(clienteItem.id)}
                          title="Editar"
                        >
                          <Icone name="pencil" className="w-4 h-4" />
                        </Button>

                        {/* Botão Ativar/Desativar */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAlternarStatus(clienteItem.id, clienteItem.ativo)}
                          title={clienteItem.ativo ? 'Desativar' : 'Ativar'}
                        >
                          <Icone
                            name={clienteItem.ativo ? 'check' : 'user-x'}
                            className="w-4 h-4"
                          />
                        </Button>

                        {/* Botão Excluir */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExcluir(clienteItem.id, clienteItem.nome)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Icone name="trash-2" className="w-4 h-4" />
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
