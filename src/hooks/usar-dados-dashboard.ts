import { useState, useEffect, useCallback } from 'react'
import { DashboardService, DadosCards } from '@/servicos/supabase/dashboard'

// Estado inicial apenas para os cards
const estadoInicial = { receitas: 0, despesas: 0, saldo: 0, gastosCartao: 0 }

export function usarDadosDashboard() {
  const [dadosCards, setDadosCards] = useState(estadoInicial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const cards = await DashboardService.buscarDadosCards()
      setDadosCards(cards)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao carregar dados dos cards:', msg)
      setError(msg)
      setDadosCards(estadoInicial)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar dados na inicialização
  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  return {
    loading,
    error,
    dadosCards,
    recarregar: carregarDados,
  }
}
