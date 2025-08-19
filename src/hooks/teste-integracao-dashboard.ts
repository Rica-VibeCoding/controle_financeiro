/**
 * Teste de integração dos hooks do dashboard
 * Este arquivo é apenas para validação, será removido após os testes
 */

import { DashboardService } from '../servicos/supabase/dashboard'
import { PeriodoFiltro } from '../tipos/dashboard'

// Teste simples de integração
export async function testarIntegracaoDashboard() {
  console.log('🧪 Iniciando teste de integração do dashboard...')
  
  try {
    // Teste 1: Obter anos disponíveis
    console.log('📅 Testando anos disponíveis...')
    const anos = await DashboardService.obterAnosDisponiveis()
    console.log('✅ Anos encontrados:', anos)
    
    // Teste 2: Obter meses com dados
    if (anos.length > 0) {
      console.log('📆 Testando meses com dados...')
      const meses = await DashboardService.obterMesesComDados(anos[0])
      console.log('✅ Meses encontrados:', meses)
      
      // Teste 3: Calcular dados do dashboard
      if (meses.length > 0) {
        console.log('💰 Testando cálculo de dados...')
        const periodo: PeriodoFiltro = { mes: meses[0], ano: anos[0] }
        const dados = await DashboardService.calcularDadosDashboard(periodo)
        console.log('✅ Dados calculados:', dados)
      }
    }
    
    // Teste 4: Período atual
    console.log('🗓️ Testando período atual...')
    const periodoAtual = DashboardService.obterPeriodoAtual()
    console.log('✅ Período atual:', periodoAtual)
    
    console.log('🎉 Todos os testes passaram!')
    return true
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return false
  }
}