import { NextRequest, NextResponse } from 'next/server'
import { buscarDadosFluxoCaixa, buscarKPIsFluxoCaixa } from '@/servicos/supabase/fluxo-caixa-queries'
import { validateAPIAuth } from '@/servicos/supabase/api-auth-helpers'
import { logger } from '@/utilitarios/logger'
import type { FiltrosFluxoCaixa } from '@/tipos/fluxo-caixa'

/**
 * API Route para buscar dados de Fluxo de Caixa Projetado
 * GET /api/fluxo-caixa?periodo=12_meses&tipo=ambos
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação usando helper centralizado
    const authResult = await validateAPIAuth()
    if (!authResult.success) {
      return authResult.response
    }

    const { workspaceId } = authResult.data

    // Extrair parâmetros da query
    const { searchParams } = request.nextUrl
    const tipoRequisicao = searchParams.get('tipo_requisicao') || 'dados' // 'dados' ou 'kpis'

    const filtros: FiltrosFluxoCaixa = {
      periodo: (searchParams.get('periodo') || '12_meses') as FiltrosFluxoCaixa['periodo'],
      tipo: (searchParams.get('tipo') || 'ambos') as FiltrosFluxoCaixa['tipo'],
      dataInicio: searchParams.get('dataInicio') || undefined,
      dataFim: searchParams.get('dataFim') || undefined
    }

    if (tipoRequisicao === 'kpis') {
      // Buscar KPIs
      const kpis = await buscarKPIsFluxoCaixa(workspaceId, filtros)
      return NextResponse.json(kpis)
    }

    // Buscar dados mensais
    const dados = await buscarDadosFluxoCaixa(workspaceId, filtros)
    return NextResponse.json(dados)
  } catch (error: any) {
    logger.error('Erro na API Fluxo de Caixa', { error: error.message })
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar dados de fluxo de caixa' },
      { status: 500 }
    )
  }
}
