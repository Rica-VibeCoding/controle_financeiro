import { NextRequest, NextResponse } from 'next/server'
import { validateAPIAuth } from '@/servicos/supabase/api-auth-helpers'
import { logger } from '@/utilitarios/logger'
import {
  buscarContasAPagar,
  buscarContasAReceber,
  buscarContasVencidas,
  calcularResumo,
  marcarComoRealizado
} from '@/servicos/supabase/contas-queries'
import type { FiltrosContas } from '@/tipos/contas'

export const dynamic = 'force-dynamic'

/**
 * GET /api/contas - Busca contas a pagar/receber/vencidas ou resumo
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação e workspace
    const authResult = await validateAPIAuth()
    if (!authResult.success) {
      return authResult.response
    }

    const { workspaceId } = authResult.data

    // DEBUG: Log temporário
    logger.log('[DEBUG] API Contas - Workspace ID:', workspaceId)

    const { searchParams } = request.nextUrl
    const tipo = searchParams.get('tipo') // 'a_pagar' | 'a_receber' | 'vencidas' | 'resumo'
    const periodo = searchParams.get('periodo') as FiltrosContas['periodo'] || '30_dias'
    const categoria = searchParams.get('categoria') || undefined
    const busca = searchParams.get('busca') || undefined
    const dataInicio = searchParams.get('dataInicio') || undefined
    const dataFim = searchParams.get('dataFim') || undefined

    const filtros: FiltrosContas = {
      periodo,
      categoria,
      busca,
      dataInicio,
      dataFim
    }

    // Buscar dados conforme tipo
    if (tipo === 'resumo') {
      const resumo = await calcularResumo(workspaceId)
      return NextResponse.json(resumo)
    }

    if (tipo === 'a_pagar') {
      const contas = await buscarContasAPagar(workspaceId, filtros)
      return NextResponse.json(contas)
    }

    if (tipo === 'a_receber') {
      const contas = await buscarContasAReceber(workspaceId, filtros)
      return NextResponse.json(contas)
    }

    if (tipo === 'vencidas') {
      const contas = await buscarContasVencidas(workspaceId, filtros)
      return NextResponse.json(contas)
    }

    return NextResponse.json(
      { error: 'Tipo inválido. Use: a_pagar, a_receber, vencidas ou resumo' },
      { status: 400 }
    )

  } catch (error) {
    logger.error('Erro na API /api/contas:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/contas - Marca transação como realizada (paga/recebida)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Validar autenticação e workspace
    const authResult = await validateAPIAuth()
    if (!authResult.success) {
      return authResult.response
    }

    const body = await request.json()
    const { transacaoId } = body

    if (!transacaoId) {
      return NextResponse.json(
        { error: 'transacaoId é obrigatório' },
        { status: 400 }
      )
    }

    await marcarComoRealizado(transacaoId)

    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error('Erro ao marcar como realizado:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
