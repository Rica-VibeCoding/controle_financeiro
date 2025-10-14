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
  obterFornecedores,
  alternarStatusContato,
  excluirContato
} from '@/servicos/supabase/contatos-queries'
import { useAuth } from '@/contextos/auth-contexto'
import { useModais } from '@/contextos/modais-contexto'
import type { Contato } from '@/tipos/database'

// Lazy load do modal - só carrega quando necessário
const ModalFornecedor = NextDynamic(
  () => import('@/componentes/modais/modal-fornecedor').then(mod => ({ default: mod.ModalFornecedor })),
  { ssr: false }
)

/**
 * Página de gerenciamento de Fornecedores (simplificado)
 */
export default function FornecedoresPage() {
  const { workspace } = useAuth()
  const { modalFornecedor, fornecedor } = useModais()
  const [fornecedores, setFornecedores] = useState<Contato[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Função para recarregar fornecedores
  const recarregarFornecedores = async () => {
    if (!workspace) return

    try {
      setCarregando(true)
      setErro(null)
      const dadosFornecedores = await obterFornecedores(workspace.id)
      setFornecedores(dadosFornecedores)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar fornecedores')
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
      setFornecedores(prev =>
        prev.map(fornecedor =>
          fornecedor.id === id
            ? { ...fornecedor, ativo: novoStatus }
            : fornecedor
        )
      )
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao alterar status')
    }
  }

  // Excluir fornecedor
  const handleExcluir = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir "${nome}"?\n\nFornecedores vinculados a transações não podem ser excluídos.`)) {
      try {
        if (!workspace) return

        await excluirContato(id, workspace.id)
        await recarregarFornecedores() // Recarregar lista
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao excluir fornecedor')
      }
    }
  }

  useEffect(() => {
    recarregarFornecedores()
  }, [workspace])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            🏭 Fornecedores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro simplificado para vincular às transações
          </p>
        </div>

        <Button onClick={() => fornecedor.abrir()}>
          <Icone name="plus-circle" className="w-4 h-4 mr-1" aria-hidden="true" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Loading State */}
      {carregando && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Carregando fornecedores...
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

      {/* Tabela de Fornecedores */}
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
              {fornecedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-4xl">🏭</div>
                      <div className="font-medium">Nenhum fornecedor cadastrado</div>
                      <div className="text-sm">
                        Clique em "Novo Fornecedor" para começar
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                fornecedores.map((fornecedorItem) => (
                  <TableRow key={fornecedorItem.id} className="border-b hover:bg-gray-50/50">
                    <TableCell className="font-medium sticky left-0 bg-white z-10">
                      {fornecedorItem.nome}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          fornecedorItem.ativo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {fornecedorItem.ativo ? '✓ Ativo' : '✗ Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Botão Editar */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fornecedor.abrir(fornecedorItem.id)}
                          title="Editar"
                        >
                          <Icone name="pencil" className="w-4 h-4" />
                        </Button>

                        {/* Botão Ativar/Desativar */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAlternarStatus(fornecedorItem.id, fornecedorItem.ativo)}
                          title={fornecedorItem.ativo ? 'Desativar' : 'Ativar'}
                        >
                          <Icone
                            name={fornecedorItem.ativo ? 'check' : 'user-x'}
                            className="w-4 h-4"
                          />
                        </Button>

                        {/* Botão Excluir */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExcluir(fornecedorItem.id, fornecedorItem.nome)}
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
      {modalFornecedor && (
        <ModalFornecedor
          isOpen={modalFornecedor}
          onClose={fornecedor.fechar}
          onSuccess={recarregarFornecedores}
          fornecedorId={fornecedor.fornecedorId}
        />
      )}
    </div>
  )
}
