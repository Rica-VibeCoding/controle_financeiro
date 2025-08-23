'use client'

import { useState } from 'react'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { ModalExportar } from '@/componentes/backup/modal-exportar'
import { ModalImportar } from '@/componentes/backup/modal-importar'

export default function ConfiguracoesPage() {
  const [modalExportarAberto, setModalExportarAberto] = useState(false)
  const [modalImportarAberto, setModalImportarAberto] = useState(false)

  return (
    <LayoutPrincipal>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Configurações
          </h1>
        </div>

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
              <Button variant="outline" className="w-full">
                <Icone name="refresh-ccw" className="w-4 h-4 mr-1" aria-hidden="true" />
                Backup Automático
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
    </LayoutPrincipal>
  )
}