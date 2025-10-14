import { NextRequest, NextResponse } from 'next/server'
import { buscarDadosROIClientes, buscarKPIs } from '@/servicos/supabase/roi-cliente-queries'
import { getSession, getCurrentWorkspace } from '@/servicos/supabase/server'
import type { FiltrosROI } from '@/tipos/roi-cliente'

/**
 * API Route para buscar dados de ROI de clientes
 * GET /api/roi-clientes?periodo=mes_atual&ordenacao=margem_desc
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Validar workspace
    const workspace = await getCurrentWorkspace()
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 404 }
      )
    }

    // O workspace retornado tem uma estrutura específica onde o id vem de fp_workspaces
    const workspaceData = workspace as any
    const workspaceId = workspaceData.id || workspaceData[0]?.id

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'ID do workspace não encontrado' },
        { status: 404 }
      )
    }

    // Extrair parâmetros da query
    const { searchParams } = request.nextUrl
    const tipo = searchParams.get('tipo') || 'clientes' // 'clientes' ou 'kpis'

    if (tipo === 'kpis') {
      // Buscar KPIs
      const kpis = await buscarKPIs(workspaceId)
      return NextResponse.json(kpis)
    }

    // Buscar dados de clientes com filtros
    const filtros: FiltrosROI = {
      periodo: (searchParams.get('periodo') || 'mes_atual') as FiltrosROI['periodo'],
      ordenacao: (searchParams.get('ordenacao') || 'margem_desc') as FiltrosROI['ordenacao'],
      dataInicio: searchParams.get('dataInicio') || undefined,
      dataFim: searchParams.get('dataFim') || undefined
    }

    const clientes = await buscarDadosROIClientes(workspaceId, filtros)
    return NextResponse.json(clientes)
  } catch (error: any) {
    console.error('Erro na API ROI clientes:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar dados de ROI' },
      { status: 500 }
    )
  }
}
