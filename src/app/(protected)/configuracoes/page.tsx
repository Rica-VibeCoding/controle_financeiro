'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { ModalExportar } from '@/componentes/backup/modal-exportar'
import { ModalImportar } from '@/componentes/backup/modal-importar'
import { ModalReset } from '@/componentes/backup/modal-reset'
import { useAuth } from '@/contextos/auth-contexto'
import { getSupabaseClient } from '@/servicos/supabase/cliente'

export default function ConfiguracoesPage() {
  const [modalExportarAberto, setModalExportarAberto] = useState(false)
  const [modalImportarAberto, setModalImportarAberto] = useState(false)
  const [modalResetAberto, setModalResetAberto] = useState(false)
  const [usuariosCount, setUsuariosCount] = useState(0)
  const { workspace, user } = useAuth()
  
  // Verificar se usuário é owner do workspace
  const isOwner = workspace?.owner_id === user?.id

  // Buscar contador de usuários ativos
  useEffect(() => {
    async function fetchUsuariosCount() {
      if (!workspace?.id) return
      
      const supabase = getSupabaseClient()
      const { count } = await supabase
        .from('fp_usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id)
        .eq('ativo', true)
      
      setUsuariosCount(count || 0)
    }
    
    fetchUsuariosCount()
  }, [workspace?.id])

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Configurações
          </h1>
        </div>

        {/* Card de Usuários - apenas para owners */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icone name="users" className="w-4 h-4" aria-hidden="true" />
                Gerenciar Equipe
              </CardTitle>
              <CardDescription>
                Convide e gerencie usuários do seu workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icone name="users" className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Usuários ativos</span>
                  </div>
                  <span className="text-sm font-medium">{usuariosCount}</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/configuracoes/usuarios'}
                >
                  <Icone name="users" className="w-4 h-4 mr-2" />
                  Gerenciar Usuários
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icone name="list" className="w-4 h-4" aria-hidden="true" />
              Metas e Orçamento
            </CardTitle>
            <CardDescription>
              Configure suas metas mensais de gastos por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/configuracoes/metas'}
            >
              <span className="mr-1" aria-hidden="true"><Icone name="list" className="w-4 h-4" /></span>
              Configurar Metas Mensais
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icone name="folder" className="w-4 h-4" aria-hidden="true" />
              Backup e Dados
            </CardTitle>
            <CardDescription>
              Gerencie seus dados e configurações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setModalExportarAberto(true)}
              >
                <Icone name="file-text" className="w-4 h-4 mr-1" aria-hidden="true" />
                Exportar Dados
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setModalImportarAberto(true)}
              >
                <Icone name="file-up" className="w-4 h-4 mr-1" aria-hidden="true" />
                Importar Dados
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setModalResetAberto(true)}
              >
                <Icone name="trash-2" className="w-4 h-4 mr-1" aria-hidden="true" />
                Reset da Planilha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modais de Backup */}
      <ModalExportar
        isOpen={modalExportarAberto}
        onClose={() => setModalExportarAberto(false)}
      />
      
      <ModalImportar
        isOpen={modalImportarAberto}
        onClose={() => setModalImportarAberto(false)}
      />
      
      <ModalReset
        isOpen={modalResetAberto}
        onClose={() => setModalResetAberto(false)}
      />
    </>
  )
}