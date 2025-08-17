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
          <p className="text-muted-foreground">
            Personalize e configure o sistema conforme suas necessidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎨 Aparência</CardTitle>
              <CardDescription>
                Personalize a interface do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tema</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Claro</Button>
                  <Button variant="outline" size="sm">Escuro</Button>
                  <Button variant="outline" size="sm">Auto</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cores</label>
                <Button variant="outline" size="sm" className="w-full">
                  Personalizar Paleta
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💰 Moeda e Formatos</CardTitle>
              <CardDescription>
                Configure formatos de exibição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Moeda Padrão</label>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  🇧🇷 Real Brasileiro (R$)
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Formato de Data</label>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  DD/MM/AAAA
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔔 Notificações</CardTitle>
              <CardDescription>
                Gerencie alertas e lembretes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Metas próximas do limite</span>
                <Button variant="outline" size="sm">Ativado</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Transações recorrentes</span>
                <Button variant="outline" size="sm">Ativado</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Relatórios mensais</span>
                <Button variant="outline" size="sm">Desativado</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Dashboard</CardTitle>
              <CardDescription>
                Configure a página inicial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Mostrar saldo total</span>
                <Button variant="outline" size="sm">Sim</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Período padrão</span>
                <Button variant="outline" size="sm">Mês atual</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Gráficos animados</span>
                <Button variant="outline" size="sm">Sim</Button>
              </div>
            </CardContent>
          </Card>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Informações do Sistema</CardTitle>
            <CardDescription>
              Detalhes técnicos e versões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Versão:</span>
                  <span className="font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Banco de Dados:</span>
                  <span className="font-mono">Supabase</span>
                </div>
                <div className="flex justify-between">
                  <span>Último Backup:</span>
                  <span className="font-mono">Nunca</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Transações:</span>
                  <span className="font-mono">--</span>
                </div>
                <div className="flex justify-between">
                  <span>Categorias:</span>
                  <span className="font-mono">--</span>
                </div>
                <div className="flex justify-between">
                  <span>Contas:</span>
                  <span className="font-mono">--</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚠️ Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis - use com cuidado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                <div>
                  <p className="font-medium">Limpar Todos os Dados</p>
                  <p className="text-sm text-muted-foreground">Remove todas as transações, categorias e configurações</p>
                </div>
                <Button variant="destructive" size="sm">
                  Limpar Tudo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}