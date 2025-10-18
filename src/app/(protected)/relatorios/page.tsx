'use client'


import { PageGuard } from '@/componentes/ui/page-guard'
import { CardRelatorio } from '@/componentes/relatorios/card-relatorio'
import { DollarSign, TrendingUp, FileText } from 'lucide-react'

export default function RelatoriosPage() {
  const relatorios = [
    {
      icone: DollarSign,
      titulo: 'ROI por Cliente',
      rota: '/relatorios/roi-cliente',
      cor: 'green' as const
    },
    {
      icone: TrendingUp,
      titulo: 'Fluxo de Caixa Projetado',
      rota: '/relatorios/fluxo-caixa',
      cor: 'blue' as const
    },
    {
      icone: FileText,
      titulo: 'Contas a Pagar e Receber',
      rota: '/relatorios/contas',
      cor: 'purple' as const
    }
  ]

  return (
    <PageGuard permissaoNecessaria="relatorios">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Relatórios Gerenciais
          </h1>
          <p className="text-lg text-gray-600">
            Escolha o relatório que deseja visualizar
          </p>
        </header>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatorios.map((relatorio, index) => (
            <CardRelatorio key={index} {...relatorio} />
          ))}
        </div>
      </div>
    </PageGuard>
  )
}