'use client'

import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'

export default function ConfiguracoesPage() {
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
            <CardTitle>🎯 Metas e Orçamento</CardTitle>
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
              🎯 Configurar Metas Mensais
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💾 Backup e Dados</CardTitle>
            <CardDescription>
              Gerencie seus dados e configurações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="w-full">
                📥 Exportar Dados
              </Button>
              <Button variant="outline" className="w-full">
                📤 Importar Dados
              </Button>
              <Button variant="outline" className="w-full">
                🔄 Backup Automático
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}